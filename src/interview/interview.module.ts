import { Module } from '@nestjs/common';
import { InterviewService } from './interview.service';
import { InterviewController } from './interview.controller';
import { AuthModule } from 'src/auth/auth.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { KafkaModule } from '../kafka/kafka.module';
import { InterviewGateway } from "./interview.gateway";

@Module({
  providers: [InterviewService, InterviewGateway],
  controllers: [InterviewController],
  imports: [
      AuthModule,
      PrismaModule,
      // KafkaModule
    ],
    exports: []
})
export class InterviewModule {
  
}
