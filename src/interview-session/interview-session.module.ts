import { Module } from '@nestjs/common';
import { InterviewSessionService } from './interview-session.service';
import { InterviewSessionController } from './interview-session.controller';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  controllers: [InterviewSessionController],
  providers: [InterviewSessionService],
  imports:[
    AuthModule,
    PrismaModule,
  ]
})
export class InterviewSessionModule {}
