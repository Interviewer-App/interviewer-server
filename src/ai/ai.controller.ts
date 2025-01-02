import { Controller, Post, Body, Param } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AiService } from './ai.service';
import { Auth } from 'src/auth/decorators';
import { Role } from '@prisma/client';
import { GenerateQuestionsDto } from './dto/generate-questions.dto';
import { AnalyzeQuestionDto } from './dto/analyze-question.dto';
import { AnalyzeCandidateDto } from './dto/analyze-candidate.dto';


@ApiBearerAuth()
@ApiTags('AI')
@Controller('ai')
export class AiController {
    constructor(private readonly aiService: AiService) { }


    @Post('generate-questions/:sessionId')
    @ApiOperation({
    summary: 'GENERATE QUESTIONS',
        description: 'Private endpoint to generate questions.'
    })
    @ApiResponse({ status: 201, description: 'Created', isArray: true })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 500, description: 'Server error' })             //Swagger
    @Auth(Role.COMPANY)
    generateQuestions(@Param('sessionId') id: string, @Body() GenerateQuestionsDto: GenerateQuestionsDto) {
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

    @Post('analiyze-candidate')
    @ApiOperation({
        summary: 'ANALYZE CANDIDATES RELEVENT FOR THE POSITION',
        description: 'Private endpoint to analyze candidate and get summary with relevance to the position.'
    })
    @ApiResponse({ status: 201, description: 'Created'})
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 500, description: 'Server error' })             //Swagger
    @Auth(Role.COMPANY)
    analyzeCandidate(@Body() AnalyzecandidateDto: AnalyzeCandidateDto) {
    return this.aiService.analyzeCandidate(AnalyzecandidateDto);
    }

}
