import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, Min, Max, IsOptional, IsString } from "class-validator";

export class UpdateCategoryScoreDto {
  @ApiProperty({
    description: 'The updated score for the category',
    example: 85.5,
    nullable: true,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  score?: number;

  @ApiProperty({
    description: 'Special Note',
    nullable: true,
    required: false,
    type: 'string',
    example: 'Special note for given category score',
  })
  @IsString()
  @IsOptional()
  note?: string;
}