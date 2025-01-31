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



export class AnalyzeCvDto {

  @ApiProperty({
    description: 'URL of cv',
    example: 'What is polymorphism in object-oriented programming?',
    nullable: false,
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  Url: string;
}