import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { InterviewSessionService } from './interview-session.service';
import { CreateInterviewSessionDto } from './dto/create-interview-session.dto';
import { UpdateInterviewSessionDto } from './dto/update-interview-session.dto';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Interview } from "../interview/entities/interview.entity";
import { Auth } from "../auth/decorators";
import { Role } from "@prisma/client";
import { InterviewSession } from './entities/interview-session.entity';
import { UpdateQuestionDto } from "./dto/update-question.dto";
import { CreateQuestionDto } from "./dto/create-question.dto";
import { ReorderCategoryScoresDto } from "./dto/reorder-category-scores.dto";

@ApiBearerAuth()
@ApiTags('Interview-Session')
@Controller('interview-session')
export class InterviewSessionController {
  constructor(private readonly interviewSessionService: InterviewSessionService) {}

  @Post()
  @ApiOperation({
    summary: 'CREATE INTERVIEW-SESSION',
    description: 'Private endpoint to Create a new Interview-Sessions. It is allowed only by "company" users'
  })
  @ApiResponse({ status: 201, description: 'Created', type: InterviewSession })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Server error' })             //Swagger
  @Auth(Role.COMPANY, Role.CANDIDATE)
  create(@Body() createInterviewSessionDto: CreateInterviewSessionDto) {
    return this.interviewSessionService.create(createInterviewSessionDto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'UPDATE INTERVIEW-SESSION',
    description: 'Private endpoint to update a new Interview-Sessions. It is allowed only by "company" users'
  })
  @ApiResponse({ status: 200, description: 'Updated', type: InterviewSession })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Server error' })             //Swagger
  @Auth(Role.COMPANY)
  update(@Param('id') id: string , @Body() updateInterviewSessionDto: UpdateInterviewSessionDto) {
    return this.interviewSessionService.update(id , updateInterviewSessionDto);
  }

  // @Get()
  // findAll() {
  //   return this.interviewSessionService.findAll();
  // }
  //
  @Get(':interviewId/:page/:limit')
  @ApiOperation({
    summary: 'GET ALL INTERVIEW SESSIONS BY INTERVIEW ID',
    description: 'Private endpoint to Get all Interviews by interview id. It is allowed only by "company" users'
  })
  @ApiResponse({ status: 201, description: 'Created', type: InterviewSession, isArray: true })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Server error' })             //Swagger
  @Auth(Role.COMPANY)
  findByInterviewId(@Param('interviewId') interviewId: string, @Param('page') page: number, @Param('limit') limit: number) {
    return this.interviewSessionService.findByInterviewId(interviewId , page, limit);
  }

  @Get('overview/:interviewId')
  @ApiOperation({
    summary: 'GET ALL INTERVIEW SESSIONS OVERVIEW BY INTERVIEW ID',
    description: 'Private endpoint to Get all Interviews Overview by interview id. It is allowed only by "company" users'
  })
  @ApiResponse({ status: 201, description: 'Created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Server error' })             //Swagger
  @Auth(Role.COMPANY)
  findOverviewByInterviewId(@Param('interviewId') interviewId: string) {
    return this.interviewSessionService.findOverviewByInterviewId(interviewId);
  }

  @Get('session/:sessionId')
  @ApiOperation({
    summary: 'GET INTERVIEW SESSION BY SESSION ID',
    description: 'Private endpoint to Get Interview Session by Session Id. It is allowed only by "company" users'
  })
  @ApiResponse({ status: 201, description: 'Created', type: InterviewSession, isArray: true })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Server error' })             //Swagger
  @Auth(Role.COMPANY)
  findBySessionId(@Param('sessionId') sessionId: string) {
    return this.interviewSessionService.findBySessionId(sessionId);
  }

  @Get('session-history/:sessionId')
  @ApiOperation({
    summary: 'GET INTERVIEW SESSION HISTORY BY SESSION ID',
    description: 'Private endpoint to Get Interview Session History by Session Id. It is allowed only by "company" users'
  })
  @ApiResponse({ status: 201, description: 'Created', type: InterviewSession, isArray: true })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Server error' })             //Swagger
  @Auth(Role.COMPANY, Role.CANDIDATE)
  findSessionHistoryBySessionId(@Param('sessionId') sessionId: string) {
    return this.interviewSessionService.findSessionHistoryBySessionId(sessionId);
  }

