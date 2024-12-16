import { BadRequestException, Injectable, InternalServerErrorException, Logger, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateInterviewDto } from './dto/create-interview.dto';


@Injectable()
export class InterviewService {
    private readonly logger = new Logger('InterviewService');

    constructor(
        private prisma: PrismaService,

    ) { }


    async create(dto: CreateInterviewDto) {
        
        this.logger.log(`POST: interview/create: New interview started`);
    
        try {
            // Creating a new interview in the database
            const interview = await this.prisma.interview.create({
                data: {
                    companyId: dto.companyId,
                    title: dto.title,
                    description: dto.description || null,
                    questions:  dto.questions,
                    duration: dto.duration,
                    status: 'DRAFT',
                },
            });

            this.logger.log(
                `POST: interview/create: Interview ${interview.id} created successfully`
            );

            return {
                message: "Interview created successfully",
                interview,
            };
        } catch (error) {
            // Custom Prisma error handler
            this.prismaErrorHandler(error, "POST", dto.companyId);
            this.logger.error(`POST: interview/create: Error: ${error.message}`);
            throw new InternalServerErrorException("Server error occurred");
        }
    }

    private prismaErrorHandler(error: any, method: string, identifier: string) {
        if (error.code === "P2002") {
            this.logger.error(
                `${method}: Conflict: Duplicate entry for companyId ${identifier}`
            );
            throw new InternalServerErrorException(
                "Duplicate entry: A record with this company ID already exists."
            );
        }
        this.logger.error(`${method}: Prisma error: ${error.message}`);
    }

    async findAll() {
    
        try {
          const users = await this.prisma.interview.findMany({
            select: {
              id: true,
              companyId: true,
              title:true,
              description:true,
              questions:true,
              duration:true,
              status:true,
              createdAt: true,
              updatedAt: true,
            }
          });
          return users;
        } catch (error) {
          this.logger.error(`GET: error: ${error}`);
          throw new InternalServerErrorException('Server error');
        }
            
      }
}
