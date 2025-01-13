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

@WebSocketGateway({ cors: true })
export class InterviewSessionGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  // Track active interview sessions
  private activeSessions: Map<string, Set<string>> = new Map(); // sessionId -> Set of participantIds (candidate and company)

  constructor(private prisma: PrismaService, private aiService : AiService) {}

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
    }
  }
  @SubscribeMessage('submitAnswer')
  async handleSubmitAnswer(
    @MessageBody() data: { sessionId: string, questionId: string, candidateId: string, answerText: string, questionText: string, questionNumber: string, numOfQuestions: string },
    @ConnectedSocket() client: Socket
  ) {
    const { sessionId, questionId, candidateId, answerText, questionText , questionNumber , numOfQuestions} = data;

    let existing = await this.prisma.answer.findUnique({
      where:{
        questionID: questionId,
      }
    })
    if (existing) {
      existing = await this.prisma.answer.update({
        where:{
          questionID: questionId
        },
        data: {
          responseText: answerText,
        }
      })

      console.log('Answer updated on existing answer:', existing);
      const metrics = await this.aiService.analyzeResponse({
        question: questionText,
        answer: answerText
      });

      const existingScore = await this.prisma.score.findUnique({
        where: {
          responseId: existing.responseID, // Unique identifier for the score record
        },
      });
      
      let score;
      if (existingScore) {
        // Update the existing score
        score = await this.prisma.score.update({
          where: {
            responseId: existing.responseID,
          },
          data: {
            score: parseFloat(metrics.relevanceScore),
          },
        });
      } else {
        // Create a new score
        score = await this.prisma.score.create({
          data: {
            responseId: existing.responseID,
            score: parseFloat(metrics.relevanceScore),
          },
        });
      }

      // Notify the company that the candidate has submitted an answer
      this.server.to(`session-${sessionId}`).emit('answerSubmitted', {
        questionId,
        candidateId,
        questionText,
        answerText,
        metrics
      });

    }else {
      const answer = await this.prisma.answer.create({
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

      console.log('Answer saved:', answer);
      const metrics = await this.aiService.analyzeResponse({
        question: questionText,
        answer: answerText
      });

      const score = await this.prisma.score.create({
        data:{
          responseId: answer.responseID,
          score: parseFloat(metrics.relevanceScore)
        }
      })

      

      // Notify the company that the candidate has submitted an answer
      this.server.to(`session-${sessionId}`).emit('answerSubmitted', {
        questionId,
        candidateId,
        questionText,
        answerText,
        metrics,
        questionNumber,
        numOfQuestions
      });
    }

  }

  @SubscribeMessage('nextQuestion')
  async handleNextQuestion(
    @MessageBody() data: { sessionId: string, nextQuestionId: string, followUpQuestion?: string },
    @ConnectedSocket() client: Socket
  ) {
    const { sessionId, nextQuestionId, followUpQuestion } = data;

    console.log(`Received nextQuestion event for session ${sessionId} with nextQuestionId ${nextQuestionId}`);

    const message = {
      type: followUpQuestion ? 'followUpQuestion' : 'navigateToNextQuestion',
      nextQuestionId,
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