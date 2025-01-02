import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsInt,
  Min,
  IsJSON,
  IsEnum,
} from "class-validator";



export class AnalyzeQuestionDto {

  @ApiProperty({
    description: 'The question being analyzed',
    example: 'What is polymorphism in object-oriented programming?',
    nullable: false,
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty({
    description: 'The candidate\'s response to the question',
    example: 'Polymorphism allows objects to be treated as instances of their parent class. For example, in Java, a parent class can have a method "draw" that is overridden in subclasses like Circle or Square. It improves flexibility and reusability.',
    nullable: false,
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  answer: string;

};