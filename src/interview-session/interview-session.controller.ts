import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { InterviewSessionService } from './interview-session.service';
import { CreateInterviewSessionDto } from './dto/create-interview-session.dto';
import { UpdateInterviewSessionDto } from './dto/update-interview-session.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Interview } from "../interview/entities/interview.entity";
import { Auth } from "../auth/decorators";
import { Role } from "@prisma/client";
import { InterviewSession } from './entities/interview-session.entity';

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
  @Auth(Role.COMPANY)
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
  @Get(':interviewId')
  @ApiOperation({
    summary: 'GET ALL INTERVIEW SESSIONS BY INTERVIEW ID',
    description: 'Private endpoint to Get all Interviews by interview id. It is allowed only by "company" users'
  })
  @ApiResponse({ status: 201, description: 'Created', type: InterviewSession, isArray: true })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Server error' })             //Swagger
  @Auth(Role.COMPANY)
  findByInterviewId(@Param('interviewId') interviewId: string) {
    return this.interviewSessionService.findByInterviewId(interviewId);
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
