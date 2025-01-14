import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, Min, Max } from 'class-validator';

export class UpdateCategoryAssignmentDto {
  @ApiProperty({
    description: 'Percentage assigned to this category',
    nullable: true,
    required: false,
    type: 'number',
    example: 50,
  })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  percentage?: number;
}