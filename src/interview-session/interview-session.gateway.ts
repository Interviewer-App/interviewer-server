import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody, ConnectedSocket
} from "@nestjs/websockets";
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
import { InterviewSessionService } from "./interview-session.service";
import { AiService } from "src/ai/ai.service";
import { AnswersService } from "../answers/answers.service";
import { CategoryService } from "../category/category.service";
import { UpdateCategoryScoreDto } from "../category/dto/update-category-score.dto";
import { Logger, NotFoundException } from "@nestjs/common";
@WebSocketGateway({ cors: true })
export class InterviewSessionGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  private readonly logger = new Logger('InterviewSessionSocket');
  // Track active interview sessions
  private activeSessions: Map<string, Set<{ userId: string, role: string }>> = new Map(); // sessionId -> Set of participantIds (candidate and company)

  constructor(private prisma: PrismaService, private aiService: AiService, private answerService: AnswersService, private categoryService: CategoryService) { }

  handleConnection(client: Socket, ...args: any[]) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.leaveAllRooms(client);
  }

  @SubscribeMessage('joinInterviewSession')
  async handleJoinInterviewSession(
    @MessageBody() data: { sessionId: string, userId: string, role: string },
    @ConnectedSocket() client: Socket
  ) {
    if (!client) {
      throw new Error('Client is undefined');
    }

    const { sessionId, userId, role } = data;
    console.log(data, data.sessionId);

    console.log(`JoinInterviewSession session: ${sessionId}`);
    // Join the session room
    client.join(`session-${sessionId}`);
    console.log(`session joined: ${sessionId}`);

    // Track participants in the session
    if (!this.activeSessions.has(sessionId)) {
      this.activeSessions.set(sessionId, new Set());
    }
    this.activeSessions.get(sessionId).add({ userId, role });

    const participants = this.activeSessions.get(sessionId);

    // Check if other participants are already in the session
    const hasOtherParticipants = participants.size > 1;
    console.log(`######################################################## : ${participants.size}`);
    console.log(`######################################################## : ${hasOtherParticipants}`);
    if (hasOtherParticipants) {
      this.server.to(`session-${sessionId}`).emit('hasOtherParticipants', { userId, role });
    }

    // Notify other participants that someone has joined
    this.server.to(`session-${sessionId}`).emit('participantJoined', { userId, role });

    const technicalStatus = await this.technicalTestStatus(sessionId);
    this.server.to(`session-${sessionId}`).emit('technicalStatus', { technicalStatus });

    const isStarted = await this.checkSessionStarted(sessionId);

    if (isStarted) {
      await this.notifyJoinSession(sessionId);
    } else {
      if (role == 'CANDIDATE') {
        client.broadcast.emit('joinedParticipants', { sessionId, userId });
      }


      const participants = this.activeSessions.get(sessionId);
      const hasCandidate = Array.from(participants).some(
        (p) => p.role === 'CANDIDATE',
      );
      const hasCompany = Array.from(participants).some(
        (p) => p.role === 'COMPANY',
      );
      if (hasCandidate && hasCompany) {
        await this.triggerDatabaseCall(sessionId);
      }
      if (role === 'COMPANY') {
        await this.notifyJoinSession(sessionId);
      }
    }
  }

  @SubscribeMessage('join-video-session')
  async handleJoinInterviewVideoSession(
    @MessageBody() data: { sessionId: string; peerId: string; },
    @ConnectedSocket() client: Socket
  ) {
    const { sessionId, peerId } = data;

    // Join the specified session room
    await client.join(sessionId);
    // Notify all clients in the room about new peer
    this.server.to(sessionId).emit('peer-joined', {
      joinedSessionId: sessionId,
      peerId: peerId, // Using userId as peerId
    });
  }

  async technicalTestStatus(sessionId: string) {
    try {

      const questions = await this.prisma.question.findMany({
        where: {
          sessionID: sessionId,
        },
        select: {
          isAnswered: true,
        },
      });

      if (questions.length === 0) {
        return "toBeConducted";
      }

      // Check if all questions are answered
      const allAnswered = questions.every((q) => q.isAnswered);
      if (allAnswered) {
        return "completed";
      }

      // Check if at least one question is answered
      const atLeastOneAnswered = questions.some((q) => q.isAnswered);
      if (atLeastOneAnswered) {
        return "ongoing";
      }

      // If no questions are answered, return "toBeConducted"
      return "toBeConducted";
    } catch (error) {
      console.error("Error fetching session status:", error);
      throw error;
    }
  }

  async notifyJoinSession(sessionId: string): Promise<void> {
    const questions = await this.fetchQuestionsForSession(sessionId);
    console.log(questions);
    this.server.to(`session-${sessionId}`).emit('questions', { questions });
    const question = await this.fetchQuestionsForUser(sessionId);
    console.log(question);
    this.server.to(`session-${sessionId}`).emit('question', { question });
    const categoryScores = await this.fetchCategoryScores(sessionId);
    console.log(categoryScores);
    this.server.to(`session-${sessionId}`).emit('categoryScores', { categoryScores });
    const totalScore = await this.calculateTotalScore(sessionId);
    console.log(totalScore);
    this.server.to(`session-${sessionId}`).emit('totalScore', { totalScore });
  }

  async checkSessionStarted(sessionId: string) {
    const status = await this.prisma.interviewSession.findUnique({
      where: { sessionId },
      select: {
        interviewStatus: true,
      }
    });
    if (!status) {
      return false;
    } else {
      return status.interviewStatus != 'toBeConducted';
    }
  }

  async triggerDatabaseCall(sessionId: string) {

    this.logger.log(`Both CANDIDATE and COMPANY have joined session ${sessionId}. Triggering database call...`);


    await this.prisma.interviewSession.update({
      where: { sessionId: sessionId },
      data: { interviewStatus: 'ongoing' },
    });
  }

  private async fetchCategoryScores(sessionId: string) {
    return await this.categoryService.getCategoryScoresBySessionId(sessionId);
  }

  @SubscribeMessage('submitCategoryScore')
  async submitCategoryScore(@MessageBody() data: { sessionId: string; categoryScoreId: string; score: number }) {
    const { sessionId, categoryScoreId, score } = data;

    if (!sessionId || !categoryScoreId || score === undefined) {
      this.logger.error('Invalid input data: sessionId, categoryScoreId, and score are required');
      this.server.to(`session-${sessionId}`).emit('error', {
        message: 'Invalid input data: sessionId, categoryScoreId, and score are required',
      });
      return;
    }

    if (typeof score !== 'number' || score < 0 || score > 100) {
      this.logger.error(`Invalid score: ${score}. Score must be a number between 0 and 100`);
      this.server.to(`session-${sessionId}`).emit('error', {
        message: 'Invalid score: Score must be a number between 0 and 100',
      });
      return;
    }

    try {
      const updateScoreDto = new UpdateCategoryScoreDto();
      updateScoreDto.score = score;

      const updatedScore = await this.updateCategoryScore(categoryScoreId, updateScoreDto);
      this.logger.log(`Category score updated successfully: ${JSON.stringify(updatedScore)}`);

      const totalScore = await this.calculateTotalScore(sessionId);
      this.logger.log(`Total score calculated successfully: ${JSON.stringify(totalScore)}`);

      const categoryScores = await this.fetchCategoryScores(sessionId);
      this.logger.log(`Category scores fetched successfully: ${JSON.stringify(categoryScores)}`);

      this.server.to(`session-${sessionId}`).emit('categoryScores', { categoryScores });
      this.server.to(`session-${sessionId}`).emit('totalScore', { totalScore });
    } catch (error) {
      this.logger.error(`Error in submitCategoryScore: ${error.message}`);

      this.server.to(`session-${sessionId}`).emit('error', {
        message: error instanceof NotFoundException ? error.message : 'An error occurred while processing your request',
      });
    }
  }

  @SubscribeMessage('submitSubCategoryScore')
  async submitSubCategoryScore(@MessageBody() data: { sessionId: string; subCategoryScoreId: string; score: number }) {
    const { sessionId, subCategoryScoreId, score } = data;

    if (!sessionId || !subCategoryScoreId || score === undefined) {
      this.logger.error('Invalid input data: sessionId, categoryScoreId, and score are required');
      this.server.to(`session-${sessionId}`).emit('error', {
        message: 'Invalid input data: sessionId, categoryScoreId, and score are required',
      });
      return;
    }

    if (typeof score !== 'number' || score < 0 || score > 100) {
      this.logger.error(`Invalid score: ${score}. Score must be a number between 0 and 100`);
      this.server.to(`session-${sessionId}`).emit('error', {
        message: 'Invalid score: Score must be a number between 0 and 100',
      });
      return;
    }

    try {
      const updateScoreDto = new UpdateCategoryScoreDto();
      updateScoreDto.score = score;

      const updatedScore = await this.updateSubCategoryScore(subCategoryScoreId, updateScoreDto);
      this.logger.log(`Category score updated successfully: ${JSON.stringify(updatedScore)}`);

      const totalScore = await this.calculateTotalScore(sessionId);
      this.logger.log(`Total score calculated successfully: ${JSON.stringify(totalScore)}`);

      const categoryScores = await this.fetchCategoryScores(sessionId);
      this.logger.log(`Category scores fetched successfully: ${JSON.stringify(categoryScores)}`);

      this.server.to(`session-${sessionId}`).emit('categoryScores', { categoryScores });
      this.server.to(`session-${sessionId}`).emit('totalScore', { totalScore });
    } catch (error) {
      this.logger.error(`Error in submitCategoryScore: ${error.message}`);

      this.server.to(`session-${sessionId}`).emit('error', {
        message: error instanceof NotFoundException ? error.message : 'An error occurred while processing your request',
      });
    }
  }

  private async updateCategoryScore(categoryScoreId: string, dto: UpdateCategoryScoreDto) {
    return await this.categoryService.updateCategoryScore(categoryScoreId, dto);
  }

  private async updateSubCategoryScore(subCategoryScoreId: string, dto: UpdateCategoryScoreDto) {
    return await this.categoryService.updateSubCategoryScore(subCategoryScoreId, dto);
  }

  private async calculateTotalScore(sessionId: string) {
    return await this.categoryService.calculateTotalScore(sessionId);
  }


  @SubscribeMessage('submitAnswer')
  async handleSubmitAnswer(
    @MessageBody() data: { sessionId: string, questionId: string, candidateId: string, answerText: string, questionText: string },
    @ConnectedSocket() client: Socket
  ) {
    const { sessionId, questionId, candidateId, answerText, questionText } = data;
    console.log(data);

    await this.prisma.question.update({
      where: {
        questionID: questionId
      },
      data: {
        isAnswered: true,
      }
    })

    let answer = await this.prisma.answer.findUnique({
      where: { questionID: questionId },
    });

    if (answer) {
      answer = await this.prisma.answer.update({
        where: { questionID: questionId },
        data: { responseText: answerText },
      });
      console.log('Answer updated:', answer);
    } else {
      answer = await this.prisma.answer.create({
        data: {
          sessionID: sessionId,
          questionID: questionId,
          candidateID: candidateId,
          responseText: answerText,
          responseTime: new Date(),
          languageDetected: 'en',
          sentimentAnalysis: null,
          keywordExtracted: null,
        },
      });
      console.log('Answer created:', answer);
    }

    const metrics = await this.analyzeResponse(questionText, answerText);

    const score = await this.upsertScore(answer.responseID, metrics.relevanceScore);

    const categoryScoreId = await this.findCategoryScoreId('Technical', sessionId);

    const totalScore = await this.getTotalScoreBySessionId(sessionId);

    const dataScore = {
      sessionId: sessionId,
      categoryScoreId: categoryScoreId.categoryScoreId,
      score: totalScore.score,
    };

    this.submitCategoryScore(dataScore);

    await this.notifyAnswerSubmission(sessionId, questionId, candidateId, questionText, answerText, metrics, totalScore);
  }

  private async findCategoryScoreId(category: string, sessionId: string) {
    const categoryScoreId = await this.prisma.categoryScore.findFirst({
      where: {
        sessionId: sessionId,
        categoryAssignment: {
          category: {
            categoryName: category,
          }
        }
      },
      select: {
        categoryScoreId: true,
      }
    })
    return categoryScoreId;
  }

  private async analyzeResponse(questionText: string, answerText: string) {
    return this.aiService.analyzeResponse({
      question: questionText,
      answer: answerText,
    });
  }

  private async upsertScore(responseId: string, relevanceScore: string) {
    const existingScore = await this.prisma.score.findUnique({
      where: { responseId },
    });

    if (existingScore) {
      return this.prisma.score.update({
        where: { responseId },
        data: { score: parseFloat(relevanceScore) },
      });
    } else {
      return this.prisma.score.create({
        data: { responseId, score: parseFloat(relevanceScore) },
      });
    }
  }

  private async getTotalScoreBySessionId(sessionId: string) {
    const total = await this.answerService.getTotalScoreBySessionId(sessionId);
    return total;
  }

  private async notifyAnswerSubmission(
    sessionId: string,
    questionId: string,
    candidateId: string,
    questionText: string,
    answerText: string,
    metrics: any,
    totalScore: any,
  ) {
    this.server.to(`session-${sessionId}`).emit('answerSubmitted', {
      questionId,
      candidateId,
      questionText,
      answerText,
      metrics,
      totalScore,
    });
    const questions = await this.fetchQuestionsForSession(sessionId);
    this.server.to(`session-${sessionId}`).emit('questions', { questions });
    const technicalStatus = await this.technicalTestStatus(sessionId);
    // this.server.to(`session-${sessionId}`).emit('technicalStatus', {technicalStatus});
    if (technicalStatus === 'completed') {
      this.server.to(`session-${sessionId}`).emit('technicalStatus', { technicalStatus: 'testEnd' });
    }
  }

  @SubscribeMessage('nextQuestion')
  async handleNextQuestion(
    @MessageBody() data: { sessionId: string, followUpQuestion?: string },
    @ConnectedSocket() client: Socket
  ) {
    const { sessionId, followUpQuestion } = data;

    console.log(`Received nextQuestion event for session ${sessionId}`);
    let question;

    if (followUpQuestion) {
      question = await this.prisma.question.create({
        data: {
          questionText: followUpQuestion,
          type: 'OPEN_ENDED',
          estimatedTimeMinutes: 5,
          usageFrequency: 0,
          interviewSession: {
            connect: {
              sessionId: sessionId,
            },
          },
        },
      });
    } else {
      question = await this.fetchQuestionsForUser(sessionId);
    }


    const message = {
      type: followUpQuestion ? 'followUpQuestion' : 'navigateToNextQuestion',
      question,
    };

    this.server.to(`session-${sessionId}`).emit('question', { question });

    const questions = await this.fetchQuestionsForSession(sessionId);
    this.server.to(`session-${sessionId}`).emit('questions', { questions });

    this.server.to(`session-${sessionId}`).emit('navigateNextQuestion', message);
    const technicalStatus = await this.technicalTestStatus(sessionId);
    // if(technicalStatus === 'completed'){
    //   this.server.to(`session-${sessionId}`).emit('technicalStatus', {technicalStatus:'testEnd'});
    // }
    this.server.to(`session-${sessionId}`).emit('technicalStatus', { technicalStatus });

    console.log(`Emitted nextQuestion event to room session-${sessionId}:`, message);
  }

  @SubscribeMessage('sendMessage')
  handleMessage(
    @MessageBody() data: { sessionId: string; message: string; senderId: string; senderRole: 'COMPANY' | 'CANDIDATE' },
    @ConnectedSocket() client: Socket,
  ) {
    const { sessionId, message, senderId, senderRole } = data;

    // Broadcast the message to all participants in the chat room
    this.server.to(`session-${sessionId}`).emit('receiveMessage', {
      senderId,
      senderRole,
      message,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('startTest')
  async handleStartTest(
    @MessageBody() data: { sessionId: string },
    @ConnectedSocket() client: Socket
  ) {
    const { sessionId } = data;

    console.log(`Received nextQuestion event for session ${sessionId}`);
    const question = await this.fetchQuestionsForUser(sessionId);
    console.log(question);
    this.server.to(`session-${sessionId}`).emit('question', { question });

    const questions = await this.fetchQuestionsForSession(sessionId);
    this.server.to(`session-${sessionId}`).emit('questions', { questions });

    const technicalStatus = await this.technicalTestStatus(sessionId);
    this.server.to(`session-${sessionId}`).emit('technicalStatus', { technicalStatus: 'ongoing' });
  }


  @SubscribeMessage('endTest')
  async handleEndTest(
    @MessageBody() data: { sessionId: string },
    @ConnectedSocket() client: Socket
  ) {
    const { sessionId } = data;

    const technicalStatus = await this.technicalTestStatus(sessionId);
    this.server.to(`session-${sessionId}`).emit('technicalStatus', { technicalStatus });
  }

  @SubscribeMessage('typingUpdate')
  handleTypingUpdate(
    @MessageBody() data: { sessionId: string; text: string },
    @ConnectedSocket() client: Socket
  ) {
    const { sessionId, text } = data;

    this.server.to(`session-${sessionId}`).emit('typingUpdate', {
      text,
      timestamp: new Date().toISOString()
    });

    // this.logger.debug(`Typing update for session ${sessionId}: ${text.substring(0, 20)}...`);
  }

  @SubscribeMessage('leaveInterviewSession')
  handleLeaveInterviewSession(
    @MessageBody() data: { sessionId: string, userId: string },
    @ConnectedSocket() client: Socket
  ) {
    const { sessionId, userId } = data;

    client.leave(`session-${sessionId}`);

    if (this.activeSessions.has(sessionId)) {
      const participants = this.activeSessions.get(sessionId);

      let participantToDelete: { userId: string; role: string } | undefined;
      for (const participant of participants) {
        if (participant.userId === userId) {
          participantToDelete = participant;
          break;
        }
      }

      if (participantToDelete) {
        participants.delete(participantToDelete);
      }

      if (participants.size === 0) {
        this.activeSessions.delete(sessionId);
      }
    }

    // Notify other participants that someone has left
    this.server.to(`session-${sessionId}`).emit('participantLeft', { userId });
  }

  @SubscribeMessage('endInterviewSession')
  async handleEndInterviewSession(
    @MessageBody() data: { sessionId: string, userId: string },
    @ConnectedSocket() client: Socket
  ) {
    const { sessionId, userId } = data;

    // const question = this.fetchQuestionsForUser(sessionId);
    await this.updateSessionStatus(sessionId);

    const totalScore = await this.calculateTotalScore(sessionId);
    this.logger.log(`Total score calculated successfully: ${JSON.stringify(totalScore)}`);

    const categoryScores = await this.fetchCategoryScores(sessionId);
    this.logger.log(`Category scores fetched successfully: ${JSON.stringify(categoryScores)}`);

    this.server.to(`session-${sessionId}`).emit('categoryScores', { categoryScores });
    this.server.to(`session-${sessionId}`).emit('totalScore', { totalScore });

    this.handleLeaveInterviewSession({ sessionId, userId }, client);

  }

  private async updateSessionStatus(sessionId: string) {

    this.logger.log(`Session is suceesfully completed ${sessionId}. Triggering update session status...`);


    await this.prisma.interviewSession.update({
      where: { sessionId: sessionId },
      data: { interviewStatus: 'completed' },
    });
  }

  private leaveAllRooms(client: Socket) {
    const rooms = Object.keys(client.rooms);
    rooms.forEach((room) => client.leave(room));
  }

  private async fetchQuestionsForSession(sessionId: string) {
    // Fetch questions from the database using Prisma
    const session = await this.prisma.interviewSession.findUnique({
      where: { sessionId },
      include: {
        questions: {
          include: {
            interviewResponses: {
              include: {
                score: true,
              }
            }
          }
        }
      },
    });

    return session?.questions || [];
  }

  private async fetchQuestionsForUser(sessionId: string) {
    const question = await this.prisma.question.findFirst({
      where: {
        sessionID: sessionId,
        isAnswered: false,
      }
    });

    return question ? question : null;
  }
}