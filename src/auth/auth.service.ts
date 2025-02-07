import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException
} from "@nestjs/common";
import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcrypt';

import { RegisterUserDto } from './dto/register-user.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

import { PrismaService } from 'src/prisma/prisma.service';
import { User } from 'src/user/entities/user.entity';
import { Role, TeamRole } from "@prisma/client";
import { first, last } from 'rxjs';
import { ProviderUserDto } from './dto/provider-user.dto';
import { CreateEmailServerDto } from "../email-server/dto/create-email-server.dto";
import { EmailServerService } from "../email-server/email-server.service";
import { v4 as uuidv4 } from 'uuid';


@Injectable()
export class AuthService {

  private readonly logger = new Logger('AuthService');

  constructor(
    private prisma: PrismaService,
    private readonly jwtService: JwtService,
    private emailService: EmailServerService
  ) { }


  async registerUser(dto: RegisterUserDto): Promise<any> {

    this.logger.log(`POST: user/register: Register user started`);
    // Check if password and passwordConfirmation match
    if (dto.password !== dto.passwordconf) throw new BadRequestException('Passwords do not match');

    if (dto.role && !Role[dto.role]) throw new BadRequestException('Invalid role');


    //Data to lower case
    dto.email = dto.email.toLowerCase().trim();
    // dto.name = dto.name.toLowerCase();

    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      this.logger.warn(`POST: user/register: User already exists: ${dto.email}`);
      throw new BadRequestException('User with this email already exists');
    }


    //Hash the password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const verificationToken = uuidv4();

    try {
      const userData = {
        firstName: dto.firstname,
        lastName: dto.lastname,
        email: dto.email,
        password: hashedPassword,
        role: dto.role,
        isEmailVerified: false,
        verificationToken: verificationToken,
      };
      // const {passwordconf , ...newUserData} = dto
      // newUserData.password = hashedPassword;


        const newuser = await this.prisma.user.create({
          data: {
            ...userData,
            ...(dto.role === Role.COMPANY && {
              company: {
                create: {
                  companyName:  dto.companyname, // Ensure company name is provided
                },
              },
              companyTeam: {
                  create: {
                    teamRole: TeamRole.ADMIN
                  },
              },
            }),
            ...(dto.role === Role.CANDIDATE && {
              candidate: {
                create: {
                  experience: '', // Add appropriate value
                  availability: '', // Add appropriate value
                  resumeURL: '', // Add appropriate value
                  skillHighlights: '', // Example field, replace with actual required fields
                },
              },
            }),
          },
          select: {
            userID: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            isEmailVerified: true,
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
            },
            candidate: {
              select: {
                profileID: true,
                user: true,
                isSurveyCompleted: true,
              },
            }
          },
        });

        if(newuser.role === Role.COMPANY){
          const technicalCategory = await this.prisma.category.create({
            data:{
              companyId: newuser.company.companyID,
              categoryName: 'Technical',
              description: 'Asseses the technical ability of the candidate'
            }
          })
          this.logger.log(`Default category technical created for the company: ${technicalCategory.categoryId}`);
        }

      const verificationLink = `${process.env.FRONTEND_BASE_URL}/email-verification?token=${verificationToken}`;

      // const message = `
      //   Dear ${newuser.firstName} ${newuser.lastName},\n\n
      //   Verify your email by navigating to the link below:\n
      //   Email: ${newuser.email}\n
      //   Verify Token: ${verificationToken}\n
      //   Link: ${verificationLink}\n\n
      //   Best regards,\n
      //   Admin Team
      //   `;
      //
      // const emailDto = new CreateEmailServerDto();
      // emailDto.body = message;
      // emailDto.to = newuser.email;
      // emailDto.subject = `Email Verification`;

      await this.emailService.sendVerificationEmail(newuser.email,newuser.firstName,newuser.lastName,newuser.email,verificationToken,verificationLink);

        return {
          user: newuser,
          token: this.getJwtToken({
            id: newuser.userID.toString(),
            role: newuser.role
          })
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


  async loginUser(email: string, password: string): Promise<any> {
    this.logger.log(`POST: auth/login: Login iniciado: ${email}`);
    let user;
    try {
      user = await this.prisma.user.findUniqueOrThrow({
        where: {
          email
        },
        select: {
          userID: true,
          email: true,
          password: true,
          role: true,
          isEmailVerified: true,
          company: {
            select: {
              companyID: true,
              isSurveyCompleted: true,
            },
          },
          companyTeam: {
            select: {
              teamRole: true,
            }
          },
          candidate: {
            select: {
              profileID: true,
              isSurveyCompleted: true,
            },
          },
          createdAt: true,
          provider: true,
          providerAccountId: true,
        }
      });

    } catch (error) {
      this.logger.error(`POST: auth/login: error: ${error}`);
      throw new BadRequestException('Wrong credentials');
    }

    if (user.provider === 'google' || user.provider === 'github') {
      throw new BadRequestException('Wrong credentials');
    } else {
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        throw new BadRequestException('Wrong credentials');
      }

      delete user.password;

      const { company, candidate, ...cleanedUser } = user;

      let extraInfo = {};
      if (user.role === 'COMPANY' && user.company) {
        extraInfo = {
          companyID: company.companyID,
          isSurveyCompleted: company.isSurveyCompleted,
        };
      } else if (user.role === 'CANDIDATE' && user.candidate) {
        extraInfo = {
          candidateID: candidate.profileID,
          isSurveyCompleted: candidate.isSurveyCompleted
        };
      }

      this.logger.log(`POST: auth/login: Usuario aceptado: ${user.email}`);
      return {
        user: {
          ...user,
          ...extraInfo
        },

        token: this.getJwtToken({
          id: user.userID,
          role: user.role
        })
      };
    }
  }


