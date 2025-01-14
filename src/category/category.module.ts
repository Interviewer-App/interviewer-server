import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  controllers: [CategoryController],
  providers: [CategoryService],
  imports: [
    AuthModule,
    PrismaModule,
  ]
})
export class CategoryModule {}
