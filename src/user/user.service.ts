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
import { Role } from '@prisma/client';
import { take } from "rxjs";


@Injectable()
export class UserService {

  private readonly logger = new Logger('UserService');

  constructor(
    private prisma: PrismaService,

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
}

