import { PartialType } from '@nestjs/swagger';
import { CreateInterviewSessionDto } from './create-interview-session.dto';

export class UpdateInterviewSessionDto extends PartialType(CreateInterviewSessionDto) {}
