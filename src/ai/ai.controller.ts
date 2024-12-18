import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { Auth, GetUser } from 'src/auth/decorators';
import { Role } from '@prisma/client';
import { GenerateQuestionsDto } from './dto/generate-questions.dto';
import { AnalyzeQuestionDto } from './dto/analyze-question.dto';


@ApiBearerAuth()
@ApiTags('AI')
@Controller('ai')
export class AiController {
    constructor(private readonly aiService: AiService) { }


    @Post('generate-questions/:interviewId')
    @ApiOperation({
        summary: 'GENERATE QUESTIONS',
        description: 'Private endpoint to generate questions.'
    })
    @ApiResponse({ status: 201, description: 'Created', isArray: true })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 500, description: 'Server error' })             //Swagger
    @Auth(Role.COMPANY)
    generateQuestions(@Param('interviewId') id: string, @Body() GenerateQuestionsDto: GenerateQuestionsDto) {
        return this.aiService.generateQuestions(id,GenerateQuestionsDto);
    }


    @Post('analiyze-question')
    @ApiOperation({
        summary: 'ANALYZE ANSWERS',
        description: 'Private endpoint to analyze answers.'
    })
    @ApiResponse({ status: 201, description: 'Created', isArray: true })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 500, description: 'Server error' })             //Swagger
    @Auth(Role.COMPANY)
    analyzeQuestion(@Body() AnalyzeQuestionDto: AnalyzeQuestionDto) {
        return this.aiService.analyzeResponse(AnalyzeQuestionDto);
    }

}
