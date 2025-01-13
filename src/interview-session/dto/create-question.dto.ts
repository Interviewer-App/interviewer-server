import { UpdateQuestionDto } from './update-question.dto';
import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsString } from "class-validator";
import { InterviewCategory } from "../../interview/dto/create-interview.dto";

enum QuestionType {
  OPEN_ENDED = "OPEN_ENDED",
  CODING = "CODING",
}
export class CreateQuestionDto extends UpdateQuestionDto{
  @ApiProperty({
    description: "SessionId",
    nullable: false,
    required: true,
    type: "string",
    example: "sjdjifjdfsmdsiMDs",
  })
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  // @ApiProperty({
  //   description: "Question Type",
  //   nullable: false,
  //   required: true,
  //   enum: QuestionType,
  //   example: QuestionType.CODING,
  // })
  // @IsNotEmpty()
  // @IsEnum(QuestionType)
  // questionType: QuestionType;
}