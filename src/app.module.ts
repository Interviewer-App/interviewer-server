import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';

import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { AppService } from './app.service';
import { AiModule } from './ai/ai.module';
import { InterviewModule } from './interview/interview.module';

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
  ],
  controllers:[AppController],
  providers:[AppService]
})
export class AppModule {}