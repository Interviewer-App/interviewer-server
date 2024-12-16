import { BadRequestException, Injectable, InternalServerErrorException, Logger  } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcrypt';

import { RegisterUserDto } from './dto/register-user.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

import { PrismaService } from 'src/prisma/prisma.service';
import { User } from 'src/user/entities/user.entity';
import { Role } from '@prisma/client';


@Injectable()
export class AuthService {

  private readonly logger = new Logger('AuthService');

  constructor(
    private prisma: PrismaService,
    private readonly jwtService: JwtService

  ) { }


  async registerUser(dto: RegisterUserDto): Promise<any> {
    debugger
    this.logger.log(`POST: user/register: Register user started`);
    // Check if password and passwordConfirmation match
    if (dto.password !== dto.passwordconf) throw new BadRequestException('Passwords do not match');

    if (dto.role && !Role[dto.role]) throw new BadRequestException('Invalid role');


    //Data to lower case
    dto.email = dto.email.toLowerCase().trim();
    // dto.name = dto.name.toLowerCase();


    //Hash the password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    try {
      const userData = {
        email: dto.email,
        password: hashedPassword,
        role: dto.role,
      };
      // const {passwordconf , ...newUserData} = dto
      // newUserData.password = hashedPassword;

      const newuser = await this.prisma.user.create({
        data: {
          ...userData,
          ...(dto.role === Role.COMPANY && {
            company: {
              create: {
                name:  'Default Company Name', // Ensure company name is provided
                description: 'Default Company Name',
              },
            },
          }),
          ...(dto.role === Role.CANDIDATE && {
            profile: {
              create: {
                firstName: 'First',
                lastName:  'Last',
                skills:  [],
                resumeUrl:  null,
              },
            },
          }),
        },
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
          company: {
            select: {
              id: true,
              name: true,
            },
          },
          profile: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
  

      return {
        user: newuser,
        token: this.getJwtToken({
          id: newuser.id,
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
          id: true,
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
        id: user.id,
        role: user.role
      })
    };
  }


  async refreshToken(user: User){
    return {
      user: user,
      token: this.getJwtToken({id: user.id, role:user.role})
    };


  }


  private getJwtToken(payload: JwtPayload) {

    const token = this.jwtService.sign(payload);
    return token;

  }


}





