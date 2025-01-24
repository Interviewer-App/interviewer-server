import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Logger } from "@nestjs/common";
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Auth, GetUser } from 'src/auth/decorators';
import { User } from './entities/user.entity';
import { Role } from '@prisma/client';
import { SaveSurveyDto } from "./dto/create-survey.dto";
import { LoginResponse } from "../auth/interfaces";
import { RegisterUserDto } from "../auth/dto/register-user.dto";
import { RegisterTeamMemberDto } from "./dto/register-team-member.dto";

@ApiBearerAuth()
@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({
    summary: 'CREATE USER',
    description: 'Private endpoint to Create a new User. It is allowed only by "admin" users, and allows the creation of users with "admin" Role.'
  })
  @ApiResponse({status: 201, description: 'Created', type: User})
  @ApiResponse({status: 400, description: 'Bad request'})
  @ApiResponse({status: 401, description: 'Unauthorized'})
  @ApiResponse({status: 500, description: 'Server error'})             //Swagger
  @Auth(Role.ADMIN, Role.COMPANY)
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }
  
  @Get(':page/:limit')
  @ApiOperation({
    summary: 'GET ALL USERS',
    description: 'Private endpoint to list all Users. It is allowed only by "admin" users.'
  })
  @ApiResponse({status: 200, description: 'Ok', type: User, isArray: true})
  @ApiResponse({status: 401, description: 'Unauthorized'})
  @ApiResponse({status: 403, description: 'Forbidden' })
  @ApiResponse({status: 500, description: 'Server error'})             //Swagger
  @Auth(Role.ADMIN, Role.COMPANY)
  findAll(@Param('page') page: number,@Param('limit') limit: number) {
    return this.userService.findAll(page, limit);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'GET USER BY ID',
    description: 'Private endpoint to get user data by a specific ID. <ul><li>The "user" role is permitted to access only their own information.</li><li>The "admin" role has the privilege to access information of any user</li></ul>'
  })
  @ApiResponse({status: 200, description: 'Ok', type: User})
  @ApiResponse({status: 401, description: 'Unauthorized'})             
  @ApiResponse({status: 500, description: 'Server error'})             //Swagger
  @Auth(Role.ADMIN, Role.COMPANY, Role.CANDIDATE)
  findOne(@Param('id') id: string, @GetUser() user: User) {
    return this.userService.findOne('userID', id, user);
  }

  @Get('email/:email')
  @ApiOperation({
    summary: 'GET USER BY EMAIL',
    description: 'Private endpoint to get user data by Email. <ul><li>The "user" role is permitted to access only their own information.</li><li>The "admin" role has the privilege to access information of any user</li></ul>'
  })
  @ApiResponse({status: 200, description: 'Ok', type: User})
  @ApiResponse({status: 401, description: 'Unauthorized'})
  @ApiResponse({status: 500, description: 'Server error'})             //Swagger
  @Auth(Role.ADMIN, Role.COMPANY, Role.CANDIDATE)
  findOneByEmail(@Param('email') email: string, @GetUser() user: User) {
    return this.userService.findOne('email', email, user);
  }


  @Patch(':id')
  @ApiOperation({
    summary: 'UPDATE USER BY ID',
    description: 'Private endpoint to update user data by Id. <ul><li>The "user" role is permitted to update only their own information.</li><li>The "admin" role has the privilege to update information of any user</li><li>Only the "admin" role can update the "role" field</li></ul>'
  })
  @ApiResponse({status: 200, description: 'Ok', type: User})
  @ApiResponse({status: 400, description: 'Bad request'})             
  @ApiResponse({status: 401, description: 'Unauthorized'})             
  @ApiResponse({status: 500, description: 'Server error'})             //Swagger
  @Auth(Role.ADMIN, Role.COMPANY,Role.CANDIDATE)
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @GetUser() user: User) {
    return this.userService.update('userID', id, updateUserDto, user);
  }
  
  @Patch('email/:email')
  @ApiOperation({
    summary: 'UPDATE USER BY EMAIL',
    description: 'Private endpoint to update user data by email. <ul><li>The "user" role is permitted to update only their own information.</li><li>The "admin" role has the privilege to update information of any user</li><li>Only the "admin" role can update the "role" field</li></ul>'
  })
  @ApiResponse({status: 200, description: 'Ok', type: User})
  @ApiResponse({status: 400, description: 'Bad request'})             
  @ApiResponse({status: 401, description: 'Unauthorized'})             
  @ApiResponse({status: 500, description: 'Server error'})             //Swagger
  @Auth(Role.ADMIN, Role.COMPANY,Role.CANDIDATE)
  updateByEmail(@Param('email') email: string, @Body() updateUserDto: UpdateUserDto, @GetUser() user: User) {
    return this.userService.update("email", email, updateUserDto, user);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'DELETE USER BY ID',
    description: 'Private endpoint to delete user by Id. <ul><li>The "user" role is permitted to remove only their own information.</li><li>The "admin" role has the privilege to delete any user</li></ul>'
  })
  @ApiOkResponse({content: {"application/json": {example: {"message": "User deleted"}}}})
  @ApiResponse({status: 400, description: 'Bad request'})             
  @ApiResponse({status: 401, description: 'Unauthorized'})             
  @ApiResponse({status: 500, description: 'Server error'})             //Swagger
  @Auth(Role.ADMIN, Role.COMPANY, Role.CANDIDATE)
  remove(@Param('id') id: string, @GetUser() user: User) {
    return this.userService.remove('userID', id, user);
  }
  
  @Delete('email/:email')
  @ApiOperation({
    summary: 'DELETE USER BY EMAIL',
    description: 'Private endpoint to delete user by Email. <ul><li>The "user" role is permitted to remove only their own information.</li><li>The "admin" role has the privilege to delete any user</li></ul>'
  })
  @ApiOkResponse({content: {"application/json": {example: {"message": "User deleted"}}}})
  @ApiResponse({status: 400, description: 'Bad request'})             
  @ApiResponse({status: 401, description: 'Unauthorized'})             
  @ApiResponse({status: 500, description: 'Server error'})             //Swagger
  @Auth(Role.ADMIN, Role.CANDIDATE,Role.COMPANY)
  removeByEmail(@Param('email') email: string, @GetUser() user: User) {
    return this.userService.remove("email", email, user);
  }

  @Get('candidate/details/:candidateId')
  @ApiOperation({
    summary: 'GET CANDIDATE DETAILS BY CANDIDATE ID',
    description: 'Private endpoint to get candidate details by Id.'
  })
  @ApiResponse({status: 200, description: 'Ok'})
  @ApiResponse({status: 401, description: 'Unauthorized'})
  @ApiResponse({status: 500, description: 'Server error'})             //Swagger
  @Auth(Role.COMPANY, Role.CANDIDATE)
  findCandidateDetailsById(@Param('candidateId') candidateId: string) {
    return this.userService.findCandidateDetailsById(candidateId);
  }

  @Post('user/servey')
  @ApiOperation({
    summary: 'SAVE SURVEY',
    description: 'Save surveys for a candidate or company.',
  })
  @ApiBody({ type: SaveSurveyDto })
  @ApiResponse({ status: 201, description: 'Surveys saved successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request (e.g., invalid role or data).' })
  @ApiResponse({ status: 404, description: 'Candidate or company not found.' })
  @ApiResponse({ status: 500, description: 'Server error.' })
  @Auth(Role.COMPANY, Role.CANDIDATE)
  async saveSurvey(@Body() dto: SaveSurveyDto) {
      return await this.userService.saveSurvey(dto);
  }

  @Get('user/servey/answers')
  @ApiOperation({
    summary: 'GET SURVEYS',
    description: 'Fetch surveys for a candidate or company by ID.',
  })
  @ApiQuery({
    name: 'role',
    description: 'Role of the user (CANDIDATE or COMPANY)',
    example: 'CANDIDATE',
    enum: ['CANDIDATE', 'COMPANY'],
  })
  @ApiQuery({
    name: 'id',
    description: 'ID of the candidate or company',
    example: 'cl4quxjjs0003vuuc0arunrlf',
  })
  @ApiResponse({ status: 200, description: 'Surveys fetched successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request (e.g., invalid role).' })
  @ApiResponse({ status: 404, description: 'Candidate or company not found.' })
  @ApiResponse({ status: 500, description: 'Server error.' })
  async getSurveys(
    @Query('role') role: 'CANDIDATE' | 'COMPANY',
    @Query('id') id: string,
  ) {
      return await this.userService.getSurveys(role, id);
  }

  @Post('register/team/member')
  @ApiOperation({
    summary: 'REGISTER TEAM MEMBER',
    description: 'Private endpoint to register a new member to company team.'
  })
  @ApiResponse({status: 201, description: 'Ok'})
  @ApiResponse({status: 400, description: 'Bad request'})
  @ApiResponse({status: 500, description: 'Server error'})
  register(@Body() registerTeamMemberDto: RegisterTeamMemberDto) {
    Logger.log(`Register`);
    return this.userService.createCompanyTeamMember(registerTeamMemberDto);
  }
}
