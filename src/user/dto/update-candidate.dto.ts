import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUrl,
  IsDateString,
  IsPhoneNumber,
  ValidateIf,
} from 'class-validator';

export class UpdateCandidateDto {
  @ApiProperty({
    description: 'First name of the user',
    required: false,
    example: 'John',
    type: String,
  })
  @IsOptional()
  @ValidateIf((obj, value) => value !== "")
  @IsString()
  firstName?: string;

  @ApiProperty({
    description: 'Last name of the user',
    required: false,
    example: 'Doe',
    type: String,
  })
  @IsOptional()
  @ValidateIf((obj, value) => value !== "")
  @IsString()
  lastName?: string;

  @ApiProperty({
    description: 'Username of the user',
    required: false,
    example: 'johndoe123',
    type: String,
  })
  @IsOptional()
  @ValidateIf((obj, value) => value !== "")
  @IsString()
  username?: string;

  @ApiProperty({
    description: 'Date of birth of the user',
    required: false,
    type: "string",
    format: "date-time",
    example: "2000-12-31T12:00:00Z",
  })
  @IsOptional()
  @ValidateIf((obj, value) => value !== "")
  @IsDateString()
  dob?: string;

  @ApiProperty({
    description: 'Gender of the user',
    required: false,
    example: 'Male',
    type: String,
  })
  @IsOptional()
  @ValidateIf((obj, value) => value !== "")
  @IsString()
  gender?: string;

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
    description: 'Skill highlights of the candidate',
    required: false,
    example: 'JavaScript, Node.js, React',
    type: String,
  })
  @IsOptional()
  @ValidateIf((obj, value) => value !== "")
  @IsString()
  skillHighlights?: string;

  @ApiProperty({
    description: 'Experience of the candidate',
    required: false,
    example: '5 years of experience in web development',
    type: String,
  })
  @IsOptional()
  @ValidateIf((obj, value) => value !== "")
  @IsString()
  experience?: string;

  @ApiProperty({
    description: 'Availability of the candidate',
    required: false,
    example: 'Immediately',
    type: String,
  })
  @IsOptional()
  @ValidateIf((obj, value) => value !== "")
  @IsString()
  availability?: string;

  @ApiProperty({
    description: 'Resume URL of the candidate',
    required: false,
    example: 'https://example.com/resume.pdf',
    type: String,
  })
  @IsOptional()
  @ValidateIf((obj, value) => value !== "")
  @IsUrl()
  resumeURL?: string;

  @ApiProperty({
    description: 'LinkedIn URL of the candidate',
    required: false,
    example: 'https://linkedin.com/in/johndoe',
    type: String,
  })
  @IsOptional()
  @ValidateIf((obj, value) => value !== "")
  @IsUrl()
  linkedInUrl?: string;

  @ApiProperty({
    description: 'GitHub URL of the candidate',
    required: false,
    example: 'https://github.com/johndoe',
    type: String,
  })
  @IsOptional()
  @ValidateIf((obj, value) => value !== "")
  @IsUrl()
  githubUrl?: string;

  @ApiProperty({
    description: 'Facebook URL of the candidate',
    required: false,
    example: 'https://facebook.com/johndoe',
    type: String,
  })
  @IsOptional()
  @ValidateIf((obj, value) => value !== "")
  @IsUrl()
  facebookUrl?: string;

  @ApiProperty({
    description: 'Twitter URL of the candidate',
    required: false,
    example: 'https://twitter.com/johndoe',
    type: String,
  })
  @IsOptional()
  @ValidateIf((obj, value) => value !== "")
  @IsUrl()
  twitterUrl?: string;

  @ApiProperty({
    description: 'Discord URL of the candidate',
    required: false,
    example: 'https://discord.com/johndoe',
    type: String,
  })
  @IsOptional()
  @ValidateIf((obj, value) => value !== "")
  @IsUrl()
  discordUrl?: string;
}