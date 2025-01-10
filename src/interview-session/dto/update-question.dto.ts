import { IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateQuestionDto{
  @ApiProperty({
    description: "Question",
    nullable: false,
    required: true,
    type: "string",
    example: "Describe a complex software project you worked on, highlighting the technical challenges you faced and how you overcame them. Focus on your specific contributions and the architectural decisions involved.",
  })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty({
    description: "Question type",
    nullable: false,
    required: true,
    type: "string",
    example: "OPEN_ENDED or CODING",
  })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({
    description: "Estimated time",
    nullable: false,
    required: true,
    type: 'integer',
    example: 5,
  })
  @IsInt()
  @IsOptional()
  estimatedTimeInMinutes: number;

  @IsString()
  @IsOptional()
  updatedAt?: string;
}
