import { Module } from '@nestjs/common';
import { InterviewService } from './interview.service';
import { InterviewController } from './interview.controller';
import { AuthModule } from 'src/auth/auth.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  providers: [InterviewService],
  controllers: [InterviewController],
  imports: [
      AuthModule,
      PrismaModule,
    ],
    exports: []
})
export class InterviewModule {
  
}
