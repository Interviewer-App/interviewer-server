import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AnswersService } from './answers.service';
import { CreateAnswerDto } from './dto/create-answer.dto';
import { UpdateAnswerDto } from './dto/update-answer.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { InterviewSession } from "../interview-session/entities/interview-session.entity";
import { Auth } from "../auth/decorators";
import { Role } from "@prisma/client";

@ApiBearerAuth()
@ApiTags('Answers')
@Controller('answers')
export class AnswersController {
  constructor(private readonly answersService: AnswersService) {}

  @Post()
  @ApiOperation({
    summary: 'Record answers for the each question',
    description: 'Private endpoint to save answers in the Database for given questions. It is allowed only by "company","candidate" users'
  })
  @ApiResponse({ status: 201, description: 'Created', type: InterviewSession })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Server error' })             //Swagger
  @Auth(Role.COMPANY, Role.CANDIDATE)
  create(@Body() createAnswerDto: CreateAnswerDto) {
    return this.answersService.create(createAnswerDto);
  }

  // @Get()
  // findAll() {
  //   return this.answersService.findAll();
  // }
  //
  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.answersService.findOne(+id);
  // }
  //
  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateAnswerDto: UpdateAnswerDto) {
  //   return this.answersService.update(+id, updateAnswerDto);
  // }
  //
  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.answersService.remove(+id);
  // }
}