  @Get('candidate/:candidateId/:page/:limit')
  @ApiOperation({
    summary: 'GET ALL INTERVIEW SESSIONS BY CANDIDATE ID',
    description: 'Private endpoint to Get all Interviews by candidate id. It is allowed only by "company" users'
  })
  @ApiResponse({ status: 201, description: 'Created', type: InterviewSession, isArray: true })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Server error' })             //Swagger
  @Auth(Role.COMPANY, Role.CANDIDATE)
  findByCandidateId(@Param('candidateId') candidateId: string, @Param('page') page: number, @Param('limit') limit: number) {
    return this.interviewSessionService.findByCandidateId(candidateId, page, limit);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'DELETE INTERVIEW SESSION BY INTERVIEW SESSION ID',
    description: 'Private endpoint to delete interview session by passed ID. It is allowed only by "admin" users'
  })
  @ApiResponse({ status: 201, description: 'Deleted'})
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Server error' })             //Swagger
  @Auth(Role.COMPANY)
  remove(@Param('id') id: string) {
    return this.interviewSessionService.remove(id);
  }

  @Get('/questions/:sessionId')
  @ApiOperation({
    summary: 'GET ALL QUESTIONS FOR THE INTERVIEW SESSION BY SESSION ID',
    description: 'Private endpoint to Get all Interview Session questions by interview id. It is allowed only by "company" users'
  })
  @ApiResponse({ status: 201, description: 'Created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Server error' })             //Swagger
  @Auth(Role.COMPANY)
  findQuestionsBySessionId(@Param('sessionId') sessionId: string) {
    return this.interviewSessionService.findQuestionsBySessionId(sessionId);
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
    return this.interviewSessionService.removeQuestionByQuestionId(questionId);
  }

  @Patch('question/:questionId')
  @ApiOperation({
    summary: 'UPDATE QUESTION BY ID',
    description: 'Private endpoint to update QUESTION data by questionId.'
  })
  @ApiResponse({status: 200, description: 'Ok', type: UpdateQuestionDto})
  @ApiResponse({status: 400, description: 'Bad request'})
  @ApiResponse({status: 401, description: 'Unauthorized'})
  @ApiResponse({status: 500, description: 'Server error'})             //Swagger
  @Auth(Role.COMPANY)
  updateQuestionById(@Param('questionId') questionId: string, @Body() updateQuestionDto: UpdateQuestionDto) {
    return this.interviewSessionService.updateQuestionById( questionId, updateQuestionDto);
  }

  @Delete('questions/:sessionId')
  @ApiOperation({
    summary: '  DELETE ALL QUESTIONS ASSOCIATED WITH INTERVIEW SESSION BY SESSION ID',
    description: 'Private endpoint to delete all questions associated with interview session by session id. It is allowed only by "company" users'
  })
  @ApiResponse({ status: 201, description: 'Deleted'})
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Server error' })             //Swagger
  @Auth(Role.COMPANY)
  removeQuestionByInterviewId(@Param('sessionId') sessionId: string) {
    return this.interviewSessionService.removeQuestionBySessionId(sessionId);
  }

  @Post('question')
  @ApiOperation({
    summary: 'CREATE QUESTIONS',
    description: 'Private endpoint to Create a new Questions. It is allowed only by "company" users'
  })
  @ApiResponse({ status: 201, description: 'Created'})
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Server error' })             //Swagger
  @Auth(Role.COMPANY)
  createQuestions(@Body() createQuestionsDto: CreateQuestionDto) {
    return this.interviewSessionService.createQuestions(createQuestionsDto);
  }

  @Get('stream-token')
  getStreamToken(@Query('userId') userId: string) {
    return { token: this.interviewSessionService.createToken(userId) };
  }

  @Get('comparison/:interviewId')
  @ApiOperation({
    summary: 'GET ALL COMPLETED SESSIONS LIST BY INTERVIEW ID',
    description: 'Private endpoint to Get all completed sessions for given interview id. It is allowed only by "company" users'
  })
  @ApiResponse({ status: 201, description: 'Created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Server error' })             //Swagger
  @Auth(Role.COMPANY)
  findCompletedSessionsByInterviewId(@Param('interviewId') interviewId: string) {
    return this.interviewSessionService.findCompletedSessionsByInterviewId(interviewId);
  }

  @Get('import-questions/:sessionId')
  @ApiOperation({
    summary: 'IMPORT ALL QUESTIONS FROM INTERVIEW',
    description: 'Private endpoint to import all questions for session. It is allowed only by "company" users'
  })
  @ApiResponse({ status: 201, description: 'Created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Server error' })             //Swagger
  @Auth(Role.COMPANY)
  importQuestions(@Param('sessionId') sessionId: string) {
    return this.interviewSessionService.importQuestions(sessionId);
  }

  @Post('reorder-category-scores')
  @ApiBody({ type: ReorderCategoryScoresDto })
  @ApiResponse({
    status: 200,
    description: 'Category scores reordered successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async reorderCategoryScores(
    @Body() dto: ReorderCategoryScoresDto,
  ): Promise<{ message: string }> {
    await this.interviewSessionService.reorderCategoryScores(dto);
    return { message: 'Category scores reordered successfully' };
  }
  
  //
  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateInterviewSessionDto: UpdateInterviewSessionDto) {
  //   return this.interviewSessionService.update(+id, updateInterviewSessionDto);
  // }
  //
  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.interviewSessionService.remove(+id);
  // }
}
