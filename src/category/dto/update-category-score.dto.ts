import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, Min, Max } from 'class-validator';

export class UpdateCategoryScoreDto {
  @ApiProperty({
    description: 'The updated score for the category',
    example: 85.5,
    nullable: false,
    required: true,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  @Max(100)
  score: number;
}