import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class SurveyQuestionDto {
  @ApiProperty({
    description: 'The survey question',
    example: 'What is your experience level?',
  })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty({
    description: 'The answer(s) to the question (can be a single value or an array)',
    example: ['Intermediate'],
    oneOf: [
      { type: 'string', example: 'Intermediate' },
      { type: 'array', items: { type: 'string' }, example: ['Node.js', 'React'] },
    ],
  })
  @IsOptional()
  @Type(() => String)
  @IsArray({ each: true })
  answer: string | string[];
}

export class SaveSurveyDto {
  @ApiProperty({
    description: 'Role of the user (candidate or company)',
    example: 'candidate',
    enum: ['candidate', 'company'],
  })
  @IsString()
  @IsNotEmpty()
  role: 'candidate' | 'company';

  @ApiProperty({
    description: 'ID of the candidate or company',
    example: 'cl4quxjjs0003vuuc0arunrlf',
  })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    description: 'Array of questions and answers',
    type: [SurveyQuestionDto],
  })
  @IsArray()
  @IsNotEmpty()
  surveys: SurveyQuestionDto[];
}