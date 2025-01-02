import { Injectable, InternalServerErrorException, Logger, NotFoundException } from "@nestjs/common";
import { CreateInterviewSessionDto } from './dto/create-interview-session.dto';
import { UpdateInterviewSessionDto } from './dto/update-interview-session.dto';
import { PrismaService } from '../prisma/prisma.service';
import { arrayNotEmpty, isNotEmpty } from "class-validator";
// import { ProducerService } from '../kafka/producer/producer.service';

@Injectable()
export class InterviewSessionService {

  private readonly logger = new Logger('InterviewService');

  constructor(
    private prisma: PrismaService,
    // private readonly _kafka: ProducerService,
  ) { }

  async create(dto: CreateInterviewSessionDto) {
    this.logger.log(`POST: interview/create: New interview started`);

    try {
      const interview = await this.prisma.interview.findUnique({
        where: { id: dto.interviewId },
      });
      if (!interview) {
        throw new NotFoundException(`Interview with id ${dto.interviewId} not found`);
      }
      const candidate = await this.prisma.user.findUnique({
        where: { userID: dto.candidateId },
      });
      if (!candidate) {
        throw new NotFoundException(`Candidate with id ${dto.candidateId} not found`);
      }
      // Creating a new interview in the database
      const interviewSession = await this.prisma.interviewSession.create({
        data: {
          interviewId: dto.interviewId,
          candidateId: dto.candidateId,
          responses: dto.responses,
          status: dto.status,
          startTime: dto.startTime,
          endTime: dto.endTime,
          score: dto.score,
          aiAnalysis: dto.aiAnalysis
        },
      });

      await this.prisma.interview.update({
        where: { id: dto.interviewId },
        data: {
          sessions: {
            connect: { id: interviewSession.id },
          },
        },
      });

      this.logger.log(
        `POST: interview-session/create: Interview Session ${interviewSession.id} created successfully`
      );


      // this._kafka.produce({
      //   topic: 'new-interview-session',
      //   messages:[{value:'this is interview session created'}]
      // })

      return {
        message: "Interview session created successfully",
        interviewSession,
      };
    } catch (error) {
      // Custom Prisma error handler
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.prismaErrorHandler(error, "POST", dto.interviewId);
      this.logger.error(`POST: interview/create: Error: ${error.message}`);
      throw new InternalServerErrorException("Server error occurred");
    }
  }

  async update(id: string, dto: UpdateInterviewSessionDto) {

    this.logger.log(`POST: interviewsession/update: Interview Session update started`);

    const interviewSession = await this.prisma.interviewSession.findUnique({
      where: { id },
    });
    if (!interviewSession) {
      throw new NotFoundException(`Interview session with id ${id} not found`);
    }
    

    try {
      // Creating a new interview in the database
      const interviewSession = await this.prisma.interviewSession.update({
        where: { id},
        data: {
          responses: dto.responses,
          status: dto.status,
          startTime: dto.startTime,
          endTime: dto.endTime,
          score: dto.score,
          aiAnalysis: dto.aiAnalysis
        },
      });

      this.logger.log(
        `POST: interview/update: Interview ${interviewSession.id} updaated successfully`
      );
      // this._kafka.produce({
      //   topic: 'update-interview-session',
      //   messages:[{value:'this is interview session updated'}]
      // })

      return {
        message: "Interview updated successfully",
        interviewSession,
      };
    } catch (error) {
      // Custom Prisma error handler
      this.prismaErrorHandler(error, "POST", id);
      this.logger.error(`POST: interview/create: Error: ${error.message}`);
      throw new InternalServerErrorException("Server error occurred");
    }
  }

  async findByInterviewId(interviewId: string) {
    try {
      const interviewSessions = await this.prisma.interviewSession.findMany({
        where: { interviewId: interviewId },
        select: {
          id: true,
          interviewId: true,
          candidateId: true,
          responses: true,
          status: true,
          startTime: true,
          endTime: true,
          score: true,
          aiAnalysis: true,
        }
      });
      if (!interviewSessions || interviewSessions.length === 0) {
        this.logger.warn(`GET: No sessions found for interview ID: ${interviewId}`);
        throw new NotFoundException(`No sessions found for interview ID: ${interviewId}`);
      }
      return interviewSessions;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`GET: error: ${error}`);
      throw new InternalServerErrorException('Server error');
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
  async remove(id: string) {
    try {
      const interviewSessionExist = await this.prisma.interviewSession.findUnique({
        where: { id: id },
      });
      if (!interviewSessionExist) {
        throw new NotFoundException(`Interview session with id ${id} not found`);
      }
      const deletedInterviewSession = await this.prisma.interviewSession.delete({
        where: {id:id},
        select:{
          id: true,
        }
      });

      this.logger.warn(`DELETE: ${JSON.stringify(deletedInterviewSession)}`);
      return {message: "Interview Session deleted"}

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.prismaErrorHandler(error, "DELETE", id);
      this.logger.error(`DELETE: error: ${error}`);
      throw new InternalServerErrorException('Server error');
    }
  }

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
