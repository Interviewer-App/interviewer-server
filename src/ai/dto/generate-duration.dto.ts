import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { CategoryAssignmentDto } from "../../interview/dto/create-interview.dto";


export class CategoriesDto {
  @ApiProperty({
    description: "Category name",
    nullable: false,
    required: true,
    type: "string",
    example: "Technical",
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: "Percentage assigned to this category",
    nullable: false,
    required: true,
    type: "number",
    example: 50,
  })
  @IsInt()
  @Min(1)
  @Max(100)
  percentage: number;
}

export class GenerateDurationDto{
  @ApiProperty({
    description: "Job Title for the interview",
    nullable: true,
    required: false,
    type: "string",
    example: "Senior Software Engineer",
  })
  @IsNotEmpty()
  @IsString()
  jobTitle: string;

  @ApiProperty({
    description: "Job description for the interview",
    nullable: true,
    required: false,
    type: "string",
    example: "Looking for candidates with strong knowledge in Node.js and React.",
  })
  @IsOptional()
  @IsString()
  jobDescription?: string;

  @ApiProperty({
    description: "Required skills for the interview",
    nullable: true,
    required: false,
    type: "string",
    example: "Node.js, React, TypeScript",
  })
  @IsOptional()
  @IsString()
  requiredSkills?: string;

  @ApiProperty({
    description: "Category assignments for the interview",
    nullable: false,
    required: true,
    type: [CategoriesDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategoriesDto)
  categoryAssignments: CategoriesDto[];

  @ApiProperty({
    description: "Difficulty of interview easy/medium/hard",
    nullable: false,
    required: true,
    type: "string",
    example: "easy",
  })
  @IsNotEmpty()
  @IsString()
  difficulty: string;

  @ApiProperty({
    description: "Preferred length for the interview mid/short/lengthy",
    nullable: false,
    required: true,
    type: "string",
    example: "mid",
  })
  @IsNotEmpty()
  @IsString()
  length: string;

}