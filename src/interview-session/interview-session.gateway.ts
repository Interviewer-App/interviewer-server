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
  private activeSessions: Map<string, Set<string>> = new Map(); // sessionId -> Set of participantIds (candidate and company)

  constructor(private prisma: PrismaService, private aiService : AiService, private answerService:AnswersService, private categoryService:CategoryService) {}

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
    this.activeSessions.get(sessionId).add(userId);

    // Notify other participants that someone has joined
    this.server.to(`session-${sessionId}`).emit('participantJoined', { userId, role });

    if(role == 'CANDIDATE') {
      client.broadcast.emit('joinedParticipants', { sessionId, userId });
    }

    // If the company starts the session, fetch and send questions to the room
    if (role === 'COMPANY') {
      const questions = await this.fetchQuestionsForSession(sessionId);
      console.log(questions);
      this.server.to(`session-${sessionId}`).emit('questions', { questions });
      const categoryScores = await this.fetchCategoryScores(sessionId);
      console.log(categoryScores);
      this.server.to(`session-${sessionId}`).emit('categoryScores', { categoryScores });
      const totalScore = await this.calculateTotalScore(sessionId);
      console.log(totalScore);
      this.server.to(`session-${sessionId}`).emit('totalScore', { totalScore });
    }
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

  private async updateCategoryScore(categoryScoreId: string, dto: UpdateCategoryScoreDto) {
    return await this.categoryService.updateCategoryScore(categoryScoreId, dto);
  }

  private async calculateTotalScore(sessionId: string) {
    return await this.categoryService.calculateTotalScore(sessionId);
  }
  // @SubscribeMessage('submitAnswer')
  // async handleSubmitAnswer(
  //   @MessageBody() data: { sessionId: string, questionId: string, candidateId: string, answerText: string, questionText: string, questionNumber: string, numOfQuestions: string },
  //   @ConnectedSocket() client: Socket
  // ) {
  //   const { sessionId, questionId, candidateId, answerText, questionText , questionNumber , numOfQuestions} = data;
  //
  //   let existing = await this.prisma.answer.findUnique({
  //     where:{
  //       questionID: questionId,
  //     }
  //   })
  //   if (existing) {
  //     existing = await this.prisma.answer.update({
  //       where:{
  //         questionID: questionId
  //       },
  //       data: {
  //         responseText: answerText,
  //       }
  //     })
  //
  //     console.log('Answer updated on existing answer:', existing);
  //     const metrics = await this.aiService.analyzeResponse({
  //       question: questionText,
  //       answer: answerText
  //     });
  //
  //     const existingScore = await this.prisma.score.findUnique({
  //       where: {
  //         responseId: existing.responseID, // Unique identifier for the score record
  //       },
  //     });
  //    
  //     let score;
  //     if (existingScore) {
  //       // Update the existing score
  //       score = await this.prisma.score.update({
  //         where: {
  //           responseId: existing.responseID,
  //         },
  //         data: {
  //           score: parseFloat(metrics.relevanceScore),
  //         },
  //       });
  //     } else {
  //       // Create a new score
  //       score = await this.prisma.score.create({
  //         data: {
  //           responseId: existing.responseID,
  //           score: parseFloat(metrics.relevanceScore),
  //         },
  //       });
  //     }
  //
  //     // Notify the company that the candidate has submitted an answer
  //     this.server.to(`session-${sessionId}`).emit('answerSubmitted', {
  //       questionId,
  //       candidateId,
  //       questionText,
  //       answerText,
  //       metrics
  //     });
  //
  //   }else {
  //     const answer = await this.prisma.answer.create({
  //       data: {
  //         sessionID: sessionId,
  //         questionID: questionId,
  //         candidateID: candidateId,
  //         responseText: answerText,
  //         responseTime: new Date(),
  //         languageDetected: 'en',
  //         sentimentAnalysis: null,
  //         keywordExtracted: null,
  //       },
  //     });
  //
  //     console.log('Answer saved:', answer);
  //     const metrics = await this.aiService.analyzeResponse({
  //       question: questionText,
  //       answer: answerText
  //     });
  //
  //     const score = await this.prisma.score.create({
  //       data:{
  //         responseId: answer.responseID,
  //         score: parseFloat(metrics.relevanceScore)
  //       }
  //     })
  //
  //    
  //
  //     // Notify the company that the candidate has submitted an answer
  //     this.server.to(`session-${sessionId}`).emit('answerSubmitted', {
  //       questionId,
  //       candidateId,
  //       questionText,
  //       answerText,
  //       metrics,
  //       questionNumber,
  //       numOfQuestions
  //     });
  //   }
  //
  // }

  @SubscribeMessage('submitAnswer')
  async handleSubmitAnswer(
    @MessageBody() data: { sessionId: string, questionId: string, candidateId: string, answerText: string, questionText: string, questionNumber: number, numOfQuestions: number },
    @ConnectedSocket() client: Socket
  ) {
    const { sessionId, questionId, candidateId, answerText, questionText , questionNumber , numOfQuestions} = data;
    console.log(data);
    
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
    
    const categoryScoreId = await this.findCategoryScoreId('Technical');

    const totalScore = await this.getTotalScoreBySessionId(sessionId);

    const dataScore = {
      sessionId: sessionId,
      categoryScoreId: categoryScoreId.categoryScoreId,
      score: totalScore.score,
    } ;

    this.submitCategoryScore(dataScore);

    this.notifyAnswerSubmission(sessionId, questionId, candidateId, questionText, answerText, metrics, questionNumber, numOfQuestions, totalScore);
  }
  
  private async findCategoryScoreId(category:string){
    const categoryScoreId = await this.prisma.categoryScore.findFirst({
      where:{
        categoryAssignment:{
          category:{
            categoryName: category,
          }
        }
      },
      select:{
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

  private notifyAnswerSubmission(
    sessionId: string,
    questionId: string,
    candidateId: string,
    questionText: string,
    answerText: string,
    metrics: any,
    questionNumber: number,
    numOfQuestions: number,
    totalScore: any,
  ) {
    this.server.to(`session-${sessionId}`).emit('answerSubmitted', {
      questionId,
      candidateId,
      questionText,
      answerText,
      metrics,
      questionNumber,
      numOfQuestions,
      totalScore,
    });
  }

  @SubscribeMessage('nextQuestion')
  async handleNextQuestion(
    @MessageBody() data: { sessionId: string, followUpQuestion?: string },
    @ConnectedSocket() client: Socket
  ) {
    const { sessionId, followUpQuestion } = data;

    console.log(`Received nextQuestion event for session ${sessionId}`);

    const message = {
      type: followUpQuestion ? 'followUpQuestion' : 'navigateToNextQuestion',
      followUpQuestion,
    };

    this.server.to(`session-${sessionId}`).emit('navigateNextQuestion', message);

    console.log(`Emitted nextQuestion event to room session-${sessionId}:`, message);
  }

  @SubscribeMessage('leaveInterviewSession')
  handleLeaveInterviewSession(
    @MessageBody() data: { sessionId: string, userId: string },
    @ConnectedSocket() client: Socket
  ) {
    const { sessionId, userId } = data;

    // Leave the session room
    client.leave(`session-${sessionId}`);

    // Remove the participant from the active session
    if (this.activeSessions.has(sessionId)) {
      this.activeSessions.get(sessionId).delete(userId);
    }

    // Notify other participants that someone has left
    this.server.to(`session-${sessionId}`).emit('participantLeft', { userId });
  }

  private leaveAllRooms(client: Socket) {
    const rooms = Object.keys(client.rooms);
    rooms.forEach((room) => client.leave(room));
  }

  private async fetchQuestionsForSession(sessionId: string) {
    // Fetch questions from the database using Prisma
    const session = await this.prisma.interviewSession.findUnique({
      where: { sessionId },
      include: { questions: true },
    });

    return session?.questions || [];
  }
}