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
        description: 'Skill level required for the job',
        example: 'Senior',
        nullable: false,
        required: true,
      })
      @IsString()
      @IsNotEmpty()
      skillLevel: string;

};