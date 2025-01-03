import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
} from "class-validator";

export class CreateAnswerDto {
  @ApiProperty({
    description: "Session ID",
    nullable: false,
    required: true,
    type: "string",
    example: "cm4quxjjs0003vuuc0arunrlf",
  })
  @IsString()
  @IsNotEmpty()
  sessionID: string;

  @ApiProperty({
    description: "Question ID",
    nullable: false,
    required: true,
    type: "string",
    example: "cm4quxjjs0003vuuc0arunrlf",
  })
  @IsString()
  @IsNotEmpty()
  questionID: string;

  @ApiProperty({
    description: "Candidate ID",
    nullable: false,
    required: true,
    type: "string",
    example: "cm4quxjjs0003vuuc0arunrlf",
  })
  @IsString()
  @IsNotEmpty()
  candidateID: string;

  @ApiProperty({
    description: "Response Text",
    nullable: false,
    required: true,
    type: "string",
    example: "This is the candidate's response to the question.",
  })
  @IsString()
  @IsNotEmpty()
  responseText: string;

  @ApiProperty({
    description: "Response Time",
    nullable: false,
    required: true,
    type: "string",
    format: "date-time",
    example: "2024-12-31T12:00:00Z",
  })
  @IsDateString()
  responseTime: string;

  @ApiProperty({
    description: "Language Detected",
    nullable: false,
    required: true,
    type: "string",
    example: "en",
  })
  @IsString()
  @IsNotEmpty()
  languageDetected: string;

  @ApiProperty({
    description: "Sentiment Analysis",
    nullable: true,
    required: false,
    type: "string",
    example: "Positive",
  })
  @IsString()
  @IsOptional()
  sentimentAnalysis?: string;

  @ApiProperty({
    description: "Keyword Extracted",
    nullable: true,
    required: false,
    type: "string",
    example: "NestJS, TypeScript",
  })
  @IsString()
  @IsOptional()
  keywordExtracted?: string;

  @ApiProperty({
    description: "Comparison ID",
    nullable: true,
    required: false,
    type: "string",
    example: "cm4quxjjs0003vuuc0arunrlf",
  })
  @IsString()
  @IsOptional()
  comparisonID?: string;

  @ApiProperty({
    description: "Assessment ID",
    nullable: true,
    required: false,
    type: "string",
    example: "cm4quxjjs0003vuuc0arunrlf",
  })
  @IsString()
  @IsOptional()
  assessmentID?: string;

  @ApiProperty({
    description: "Review ID",
    nullable: true,
    required: false,
    type: "string",
    example: "cm4quxjjs0003vuuc0arunrlf",
  })
  @IsString()
  @IsOptional()
  reviewID?: string;
}