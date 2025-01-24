import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { AuthModule } from 'src/auth/auth.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { EmailServerModule } from "../email-server/email-server.module";

@Module({
  controllers: [UserController],
  providers: [UserService],
  imports: [
    AuthModule,
    PrismaModule,
    EmailServerModule,
  ],
  exports: []
})
export class UserModule {}
