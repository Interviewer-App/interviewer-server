import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsString, Max, Min } from "class-validator";

export class AddSubCategoryAssignmentDto {
  @ApiProperty({
    description: "Name of the subcategory",
    example: "JavaScript Fundamentals",
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: "Percentage allocated to this subcategory (relative to parent category)",
    example: 60,
    required: true,
  })
  @IsInt()
  @Min(1)
  @Max(100)
  percentage: number;
}