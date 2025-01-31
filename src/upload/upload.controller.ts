import { Controller, Post, UploadedFile, UseInterceptors, Param, ParseUUIDPipe, Get } from "@nestjs/common";
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { ApiConsumes, ApiBody, ApiParam, ApiResponse, ApiTags, ApiOperation } from "@nestjs/swagger";

@ApiTags('Upload') // Add a tag for Swagger documentation
@Controller('upload')
export class UploadController {
  constructor(
    private readonly fileUploadService: UploadService,
  ) {}

  @Post('cv/:candidateId')
  @UseInterceptors(FileInterceptor('file')) // Multer interceptor for file upload
  @ApiConsumes('multipart/form-data') // Specify the content type for Swagger
  @ApiBody({
    description: 'Upload a PDF file',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary', // Indicates that this is a file upload
        },
      },
    },
  })
  @ApiParam({
    name: 'candidateId',
    description: 'The ID of the candidate',
    type: 'string',
  })
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file or candidate ID' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async uploadCV(
    @UploadedFile() file: Express.Multer.File,
    @Param('candidateId') candidateId: string,
  ) {
    return await this.fileUploadService.uploadFile(file, candidateId);
  }

  @Get('resume-url/:candidateId')
  @ApiOperation({ summary: 'Get the resume URL of a candidate by profileID' })
  @ApiResponse({ status: 200, description: 'Resume URL fetched successfully', type: String })
  @ApiResponse({ status: 404, description: 'Candidate not found' })
  async getResumeUrl(@Param('candidateId') candidateId: string) {

      return await this.fileUploadService.getResumeUrl(candidateId);

  }
}