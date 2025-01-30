import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsPhoneNumber, IsString, IsUrl, ValidateIf } from "class-validator";

export class UpdateCompanyDto {
  @ApiProperty({
    description: 'Company Name',
    required: false,
    example: 'Company',
    type: String,
  })
  @IsOptional()
  @ValidateIf((obj, value) => value !== "")
  @IsString()
  companyName?: string;

  @ApiProperty({
    description: 'Description of the company',
    required: false,
    example: 'Innovative company in Software Development',
    type: String,
  })
  @IsOptional()
  @ValidateIf((obj, value) => value !== "")
  @IsString()
  companyDescription?: string;

  @ApiProperty({
    description: 'Contact number of the user',
    required: false,
    example: '+1234567890',
    type: String,
  })
  @IsOptional()
  @ValidateIf((obj, value) => value !== "")
  @IsPhoneNumber()
  contactNo?: string;

  @ApiProperty({
    description: 'Website URL of the company',
    required: false,
    example: 'https://company.com',
    type: String,
  })
  @IsOptional()
  @ValidateIf((obj, value) => value !== "")
  @IsUrl()
  websiteUrl?: string;

  @ApiProperty({
    description: 'LinkedIn URL of the company',
    required: false,
    example: 'https://linkedin.com/in/johndoe',
    type: String,
  })
  @IsOptional()
  @ValidateIf((obj, value) => value !== "")
  @IsUrl()
  linkedInUrl?: string;

  @ApiProperty({
    description: 'GitHub URL of the company',
    required: false,
    example: 'https://github.com/johndoe',
    type: String,
  })
  @IsOptional()
  @ValidateIf((obj, value) => value !== "")
  @IsUrl()
  githubUrl?: string;

  @ApiProperty({
    description: 'Facebook URL of the company',
    required: false,
    example: 'https://facebook.com/johndoe',
    type: String,
  })
  @IsOptional()
  @ValidateIf((obj, value) => value !== "")
  @IsUrl()
  facebookUrl?: string;

  @ApiProperty({
    description: 'Twitter URL of the company',
    required: false,
    example: 'https://twitter.com/johndoe',
    type: String,
  })
  @IsOptional()
  @ValidateIf((obj, value) => value !== "")
  @IsUrl()
  twitterUrl?: string;

  @ApiProperty({
    description: 'Discord URL of the company',
    required: false,
    example: 'https://discord.com/johndoe',
    type: String,
  })
  @IsOptional()
  @ValidateIf((obj, value) => value !== "")
  @IsUrl()
  discordUrl?: string;
}