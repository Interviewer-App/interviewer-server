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
import { InterviewStatus, Role } from "@prisma/client";
import { EmailInvitationDto } from "./dto/email-invitation.dto";
import { EmailServerService } from "../email-server/email-server.service";
import { CreateEmailServerDto } from "../email-server/dto/create-email-server.dto";
import * as process from "node:process";
import { BookScheduleDto } from "./dto/book-schedule.dto";
import { AuthService } from "../auth/auth.service";
import { RegisterUserDto } from "../auth/dto/register-user.dto";
import { UpdateQuestionDto } from "../interview-session/dto/update-question.dto";
import { CreateQuestionDto } from "../interview-session/dto/create-question.dto";
import { CreateInterviewQuestionsDto } from "./dto/create-interview-questions.dto";
import { AddSubCategoryAssignmentDto } from "./dto/add-sub-categories.dto";
import { UpdateSubCategoryAssignmentDto } from "./dto/update-sub-categories.dto";


@Injectable()
export class InterviewService {
    private readonly logger = new Logger('InterviewService');

    constructor(
        private prisma: PrismaService,
        private emailService:EmailServerService,
        private authService: AuthService,

    ) { }


    async create(dto: CreateInterviewDto) {

        this.logger.log(`POST: interview/create: New interview started`);

        try {
            // Validate total percentage
            const totalPercentage = dto.categoryAssignments.reduce((sum, assignment) => sum + assignment.percentage, 0);
            if (totalPercentage !== 100) {
                throw new BadRequestException('The total percentage of category assignments must be 100.');
            }

            // Validate subcategory percentages
            for (const assignment of dto.categoryAssignments) {
                if (assignment.subAssignments && assignment.subAssignments.length > 0) {
                    const subTotal = assignment.subAssignments.reduce((sum, sub) => sum + sub.percentage, 0);
                    if (subTotal !== 100) {
                        throw new BadRequestException(
                          `Subcategory percentages for category ${assignment.categoryId} must sum to 100.`
                        );
                    }
                }
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
                        create: dto.categoryAssignments.map(assignment => ({
                            categoryId: assignment.categoryId,
                            percentage: assignment.percentage,
                            SubCategoryAssignment: assignment.subAssignments ? {
                                create: assignment.subAssignments.map(sub => ({
                                    name: sub.name,
                                    percentage: sub.percentage
                                }))
                            } : undefined
                        })),
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
                    CategoryAssignment: {
                        include: {
                            SubCategoryAssignment: true
                        }
                    },
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
                include: { CategoryAssignment: true }
            });

            if (!interviewExist) {
                throw new NotFoundException(`Interview with id ${id} not found`);
            }

            const sessionExist = await this.prisma.interviewSession.findMany({
                where: { interviewId: id },
            });

            if (sessionExist.length > 0) {
                if (dto.status != null || dto.status != undefined) {
                    const updateStatus = await this.prisma.interview.update({
                        where: { interviewID: id },
                        data: { status: dto.status },
                        include: { CategoryAssignment: true },
                    });
                    return {
                        message: 'Interview status updated successfully',
                        updateStatus,
                    };
                }
                throw new BadRequestException('Cannot update this interview. Candidates already joined to this interview');
            }

            if (dto.categoryAssignments != undefined) {
                // Validate category percentages
                const totalPercentage = dto.categoryAssignments.reduce((sum, assignment) => sum + assignment.percentage, 0);
                if (totalPercentage !== 100) {
                    throw new BadRequestException('The total percentage of category assignments must be 100.');
                }

                for (const assignment of dto.categoryAssignments) {
                    if (assignment.subAssignments && assignment.subAssignments.length > 0) {
                        const subTotal = assignment.subAssignments.reduce((sum, sub) => sum + sub.percentage, 0);
                        if (subTotal !== 100) {
                            throw new BadRequestException(
                              `Subcategory percentages for category ${assignment.categoryId} must sum to 100.`
                            );
                        }
                    }
                }

                await this.prisma.subCategoryAssignment.deleteMany({
                    where: {
                        categoryAssignment: {
                            interviewId: id
                        }
                    }
                });

                // Then delete categories
                await this.prisma.categoryAssignment.deleteMany({
                    where: { interviewId: id },
                });
            }

            if (dto.schedules != undefined) {
                await this.prisma.scheduling.deleteMany({
                    where: {
                        interviewId: id,
                        isBooked: false,
                    },
                });
            }

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
                    ...(dto.categoryAssignments != undefined && {
                        CategoryAssignment: {
                            create: dto.categoryAssignments.map(assignment => ({
                                categoryId: assignment.categoryId,
                                percentage: assignment.percentage,
                                ...(assignment.subAssignments && {
                                    SubCategoryAssignment: {
                                        create: assignment.subAssignments.map(sub => ({
                                            name: sub.name,
                                            percentage: sub.percentage
                                        }))
                                    }
                                })
                            })),
                        }
                    }),
                    ...(dto.schedules != undefined && {
                        scheduling: {
                            create: dto.schedules.map((schedule) => ({
                                startTime: schedule.startTime,
                                endTime: schedule.endTime,
                                isBooked: false,
                            })),
                        }
                    }),
                },
                include: {
                    CategoryAssignment: {
                        include: {
                            SubCategoryAssignment: true
                        }
                    },
                    scheduling: true,
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
                    CategoryAssignment: {
                        include: {
                            SubCategoryAssignment: true,
                        }
                    },
                    scheduling: true,
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
                scheduling: interview.scheduling,
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
                    CategoryAssignment: {
                        include: {
                            SubCategoryAssignment: true,
                        }
                    },
                    scheduling: true,
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
                scheduling: interview.scheduling,
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
                    CategoryAssignment: {
                        include: {
                            SubCategoryAssignment: true,
                        }
                    },
                    scheduling: true,
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
                    CategoryAssignment: {
                        include: {
                            SubCategoryAssignment: true,
                        }
                    },
                    scheduling: true,
                    questions: true
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
                scheduling: interview.scheduling,
                questions: interview.questions,
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
        this.logger.log(`Sending email invitation to ${dto.to}`);

        try {
            if (!dto.to || !dto.interviewId || !dto.scheduleId) {
                throw new BadRequestException('Invalid input data: to, interviewId, and scheduleId are required');
            }

            let isNewUser = false;
            let getUser = await this.prisma.user.findUnique({
                where: {
                    email: dto.to,
                    role: Role.CANDIDATE,
                },
                select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                    candidate: true,
                },
            });

            let temporaryCredentials = '';

            if (!getUser) {
                isNewUser = true;

                const firstName = dto.to.substring(0,dto.to.indexOf('@'));
                const lastName = 'guest';
                const password = this.generateRandomPassword();

                const registerDto = new RegisterUserDto();
                registerDto.email = dto.to;
                registerDto.role = Role.CANDIDATE;
                registerDto.firstname = firstName;
                registerDto.lastname = lastName;
                registerDto.password = password;
                registerDto.passwordconf = password;

                const newUser = await this.authService.registerUser(registerDto);
                console.log(newUser)

                if (newUser) {
                    getUser = await this.prisma.user.findUnique({
                        where: {
                            userID: newUser.user.userID,
                        },
                        select: {
                            firstName: true,
                            lastName: true,
                            email: true,
                            candidate: true,
                        },
                    });

                    temporaryCredentials = `\n\nYou have been registered with temporary credentials:\n`
                      + `Email: ${dto.to}\n`
                      + `Password: ${password}\n\n`
                      + `Please use these credentials to log in and change your password later.`;
                }
            }

            const interview = await this.prisma.interview.findUnique({
                where: {
                    interviewID: dto.interviewId,
                },
                select: {
                    jobTitle: true,
                    company: {
                        select: {
                            companyName: true,
                        },
                    },
                },
            });

            if (!interview) {
                throw new NotFoundException(`Interview with ID ${dto.interviewId} not found`);
            }

            let bookSchedule = await this.prisma.scheduling.findUnique({
                where: {
                    scheduleID: dto.scheduleId,
                    interviewId: dto.interviewId,
                },
            });

            if (!bookSchedule) {
                throw new NotFoundException(`No schedule found for scheduleId: ${dto.scheduleId}`);
            }

            if (bookSchedule.isBooked) {
                throw new BadRequestException('This schedule is already booked for another candidate');
            }

            const scheduleExist = await this.prisma.scheduling.findUnique({
                where: {
                    interviewId_candidateId: {
                        interviewId: dto.interviewId,
                        candidateId: getUser.candidate.profileID,
                    }
                },
            })

            if(scheduleExist) {
                this.logger.warn(`Another schedule with ID ${scheduleExist.scheduleID} booked for this interview ID: ${dto.interviewId}`);
                throw new BadRequestException(`Another schedule with ID ${scheduleExist.scheduleID} booked for this interview ID: ${dto.interviewId}`)
            }

            bookSchedule = await this.prisma.scheduling.update({
                where: {
                    scheduleID: dto.scheduleId,
                    interviewId: dto.interviewId,
                },
                data: {
                    candidateId: getUser.candidate.profileID,
                    isBooked: true,
                },
            });

            const message = `Hi ${getUser.firstName},\n\n`
              + `You have been invited to join the ${interview.jobTitle} interview at ${interview.company.companyName}.\n`
              + `Your scheduled time slot is on ${bookSchedule.startTime.toDateString()} from ${bookSchedule.startTime.toTimeString()} to ${bookSchedule.endTime.toTimeString()}.\n`
              + `Please use this link to join the interview: ${process.env.FRONTEND_BASE_URL}/interviews/${dto.interviewId}\n`
              + `${temporaryCredentials}\n\n`
              + `Best regards,\nThe Interview Team`;

            const candidateInvite = await this.prisma.candidateInvitation.create({
                data:{
                    candidateID: getUser.candidate.profileID,
                    interviewID: dto.interviewId,
                    scheduleId: bookSchedule.scheduleID,
                    message: message,
                }
            })
            const emailDto = new CreateEmailServerDto();
            emailDto.body = message;
            emailDto.to = dto.to;
            emailDto.subject = `Invitation to Join the ${interview.jobTitle} Interview at ${interview.company.companyName}`;

            await this.emailService.sendMailSandBox(emailDto);

            return {
                message: `Invitation sent to candidate email ${dto.to}`,
                candidateInvite,
            };
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            this.logger.error(`Error sending email invitation: ${error.message}`);
            throw new InternalServerErrorException('Failed to send email invitation');
        }
    }
    private generateRandomPassword(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
        let password = '';
        for (let i = 0; i < 12; i++) {
            password += chars[Math.floor(Math.random() * chars.length)];
        }
        return password;
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
            const groupedSchedules = schedules.reduce((acc, schedule) => {

                const date = new Date(schedule.startTime).toISOString().split('T')[0];


                let dateGroup = acc.find((group) => group.date.startsWith(date));
                if (!dateGroup) {
                    dateGroup = {
                        date: schedule.startTime.toISOString(), // Use the full ISO string for the date
                        schedules: [],
                    };
                    acc.push(dateGroup);
                }


                dateGroup.schedules.push({
                    id: schedule.scheduleID,
                    start: schedule.startTime.toISOString(),
                    end: schedule.endTime.toISOString(),
                    isBooked: schedule.isBooked,
                });

                return acc;
            }, [] as Array<{ date: string; schedules: Array<{ id: string; start: string; end: string; isBooked: boolean }> }>);

            this.logger.log(`Schedules fetched and grouped by date for interview ID: ${interviewId}`);

            return {
                message: 'Schedules fetched successfully',
                schedulesByDate: groupedSchedules,
            };
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            this.logger.error(`GET: Error fetching schedules: ${error.message}`);
            throw new InternalServerErrorException('Failed to fetch schedules');
        }
    }

    async findSchedulesByInterviewIdForCompany(interviewId: string) {
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

            const scheduleExist = await this.prisma.scheduling.findUnique({
                where: {
                    interviewId_candidateId: {
                        interviewId: dto.interviewId,
                        candidateId: dto.candidateId,
                    }
                },
            })

            if(scheduleExist) {
                this.logger.warn(`Another schedule with ID ${scheduleExist.scheduleID} booked for this interview ID: ${dto.interviewId}`);
                throw new BadRequestException(`Another schedule with ID ${scheduleExist.scheduleID} booked for this interview ID: ${dto.interviewId}`)
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

    async getInvitationsByInterviewId(interviewID: string, page: number, limit: number) {

        try {
            const skip = (page - 1) * limit;
            const take = Number(limit);
            const interview = await this.prisma.interview.findUnique({
                where: { interviewID: interviewID },
            })
            if (!interview) {
                this.logger.warn(`Interview with ID ${interviewID} not found`);
                throw new NotFoundException(`Interview with ID ${interviewID} not found`);
            }
            const invitations = await this.prisma.candidateInvitation.findMany({
                skip,
                take,
                where: { interviewID },
                include: {
                    candidate: {
                        include: {
                            user: true,
                        }
                    },
                    interview: {
                        include: {
                            company:{
                                include: {
                                    user: true,
                                }
                            }
                        }
                    },
                    Scheduling: true,
                },
            });

            if (!invitations || invitations.length === 0) {
                this.logger.warn(`No invitations found for interview ID: ${interviewID}`);
                throw new NotFoundException(`No invitations found for interview ID ${interviewID}`);
            }
            const total = await this.prisma.candidateInvitation.count({
                  where: {
                      interviewID: interviewID,
                  }
              }
            );

            return {
                invitations,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            };
        } catch (error) {
            this.logger.error(`Error fetching invitations for interview ID ${interviewID}: ${error.message}`);

            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }

            throw new InternalServerErrorException('An error occurred while fetching invitations.');
        }
    }

    async findSchedulesByCandidateId(candidateId: string) {
        this.logger.log(`GET: Fetching schedules for candidate ID: ${candidateId}`);

        try {
            const candidate = await this.prisma.candidate.findUnique({
                where: { profileID: candidateId },
            });

            if (!candidate) {
                this.logger.warn(`Candidate with ID ${candidateId} not found`);
                throw new NotFoundException(`Candidate with ID ${candidateId} not found`);
            }

            const schedules = await this.prisma.scheduling.findMany({
                where: {
                    candidateId: candidateId ,
                    isBooked: true,
                },
                include: {
                    interview: {
                        include: {
                            company: true,
                        }
                    },
                    invitation: true,
                }
            });

            if (!schedules || schedules.length === 0) {
                this.logger.warn(`No schedules found for interview ID: ${candidateId}`);
                return {
                    message: 'No schedules found for this candidate',
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

    async findSchedulesOverviewByCandidateId(candidateId: string) {
        this.logger.log(`GET: Fetching schedules for candidate ID: ${candidateId}`);

        try {
            const candidate = await this.prisma.candidate.findUnique({
                where: { profileID: candidateId },
            });

            if (!candidate) {
                this.logger.warn(`Candidate with ID ${candidateId} not found`);
                throw new NotFoundException(`Candidate with ID ${candidateId} not found`);
            }

            const totalSchedules = await this.prisma.scheduling.count({
                where: {
                    candidateId: candidateId ,
                    isBooked: true,
                },
            });

            const completedSchedules = await this.prisma.scheduling.count({
                where: {
                    candidateId: candidateId ,
                    isBooked: true,
                    interviewSession: {
                        interviewStatus: "completed",
                    }
                }
            })

            if (!totalSchedules || totalSchedules == 0) {
                this.logger.warn(`No schedules found for interview ID: ${candidateId}`);
                return {
                    message: 'No schedules found for this candidate',
                    schedules: [],
                };
            }

            return {
                message: 'Schedules fetched successfully',
                total:totalSchedules,
                completed:completedSchedules,
                pending: totalSchedules-completedSchedules,
            };
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            this.logger.error(`GET: Error fetching schedules: ${error.message}`);
            throw new InternalServerErrorException('Failed to fetch schedules');
        }
    }

    async getInterviewScheduleStats(interviewId: string) {
        try {

            if (!interviewId || typeof interviewId !== 'string') {
                throw new BadRequestException('Invalid interview ID');
            }

            const interview = await this.prisma.interview.findUnique({
                where: { interviewID: interviewId },
            });

            if (!interview) {
                throw new NotFoundException('Interview not found');
            }

            const totalSchedules = await this.prisma.scheduling.count({
                where: { interviewId },
            });

            const bookedSchedules = await this.prisma.scheduling.count({
                where: { interviewId, isBooked: true },
            });

            const completedSchedules = await this.prisma.interviewSession.count({
                where: { interviewId, interviewStatus: 'completed' },
            });

            const schedulesWithInvitations = await this.prisma.scheduling.count({
                where: { interviewId, invitation: { isNot: null } },
            });

            return {
                interviewId,
                totalSchedules,
                bookedSchedules,
                completedSchedules,
                schedulesWithInvitations,
            };
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            } else if (error.code === 'P2025') {
                throw new NotFoundException('Interview not found');
            } else {
                throw new InternalServerErrorException('Failed to fetch interview schedule stats');
            }
        }
    }

    async getBookedInterviewSchedules(interviewId: string, page: number, limit: number) {
        const skip = (page - 1) * limit;
        const take = Number(limit);

        if (!interviewId || typeof interviewId !== 'string') {
            throw new Error('Invalid interviewId provided');
        }

        const interview = await this.prisma.interview.findUnique({
            where: { interviewID: interviewId },
        });

        if (!interview) {
            throw new NotFoundException('Interview not found');
        }
        try {
            const schedules = await this.prisma.scheduling.findMany({
                skip,
                take,
                where: {
                    interviewId,
                    isBooked: true,
                    candidateId: { not: null },
                },
                include: {
                    candidate: {
                        include: {
                            user: true
                        }
                    },
                    invitation: {
                        select: {
                            invitationID: true,
                            status: true,
                            sentAt: true,
                        },
                    },
                },
            });

            if (!schedules || schedules.length === 0) {
                return {
                    success: true,
                    message: 'No booked schedules found for this interview',
                    data: [],
                };
            }

            const total = await this.prisma.scheduling.count({
                where: {
                    interviewId,
                    isBooked: true,
                    candidateId: { not: null },
                }
              }
            );

            const formattedSchedules = schedules.map((schedule) => ({
                scheduleID: schedule.scheduleID,
                startTime: schedule.startTime,
                endTime: schedule.endTime,
                isBooked: schedule.isBooked,
                candidate: schedule.candidate ? {
                    candidateId: schedule.candidate.profileID,
                    fullName: `${schedule.candidate.user.firstName} ${schedule.candidate.user.lastName}`,
                    email: schedule.candidate.user.email,
                    phoneNumber: schedule.candidate.user.contactNo,
                } : null,
                invitationStatus: schedule.invitation ? {
                    isInvitationSent: true,
                    status: schedule.invitation.status,
                    sentAt: schedule.invitation.sentAt,
                } : {
                    isInvitationSent: false,
                    status: 'NOT_SENT',
                    sentAt: null,
                },
            }));

            return {
                message: 'Booked schedules retrieved successfully',
                data: formattedSchedules,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            };
        } catch (error) {
            console.error('Error in getBookedInterviewSchedules:', error);

            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to retrieve booked schedules');
        }
    }

    async removeQuestionByQuestionId(questionId: string) {

        try {
            const questionExist = await this.prisma.interviewQuestions.findUnique({
                where: { interviewQuestionID: questionId },
            });
            if (!questionExist) {
                throw new NotFoundException(`Question with id ${questionId} not found`);
            }
            const deletedQuestion = await this.prisma.interviewQuestions.delete({
                where: {interviewQuestionID:questionId},
                select:{
                    interviewQuestionID: true,
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
            const questionExist = await this.prisma.interviewQuestions.findUnique({
                where: { interviewQuestionID: questionId },
            });
            if (!questionExist) {
                throw new NotFoundException(`Question with id ${questionId} not found`);
            }
            const question = await this.prisma.interviewQuestions.update({
                where:{interviewQuestionID:questionId},
                data: {
                    questionText:dto.question,
                    type:dto.type.toUpperCase() === 'OPEN_ENDED' ? 'OPEN_ENDED' : 'CODING',
                    estimatedTimeMinutes:dto.estimatedTimeInMinutes
                },
            });

            this.logger.log(
              `POST: question/update: Question ${question.interviewQuestionID} updated successfully`
            );

            return {
                message: `Question for ID ${question.interviewQuestionID} updated successfully`,
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

    async createQuestions(dto: CreateInterviewQuestionsDto) {
        this.logger.log(`POST: Question/create: New Question creating started`);

        try {
            const interview = await this.prisma.interview.findUnique({
                where: { interviewID: dto.interviewId },
            });
            if (!interview) {
                throw new NotFoundException(`Interview with id ${dto.interviewId} not found`);
            }

            const question = await this.prisma.interviewQuestions.create({
                data: {
                    questionText: dto.question,
                    type: dto.type.toUpperCase() === 'OPEN-ENDED' ? 'OPEN_ENDED' : 'CODING',
                    estimatedTimeMinutes: dto.estimatedTimeInMinutes,
                    usageFrequency: 0,
                    interviews: {
                        connect: {
                            interviewID: dto.interviewId,
                        },
                    },
                },
            });


            this.logger.log(
              `POST: interview/create: Question ${question.interviewQuestionID} created successfully`
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
            this.prismaErrorHandler(error, "POST", dto.interviewId);
            this.logger.error(`POST: Question/create: Error: ${error.message}`);
            throw new InternalServerErrorException("Server error occurred");
        }
    }

    async addSubCategoryAssignment(
      categoryAssignmentId: string,
      dto: AddSubCategoryAssignmentDto
    ) {
        this.logger.log(
          `POST: subcategory-assignment/add: Adding subcategory to category assignment ${categoryAssignmentId}`
        );

        try {

            const categoryAssignment = await this.prisma.categoryAssignment.findUnique({
                where: { assignmentId: categoryAssignmentId },
                include: { SubCategoryAssignment: true },
            });

            if (!categoryAssignment) {
                throw new NotFoundException(
                  `Category assignment with id ${categoryAssignmentId} not found`
                );
            }

            const existingSubTotal = categoryAssignment.SubCategoryAssignment.reduce(
              (sum, sub) => sum + sub.percentage,
              0
            );
            const newTotal = existingSubTotal + dto.percentage;

            if (newTotal > 100) {
                throw new BadRequestException(
                  `Adding this subcategory would exceed the 100% limit for subcategories. Current total: ${existingSubTotal}%`
                );
            }

            const subCategoryAssignment = await this.prisma.subCategoryAssignment.create({
                data: {
                    parentAssignmentId: categoryAssignmentId,
                    name: dto.name,
                    percentage: dto.percentage,
                },
            });

            this.logger.log(
              `POST: subcategory-assignment/add: Subcategory ${subCategoryAssignment.id} added successfully`
            );

            return {
                message: "Subcategory assignment added successfully",
                subCategoryAssignment,
            };
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            this.logger.error(
              `POST: subcategory-assignment/add: Error: ${error.message}`
            );
            throw new InternalServerErrorException("Server error occurred");
        }
    }

    async removeSubCategoryAssignment(subCategoryAssignmentId: string) {
        this.logger.log(
          `DELETE: subcategory-assignment/remove: Removing subcategory assignment ${subCategoryAssignmentId}`
        );

        try {
            const subCategoryAssignment =
              await this.prisma.subCategoryAssignment.findUnique({
                  where: { id: subCategoryAssignmentId },
              });

            if (!subCategoryAssignment) {
                throw new NotFoundException(
                  `Subcategory assignment with id ${subCategoryAssignmentId} not found`
                );
            }

            await this.prisma.subCategoryAssignment.delete({
                where: { id: subCategoryAssignmentId },
            });

            this.logger.log(
              `DELETE: subcategory-assignment/remove: Subcategory assignment ${subCategoryAssignmentId} removed successfully`
            );

            return {
                message: "Subcategory assignment removed successfully",
            };
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            this.logger.error(
              `DELETE: subcategory-assignment/remove: Error: ${error.message}`
            );
            throw new InternalServerErrorException("Server error occurred");
        }
    }

    async updateSubCategoryAssignment(
      subCategoryAssignmentId: string,
      dto: UpdateSubCategoryAssignmentDto
    ) {
        this.logger.log(
          `PATCH: subcategory-assignment/update: Updating subcategory ${subCategoryAssignmentId}`
        );

        try {
            const existingSub = await this.prisma.subCategoryAssignment.findUnique({
                where: { id: subCategoryAssignmentId },
                include: {
                    categoryAssignment: {
                        include: {
                            SubCategoryAssignment: true
                        }
                    }
                }
            });

            if (!existingSub) {
                throw new NotFoundException(
                  `Subcategory assignment ${subCategoryAssignmentId} not found`
                );
            }

            if (dto.percentage !== undefined) {
                const otherSubsTotal = existingSub.categoryAssignment.SubCategoryAssignment
                  .filter(sub => sub.id !== subCategoryAssignmentId)
                  .reduce((sum, sub) => sum + sub.percentage, 0);

                const newTotal = otherSubsTotal + dto.percentage;

                if (newTotal > 100) {
                    throw new BadRequestException(
                      `Subcategory percentage would exceed 100% limit. Max allowed: ${100 - otherSubsTotal}%`
                    );
                }
            }

            const updatedSub = await this.prisma.subCategoryAssignment.update({
                where: { id: subCategoryAssignmentId },
                data: {
                    name: dto.name,
                    percentage: dto.percentage
                }
            });

            this.logger.log(
              `PATCH: subcategory-assignment/update: Subcategory ${subCategoryAssignmentId} updated successfully`
            );

            return {
                message: "Subcategory assignment updated successfully",
                subCategoryAssignment: updatedSub
            };
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            this.logger.error(
              `PATCH: subcategory-assignment/update: Error: ${error.message}`
            );
            throw new InternalServerErrorException("Server error occurred");
        }
    }
}
