import { PartialType } from '@nestjs/swagger';
import { CreateInterviewSessionDto } from './create-interview-session.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateInterviewSessionDto extends PartialType(CreateInterviewSessionDto) {
        @IsString()
        @IsOptional()
        updatedAt?: string
}
