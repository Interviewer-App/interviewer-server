import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested, IsString, IsNumber, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

class CategoryOrderDto {
  @ApiProperty({
    description: 'Category ID',
    example: 'cln3z8y8a0000qy5q1q1q1q1q',
  })
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({
    description: 'Desired order for the category',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  order: number;
}

export class ReorderCategoryScoresDto {
  @ApiProperty({
    description: 'Session ID',
    example: 'cln3z8y8a0000qy5q1q1q1q1q',
  })
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({
    description: 'List of categories with their desired order',
    type: [CategoryOrderDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategoryOrderDto)
  categories: CategoryOrderDto[];
}