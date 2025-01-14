import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';

import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { AppService } from './app.service';
import { AiModule } from './ai/ai.module';
import { InterviewModule } from './interview/interview.module';
import { InterviewSessionModule } from './interview-session/interview-session.module';
import { KafkaModule } from './kafka/kafka.module';
import { AnswersModule } from './answers/answers.module';
import { CronService } from './cron/cron.service';
import { CategoryModule } from './category/category.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    PrismaModule,
    UserModule,
    AiModule,
    InterviewModule,
    InterviewSessionModule,
    AnswersModule,
    CategoryModule,
    // KafkaModule,
  ],
  controllers:[AppController],
  providers:[AppService, CronService]
})
export class AppModule {}