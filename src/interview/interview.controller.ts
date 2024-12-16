import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InterviewService } from './interview.service';
import { Auth, GetUser } from 'src/auth/decorators';
import { Interview } from './entities/interview.entity';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { Role } from '@prisma/client';

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
}
