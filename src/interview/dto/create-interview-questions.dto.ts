import { UpdateQuestionDto } from '../../interview-session/dto/update-question.dto';
import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsString } from "class-validator";

export class CreateInterviewQuestionsDto extends UpdateQuestionDto{
  @ApiProperty({
    description: "InterviewId",
    nullable: false,
    required: true,
    type: "string",
    example: "sjdjifjdfsmdsiMDs",
  })
  @IsString()
  @IsNotEmpty()
  interviewId: string;
}