  async providerRegisterUser(dto: ProviderUserDto): Promise<any> {

    this.logger.log(`POST: user/register: Register user started`);
    // Check if password and passwordConfirmation match

    if (dto.role && !Role[dto.role]) throw new BadRequestException('Invalid role');


    //Data to lower case
    dto.email = dto.email.toLowerCase().trim();
    // dto.name = dto.name.toLowerCase();

    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: {
        userID: true,
        email: true,
        role: true,
        isEmailVerified: true,
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
        },
        candidate: {
          select: {
            profileID: true,
            isSurveyCompleted: true,
          },
        },
        createdAt: true,
        provider: true,
        providerAccountId: true,
      }
    });

    console.log(existingUser);

    if (existingUser) {

      if (!(existingUser.providerAccountId === dto.providerAccountId)) {
        throw new BadRequestException('Wrong credentials');
      }

      this.logger.log(`POST: auth/login: Usuario aceptado: ${existingUser.email}`);
      return {
        user: existingUser,
        token: this.getJwtToken({
          id: existingUser.userID,
          role: existingUser.role
        })
      };
    }

    try {
      const newuser = await this.prisma.user.create({
        data: {
          firstName: dto.firstname,
          lastName: dto.lastname,
          email: dto.email,
          isEmailVerified: true,
          providerAccountId: dto.providerAccountId,
          provider: dto.provider,
          ...(dto.role === Role.COMPANY && {
            company: {
              create: {
                companyName:  dto.companyname, // Ensure company name is provided
              },
            },
            companyTeam: {
              create: {
                teamRole: TeamRole.ADMIN
              },
            },
          }),
          ...(dto.role === Role.CANDIDATE && {
            candidate: {
              create: {

                // firstName: 'First',
                // lastName:  'Last',
                // skillHighlights: '',
                experience: '', // Add appropriate value
                availability: '', // Add appropriate value
                resumeURL: '', // Add appropriate value
                skillHighlights: '', // Example field, replace with actual required fields
              },
            },
          }),
        },
        select: {
          userID: true,
          email: true,
          role: true,
          isEmailVerified: true,
          createdAt: true,
          provider: true,
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
          },
          candidate: {
            select: {
              profileID: true,
              isSurveyCompleted: true,
            },
          },
        },
      });


      return {
        user: newuser,
        token: this.getJwtToken({
          id: newuser.userID.toString(),
          role: newuser.role
        })
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

  async userAvailability(email: string): Promise<any> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
        select: {
          providerAccountId: true,
        }
      });

      if (user){
        return  {isUserExists: true, proId: user.providerAccountId};
      }else {
        return  {isUserExists: false};
      }
    }catch (error) {
      this.logger.error(`POST: auth/login: error: ${error}`);
      throw new BadRequestException('Wrong credentials');
    }
  }

  async refreshToken(user: User){
    return {
      user: user,
      token: this.getJwtToken({id: user.userID, role:user.role})
    };


  }


  private getJwtToken(payload: JwtPayload) {

    const token = this.jwtService.sign(payload);
    return token;

  }


  async forgotPassword(email: string) {
    this.logger.log(`POST: user/forgot-password: Forgot password request started for email: ${email}`);

    try {
      if (!email || typeof email !== 'string' ) {
        this.logger.warn(`POST: user/forgot-password: Invalid email format: ${email}`);
        throw new BadRequestException('Invalid email format');
      }

      email = email.toLowerCase().trim();


      const existingUser = await this.prisma.user.findUnique({
        where: { email: email },
      });

      if (!existingUser) {
        this.logger.warn(`POST: user/forgot-password: User not found: ${email}`);
        throw new NotFoundException('User with this email not found');
      }


      const password = this.generateRandomPassword();
      const hashedPassword = await bcrypt.hash(password, 10);


      const user = await this.prisma.user.update({
        where: {
          email: email,
        },
        data: {
          password: hashedPassword,
        },
      });

      if (user) {

        await this.emailService.sendPasswordResetEmail(user.email,user.firstName,user.lastName,user.email,password);

        this.logger.log(`POST: user/forgot-password: Password reset successfully for email: ${email}`);

        return {
          message: `Mr./Mrs. ${user.firstName}, Your password has been reset successfully. Check your email for the new password.`,
          user: user.email,
        };
      }
    } catch (error) {
      this.logger.error(`POST: user/forgot-password: Error occurred: ${error.message}`);

      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      } else {

        throw new InternalServerErrorException('Failed to process forgot password request');
      }
    }
  }

  async verifyEmail(token: string): Promise<any> {
    this.logger.log(`POST: user/verify-email: Verifying email with token: ${token}`);

    const user = await this.prisma.user.findFirst({
      where: { verificationToken: token },
    });

    if (!user) {
      this.logger.warn(`POST: user/verify-email: Invalid or expired token: ${token}`);
      throw new BadRequestException('Invalid or expired verification token');
    }

    const updatedUser = await this.prisma.user.update({
      where: { userID: user.userID },
      data: {
        isEmailVerified: true,
        verificationToken: null,
      },
      select: {
        userID: true,
        role: true,
        isEmailVerified: true,
      }
    });

    this.logger.log(`POST: user/verify-email: Email verified successfully for user: ${user.email}`);
    return {
      message: 'Email verified successfully' ,
      userId: updatedUser.userID,
      role: updatedUser.role,
      isEmailVerified: updatedUser.isEmailVerified,
    };
  }

  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  

  private generateRandomPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars[Math.floor(Math.random() * chars.length)];
    }
    return password;
  }
}





