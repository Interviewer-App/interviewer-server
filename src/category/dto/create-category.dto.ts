import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Company ID',
    nullable: false,
    required: true,
    type: 'string',
    example: 'cm4quxjjs0003vuuc0arunrlf',
  })
  @IsString()
  @IsNotEmpty()
  companyId: string;

  @ApiProperty({
    description: 'Category Name',
    nullable: false,
    required: true,
    type: 'string',
    example: 'Technical',
  })
  @IsString()
  @IsNotEmpty()
  categoryName: string;

  @ApiProperty({
    description: 'Category Description',
    nullable: true,
    required: false,
    type: 'string',
    example: 'Asseses the technical ability of the candidate',
  })
  @IsString()
  @IsOptional()
  description?: string;
}