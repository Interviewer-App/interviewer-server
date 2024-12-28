import { Module } from '@nestjs/common';
import { InterviewSessionService } from './interview-session.service';
import { InterviewSessionController } from './interview-session.controller';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { InterviewSessionCreateConsumer } from './interview-session-create.consumer';
import { KafkaModule } from '../kafka/kafka.module';

@Module({
  controllers: [InterviewSessionController],
  providers: [InterviewSessionService, InterviewSessionCreateConsumer],
  imports:[
    AuthModule,
    PrismaModule,
    KafkaModule
  ]
})
export class InterviewSessionModule {}
