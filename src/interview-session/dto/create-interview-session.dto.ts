// import { ApiProperty } from "@nestjs/swagger";
// import { IsDateString, IsInt, IsJSON, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";
//
// export class CreateInterviewSessionDto {
//   @ApiProperty({
//     description: "Interview ID",
//     nullable: false,
//     required: true,
//     type: "string",
//     example: "cm4quxjjs0003vuuc0arunrlf",
//   })
//   @IsString()
//   @IsNotEmpty()
//   interviewId: string;
//
//   @ApiProperty({
//     description: "Candidate ID",
//     nullable: false,
//     required: true,
//     type: "string",
//     example: "cm4quxjjs0003vuuc0arunrlf",
//   })
//   @IsString()
//   @IsNotEmpty()
//   candidateId: string;
//
//   @ApiProperty({
//     description: "Answers in JSON format",
//     nullable: false,
//     required: true,
//     type: "array",
//     example: [
//       { question: "What is a binary tree?", answer: "answer here" },
//       { question: "Solve this coding challenge.", answer: "answer here" },
//     ],
//   })
//
//   @IsOptional()
//   responses: Array<{ question: string; answer: string }>;
//
//   @ApiProperty({
//     description: "Status of the interview session",
//     nullable: false,
//     required: true,
//     type: "string",
//     example: "PENDING",
//   })
//   @IsString()
//   status:  "PENDING" | "ACTIVE" | "COMPLETED" | 'ARCHIVED';
//
//   @ApiProperty({
//     description: "Start time of the interview session in ISO 8601 format",
//     nullable: true,
//     required: false,
//     type: "string",
//     format: "date-time",
//     example: "2024-12-31T12:00:00Z",
//   })
//   @IsOptional()
//   @IsDateString()
//   startTime?: string;
//
//   @ApiProperty({
//     description: "End time of the interview session in ISO 8601 format",
//     nullable: true,
//     required: false,
//     type: "string",
//     format: "date-time",
//     example: "2024-12-31T13:00:00Z",
//   })
//   @IsOptional()
//   @IsDateString()
//   endTime?: string;
//
//   @ApiProperty({
//     description: "Score of the interview session",
//     nullable: true,
//     required: false,
//     type: "number",
//     example: 85.5,
//   })
//   @IsOptional()
//   @IsNumber()
//   score?: number;
//
//   @ApiProperty({
//     description: "Answers in JSON format",
//     nullable: false,
//     required: true,
//     type: "array",
//     example: [
//       { answer: "What is a binary tree?", analysis: "analysis here" },
//       { answer: "Solve this coding challenge.", analysis: "analysis here" },
//     ],
//   })
//
//   @IsOptional()
//   aiAnalysis: Array<{ answer: string; analysis: string }>;
// }

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
