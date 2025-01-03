import { Module } from '@nestjs/common';
import { AnswersService } from './answers.service';
import { AnswersController } from './answers.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  controllers: [AnswersController],
  providers: [AnswersService],
  imports: [
    PrismaModule,
    AuthModule
  ]
})
export class AnswersModule {}
