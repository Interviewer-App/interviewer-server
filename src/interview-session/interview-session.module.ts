import { Module } from '@nestjs/common';
import { InterviewSessionService } from './interview-session.service';
import { InterviewSessionController } from './interview-session.controller';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { InterviewSessionCreateConsumer } from './interview-session-create.consumer';
import { KafkaModule } from '../kafka/kafka.module';
import { InterviewSessionGateway } from './interview-session.gateway';
import { AiService } from 'src/ai/ai.service';
import { AnswersService } from "../answers/answers.service";
import { CategoryService } from "../category/category.service";

@Module({
  controllers: [InterviewSessionController],
  providers: [InterviewSessionService, InterviewSessionGateway, AiService, AnswersService, CategoryService],
  imports:[
    AuthModule,
    PrismaModule,
    // KafkaModule
  ]
})
export class InterviewSessionModule {}
