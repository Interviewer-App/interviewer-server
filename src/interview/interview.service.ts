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
                where: { companyID: dto.companyID },
            });
            if (!company) {
                throw new NotFoundException(`Company with id ${dto.companyID} not found`);
            }
            // Creating a new interview in the database
            const interview = await this.prisma.interview.create({
                data: {
                    companyID: dto.companyID,
                    jobTitle: dto.jobTitle,
                    jobDescription: dto.jobDescription,
                    requiredSkills: dto.requiredSkills || null,
                    scheduledDate: dto.scheduledDate,
                    scheduledAt: dto.scheduledAt,
                    status: dto.status,
                },
            });

            this.logger.log(
                `POST: interview/create: Interview ${interview.interviewID} created successfully`
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
            this.prismaErrorHandler(error, "POST", dto.companyID);
            this.logger.error(`POST: interview/create: Error: ${error.message}`);
            throw new InternalServerErrorException("Server error occurred");
        }
    }

    async update(id:string, dto: UpdateInterviewDto) {

        this.logger.log(`POST: interview/update: Interview update started`);

        try {
            const interviewExist = await this.prisma.interview.findUnique({
                where: { interviewID: id },
            });
            if (!interviewExist) {
                throw new NotFoundException(`Interview with id ${id} not found`);
            }
            // Creating a new interview in the database
            const interview = await this.prisma.interview.update({
                where:{interviewID:id},
                data: {
                    companyID: dto.companyID,
                    jobTitle: dto.jobTitle,
                    jobDescription: dto.jobDescription,
                    requiredSkills: dto.requiredSkills || null,
                    scheduledDate: dto.scheduledDate,
                    scheduledAt: dto.scheduledAt,
                    status: dto.status,
                },
            });

            this.logger.log(
                `POST: interview/update: Interview ${interview.interviewID} updaated successfully`
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
            this.prismaErrorHandler(error, "POST", dto.companyID);
            this.logger.error(`POST: interview/create: Error: ${error.message}`);
            throw new InternalServerErrorException("Server error occurred");
        }
    }
    

    async findAll() {

        try {
            const interviews = await this.prisma.interview.findMany({
                select: {
                    interviewID: true,
                    companyID: true,
                    jobTitle: true,
                    jobDescription: true,
                    requiredSkills: true,
                    scheduledDate: true,
                    scheduledAt: true,
                    status: true,
                    interviewers: true,
                    candidates: true,
                    interviewSessions: true,
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
                where: { companyID: companyId },
                select: {
                    interviewID: true,
                    jobTitle: true,
                    companyID: true,
                    jobDescription: true,
                    requiredSkills: true,
                    scheduledDate: true,
                    scheduledAt: true,
                    status: true,
                    interviewers: true,
                    candidates: true,
                    interviewSessions: true,
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
                where: { interviewID: id },
            });
            if (!interviewExist) {
                throw new NotFoundException(`Interview with id ${id} not found`);
            }
            const deletedInterview = await this.prisma.interview.delete({
                where: {interviewID:id},
                select:{
                  interviewID: true,
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

}
