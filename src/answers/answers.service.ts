import { Injectable, InternalServerErrorException, Logger, NotFoundException } from "@nestjs/common";
import { CreateAnswerDto } from './dto/create-answer.dto';
import { UpdateAnswerDto } from './dto/update-answer.dto';
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AnswersService {

  private readonly logger = new Logger('QuestionService');

  constructor(
    private prisma: PrismaService,


  ) { }
  
  async create(dto: CreateAnswerDto) {
    this.logger.log(`POST: answers/create: Answers added to the questions`);

    try {
      const candidate = await this.prisma.candidate.findUnique({
        where: { profileID: dto.candidateID },
      });
      if (!candidate) {
        throw new NotFoundException(`Candidate with id ${dto.candidateID} not found`);
      }
      const question = await this.prisma.question.findUnique({
        where: { questionID: dto.questionID },
      });
      if (!question) {
        throw new NotFoundException(`Question with id ${dto.questionID} not found`);
      }
      const session = await this.prisma.interviewSession.findUnique({
        where: { sessionId: dto.sessionID },
      });
      if (!session) {
        throw new NotFoundException(`Session with id ${dto.sessionID} not found`);
      }
      // Creating a new interview in the database
      const answer = await this.prisma.answer.create({
        data: {
          candidateID: dto.candidateID,
          questionID: dto.questionID,
          sessionID: dto.sessionID,
          responseText: dto.responseText,
          responseTime: dto.responseTime,
          languageDetected: dto.languageDetected,
          sentimentAnalysis: dto.sentimentAnalysis || '',
          keywordExtracted: dto.keywordExtracted || '',
          comparisonID: dto.comparisonID || '',
          assessmentID: dto.assessmentID || '',
          reviewID: dto.reviewID || '',
        },
      });

      this.logger.log(
        `POST: Answer/create: Answer response ${answer.responseID} created successfully`
      );

      return {
        message: "Answer saved successfully",
        answer,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      // Custom Prisma error handler
      this.prismaErrorHandler(error, "POST", dto.questionID);
      this.logger.error(`POST: interview/create: Error: ${error.message}`);
      throw new InternalServerErrorException("Server error occurred");
    }
  }

  // findAll() {
  //   return `This action returns all answers`;
  // }
  //
  // findOne(id: number) {
  //   return `This action returns a #${id} answer`;
  // }
  //
  // update(id: number, updateAnswerDto: UpdateAnswerDto) {
  //   return `This action updates a #${id} answer`;
  // }
  //
  // remove(id: number) {
  //   return `This action removes a #${id} answer`;
  // }

  private prismaErrorHandler(error: any, method: string, identifier: string|number) {
    if (error.code === "P2002") {
      this.logger.error(
        `${method}: Conflict: Duplicate entry for question ${identifier}`
      );
      throw new InternalServerErrorException(
        "Duplicate entry: A record with this question ID already exists."
      );
    }
    this.logger.error(`${method}: Prisma error: ${error.message}`);
  }

  async getTotalScoreBySessionId(sessionId: string) {
    try {
      const answers = await this.prisma.answer.findMany({
        where: { sessionID: sessionId },
        include: { score: true },
      });

      if (answers.length === 0) {
        throw new NotFoundException(`No answers found for session ID ${sessionId}`);
      }

      let totalScore = 0;
      let numberOfAnswers = 0;

      for (const answer of answers) {
        if (answer.score) {
          totalScore += answer.score.score;
          numberOfAnswers++;
        }
      }

      const session = await this.prisma.interviewSession.update({
        where: {
          sessionId: sessionId
        },
        data: {
          score: totalScore,
        }
      })

      return {
        sessionId,
        totalScore,
        numberOfAnswers,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`GET: error: ${error}`);
      throw new InternalServerErrorException('Server error');
    }
  }
}
