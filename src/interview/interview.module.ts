import { Module } from '@nestjs/common';
import { InterviewService } from './interview.service';
import { InterviewController } from './interview.controller';
import { AuthModule } from 'src/auth/auth.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { KafkaModule } from '../kafka/kafka.module';
import { InterviewGateway } from "./interview.gateway";
import { EmailServerModule } from "../email-server/email-server.module";
import { AuthService } from "../auth/auth.service";

@Module({
  providers: [InterviewService, InterviewGateway, AuthService],
  controllers: [InterviewController],
  imports: [
      AuthModule,
      PrismaModule,
      EmailServerModule,
      // KafkaModule
    ],
    exports: []
})
export class InterviewModule {
  
}
