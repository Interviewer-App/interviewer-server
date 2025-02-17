import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    Logger,
    NotFoundException,
    UnauthorizedException
} from "@nestjs/common";
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { UpdateInterviewDto } from './dto/update-interview.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { ProducerService } from '../kafka/producer/producer.service';


@Injectable()
export class InterviewService {
    private readonly logger = new Logger('InterviewService');

    constructor(
        private prisma: PrismaService,


    ) { }


    async create(dto: CreateInterviewDto) {

        this.logger.log(`POST: interview/create: New interview started`);

        try {
            const company = await this.prisma.company.findUnique({
                where: { companyID: dto.companyId },
            });
            if (!company) {
                throw new NotFoundException(`Company with id ${dto.companyId} not found`);
            }
            // Creating a new interview in the database
            const interview = await this.prisma.interview.create({
                data: {
                    companyId: dto.companyId,
                    title: dto.title,
                    description: dto.description || null,
                    questions: dto.questions,
                    duration: dto.duration,
                    status: dto.status,
                },
            });

            this.logger.log(
                `POST: interview/create: Interview ${interview.id} created successfully`
            );

            return {
                message: "Interview created successfully",
                interview,
            };
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            // Custom Prisma error handler
            this.prismaErrorHandler(error, "POST", dto.companyId);
            this.logger.error(`POST: interview/create: Error: ${error.message}`);
            throw new InternalServerErrorException("Server error occurred");
        }
    }

    async update(id:string, dto: UpdateInterviewDto) {

        this.logger.log(`POST: interview/update: Interview update started`);

        try {
            const interviewExist = await this.prisma.interview.findUnique({
                where: { id: id },
            });
            if (!interviewExist) {
                throw new NotFoundException(`Interview with id ${id} not found`);
            }
            // Creating a new interview in the database
            const interview = await this.prisma.interview.update({
                where:{id:id},
                data: {
                    companyId: dto.companyId,
                    title: dto.title,
                    description: dto.description || null,
                    questions: dto.questions,
                    duration: dto.duration,
                    status: dto.status,
                },
            });

            this.logger.log(
                `POST: interview/update: Interview ${interview.id} updaated successfully`
            );



            return {
                message: "Interview updated successfully",
                interview,
            };
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            // Custom Prisma error handler
            this.prismaErrorHandler(error, "POST", dto.companyId);
            this.logger.error(`POST: interview/create: Error: ${error.message}`);
            throw new InternalServerErrorException("Server error occurred");
        }
    }
    

    async findAll() {

        try {
            const interviews = await this.prisma.interview.findMany({
                select: {
                    id: true,
                    companyId: true,
                    title: true,
                    description: true,
                    questions: true,
                    duration: true,
                    status: true,
                    createdAt: true,
                    updatedAt: true,
                }
            });
            return interviews;
        } catch (error) {
            this.logger.error(`GET: error: ${error}`);
            throw new InternalServerErrorException('Server error');
        }

    }


    async findAllByCompanyId(companyId: string) {

        try {
            const interviews = await this.prisma.interview.findMany({
                where: { companyId: companyId },
                select: {
                    id: true,
                    companyId: true,
                    title: true,
                    description: true,
                    questions: true,
                    duration: true,
                    status: true,
                    createdAt: true,
                    updatedAt: true,
                }
            });

            if (!interviews || interviews.length === 0) {
                this.logger.warn(`GET: No interviews found for company ID: ${companyId}`);
                throw new NotFoundException(`No interviews found for company ID: ${companyId}`);
            }
            return interviews;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            this.logger.error(`GET: error: ${error}`);
            throw new InternalServerErrorException('Server error');
        }

    }


      async remove(id: string) {
    
        try {
            const interviewExist = await this.prisma.interview.findUnique({
                where: { id: id },
            });
            if (!interviewExist) {
                throw new NotFoundException(`Interview with id ${id} not found`);
            }
            const deletedInterview = await this.prisma.interview.delete({
                where: {id:id},
                select:{
                  id: true,
                }
            });

            this.logger.warn(`DELETE: ${JSON.stringify(deletedInterview)}`);
            return {message: "Interview deleted"}

        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            this.prismaErrorHandler(error, "DELETE", id);
            this.logger.error(`DELETE: error: ${error}`);
            throw new InternalServerErrorException('Server error');
        }
    
    
      }

      async findQuestionsByInterviewId(interviewId: string) {
          try {
              const questions = await this.prisma.question.findMany({
                  where: { interviewId: interviewId },
                  select: {
                      id: true,
                      interviewId: true,
                      question: true,
                      type: true,
                      createdAt: true,
                      updatedAt: true,
                  }
              });

              if (!questions || questions.length === 0) {
                  this.logger.warn(`GET: No questions found for interview ID: ${interviewId}`);
                  throw new NotFoundException(`No questions found for interview ID: ${interviewId}`);
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
                where: { id: questionId },
            });
            if (!questionExist) {
                throw new NotFoundException(`Question with id ${questionId} not found`);
            }
            const deletedQuestion = await this.prisma.question.delete({
                where: {id:questionId},
                select:{
                    id: true,
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

      private prismaErrorHandler(error: any, method: string, identifier: string|number) {
        if (error.code === "P2002") {
            this.logger.error(
                `${method}: Conflict: Duplicate entry for companyId ${identifier}`
            );
            throw new InternalServerErrorException(
                "Duplicate entry: A record with this company ID already exists."
            );
        }
        this.logger.error(`${method}: Prisma error: ${error.message}`);
    }

    async updateQuestionById(questionId: string, dto: UpdateQuestionDto) {
        this.logger.log(`POST: question/update: Question update started`);

        try {
            const questionExist = await this.prisma.question.findUnique({
                where: { id: questionId },
            });
            if (!questionExist) {
                throw new NotFoundException(`Question with id ${questionId} not found`);
            }
            const question = await this.prisma.question.update({
                where:{id:questionId},
                data: {
                    question:dto.question,
                    type:dto.type.toUpperCase() === 'OPEN_ENDED' ? 'OPEN_ENDED' : 'CODING',
                },
            });

            this.logger.log(
              `POST: question/update: Question ${question.id} updated successfully`
            );

            return {
                message: `Question for ID ${question.id} updated successfully`,
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

    async removeQuestionByInterviewId(interviewId: string) {
        try {
            const deletedQuestions = await this.prisma.question.deleteMany({
                where: {interviewId:interviewId},
            });

            if (!deletedQuestions || deletedQuestions.count === 0) {
                this.logger.warn(`GET: No questions found for interview ID: ${interviewId}`);
                throw new NotFoundException(`No questions found for interview ID: ${interviewId}`);
            }

            this.logger.warn(`DELETE: ${JSON.stringify(deletedQuestions)}`);
            return {message: `Question with associated with Interview id ${interviewId} deleted`}

        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            this.prismaErrorHandler(error, "DELETE", interviewId);
            this.logger.error(`DELETE: error: ${error}`);
            throw new InternalServerErrorException('Server error');
        }
    }
}
