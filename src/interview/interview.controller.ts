import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InterviewService } from './interview.service';
import { Auth, GetUser } from 'src/auth/decorators';
import { Interview } from './entities/interview.entity';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { Role } from '@prisma/client';
import { UpdateInterviewDto } from './dto/update-interview.dto';
import { UpdateQuestionDto } from "./dto/update-question.dto";

@ApiBearerAuth()
@ApiTags('Interview')
@Controller('interview')
export class InterviewController {
    constructor(private readonly interviewService: InterviewService) { }

    @Post()
    @ApiOperation({
        summary: 'CREATE INTERVIEW',
        description: 'Private endpoint to Create a new Interview. It is allowed only by "admin" users'
    })
    @ApiResponse({ status: 201, description: 'Created', type: Interview })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 500, description: 'Server error' })             //Swagger
    @Auth(Role.ADMIN, Role.COMPANY)
    create(@Body() createInterviewDto: CreateInterviewDto) {
        return this.interviewService.create(createInterviewDto);
    }

    @Patch(':id')
      @ApiOperation({
        summary: 'UPDATE INTERVIEW BY ID',
        description: 'Private endpoint to update INTERVIEW data by Id. <ul><li>The "user" role is permitted to update only their own information.</li><li>The "admin" role has the privilege to update information of any user</li><li>Only the "admin" role can update the "role" field</li></ul>'
      })
      @ApiResponse({status: 200, description: 'Ok', type: Interview})
      @ApiResponse({status: 400, description: 'Bad request'})             
      @ApiResponse({status: 401, description: 'Unauthorized'})             
      @ApiResponse({status: 500, description: 'Server error'})             //Swagger
      @Auth(Role.ADMIN, Role.COMPANY,Role.CANDIDATE)
      update(@Param('id') id: string, @Body() updateUserDto: UpdateInterviewDto) {
        return this.interviewService.update( id, updateUserDto);
    }

    @Get()
    @ApiOperation({
        summary: 'GET ALL INTERVIEWS',
        description: 'Private endpoint to Get all Interviews. It is allowed only by "admin" users'
    })
    @ApiResponse({ status: 201, description: 'Created', type: Interview,isArray: true })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 500, description: 'Server error' })             //Swagger
    @Auth(Role.COMPANY)
    findAll() {
        return this.interviewService.findAll();
    }

    @Get(':companyId')
    @ApiOperation({
        summary: 'GET ALL INTERVIEWS BY COMPANHY ID',
        description: 'Private endpoint to Get all Interviews by company id. It is allowed only by "admin" users'
    })
    @ApiResponse({ status: 201, description: 'Created', type: Interview, isArray: true })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 500, description: 'Server error' })             //Swagger
    @Auth(Role.COMPANY)
    findByCompanyId(@Param('companyId') companyId: string) {
        return this.interviewService.findAllByCompanyId(companyId);
    }


    @Delete(':id')
    @ApiOperation({
        summary: 'GET ALL INTERVIEWS BY COMPANHY ID',
        description: 'Private endpoint to Get all Interviews by company id. It is allowed only by "admin" users'
    })
    @ApiResponse({ status: 201, description: 'Created', type: Interview, isArray: true })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 500, description: 'Server error' })             //Swagger
    @Auth(Role.COMPANY)
    remove(@Param('id') id: string) {
        return this.interviewService.remove(id);
    }

    @Get('/questions/:interviewId')
    @ApiOperation({
        summary: 'GET ALL INTERVIEW QUESTIONS BY INTERVIEW ID',
        description: 'Private endpoint to Get all Interview questions by interview id. It is allowed only by "company" users'
    })
    @ApiResponse({ status: 201, description: 'Created' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 500, description: 'Server error' })             //Swagger
    @Auth(Role.COMPANY)
    findQuestionsByInterviewId(@Param('interviewId') interviewId: string) {
        return this.interviewService.findQuestionsByInterviewId(interviewId);
    }

    @Delete('question/:questionId')
    @ApiOperation({
        summary: '  DELETE QUESTIONS BY QUESTION ID',
        description: 'Private endpoint to delete questions by question id. It is allowed only by "admin" users'
    })
    @ApiResponse({ status: 201, description: 'Deleted'})
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 500, description: 'Server error' })             //Swagger
    @Auth(Role.COMPANY)
    removeQuestionByQuestionId(@Param('questionId') questionId: string) {
        return this.interviewService.removeQuestionByQuestionId(questionId);
    }

    @Patch('question/:questionId')
    @ApiOperation({
        summary: 'UPDATE INTERVIEW BY ID',
        description: 'Private endpoint to update QUESTION data by questionId.'
    })
    @ApiResponse({status: 200, description: 'Ok', type: UpdateQuestionDto})
    @ApiResponse({status: 400, description: 'Bad request'})
    @ApiResponse({status: 401, description: 'Unauthorized'})
    @ApiResponse({status: 500, description: 'Server error'})             //Swagger
    @Auth(Role.COMPANY)
    updateQuestionById(@Param('questionId') questionId: string, @Body() updateQuestionDto: UpdateQuestionDto) {
        return this.interviewService.updateQuestionById( questionId, updateQuestionDto);
    }

    @Delete('questions/:interviewId')
    @ApiOperation({
        summary: '  DELETE ALL QUESTIONS ASSOCIATED WITH INTERVIEW BY INTERVIEW ID',
        description: 'Private endpoint to delete all questions associated withinterview by interview id. It is allowed only by "company" users'
    })
    @ApiResponse({ status: 201, description: 'Deleted'})
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 500, description: 'Server error' })             //Swagger
    @Auth(Role.COMPANY)
    removeQuestionByInterviewId(@Param('interviewId') interviewId: string) {
        return this.interviewService.removeQuestionByInterviewId(interviewId);
    }
}
