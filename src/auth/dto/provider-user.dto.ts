import { ApiProperty } from "@nestjs/swagger";
import { Role } from "@prisma/client";

import { IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength, NotContains } from "class-validator";


export class ProviderUserDto {

  @ApiProperty({
    description: "Name",
    nullable: false,
    required: true,
    type: "string",
    example: "John Sample",
  })
  @IsString()
  @MinLength(3)
  firstname: string;

  @ApiProperty({
    description: "Name",
    nullable: false,
    required: true,
    type: "string",
    example: "John Sample",
  })
  @IsString()
  @MinLength(3)
  lastname: string;


  @ApiProperty({
    description: "Email",
    uniqueItems: true,
    nullable: false,
    required: true,
    type: "string",
    example: "youremail@example.com",
  })
  @IsEmail()
  email: string;




  @ApiProperty({
    description: "User Role (CAMPANY, CANDIDATE, ADMIN)",
    nullable: false,
    required: true,
    type: "string",
    example: "COMPANY",
  })
  @IsString()
  @IsOptional()
  role?: Role;


  @ApiProperty({
    description: "user provider account type",
    nullable: false,
    required: true,
    type: "string",
    // example: "Google",
  })
  @IsString()
  @IsOptional()
  provider?: string;

  @ApiProperty({
    description: "user provider account type",
    nullable: false,
    required: true,
    type: "string",
    // example: "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",
  })
  @IsString()
  @IsOptional()
  providerAccountId?: string;


  @ApiProperty({
    description: "Company Name",
    nullable: false,
    required: true,
    type: "string",
    example: "Coullax",
  })
  @IsString()
  @IsOptional()
  companyname?: string;
}
