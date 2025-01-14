import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, Min, Max, IsNotEmpty } from 'class-validator';

export class CreateCategoryAssignmentDto {
  @ApiProperty({
    description: 'Interview ID',
    nullable: false,
    required: true,
    type: 'string',
    example: 'cl4quxjjs0003vuuc0arunrlf',
  })
  @IsString()
  @IsNotEmpty()
  interviewId: string;

  @ApiProperty({
    description: 'Category ID',
    nullable: false,
    required: true,
    type: 'string',
    example: 'cl4quxjjs0004vuuc0arunrlf',
  })
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({
    description: 'Percentage assigned to this category',
    nullable: false,
    required: true,
    type: 'number',
    example: 50,
  })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsNotEmpty()
  percentage: number;
}