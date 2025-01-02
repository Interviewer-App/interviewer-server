import { BadRequestException, Injectable, InternalServerErrorException, Logger  } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcrypt';

import { RegisterUserDto } from './dto/register-user.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

import { PrismaService } from 'src/prisma/prisma.service';
import { User } from 'src/user/entities/user.entity';
import { Role } from '@prisma/client';
import { first, last } from 'rxjs';


@Injectable()
export class AuthService {

  private readonly logger = new Logger('AuthService');

  constructor(
    private prisma: PrismaService,
    private readonly jwtService: JwtService

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

    try {
      const userData = {
        firstName: dto.firstname,
        lastName: dto.lastname,
        email: dto.email,
        password: hashedPassword,
        role: dto.role,
      };
      // const {passwordconf , ...newUserData} = dto
      // newUserData.password = hashedPassword;
      if(dto.providerAccountId){

        const newuser = await this.prisma.user.create({
          data: {
            firstName: dto.firstname,
            lastName: dto.lastname,
            email: dto.email,
            providerAccountId: dto.providerAccountId,
            provider: dto.provider,
            ...(dto.role === Role.COMPANY && {
              company: {
                create: {
                  companyName:  dto.companyname, // Ensure company name is provided
                },
              },
            }),
            ...(dto.role === Role.CANDIDATE && {
              candidate: {
                create: {
                  
                  // firstName: 'First',
                  // lastName:  'Last',
                  // skillHighlights: '',
                  resumeUrl: null,
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
            createdAt: true,
            company: {
              select: {
                companyID: true,
                companyName: true,
              },
            },
            candidate: {
              select: {
                profileID: true,
                user: true,
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

      }else{

        const newuser = await this.prisma.user.create({
          data: {
            ...userData,
            ...(dto.role === Role.COMPANY && {
              company: {
                create: {
                  companyName:  dto.companyname, // Ensure company name is provided
                },
              },
            }),
            ...(dto.role === Role.CANDIDATE && {
              candidate: {
                create: {
                  
                  resumeUrl: null,
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
            createdAt: true,
            company: {
              select: {
                companyID: true,
                companyName: true,
              },
            },
            candidate: {
              select: {
                profileID: true,
                user: true,
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

      }


      
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
          createdAt: true,
        }
      });

    } catch (error) {
      this.logger.error(`POST: auth/login: error: ${error}`);
      throw new BadRequestException('Wrong credentials');
    }

    // Compare the provided password with the hashed password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      throw new BadRequestException('Wrong credentials');
    }
    
    delete user.password;
    
    this.logger.log(`POST: auth/login: Usuario aceptado: ${user.email}`);
    return {
      user,
      token: this.getJwtToken({
        id: user.userID,
        role: user.role
      })
    };
  }


  async userAvailability(email: string): Promise<any> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
        select:{
          provider: true,
        }
      });

      if (user){
        return  {user}
      }else {
        return  {user: null}
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


}





