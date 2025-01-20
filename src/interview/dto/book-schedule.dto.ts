import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class BookScheduleDto {
  @ApiProperty({
    description: 'The ID of the interview',
    example: 'cl4quxjjs0003vuuc0arunrlf',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  interviewId: string;

  @ApiProperty({
    description: 'The ID of the schedule to book',
    example: 'cl4quxjjs0004vuuc0arunrlf',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  scheduleId: string;

  @ApiProperty({
    description: 'The ID of the candidate booking the schedule',
    example: 'cl4quxjjs0005vuuc0arunrlf',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  candidateId: string;
}