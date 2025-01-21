import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { InterviewService } from './interview.service';
import { Auth, GetUser } from 'src/auth/decorators';
import { Interview } from './entities/interview.entity';
import { CreateInterviewDto } from "./dto/create-interview.dto";
import { InterviewStatus, Role } from "@prisma/client";
import { UpdateInterviewDto } from './dto/update-interview.dto';
import { EmailInvitationDto } from "./dto/email-invitation.dto";
import { BookScheduleDto } from "./dto/book-schedule.dto";

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
        description: 'Private endpoint to Get all Interviews with status published. It is allowed only by "admin" users',
    })
    @ApiResponse({ status: 200, description: 'Success', type: Interview, isArray: true })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 500, description: 'Server error' })
    @ApiQuery({ name: 'sortBy', required: false, description: 'Sort by: latest, a-z, z-a, topmatch' })
    @ApiQuery({ name: 'datePosted', required: false, description: 'Filter by date posted: last 24 hours, last week, last month' })
    @ApiQuery({ name: 'category', required: false, description: 'Filter by interview category' })
    @ApiQuery({ name: 'jobTitle', required: false, description: 'Filter by job title' })
    @ApiQuery({ name: 'keywords', required: false, description: 'Filter by keywords in job title, description, or skills' })
    @Auth(Role.COMPANY, Role.CANDIDATE)
    findAllPublishedInterview(
      @Query('sortBy') sortBy?: string,
      @Query('datePosted') datePosted?: string,
      @Query('category') category?: string,
      @Query('jobTitle') jobTitle?: string,
      @Query('keywords') keywords?: string,
    ) {
        return this.interviewService.findAllPublishedInterviews(
          sortBy,
          datePosted,
          category,
          jobTitle,
          keywords,
        );
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
    @Auth(Role.COMPANY,Role.CANDIDATE)
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

    @Post('send-invitation')
    @ApiOperation({
        summary: 'SEND INVITATION',
        description: 'Private endpoint to send invitations to candidate for the interview. It is allowed only by "admin" users'
    })
    @ApiResponse({ status: 201, description: 'Created'})
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 500, description: 'Server error' })             //Swagger
    @Auth(Role.ADMIN, Role.COMPANY)
    sendEmailInvitation(@Body() emailInvitation: EmailInvitationDto) {
        return this.interviewService.sendEmailInvitation(emailInvitation);
    }

    @Get('schedules/:interviewId')
    @ApiOperation({
        summary: 'GET ALL SCHEDULES OF THE INTERVIEW',
        description: 'Private endpoint to Get all schedules of the interview. It is allowed only by "admin" users'
    })
    @ApiResponse({ status: 201, description: 'Created'})
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 500, description: 'Server error' })
    @Auth(Role.COMPANY,Role.CANDIDATE)
    findSchedulesByInterviewId(@Param('interviewId') interviewId: string) {
        return this.interviewService.findSchedulesByInterviewId(interviewId);
    }

    @Get('schedules/company/:interviewId')
    @ApiOperation({
        summary: 'GET ALL SCHEDULES OF THE INTERVIEW',
        description: 'Private endpoint to Get all schedules of the interview. It is allowed only by "admin" users'
    })
    @ApiResponse({ status: 201, description: 'Created'})
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 500, description: 'Server error' })
    @Auth(Role.COMPANY,Role.CANDIDATE)
    findSchedulesByInterviewIdForCompany(@Param('interviewId') interviewId: string) {
        return this.interviewService.findSchedulesByInterviewIdForCompany(interviewId);
    }

    @Post('book-schedule')
    @ApiOperation({
        summary: 'BOOK INTERVIEW SLOT',
        description: 'Private endpoint to send invitations to candidate for the interview. It is allowed only by "admin" users'
    })
    @ApiResponse({ status: 201, description: 'Created'})
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 500, description: 'Server error' })             //Swagger
    @Auth(Role.CANDIDATE, Role.COMPANY)
    bookInterviewSchedule(@Body() bookScheduleDto: BookScheduleDto) {
        return this.interviewService.bookInterviewSchedule(bookScheduleDto);
    }

    @Get('invitations/:interviewID/:page/:limit')
    @ApiOperation({ summary: 'Get all invitations for a specific interview' })
    @ApiParam({ name: 'interviewID', description: 'ID of the interview', type: String })
    @ApiResponse({
        status: 200,
        description: 'List of invitations for the interview',
    })
    @ApiResponse({ status: 404, description: 'No invitations found for the interview' })
    async getInvitationsByInterviewId(
      @Param('interviewID') interviewID: string,
      @Param('page') page: number,
      @Param('limit') limit: number,
    ) {
        return this.interviewService.getInvitationsByInterviewId(interviewID,page,limit);
    }

    @Get('schedules/candidate/:candidateId')
    @ApiOperation({
        summary: 'GET ALL SCHEDULES OF THE GIVEN CANDIDATE',
        description: 'Private endpoint to Get all schedules of the candidate. It is allowed only by "admin" users'
    })
    @ApiResponse({ status: 201, description: 'Created'})
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 500, description: 'Server error' })             //Swagger
    @Auth(Role.COMPANY,Role.CANDIDATE)
    findSchedulesByCandidateId(@Param('candidateId') candidateId: string) {
        return this.interviewService.findSchedulesByCandidateId(candidateId);
    }
}
