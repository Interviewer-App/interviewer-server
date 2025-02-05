import {
  BadRequestException, ConflictException, HttpException, HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException
} from "@nestjs/common";
import { CreateInterviewSessionDto } from './dto/create-interview-session.dto';
import { UpdateInterviewSessionDto } from './dto/update-interview-session.dto';
import { PrismaService } from '../prisma/prisma.service';
import { arrayNotEmpty, isNotEmpty } from "class-validator";
import { UpdateQuestionDto } from "./dto/update-question.dto";
import { CreateQuestionDto } from "./dto/create-question.dto";
// import { ProducerService } from '../kafka/producer/producer.service';
import { StreamClient } from '@stream-io/node-sdk';

@Injectable()
export class InterviewSessionService {

  private readonly logger = new Logger('InterviewService');
  private streamClient: StreamClient;

  constructor(
    private prisma: PrismaService,
    // private readonly _kafka: ProducerService,
  ) { 
    this.streamClient = new StreamClient(
      process.env.STREAM_API_KEY,
      process.env.STREAM_API_SECRET,
    );
  }

  createToken(userId: string): string {
    return this.streamClient.createToken(userId);
  }

  async create(dto: CreateInterviewSessionDto) {
    this.logger.log(`POST: interview-session/create: New session started`);

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
      });
      if (existingSession != null) {
        return {
          message: "Interview session already exists",
          interviewSession: existingSession,
        };
      }

      const bookedSchedule = await this.prisma.scheduling.findUnique({
        where: {
          interviewId_candidateId: {
            interviewId: dto.interviewId,
            candidateId: dto.candidateId,
          },
          isBooked: true,
        }
      });

      if (!bookedSchedule) {
        throw new NotFoundException(`No booked schedule found for candidate ${dto.candidateId} in interview ${dto.interviewId}`);
      }

      if (bookedSchedule.sessionID) {
        throw new BadRequestException(`Schedule ${bookedSchedule.scheduleID} is already mapped to session ${bookedSchedule.sessionID}`);
      }

      // Get category assignments with their subcategories
      const categoryAssignments = await this.prisma.categoryAssignment.findMany({
        where: { interviewId: dto.interviewId },
        include: {
          SubCategoryAssignment: true
        }
      });

      // Create session and scores in a transaction
      const [interviewSession] = await this.prisma.$transaction([
        this.prisma.interviewSession.create({
          data: {
            interviewId: dto.interviewId,
            candidateId: dto.candidateId,
            scheduledDate: dto.scheduledDate,
            scheduledAt: dto.scheduledAt,
            interviewCategory: 'Technical',
            interviewStatus: dto.interviewStatus,
          },
        }),

        // Update scheduling first to lock the schedule
        this.prisma.scheduling.update({
          where: { scheduleID: bookedSchedule.scheduleID },
          data: { sessionID: { set: null } }, // Temporary update to maintain transaction
        })
      ]);

      let num = 0;
      // Create category scores and subcategory scores
      const categoryScores = await Promise.all(
        categoryAssignments.map(async (assignment) => {
          const categoryScore = await this.prisma.categoryScore.create({
            data: {
              sessionId: interviewSession.sessionId,
              assignmentId: assignment.assignmentId,
              score: 0,
              order: num++,
              // Create subcategory scores for each subcategory assignment
              subCategoryScores: {
                create: assignment.SubCategoryAssignment.map(subAssignment => ({
                  subAssignmentId: subAssignment.id,
                  score: 0
                }))
              }
            },
            include: {
              subCategoryScores: true
            }
          });
          return categoryScore;
        })
      );

      // Finalize scheduling update
      await this.prisma.scheduling.update({
        where: { scheduleID: bookedSchedule.scheduleID },
        data: {
          sessionID: interviewSession.sessionId,
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
        `POST: interview-session/create: Session ${interviewSession.sessionId} created with ${categoryScores.length} category scores`
      );

      return {
        message: "Interview session created successfully",
        interviewSession: {
          ...interviewSession,
          categoryScores: categoryScores.map(score => ({
            ...score,
            subCategoryScores: score.subCategoryScores
          })),
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`POST: interview-session/create: Error: ${error.message}`);
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


      const allInterviewSessions = await this.prisma.interviewSession.findMany({
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
            include: {
              user: true,
            },
          },
          interview: true,
          scheduling: true,
          questions: true,
          CategoryScore: {
            include: {
              subCategoryScores: true,
            }
          },
        },
      });

      if (!allInterviewSessions || allInterviewSessions.length === 0) {
        this.logger.warn(`GET: No sessions found for interview ID: ${interviewId}`);
        throw new NotFoundException(`No sessions found for interview ID: ${interviewId}`);
      }

      // Calculate the maximum score and the corresponding candidate ID from all sessions
      let maxScore = -Infinity;
      let maxScoreCandidateFirstName: string | null = null;
      let maxScoreCandidateLastName: string | null = null;

      allInterviewSessions.forEach((session) => {
        if (session.score !== null && session.score > maxScore) {
          maxScore = session.score;
          maxScoreCandidateFirstName = session.candidate.user.firstName;
          maxScoreCandidateLastName = session.candidate.user.lastName;
        }
      });

      const paginatedInterviewSessions = allInterviewSessions.slice(skip, skip + take);

      const total = allInterviewSessions.length;

      return {
        interviewSessions: paginatedInterviewSessions,
        maxScore: maxScore !== -Infinity ? maxScore : null, // Return null if no valid score is found
        maxScoreCandidateFirstName,
        maxScoreCandidateLastName,
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

  async findOverviewByInterviewId(interviewId: string) {
    try {

      const interview = await this.prisma.interview.findUnique({
        where: { interviewID: interviewId },
      });

      if (!interview) {
        this.logger.warn(`GET: Interview with ID ${interviewId} not found`);
        throw new NotFoundException(`Interview with ID ${interviewId} not found. Please check the interview ID.`);
      }

      const allInterviewSessions = await this.prisma.interviewSession.findMany({
        where: {
          interviewId: interviewId,
          interviewStatus: 'completed',
        },
        select: {
          sessionId: true,
          interviewId: true,
          candidateId: true,
          interviewStatus: true,
          score: true,
          candidate: {
            include: {
              user: true,
            },
          },
        },
      });

      const total = await this.totalSessions(interviewId);

      if (!allInterviewSessions || allInterviewSessions.length === 0) {
        this.logger.warn(`GET: No completed sessions found for interview ID: ${interviewId}`);
        return {
          maxScore: 0,
          maxScoreCandidateFirstName: null,
          maxScoreCandidateLastName: null,
          total: total != 0 ? total : 0,
          totalCompletedInterviews: 0,
        };
      }

      let maxScore = -Infinity;
      let maxScoreCandidateFirstName: string | null = null;
      let maxScoreCandidateLastName: string | null = null;

      allInterviewSessions.forEach((session) => {
        if (session.score !== null && session.score > maxScore) {
          maxScore = session.score;
          maxScoreCandidateFirstName = session.candidate.user.firstName;
          maxScoreCandidateLastName = session.candidate.user.lastName;
        }
      });

      const totalCompletedInterviews = allInterviewSessions.length;

      return {
        maxScore: maxScore !== -Infinity ? maxScore : null, 
        maxScoreCandidateFirstName,
        maxScoreCandidateLastName,
        total,
        totalCompletedInterviews,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`GET: error: ${error}`);
      throw new InternalServerErrorException('Server error');
    }
  }

  private async totalSessions(interviewId: string) {
    return await this.prisma.interviewSession.count({
      where: {
        interviewId: interviewId,
      },
    });
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
            candidate: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                   
                  }
                },
              },
            },
            interview: true,
            scheduling: true,
            questions: true,
            CategoryScore: {
              include: {
                subCategoryScores: true,
              }
            },
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
          candidate: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                 
                }
              },
            },
          },
          interview: true,
          scheduling: true,
          CategoryScore: {
            include: {
              subCategoryScores: true,
            }
          },
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

  async createQuestions(dto: CreateQuestionDto) {
    this.logger.log(`POST: Question/create: New Question creating started`);

    try {
      const session = await this.prisma.interviewSession.findUnique({
        where: { sessionId: dto.sessionId },
      });
      if (!session) {
        throw new NotFoundException(`Interview Session with id ${dto.sessionId} not found`);
      }

      const question = await this.prisma.question.create({
        data: {
          questionText: dto.question,
          type: dto.type.toUpperCase() === 'OPEN-ENDED' ? 'OPEN_ENDED' : 'CODING',
          estimatedTimeMinutes: dto.estimatedTimeInMinutes,
          usageFrequency: 0,
          interviewSession: {
            connect: {
              sessionId: dto.sessionId,
            },
          },
        },
      });


      this.logger.log(
        `POST: interview-session/create: Question ${question.questionID} created successfully`
      );

      return {
        message: "Question created successfully",
        question,
      };
    } catch (error) {
      // Custom Prisma error handler
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.prismaErrorHandler(error, "POST", dto.sessionId);
      this.logger.error(`POST: Question/create: Error: ${error.message}`);
      throw new InternalServerErrorException("Server error occurred");
    }
  }

  async updateConsumeTimeAndStatus(sessionId: string, consumedTimeMinutes: number) {
     this.logger.log(`POST: Question/updateConsumeTimeAndStatus: ${sessionId}`);
     const session = await this.prisma.interviewSession.findUnique({
       where: { sessionId: sessionId },
     });
     if (!session) {
       throw new NotFoundException(`Interview Session with id ${sessionId}`);
     }

     try {
       const updatedSession = await this.prisma.interviewSession.update({
         where: {
           sessionId: sessionId,
         },
         data: {
           timeConsumed: consumedTimeMinutes,
           interviewStatus: "completed",
         }
       });

       return updatedSession;
     }catch (error) {
       if (error instanceof NotFoundException) {
         throw error;
       }
       this.prismaErrorHandler(error, "GET", sessionId);
       this.logger.error(`POST: Question/create: Error: ${error.message}`);
       throw new InternalServerErrorException("Server error occurred");
     }
  }

  async findCompletedSessionsByInterviewId(interviewId: string) {
    try {

      const interview = await this.prisma.interview.findUnique({
        where: { interviewID: interviewId },
      });

      if (!interview) {
        this.logger.warn(`GET: Interview with ID ${interviewId} not found`);
        throw new NotFoundException(`Interview with ID ${interviewId} not found. Please check the interview ID.`);
      }

      const allInterviewSessions = await this.prisma.interviewSession.findMany({
        where: {
          interviewId: interviewId,
          interviewStatus: 'completed',
        },
        select: {
          sessionId: true,
          interviewId: true,
          candidateId: true,
          interviewStatus: true,
          score: true,
          candidate: {
            include: {
              user: true,
            },
          },
        },
      });

      if (!allInterviewSessions || allInterviewSessions.length === 0) {
        this.logger.warn(`GET: No completed sessions found for interview ID: ${interviewId}`);
        return [];
      }


      return allInterviewSessions;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`GET: error: ${error}`);
      throw new InternalServerErrorException('Server error');
    }
  }

  async importQuestions(sessionId: string) {
    this.logger.log(`Starting question import for session: ${sessionId}`);

    try {

      const session = await this.prisma.interviewSession.findUnique({
        where: { sessionId },
        include: { interview: true }
      });

      if (!session) {
        throw new NotFoundException(`Session with ID ${sessionId} not found`);
      }

      if (!session.interviewId || !session.interview) {
        throw new ConflictException('Session is not associated with a valid interview');
      }

      const questions = await this.prisma.interviewQuestions.findMany({
        where: { interviewID: session.interviewId }
      });

      if (questions.length === 0) {
        throw new NotFoundException(`No questions found for interview ${session.interviewId}`);
      }

      const validationErrors = [];
      questions.forEach((q, index) => {
        if (!this.isValidQuestionType(q.type)) {
          validationErrors.push(`Question ${index + 1}: Invalid type '${q.type}'`);
        }
        if (!q.questionText || q.questionText.trim().length < 10) {
          validationErrors.push(`Question ${index + 1}: Text too short (min 10 characters)`);
        }
      });

      if (validationErrors.length > 0) {
        throw new BadRequestException({
          message: 'Invalid question data',
          errors: validationErrors
        });
      }

      const results = await Promise.allSettled(
        questions.map(async (q) => {
          try {
            return await this.prisma.question.create({
              data: {
                questionText: q.questionText,
                type: q.type,
                explanation: q.explanation,
                estimatedTimeMinutes: q.estimatedTimeMinutes || 5,
                aiContext: q.aiContext,
                usageFrequency: 0,
                interviewSession: { connect: { sessionId } }
              }
            });
          } catch (error) {
            this.logger.error(`Failed to import question: ${q.questionText}`, error.stack);
            throw new InternalServerErrorException(`Failed to import question: ${q.questionText}`);
          }
        })
      );

      const successfulImports = results.filter(r => r.status === 'fulfilled');
      const failedImports = results.filter(r => r.status === 'rejected');

      if (failedImports.length > 0) {
        this.logger.warn(`Partial import completed: ${successfulImports.length} succeeded, ${failedImports.length} failed`);
        throw new PartialImportException(
          'Partial question import completed',
          successfulImports.length,
          failedImports.length
        );
      }

      this.logger.log(`Successfully imported ${successfulImports.length} questions to session ${sessionId}`);
      return {
        message: 'All questions imported successfully',
        count: successfulImports.length
      };

    } catch (error) {
      this.logger.error(`Question import failed for session ${sessionId}: ${error.message}`);

      if (
        error instanceof PartialImportException ||
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ConflictException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to import questions');
    }
  }

  private isValidQuestionType(type: string): boolean {
    const validTypes = ['OPEN-ENDED', 'CODING', 'OPEN_ENDED'];
    return validTypes.includes(type.toUpperCase());
  }


}

export class PartialImportException extends HttpException {
  constructor(
    message: string,
    public readonly successCount: number,
    public readonly failureCount: number
  ) {
    super({ message, successCount, failureCount }, HttpStatus.PARTIAL_CONTENT);
  }
}