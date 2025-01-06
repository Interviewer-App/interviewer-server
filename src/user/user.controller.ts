import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Auth, GetUser } from 'src/auth/decorators';
import { User } from './entities/user.entity';
import { Role } from '@prisma/client';

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

}
