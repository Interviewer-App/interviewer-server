import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsInt,
  Min,
  IsJSON,
  IsEnum,
  IsArray,
} from "class-validator";

export enum QuestionTypes {
  TECHNICAL = 'TECHNICAL',
  BEHAVIOURAL = 'BEHAVIOURAL',
}

export enum SkillLevel {
  Junior = 'Junior',
  Senior = 'Senior',
}

export class GenerateQuestionsDto {
  @ApiProperty({
    description: 'The role or title of the job',
    example: 'Software Engineer',
    nullable: false,
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  jobRole: string;

  @ApiProperty({
    description: 'The skill level required for the job',
    example: 'Junior',
    enum: SkillLevel,
    nullable: false,
    required: true,
  })
  @IsEnum(SkillLevel)
  @IsNotEmpty()
  skillLevel: SkillLevel;

  @ApiProperty({
    description: 'The culture of the company',
    example: 'Innovative and collaborative',
    nullable: true,
    required: false,
  })
  @IsString()
  @IsOptional()
  companyCulture?: string;

  @ApiProperty({
    description: 'The aim or mission of the company',
    example: 'To revolutionize the tech industry',
    nullable: true,
    required: false,
  })
  @IsString()
  @IsOptional()
  companyAim?: string;

  @ApiProperty({
    description: 'The type of questions to generate',
    example: 'TECHNICAL',
    enum: QuestionTypes,
    nullable: false,
    required: true,
  })
  @IsEnum(QuestionTypes)
  @IsNotEmpty()
  QuestionType: QuestionTypes;

  @ApiProperty({
    description: 'Keywords related to the job or company',
    example: ['JavaScript', 'Node.js', 'React'],
    nullable: true,
    required: false,
    type: [String],
  })
  @IsArray()
  @IsOptional()
  Keywords?: string[];
}