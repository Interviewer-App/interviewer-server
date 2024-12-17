import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { InterviewSessionService } from './interview-session.service';
import { CreateInterviewSessionDto } from './dto/create-interview-session.dto';
import { UpdateInterviewSessionDto } from './dto/update-interview-session.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Interview } from "../interview/entities/interview.entity";
import { Auth } from "../auth/decorators";
import { Role } from "@prisma/client";

@ApiBearerAuth()
@ApiTags('Interview-Session')
@Controller('interview-session')
export class InterviewSessionController {
  constructor(private readonly interviewSessionService: InterviewSessionService) {}

  @Post()
  @Post()
  @ApiOperation({
    summary: 'CREATE INTERVIEW-SESSION',
    description: 'Private endpoint to Create a new Interview-Sessions. It is allowed only by "company" users'
  })
  @ApiResponse({ status: 201, description: 'Created', type: Interview })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Server error' })             //Swagger
  @Auth(Role.COMPANY)
  create(@Body() createInterviewSessionDto: CreateInterviewSessionDto) {
    return this.interviewSessionService.create(createInterviewSessionDto);
  }

  // @Get()
  // findAll() {
  //   return this.interviewSessionService.findAll();
  // }
  //
  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.interviewSessionService.findOne(+id);
  // }
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
