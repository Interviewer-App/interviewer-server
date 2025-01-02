import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { AuthModule } from 'src/auth/auth.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  providers: [AiService],
  controllers: [AiController],
  imports: [
        AuthModule,
        PrismaModule,
      ],
      exports: []
})
export class AiModule {}
