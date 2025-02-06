import { Controller, Post, Body, Param, Get, Res, HttpException, HttpStatus } from "@nestjs/common";
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
import { ComparisonBodyDto } from "./dto/comparison-body.dto";
import { AnalyzeCvDto } from "./dto/analyze-cv.dto";
import { GenerateDescriptionDto } from "./dto/generate-description.dto";
import { GenerateSchedulesDto } from "./dto/generate-schedules.dto";
import { Response } from 'express';


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
        return this.aiService.generateQuestions(id, GenerateQuestionsDto);
    }

    @Post('generate-questions-interview/:interviewId')
    @ApiOperation({
        summary: 'GENERATE QUESTIONS',
        description: 'Private endpoint to generate questions.'
    })
    @ApiResponse({ status: 201, description: 'Created', isArray: true })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 500, description: 'Server error' })             //Swagger
    @Auth(Role.COMPANY)
    generateQuestionsForInterview(@Param('interviewId') id: string, @Body() GenerateQuestionsDto: GenerateQuestionsDto) {
        return this.aiService.generateQuestionsForInterview(id, GenerateQuestionsDto);
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
    @ApiResponse({ status: 201, description: 'Created' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 500, description: 'Server error' })             //Swagger
    @Auth(Role.COMPANY)
    analyzeCandidate(@Body() AnalyzecandidateDto: AnalyzeCandidateDto) {
        return this.aiService.analyzeCandidate(AnalyzecandidateDto);
    }

    @Post('candidate-comparison')
    @ApiOperation({
        summary: 'COMPARE TWO CANDIDATES WHO COMPLETED SESSION',
        description: 'Private endpoint to analyze and compare two candidates who completed the session'
    })
    @ApiResponse({ status: 201, description: 'Created' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 500, description: 'Server error' })
    @Auth(Role.COMPANY)
    compareCandidate(@Body() comparisonBodyDto: ComparisonBodyDto) {
        return this.aiService.compareSessions(comparisonBodyDto);
    }

    @Post('analyze-cv')
    @ApiOperation({
        summary: 'analyze cv',
        description: 'Private endpoint to analyze cv.'
    })
    @ApiResponse({ status: 201, description: 'Created' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 500, description: 'Server error' })
    @Auth(Role.COMPANY, Role.CANDIDATE)
    analyzeCV(@Body() dto: AnalyzeCvDto) {
        return this.aiService.analyzeCV(dto);
    }

    @Post('generate-description')
    @ApiOperation({
        summary: 'GENERATE DESCRIPTION FOR INTERVIEW',
        description: 'Private endpoint to generate description.'
    })
    @ApiResponse({ status: 201, description: 'Created' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 500, description: 'Server error' })
    @Auth(Role.COMPANY)
    generateDescription(@Body() dto: GenerateDescriptionDto) {
        return this.aiService.generateDescription(dto);
    }

    @Post('generate-schedules')
    @ApiOperation({
        summary: 'GENERATE SCHEDULES FOR INTERVIEW',
        description: 'Private endpoint to generate schedules.'
    })
    @ApiResponse({ status: 201, description: 'Created' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 500, description: 'Server error' })
    @Auth(Role.COMPANY)
    generateSchedules(@Body() dto: GenerateSchedulesDto) {
        return this.aiService.generateSchedules(dto);
    }

    @Post('generate')
    @ApiResponse({ status: 201, description: 'Created' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 500, description: 'Server error' })
    async generatePdf(@Body() generatePdfDto: any, @Res() res:Response) {
        try {
            const pdf = await this.aiService.generatePdf(generatePdfDto.url);
            
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=download.pdf');
            return res.send(pdf);
          } catch (error) {
            throw new HttpException(
              {
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                error: 'PDF generation failed',
                message: error.message,
              },
              HttpStatus.INTERNAL_SERVER_ERROR,
            );
          }
    }

}
