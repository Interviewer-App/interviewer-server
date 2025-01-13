import { Injectable, InternalServerErrorException, Logger, NotFoundException } from "@nestjs/common";
import { CreateInterviewSessionDto } from './dto/create-interview-session.dto';
import { UpdateInterviewSessionDto } from './dto/update-interview-session.dto';
import { PrismaService } from '../prisma/prisma.service';
import { arrayNotEmpty, isNotEmpty } from "class-validator";
import { UpdateQuestionDto } from "./dto/update-question.dto";
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
        where: { interviewID: dto.interviewId },
      });
      if (!interview) {
        throw new NotFoundException(`Interview with id ${dto.interviewId} not found`);
      }
      const candidate = await this.prisma.candidate.findUnique({
        where: { profileID: dto.candidateId },
      });
      if (!candidate) {
        throw new NotFoundException(`Candidate with id ${dto.candidateId} not found`);
      }

      const existingSession = await this.prisma.interviewSession.findUnique({
          where: {
            interviewId_candidateId: {
              interviewId: dto.interviewId,
              candidateId: dto.candidateId,
            },
          },
      })
      if (existingSession != null ) {
        return {
          message: "Interview session already exists",
          interviewSession: existingSession,
        };
      }
      const interviewSession = await this.prisma.interviewSession.create({
        data: {
          interviewId: dto.interviewId,
          candidateId: dto.candidateId,
          scheduledDate: dto.scheduledDate,
          scheduledAt: dto.scheduledAt,
          interviewCategory: dto.interviewCategory,
          interviewStatus: dto.interviewStatus
        },
      });

      await this.prisma.interview.update({
        where: { interviewID: dto.interviewId },
        data: {
          interviewSessions: {
            connect: { sessionId: interviewSession.sessionId },
          },
        },
      });

      this.logger.log(
        `POST: interview-session/create: Interview Session ${interviewSession.sessionId} created successfully`
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
      where: { sessionId:id },
    });
    if (!interviewSession) {
      throw new NotFoundException(`Interview session with id ${id} not found`);
    }
    

    try {
      // Creating a new interview in the database
      const interviewSession = await this.prisma.interviewSession.update({
        where: { sessionId:id },
        data: {
          scheduledDate: dto.scheduledDate,
          scheduledAt: dto.scheduledAt,
          interviewCategory: dto.interviewCategory,
          interviewStatus: dto.interviewStatus
        },
      });

      this.logger.log(
        `POST: interview/update: Interview ${interviewSession.sessionId} updaated successfully`
      );
      // this._kafka.produce({
      //   topic: 'update-interview-session',
      //   messages:[{value:'this is interview session updated'}]
      // })

      return {
        message: "Interview session updated successfully",
        interviewSession,
      };
    } catch (error) {
      // Custom Prisma error handler
      this.prismaErrorHandler(error, "POST", id);
      this.logger.error(`POST: interview/create: Error: ${error.message}`);
      throw new InternalServerErrorException("Server error occurred");
    }
  }

  async findByInterviewId(interviewId: string, page: number, limit: number) {
    try {
      const skip = (page - 1) * limit;
      const take = Number(limit);
      const interviewSessions = await this.prisma.interviewSession.findMany({
        skip,
        take,
        where: { interviewId: interviewId },
        select: {
          sessionId: true,
          interviewId: true,
          candidateId: true,
          assesmentId: true,
          feedbackId: true,
          interviewCategory: true,
          scheduledDate: true,
          scheduledAt: true,
          completedDate: true,
          interviewStatus: true,
          score: true,
          reviewedBy: true,
          createdAt: true,
          updatedAt: true,
          candidate: {
            include:{
              user: true,
            }
          },
          interview: true,
          scheduling: true,
          questions: true
        }
      });

      if (!interviewSessions || interviewSessions.length === 0) {
        this.logger.warn(`GET: No sessions found for interview ID: ${interviewId}`);
        throw new NotFoundException(`No sessions found for interview ID: ${interviewId}`);
      }
      const total = await this.prisma.interviewSession.count({
        where: {
          interviewId: interviewId,
        }
        }
      );

      return {
        interviewSessions,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
      // return interviewSessions;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`GET: error: ${error}`);
      throw new InternalServerErrorException('Server error');
    }
  }

  async findByCandidateId(candidateId: string, page: number, limit: number) {
    try {
      const skip = (page - 1) * limit;
      const take = Number(limit);
      const interviewSessions = await this.prisma.interviewSession.findMany({
        skip,
        take,
        where: { candidateId: candidateId },
        select: {
          sessionId: true,
          interviewId: true,
          candidateId: true,
          assesmentId: true,
          feedbackId: true,
          interviewCategory: true,
          scheduledDate: true,
          scheduledAt: true,
          completedDate: true,
          interviewStatus: true,
          score: true,
          reviewedBy: true,
          createdAt: true,
          updatedAt: true,
          candidate: true,
          interview: true,
          scheduling: true,
          questions: true
        }
      });

      if (!interviewSessions || interviewSessions.length === 0) {
        this.logger.warn(`GET: No sessions found for candidate ID: ${candidateId}`);
        throw new NotFoundException(`No sessions found for candidate ID: ${candidateId}`);
      }
      const total = await this.prisma.interviewSession.count({
          where: {
            candidateId: candidateId,
          }
        }
      );
      return {
        interviewSessions,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`GET: error: ${error}`);
      throw new InternalServerErrorException('Server error');
    }
  }

  async findBySessionId(sessionId: string) {
    try {
      this.logger.log(`POST: interviewsession/session: Get Interview Session By SessionId started`);

      console.log(sessionId)
      const interviewSessionExist = await this.prisma.interviewSession.findUnique({
          where: { sessionId: sessionId },
      });
      if (!interviewSessionExist) {
        throw new NotFoundException(`Interview session with id ${sessionId} not found`);
      }
      
      const interviewSession = await this.prisma.interviewSession.findUniqueOrThrow({
        where: { sessionId: sessionId },
        select: {
            sessionId: true,
            interviewId: true,
            candidateId: true,
            assesmentId: true,
            feedbackId: true,
            interviewCategory: true,
            scheduledDate: true,
            scheduledAt: true,
            completedDate: true,
            interviewStatus: true,
            score: true,
            reviewedBy: true,
            createdAt: true,
            updatedAt: true,
            candidate: true,
            interview: true,
            scheduling: true,
            questions: true
        }
      });

      return interviewSession;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`GET: error: ${error}`);
      throw new InternalServerErrorException('Server error');
    }
  }

  async findSessionHistoryBySessionId(sessionId: string) {
    try {
      this.logger.log(`POST: interviewsession/session: Get Interview Session By SessionId started`);

      const interviewSessionExist = await this.prisma.interviewSession.findUnique({
        where: { sessionId: sessionId },
      });
      if (!interviewSessionExist) {
        throw new NotFoundException(`Interview session with id ${sessionId} not found`);
      }

      const interviewSession = await this.prisma.interviewSession.findUniqueOrThrow({
        where: { sessionId: sessionId },
        select: {
          sessionId: true,
          interviewId: true,
          candidateId: true,
          assesmentId: true,
          feedbackId: true,
          interviewCategory: true,
          scheduledDate: true,
          scheduledAt: true,
          completedDate: true,
          interviewStatus: true,
          score: true,
          reviewedBy: true,
          createdAt: true,
          updatedAt: true,
          candidate: true,
          interview: true,
          scheduling: true,
          questions: {
            include:{
              interviewResponses:{
                include:{
                  score: true,
                }
              }
            }
          }
        }
      });

      return interviewSession;
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
        where: { sessionId: id },
      });
      if (!interviewSessionExist) {
        throw new NotFoundException(`Interview session with id ${id} not found`);
      }
      const deletedInterviewSession = await this.prisma.interviewSession.delete({
        where: {sessionId:id},
        select:{
          sessionId: true,
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

    async findQuestionsBySessionId(sessionId: string) {
        try {
            const questions = await this.prisma.question.findMany({
                where: { sessionID: sessionId },
                select: {
                    questionID: true,
                    sessionID: true,
                    questionText: true,
                    type: true,
                    estimatedTimeMinutes: true,
                    createdAt: true,
                    updatedAt: true,
                }
            });

            if (!questions || questions.length === 0) {
                this.logger.warn(`GET: No questions found for session ID: ${sessionId}`);
                throw new NotFoundException(`No questions found for session ID: ${sessionId}`);
            }
            return questions;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            this.logger.error(`GET: error: ${error}`);
            throw new InternalServerErrorException('Server error');
        }
    }

  async removeQuestionByQuestionId(questionId: string) {

      try {
          const questionExist = await this.prisma.question.findUnique({
              where: { questionID: questionId },
          });
          if (!questionExist) {
              throw new NotFoundException(`Question with id ${questionId} not found`);
          }
          const deletedQuestion = await this.prisma.question.delete({
              where: {questionID:questionId},
              select:{
                  questionID: true,
              }
          });

          this.logger.warn(`DELETE: ${JSON.stringify(deletedQuestion)}`);
          return {message: `Question with id ${questionId} deleted`}

      } catch (error) {
          if (error instanceof NotFoundException) {
              throw error;
          }
          this.prismaErrorHandler(error, "DELETE", questionId);
          this.logger.error(`DELETE: error: ${error}`);
          throw new InternalServerErrorException('Server error');
      }
  }

  async updateQuestionById(questionId: string, dto: UpdateQuestionDto) {
      this.logger.log(`POST: question/update: Question update started`);

      try {
          const questionExist = await this.prisma.question.findUnique({
              where: { questionID: questionId },
          });
          if (!questionExist) {
              throw new NotFoundException(`Question with id ${questionId} not found`);
          }
          const question = await this.prisma.question.update({
              where:{questionID:questionId},
              data: {
                  questionText:dto.question,
                  type:dto.type.toUpperCase() === 'OPEN_ENDED' ? 'OPEN_ENDED' : 'CODING',
                  estimatedTimeMinutes:dto.estimatedTimeInMinutes
              },
          });

          this.logger.log(
            `POST: question/update: Question ${question.questionID} updated successfully`
          );

          return {
              message: `Question for ID ${question.questionID} updated successfully`,
              question,
          };
      } catch (error) {
          if (error instanceof NotFoundException) {
              throw error;
          }
          // Custom Prisma error handler
          this.prismaErrorHandler(error, "PATCH", questionId);
          this.logger.error(`POST: question/update: Error: ${error.message}`);
          throw new InternalServerErrorException("Server error occurred");
      }
  }

  async removeQuestionBySessionId(sessionId: string) {
      try {
          const deletedQuestions = await this.prisma.question.deleteMany({
              where: {sessionID:sessionId},
          });

          if (!deletedQuestions || deletedQuestions.count === 0) {
              this.logger.warn(`GET: No questions found for session ID: ${sessionId}`);
              throw new NotFoundException(`No questions found for session ID: ${sessionId}`);
          }

          this.logger.warn(`DELETE: ${JSON.stringify(deletedQuestions)}`);
          return {message: `Question with associated with Session id ${sessionId} deleted`}

      } catch (error) {
          if (error instanceof NotFoundException) {
              throw error;
          }
          this.prismaErrorHandler(error, "DELETE", sessionId);
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
