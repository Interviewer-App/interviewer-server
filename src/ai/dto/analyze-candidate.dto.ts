import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty, IsArray, IsNumber
} from "class-validator";



export class AnalyzeCandidateDto {

  @ApiProperty({
    description: 'Name of the analyzing candidate',
    example: 'John Doe',
    nullable: false,
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Skills of the analyzing candidate',
    example: ["java","javascript","php"],
    nullable: false,
    required: true,
  })
  @IsArray()
  @IsNotEmpty()
  skills: Array<string>;

  @ApiProperty({
    description: 'Country of the analyzing candidate',
    example: 'United States',
    nullable: false,
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiProperty({
    description: 'Position of the analyzing candidate',
    example: 'Senior Software Engineer',
    nullable: false,
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  position: string;

  @ApiProperty({
    description: 'Years of experience analyzing candidate have',
    example: '5',
    nullable: false,
    required: true,
  })
  @IsNumber()
  @IsNotEmpty()
  yearsOfExperience: number;

  @ApiProperty({
    description: 'Education Level of the analyzing candidate',
    example: 'Graduate',
    nullable: false,
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  educationLevel: string;

};