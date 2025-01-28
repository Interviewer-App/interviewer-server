import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException
} from "@nestjs/common";

import * as bcrypt from 'bcrypt';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { User } from './entities/user.entity';
import { Prisma, Role, TeamRole } from "@prisma/client";
import { SaveSurveyDto } from "./dto/create-survey.dto";
import { RegisterTeamMemberDto } from "./dto/register-team-member.dto";
import { CreateEmailServerDto } from "../email-server/dto/create-email-server.dto";
import { EmailServerService } from "../email-server/email-server.service";


@Injectable()
export class UserService {

  private readonly logger = new Logger('UserService');

  constructor(
    private prisma: PrismaService,
    private emailService: EmailServerService
  ) { }

  async create(dto: CreateUserDto) {
    this.logger.log(`POST: user/register: Register user started`);
    
    // Check if password and passwordConfirmation match
    if (dto.password !== dto.passwordconf) throw new BadRequestException('Passwords do not match');

    // Check Role
    if (dto.role && !Role[dto.role]) throw new BadRequestException('Invalid role');

    //Data to lower case
    dto.email = dto.email.toLowerCase().trim();
    // dto.name = dto.name.toLowerCase();

    //Hash the password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    try {
      
      // const {passwordconf , ...newUserData} = dto
      // newUserData.password = hashedPassword;

      const newuser = await this.prisma.user.create({
        data: {
          email:dto.email,
          username:dto.userName,
          password:hashedPassword,
          role: dto.role 
        },
        select: {
          userID: true,
          email: true,
          role: true,
          createdAt: true,
        }
      });

      return newuser;
      
    } catch (error) {
      this.prismaErrorHanler(error, "POST", dto.email);
      this.logger.error(`POST: error: ${error}`);
      throw new InternalServerErrorException('Server error');
    }
  }

  async findAll(page: number, limit: number) {
    try {
      const skip = (page - 1) * limit;
      const take = Number(limit);

      const users = await this.prisma.user.findMany({
        skip,
        take,
        select: {
          userID: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        }
      });

      const total = await this.prisma.user.count();

      return {
        data: users,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };

    } catch (error) {
      this.logger.error(`GET: error: ${error}`);
      throw new InternalServerErrorException('Server error');
    }
  }

  async findOne(field: string, value: string, user: User) {
        
    if (value !== user[field] && user.role !== 'ADMIN') throw new UnauthorizedException('Unauthorized');
    
    // const whereData = field === 'id' ? {userID: value} : {email: value};
    let whereData;
    if (field === 'userID') {
      whereData = { userID: value };  // Only use userID when field is 'id'
    } else if (field === 'email') {
      whereData = { email: value };   // Only use email when field is 'email'
    } else {
      throw new BadRequestException('Invalid field');
    }
    try {
      const user = await this.prisma.user.findUniqueOrThrow({
        where: whereData,
        select: {
          userID: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        }
      });

      return user;

    } catch (error) {
      this.prismaErrorHanler(error, "GET", value);
      this.logger.error(`GET/{id}: error: ${error}`);
      throw new InternalServerErrorException('Server error');
    }
    
  }

  async update(field: string, value: string, dto: UpdateUserDto, user: User) {

    if (value !== user[field] && user.role !== 'ADMIN') throw new UnauthorizedException('Unauthorized');
    
    // const whereData = field === 'id' ? { userID: value } : { email: value };
    let whereData;
    if (field === 'userID') {
      whereData = { userID: value };  // Only use userID when field is 'id'
    } else if (field === 'email') {
      whereData = { email: value };   // Only use email when field is 'email'
    } else {
      throw new BadRequestException('Invalid field');
    }
    
    if (user.role !== 'ADMIN') delete dto.role;

    const {passwordconf , ...newUserData} = dto

    // Check if password and passwordConfirmation match
    if (dto.password){
      if(dto.password !== passwordconf) throw new BadRequestException('Passwords do not match');
      //Hash the password
      newUserData.password = await bcrypt.hash(dto.password, 10);
    }

    try {
      const updatedUser = await this.prisma.user.update({
        where: whereData,
        data: newUserData,
        select: {
          userID: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        }
      });
      return updatedUser;
      
    } catch (error) {
      this.prismaErrorHanler(error, "PATCH", value);
      this.logger.error(`PATCH: error: ${error}`);
      throw new InternalServerErrorException('Server error');
    }
     
  }

  async remove(field: string, value: string, user: User) {
    if (value !== user[field] && user.role !== 'ADMIN') throw new UnauthorizedException('Unauthorized');

    // const whereData = field === 'id' ? {userID: value} : {email: value};
    let whereData;
    if (field === 'userID') {
      whereData = { userID: value };  // Only use userID when field is 'id'
    } else if (field === 'email') {
      whereData = { email: value };   // Only use email when field is 'email'
    } else {
      throw new BadRequestException('Invalid field');
    }

    try {
      const deletedUser = await this.prisma.user.delete({
        where: whereData,
        select:{
          userID: true,
          email: true,
        }
      });
      
      this.logger.warn(`DELETE: ${JSON.stringify(deletedUser)}`);
      return {message: "User deleted"}
      
    } catch (error) {
      this.prismaErrorHanler(error, "DELETE", value);
      this.logger.error(`DELETE: error: ${error}`);
      throw new InternalServerErrorException('Server error');
    }


  }
  
  prismaErrorHanler = (error: any, method: string, value: string = null) => { 
   if (error.code === 'P2002') {
     this.logger.warn(`${method}: User already exists: ${value}`);
     throw new BadRequestException('User already exists');
   }
   if (error.code === 'P2025') {
     this.logger.warn(`${method}: User not found: ${value}`);
     throw new BadRequestException('User not found');
   }
  }

  async findCandidateDetailsById(candidateId: string) {
    try{
      const candidate = await this.prisma.candidate.findUnique({
        where:{
          profileID: candidateId
        },
        select:{
          userID: true,
          skillHighlights: true,
          experience: true,
          availability: true,
          user: {
            select:{
              firstName: true,
              lastName: true,
              username: true,
              dob: true,
              email: true,
              gender: true,
              contactNo: true,
              role: true,
            }
          },
        }
      })
      if (!candidate) {
        throw new NotFoundException(`Candidate with id ${candidateId} not found`);
      }
      return candidate;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.prismaErrorHanler(error, "Get", candidateId);
      this.logger.error(`GET: error: ${error}`);
      throw new InternalServerErrorException('Server error');
    }
    
  }

  async saveSurvey(dto: SaveSurveyDto) {
    this.logger.log(`Saving survey for ${dto.role} with ID: ${dto.id}`);

    try {
      const normalizedSurveys = dto.surveys.map((survey) => ({
        ...survey,
        answer: Array.isArray(survey.answer) ? survey.answer : [survey.answer],
      }));

      if (dto.role === 'CANDIDATE') {
        const candidate = await this.prisma.candidate.findUnique({
          where: { profileID: dto.id },
        });

        if (!candidate) {
          throw new NotFoundException(`Candidate with ID ${dto.id} not found`);
        }

        const savedSurveys = await Promise.all(
          normalizedSurveys.map((survey) =>
            this.prisma.candidateServey.create({
              data: {
                question: survey.question,
                answer: survey.answer,
                candidateId: dto.id,
              },
            }),
          ),
        );

        await this.prisma.candidate.update({
          where: {
            profileID: dto.id,
          },
          data: {
            isSurveyCompleted: true,
          }
        })

        return {
          message: 'Candidate surveys saved successfully',
          surveys: savedSurveys,
        };
      } else if (dto.role === 'COMPANY') {
        const company = await this.prisma.company.findUnique({
          where: { companyID: dto.id },
        });

        if (!company) {
          throw new NotFoundException(`Company with ID ${dto.id} not found`);
        }

        const savedSurveys = await Promise.all(
          normalizedSurveys.map((survey) =>
            this.prisma.companyServey.create({
              data: {
                question: survey.question,
                answer: survey.answer,
                companyId: dto.id,
              },
            }),
          ),
        );

        await this.prisma.company.update({
          where: {
            companyID: dto.id,
          },
          data: {
            isSurveyCompleted: true,
          }
        })

        return {
          message: 'Company surveys saved successfully',
          surveys: savedSurveys,
        };
      } else {
        throw new BadRequestException('Invalid role. Role must be "candidate" or "company".');
      }
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Error saving survey: ${error.message}`);
      throw new InternalServerErrorException('Failed to save survey');
    }
  }

  async getSurveys(role: 'CANDIDATE' | 'COMPANY', id: string) {
    this.logger.log(`Fetching surveys for ${role} with ID: ${id}`);

    try {
      if (role === 'CANDIDATE') {
        const candidate = await this.prisma.candidate.findUnique({
          where: { profileID: id },
        });

        if (!candidate) {
          throw new NotFoundException(`Candidate with ID ${id} not found`);
        }

        const surveys = await this.prisma.candidateServey.findMany({
          where: { candidateId: id },
        });

        return {
          message: 'Candidate surveys fetched successfully',
          surveys,
        };
      } else if (role === 'COMPANY') {
        const company = await this.prisma.company.findUnique({
          where: { companyID: id },
        });

        if (!company) {
          throw new NotFoundException(`Company with ID ${id} not found`);
        }

        const surveys = await this.prisma.companyServey.findMany({
          where: { companyId: id },
        });

        return {
          message: 'Company surveys fetched successfully',
          surveys,
        };
      } else {
        throw new BadRequestException('Invalid role. Role must be "candidate" or "company".');
      }
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Error fetching surveys: ${error.message}`);
      throw new InternalServerErrorException('Failed to fetch surveys');
    }
  }

  async createCompanyTeamMember(dto: RegisterTeamMemberDto){
    this.logger.log(`POST: user/register: Register user started`);
    dto.email = dto.email.toLowerCase().trim();

    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      this.logger.warn(`POST: user/register: User already exists: ${dto.email}`);
      throw new BadRequestException('User with this email already exists');
    }
    const password = this.generateRandomPassword();
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const userData = {
        firstName: dto.firstname,
        lastName: dto.lastname,
        email: dto.email,
        password: hashedPassword,
        role: Role.COMPANY,
      };


      const newuser = await this.prisma.user.create({
        data: {
          ...userData,
          companyId: dto.companyId,
          companyTeam: {
            create: {
              teamRole: dto.teamRole
            },
          },
        },
        select: {
          userID: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
          company: {
            select: {
              companyID: true,
              companyName: true,
              isSurveyCompleted: true,
            },
          },
          companyTeam: {
            select: {
              teamRole: true,
            }
          }
        },
      });

      if(newuser) {
        const message = `
              Dear ${newuser.firstName} ${newuser.lastName},
              
              You have been registered with below temporary credentials for ${newuser.companyTeam.teamRole} Company Role:
              Email: ${newuser.email}
              Password: ${password}
              
              Please use these credentials to log in and change your password later.
              
              Best regards,
              Your Company Team
              `;

        const emailDto = new CreateEmailServerDto();
        emailDto.body = message;
        emailDto.to = newuser.email;
        emailDto.subject = `Your Company User Account Credentials for ${newuser.companyTeam.teamRole} Role`;

        await this.emailService.sendMailSandBox(emailDto);
      }

      return {
        message: 'New team role created successfully,and credentials send to the user',
        user: newuser,
      };
    } catch (error) {
      if (error.code === 'P2002') {
        this.logger.warn(`POST: auth/register: User already exists: ${dto.email}`);
        throw new BadRequestException('User already exists');
      }
      this.logger.error(`POST: auth/register: error: ${error}`);
      throw new InternalServerErrorException('Server error');
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

  async findCompanyTeamByCompanyId(companyId: string, page: number, limit: number) {
    try {
      this.logger.log(`Fetching company team members for company ID: ${companyId}`);

      if (page < 1 || limit < 1) {
        throw new BadRequestException('Page and limit must be greater than 0');
      }

      const company = await this.prisma.company.findUnique({
        where: { companyID: companyId },
        include: {
          user: {
            include: {
              companyTeam: true,
            },
          },
        },
      });

      if (!company) {
        this.logger.warn(`Company with ID ${companyId} not found`);
        throw new NotFoundException(`Company with ID ${companyId} not found`);
      }

      const sortedTeamMembers = company.user
        .filter((user) => user.companyTeam)
        .sort((a, b) => {
          if (a.companyTeam.teamRole === 'ADMIN') return -1;
          if (b.companyTeam.teamRole === 'ADMIN') return 1;
          return 0;
        })
        .map((user) => ({
          userId: user.userID,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.companyTeam.teamRole,
        }));

      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const paginatedTeamMembers = sortedTeamMembers.slice(startIndex, endIndex);

      this.logger.log(`Successfully fetched company team members for company ID: ${companyId}`);
      return {
        team: paginatedTeamMembers,
        total: sortedTeamMembers.length,
        page,
        limit,
        totalPages: Math.ceil(sortedTeamMembers.length / limit),
      };
    } catch (error) {
      this.logger.error(`Error fetching company team members for company ID: ${companyId}`, error.stack);

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Company with ID ${companyId} not found`);
        }
        throw new Error('An error occurred while fetching company team members');
      }

      throw error;
    }
  }
}

