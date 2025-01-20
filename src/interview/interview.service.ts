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
import { InterviewStatus } from "@prisma/client";
import { EmailInvitationDto } from "./dto/email-invitation.dto";
import { EmailServerService } from "../email-server/email-server.service";
import { CreateEmailServerDto } from "../email-server/dto/create-email-server.dto";
import * as process from "node:process";
import { BookScheduleDto } from "./dto/book-schedule.dto";


@Injectable()
export class InterviewService {
    private readonly logger = new Logger('InterviewService');

    constructor(
        private prisma: PrismaService,
        private emailService:EmailServerService,

    ) { }


    async create(dto: CreateInterviewDto) {

        this.logger.log(`POST: interview/create: New interview started`);

        try {
            const totalPercentage = dto.categoryAssignments.reduce((sum, assignment) => sum + assignment.percentage, 0);
            if (totalPercentage !== 100) {
                throw new BadRequestException('The total percentage of category assignments must be 100.');
            }

            const company = await this.prisma.company.findUnique({
                where: { companyID: dto.companyID },
            });
            if (!company) {
                throw new NotFoundException(`Company with id ${dto.companyID} not found`);
            }

            const interview = await this.prisma.interview.create({
                data: {
                    companyID: dto.companyID,
                    jobTitle: dto.jobTitle,
                    jobDescription: dto.jobDescription,
                    interviewCategory: dto.interviewCategory,
                    requiredSkills: dto.requiredSkills || null,
                    startDate: dto.startDate,
                    endDate: dto.endDate,
                    status: dto.status,
                    CategoryAssignment: {
                        createMany: {
                            data: dto.categoryAssignments.map(assignment => ({
                                categoryId: assignment.categoryId,
                                percentage: assignment.percentage,
                            })),
                        },
                    },
                    scheduling: {
                        create: dto.schedules.map((schedule) => ({
                            startTime: schedule.startTime,
                            endTime: schedule.endTime,
                            isBooked: false,
                        })),
                    },
                },
                include: {
                    CategoryAssignment: true,
                    scheduling: true,
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
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            this.logger.error(`POST: interview/create: Error: ${error.message}`);
            throw new InternalServerErrorException("Server error occurred");
        }
    }

    async update(id: string, dto: UpdateInterviewDto) {
        this.logger.log(`PATCH: interview/update: Interview update started`);

        try {
            const interviewExist = await this.prisma.interview.findUnique({
                where: { interviewID: id },
            });

            if (!interviewExist) {
                throw new NotFoundException(`Interview with id ${id} not found`);
            }

            const sessionExist = await this.prisma.interviewSession.findMany({
                where: {interviewId: id},
            })
            if(sessionExist || sessionExist.length > 0){
                if(dto.status!=null||dto.status!=undefined){
                    const updateStatus = await this.prisma.interview.update({
                        where: {
                            interviewID: id,
                        },
                        data: {
                            status: dto.status,
                        },
                        include: {
                            CategoryAssignment: true,
                        },
                    })
                    return {
                        message: 'Interview status updated successfully',
                        updateStatus,
                    };
                }
                throw new BadRequestException('Cannot update this interview.Candidates already joined to this interview');
            }

            const totalPercentage = dto.categoryAssignments.reduce((sum, assignment) => sum + assignment.percentage, 0);
            if (totalPercentage !== 100) {
                throw new BadRequestException('The total percentage of category assignments must be 100.');
            }

            await this.prisma.categoryAssignment.deleteMany({
                where: { interviewId: id },
            });

            const interview = await this.prisma.interview.update({
                where: { interviewID: id },
                data: {
                    companyID: dto.companyID,
                    jobTitle: dto.jobTitle,
                    jobDescription: dto.jobDescription,
                    interviewCategory: dto.interviewCategory,
                    requiredSkills: dto.requiredSkills,
                    startDate: dto.startDate,
                    endDate: dto.endDate,
                    status: dto.status,
                    CategoryAssignment: {
                        createMany: {
                            data: dto.categoryAssignments.map((assignment) => ({
                                categoryId: assignment.categoryId,
                                percentage: assignment.percentage,
                            })),
                        },
                    },
                },
                include: {
                    CategoryAssignment: true,
                },
            });

            this.logger.log(
              `PATCH: interview/update: Interview ${interview.interviewID} updated successfully`,
            );

            return {
                message: 'Interview updated successfully',
                interview,
            };
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            this.logger.error(`PATCH: interview/update: Error: ${error.message}`);
            throw new InternalServerErrorException('Server error occurred');
        }
    }
    

    async findAll() {

        try {
            const interviews = await this.prisma.interview.findMany({
                include: {
                    company: {
                        select: {
                            companyName: true,
                        }
                    },
                    interviewers: true,
                    candidates: true,
                    interviewSessions: true,
                    CategoryAssignment: true,
                }
            });
            return interviews.map(interview => ({
                interviewID: interview.interviewID,
                companyID: interview.companyID,
                companyName: interview.company.companyName,
                jobTitle: interview.jobTitle,
                jobDescription: interview.jobDescription,
                interviewCategory: interview.interviewCategory,
                requiredSkills: interview.requiredSkills,
                startDate: interview.startDate,
                endDate: interview.endDate,
                status: interview.status,
                interviewers: interview.interviewers,
                candidates: interview.candidates,
                interviewSessions: interview.interviewSessions,
                CategoryAssignment: interview.CategoryAssignment,
                createdAt: interview.createdAt,
                updatedAt: interview.updatedAt,
            }));
        } catch (error) {
            this.logger.error(`GET: error: ${error}`);
            throw new InternalServerErrorException('Server error');
        }

    }

    async findAllPublishedInterviews(
      sortBy?: string,
      datePosted?: string,
      category?: string,
      jobTitle?: string,
      keywords?: string,
    ) {
        try {
            const where: any = {
                status: InterviewStatus.ACTIVE,
            };


            if (datePosted) {
                const now = new Date();
                let startDate: Date;

                switch (datePosted) {
                    case 'last 24 hours':
                        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                        break;
                    case 'last week':
                        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        break;
                    case 'last month':
                        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                        break;
                    default:
                        startDate = new Date(0);
                }

                where.createdAt = {
                    gte: startDate,
                };
            }


            if (category) {
                where.interviewCategory = category;
            }


            if (jobTitle) {
                where.jobTitle = {
                    contains: jobTitle,
                    mode: 'insensitive',
                };
            }


            if (keywords) {
                where.OR = [
                    { jobTitle: { contains: keywords, mode: 'insensitive' } },
                    { jobDescription: { contains: keywords, mode: 'insensitive' } },
                    { requiredSkills: { contains: keywords, mode: 'insensitive' } },
                ];
            }


            const interviews = await this.prisma.interview.findMany({
                where,
                include: {
                    company: {
                        select: {
                            companyName: true,
                        },
                    },
                    interviewers: true,
                    candidates: true,
                    interviewSessions: true,
                    CategoryAssignment: true,
                },
            });


            let sortedInterviews = interviews;
            if (sortBy) {
                switch (sortBy) {
                    case 'latest':
                        sortedInterviews = interviews.sort(
                          (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
                        );
                        break;
                    case 'a-z':
                        sortedInterviews = interviews.sort((a, b) =>
                          a.jobTitle.localeCompare(b.jobTitle),
                        );
                        break;
                    case 'z-a':
                        sortedInterviews = interviews.sort((a, b) =>
                          b.jobTitle.localeCompare(a.jobTitle),
                        );
                        break;
                    case 'topmatch':
                        sortedInterviews = interviews;
                        break;
                    default:
                        sortedInterviews = interviews;
                }
            }

            return sortedInterviews.map((interview) => ({
                interviewID: interview.interviewID,
                companyID: interview.companyID,
                companyName: interview.company.companyName,
                jobTitle: interview.jobTitle,
                jobDescription: interview.jobDescription,
                interviewCategory: interview.interviewCategory,
                requiredSkills: interview.requiredSkills,
                startDate: interview.startDate,
                endDate: interview.endDate,
                status: interview.status,
                interviewers: interview.interviewers,
                candidates: interview.candidates,
                interviewSessions: interview.interviewSessions,
                CategoryAssignment: interview.CategoryAssignment,
                createdAt: interview.createdAt,
                updatedAt: interview.updatedAt,
            }));
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
                    interviewCategory: true,
                    requiredSkills: true,
                    startDate: true,
                    endDate: true,
                    status: true,
                    interviewers: true,
                    candidates: true,
                    interviewSessions: true,
                    CategoryAssignment: true,
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



    async findById(id: string) {

        try {
            const interviewExist = await this.prisma.interview.findUnique({
                where: { interviewID: id },
            });
            if (!interviewExist) {
                throw new NotFoundException(`Interview with id ${id} not found`);
            }
            const interview = await this.prisma.interview.findUniqueOrThrow({
                where:{
                    interviewID: id,
                },
                include: {
                    company: {
                        select: {
                            companyName: true,
                        }
                    },
                    interviewers: true,
                    candidates: true,
                    interviewSessions: true,
                    CategoryAssignment: true,
                }
            });
            return {
                interviewID: interview.interviewID,
                companyID: interview.companyID,
                companyName: interview.company.companyName,
                jobTitle: interview.jobTitle,
                jobDescription: interview.jobDescription,
                interviewCategory: interview.interviewCategory,
                requiredSkills: interview.requiredSkills,
                startDate: interview.startDate,
                endDate: interview.endDate,
                status: interview.status,
                interviewers: interview.interviewers,
                candidates: interview.candidates,
                interviewSessions: interview.interviewSessions,
                CategoryAssignment: interview.CategoryAssignment,
                createdAt: interview.createdAt,
                updatedAt: interview.updatedAt,
            };
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
                include: {
                    interviewSessions: true,
                    CategoryAssignment: true,
                    scheduling: true,
                }
            });
            if (!interviewExist) {
                throw new NotFoundException(`Interview with id ${id} not found`);
            }
            if(interviewExist.CategoryAssignment!=null || interviewExist.CategoryAssignment.length>0){
                const deleteAssignCategories = await this.prisma.categoryAssignment.deleteMany({
                    where: {
                        interviewId:id
                    }
                })
                this.logger.warn(`DELETE:Categories associated with interview Id: ${id} Deleted`);
            }

            if(interviewExist.scheduling!=null || interviewExist.scheduling.length>0){
                const deleteScheduling = await this.prisma.scheduling.deleteMany({
                    where: {
                        interviewId:id
                    }
                })
                this.logger.warn(`DELETE:Scheduling with interviewId: ${id} Deleted`);
            }

            if(interviewExist.interviewSessions){
                const deleteSessions = await this.prisma.interviewSession.deleteMany({
                    where: {
                        interviewId:id
                    }
                })
                this.logger.warn(`DELETE:Sessions associated with interview Id: ${id} Deleted`);
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

    async findAllByStatus(status: InterviewStatus) {
        try {
            const interviews = await this.prisma.interview.findMany({
                where: { status: status },
                select: {
                    interviewID: true,
                    jobTitle: true,
                    companyID: true,
                    jobDescription: true,
                    interviewCategory: true,
                    requiredSkills: true,
                    startDate: true,
                    endDate: true,
                    status: true,
                    interviewers: true,
                    candidates: true,
                    interviewSessions: true,
                    CategoryAssignment: true,
                    createdAt: true,
                    updatedAt: true,
                }
            });

            if (!interviews || interviews.length === 0) {
                this.logger.warn(`GET: No interviews found for Status: ${status}`);
                throw new NotFoundException(`No interviews found for Status: ${status}`);
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

    async sendEmailInvitation(dto: EmailInvitationDto) {
        const interview = await this.prisma.interview.findUnique({
            where:{
                interviewID: dto.interviewId
            },
            select:{
                jobTitle: true,
                company: {
                    select:{
                        companyName: true,
                    }
                }
            }
        })
        const message = `You invited to join to ${interview.jobTitle} interview of the ${interview.company.companyName} company,
                          Here is the link ${process.env.FRONTEND_BASE_URL}interviews/${dto.interviewId}`;
        const emailDto = new CreateEmailServerDto();
        emailDto.body = message;
        emailDto.to = dto.to;
        emailDto.subject = `Invitation to Join To ${interview.jobTitle} Interview by the ${interview.company.companyName}`;

        await this.emailService.sendMailSandBox(emailDto);

        return {
            message: `Invitation send to candidate email ${dto.to}`
        }
    }

    async findSchedulesByInterviewId(interviewId: string) {
        this.logger.log(`GET: Fetching schedules for interview ID: ${interviewId}`);

        try {
            const interview = await this.prisma.interview.findUnique({
                where: { interviewID: interviewId },
            });

            if (!interview) {
                this.logger.warn(`Interview with ID ${interviewId} not found`);
                throw new NotFoundException(`Interview with ID ${interviewId} not found`);
            }

            const schedules = await this.prisma.scheduling.findMany({
                where: { interviewId: interviewId },
            });

            if (!schedules || schedules.length === 0) {
                this.logger.warn(`No schedules found for interview ID: ${interviewId}`);
                return {
                    message: 'No schedules found for this interview',
                    schedules: [],
                };
            }

            return {
                message: 'Schedules fetched successfully',
                schedules,
            };
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            this.logger.error(`GET: Error fetching schedules: ${error.message}`);
            throw new InternalServerErrorException('Failed to fetch schedules');
        }
    }

    async bookInterviewSchedule(dto: BookScheduleDto) {
        this.logger.log(`Booking schedule with ID: ${dto.scheduleId}`);

        try {
            if (!dto.scheduleId || !dto.candidateId || !dto.interviewId) {
                throw new BadRequestException('Invalid input data: scheduleId, candidateId, and interviewId are required');
            }

            const schedule = await this.prisma.scheduling.findUnique({
                where: { scheduleID: dto.scheduleId },
            });

            if (!schedule) {
                this.logger.warn(`Schedule with ID ${dto.scheduleId} not found`);
                throw new NotFoundException(`Schedule with ID ${dto.scheduleId} not found`);
            }

            if (schedule.isBooked) {
                this.logger.warn(`Schedule with ID ${dto.scheduleId} is already booked`);
                throw new BadRequestException('This schedule is already booked');
            }

            const candidate = await this.prisma.candidate.findUnique({
                where: { profileID: dto.candidateId },
            });

            if (!candidate) {
                this.logger.warn(`Candidate with ID ${dto.candidateId} not found`);
                throw new NotFoundException(`Candidate with ID ${dto.candidateId} not found`);
            }

            const interview = await this.prisma.interview.findUnique({
                where: { interviewID: dto.interviewId },
            });

            if (!interview) {
                this.logger.warn(`Interview with ID ${dto.interviewId} not found`);
                throw new NotFoundException(`Interview with ID ${dto.interviewId} not found`);
            }

            const bookedSchedule = await this.prisma.scheduling.update({
                where: { scheduleID: dto.scheduleId },
                data: {
                    candidateId: dto.candidateId,
                    isBooked: true,
                },
            });

            this.logger.log(`Schedule with ID ${dto.scheduleId} booked successfully`);

            return {
                message: 'Schedule booked successfully',
                schedule: bookedSchedule,
            };
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            this.logger.error(`Error booking schedule: ${error.message}`);
            throw new InternalServerErrorException('Failed to book schedule');
        }
    }
}
