import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Interview } from "../interview/entities/interview.entity";
import { Auth } from "../auth/decorators";
import { Role } from "@prisma/client";
import { EmailServerService } from './email-server.service';
import { CreateEmailServerDto } from './dto/create-email-server.dto';
import { EmailServer } from './entities/email-service.entity';


// @ApiBearerAuth()
@ApiTags('email-server')
@Controller('email-server')
export class EmailServerController {
    constructor(private readonly emailServerService: EmailServerService) {}

    @Post('test')
    @ApiOperation({
        summary: 'CREATE Email',
        description: 'Private endpoint to Create a new email'
    })
    @ApiResponse({ status: 201, description: 'Created' , type: EmailServer})
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 500, description: 'Server error' })    
    testEMail(@Body() createEmailServerDto: CreateEmailServerDto) {
      return this.emailServerService.sendMailSandBox(createEmailServerDto);
    }

}
