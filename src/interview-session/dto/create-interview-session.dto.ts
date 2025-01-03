import { ApiProperty } from "@nestjs/swagger";
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum
} from "class-validator";

export enum InterviewCategory {
  Technical = "Technical",
  Behavioural = "Behavioural",
}

export enum InterviewStatus {
  toBeConducted = "toBeConducted",
  completed = "completed",
}


export class CreateInterviewSessionDto {
  @ApiProperty({
    description: "Candidate ID",
    nullable: false,
    required: true,
    type: "string",
    example: "cm4quxjjs0003vuuc0arunrlf",
  })
  @IsString()
  @IsNotEmpty()
  candidateId: string;

  @ApiProperty({
    description: "Interview ID",
    nullable: false,
    required: true,
    type: "string",
    example: "cm4quxjjs0003vuuc0arunrlf",
  })
  @IsString()
  @IsNotEmpty()
  interviewId: string;


  @ApiProperty({
    description: "Interview Category",
    nullable: false,
    required: true,
    enum: InterviewCategory,
    example: InterviewCategory.Technical,
  })
  @IsEnum(InterviewCategory)
  interviewCategory: InterviewCategory;

  @ApiProperty({
    description: "Scheduled Date",
    nullable: false,
    required: true,
    type: "string",
    format: "date-time",
    example: "2024-12-31T12:00:00Z",
  })
  @IsDateString()
  scheduledDate: string;

  @ApiProperty({
    description: "Scheduled At",
    nullable: false,
    required: true,
    type: "string",
    format: "date-time",
    example: "2024-12-31T12:00:00Z",
  })
  @IsDateString()
  scheduledAt: string;

  @ApiProperty({
    description: "Interview Status",
    nullable: false,
    required: true,
    enum: InterviewStatus,
    example: InterviewStatus.toBeConducted,
  })
  @IsEnum(InterviewStatus)
  interviewStatus: InterviewStatus;



}
