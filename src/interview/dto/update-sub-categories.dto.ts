import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, Min, Max, IsOptional, IsNotEmpty } from "class-validator";

export class UpdateSubCategoryAssignmentDto {
  @ApiProperty({
    description: "Updated name of the subcategory",
    example: "Advanced JavaScript",
    required: false
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: "Updated percentage allocated to this subcategory",
    example: 70,
    required: false
  })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  percentage?: number;

  @ApiProperty({
    description: "Color of the subcategory",
    example: "#4287f5",
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  color: string;
}