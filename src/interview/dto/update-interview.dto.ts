import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { CreateInterviewDto } from './create-interview.dto';

export class UpdateInterviewDto extends PartialType(CreateInterviewDto) {
    @IsString()
    @IsOptional()
    updatedAt?: string
}
