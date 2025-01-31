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
import { EmailServerModule } from './email-server/email-server.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { PugAdapter } from '@nestjs-modules/mailer/dist/adapters/pug.adapter';
import { UploadModule } from './upload/upload.module';

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
    EmailServerModule,
    MailerModule.forRoot({
      transport: {
        host: String(process.env.MAIL_HOST),
        port: Number(process.env.MAIL_PORT),
        secure: false,
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
        },
      },
      template: {
        dir: __dirname + './template/notification',
        adapter: new PugAdapter({  inlineCssEnabled: true,}),
        options: {
          strict: true,
        },
      },
    }),
    UploadModule,
    // KafkaModule,
  ],
  controllers:[AppController],
  providers:[AppService, CronService]
})
export class AppModule {}