import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { AiService } from "../ai/ai.service";

@Module({
  controllers: [UploadController],
  providers: [UploadService, AiService],
  imports: [
    AuthModule,
    PrismaModule,
  ]
})
export class UploadModule {}
