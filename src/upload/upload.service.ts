import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { Storage } from '@google-cloud/storage';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class UploadService {
  private storage: Storage;
  private bucketName: string;

  constructor(
    private configService: ConfigService,
    private readonly prisma: PrismaService,) {
    this.storage = new Storage({
      keyFilename: this.configService.get<string>(
        'GOOGLE_APPLICATION_CREDENTIALS',
      ),
    });
    this.bucketName = this.configService.get<string>('GCS_BUCKET_NAME');
  }

  async uploadFile(file: Express.Multer.File, candidateId: string): Promise<any> {

    if (!file) {
      throw new BadRequestException('No file uploaded.');
    }

    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Only PDF files are allowed.');
    }

    if (!candidateId) {
      throw new BadRequestException('Candidate ID is required.');
    }

    const candidate = await this.prisma.candidate.findUnique({
      where: { profileID: candidateId },
    });

    if (!candidate) {
      throw new NotFoundException(`Candidate with ID ${candidateId} not found.`);
    }

    try {
      const fileName = `${Date.now()}_${file.originalname}`;
      const fileStream = file.buffer;

      const bucket = this.storage.bucket(this.bucketName);
      const fileUpload = bucket.file(fileName);

      await fileUpload.save(fileStream, {
        metadata: { contentType: file.mimetype },
      });

      const fileUrl = `https://storage.googleapis.com/${this.bucketName}/${fileName}`;

      const updatedCandidate = await this.prisma.candidate.update({
        where: { profileID: candidateId },
        data: { resumeURL: fileUrl },
      });

      return { message: 'File uploaded successfully', fileUrl, candidate: updatedCandidate };
    } catch (error) {
      console.error('Error uploading file:', error);

      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to upload file. Please try again later.');
    }
  }
}