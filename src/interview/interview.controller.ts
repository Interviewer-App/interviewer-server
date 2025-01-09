import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { InterviewService } from './interview.service';
import { Auth, GetUser } from 'src/auth/decorators';
import { Interview } from './entities/interview.entity';
import { CreateInterviewDto } from "./dto/create-interview.dto";
import { InterviewStatus, Role } from "@prisma/client";
import { UpdateInterviewDto } from './dto/update-interview.dto';

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

    @Get('published')
    @ApiOperation({
        summary: 'GET ALL PUBLISHED INTERVIEWS',
        description: 'Private endpoint to Get all Interviews with status published. It is allowed only by "admin" users'
    })
    @ApiResponse({ status: 201, description: 'Created', type: Interview,isArray: true })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 500, description: 'Server error' })             //Swagger
    @Auth(Role.COMPANY, Role.CANDIDATE)
    findAllPublishedInterview() {
        return this.interviewService.findAllPublishedInterviews();
    }

    @Get('interview/:id')
    @ApiOperation({
        summary: 'GET INTERVIEW BY ID',
        description: 'Private endpoint to Get interview by Id. It is allowed only by "admin" users'
    })
    @ApiResponse({ status: 201, description: 'Created', type: Interview,isArray: true })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 500, description: 'Server error' })             //Swagger
    @Auth(Role.COMPANY)
    findInterviewById(@Param('id') id: string) {
        return this.interviewService.findById(id);
    }

    @Get('status')
    @ApiQuery({
        name: 'status',
        enum: InterviewStatus,
        description: 'Filter by status',
        required: true,
    })
    @ApiOperation({
        summary: 'GET INTERVIEW BY STATUS',
        description: 'Private endpoint to Get interview by Status. It is allowed only by "admin" users'
    })
    @ApiResponse({ status: 201, description: 'Created', type: Interview,isArray: true })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 500, description: 'Server error' })             //Swagger
    @Auth(Role.COMPANY)
    findAllByStatus(@Query('status') status: InterviewStatus ) {
        return this.interviewService.findAllByStatus(status);
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


}
