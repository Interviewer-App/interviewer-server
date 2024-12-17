import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { CreateInterviewSessionDto } from './dto/create-interview-session.dto';
import { UpdateInterviewSessionDto } from './dto/update-interview-session.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InterviewSessionService {

  private readonly logger = new Logger('InterviewService');

  constructor(
    private prisma: PrismaService,

  ) { }

  async create(dto: CreateInterviewSessionDto) {
    this.logger.log(`POST: interview/create: New interview started`);

    try {
      // Creating a new interview in the database
      const interviewSession = await this.prisma.interviewSession.create({
        data: {
          interviewId:dto.interviewId,
          candidateId:dto.candidateId,
          responses:dto.responses,
          status:dto.status,
          startTime:dto.startTime,
          endTime:dto.endTime,
          score:dto.score,
          aiAnalysis:dto.aiAnalysis
        },
      });

      // const interview = await this.prisma.interview.update({
      //   where: { id: dto.interviewId },
      //   data: {
      //     sessions: interviewSession,
      //   },
      // });

      this.logger.log(
        `POST: interview-sessiom/create: Interview Session ${interviewSession.id} created successfully`
      );

      return {
        message: "Interview session created successfully",
        interviewSession,
      };
    } catch (error) {
      // Custom Prisma error handler
      this.prismaErrorHandler(error, "POST", dto.interviewId);
      this.logger.error(`POST: interview/create: Error: ${error.message}`);
      throw new InternalServerErrorException("Server error occurred");
    }
  }

  // findAll() {
  //   return `This action returns all interviewSession`;
  // }
  //
  // findOne(id: number) {
  //   return `This action returns a #${id} interviewSession`;
  // }
  //
  // update(id: number, updateInterviewSessionDto: UpdateInterviewSessionDto) {
  //   return `This action updates a #${id} interviewSession`;
  // }
  //
  // remove(id: number) {
  //   return `This action removes a #${id} interviewSession`;
  // }

  private prismaErrorHandler(error: any, method: string, identifier: string) {
    if (error.code === "P2002") {
      this.logger.error(
        `${method}: Conflict: Duplicate entry for interviewId ${identifier}`
      );
      throw new InternalServerErrorException(
        "Duplicate entry: A record with this interview ID already exists."
      );
    }
    this.logger.error(`${method}: Prisma error: ${error.message}`);
  }
}
