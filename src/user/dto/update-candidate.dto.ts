import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUrl,
  IsDateString,
  IsPhoneNumber,
} from 'class-validator';

export class UpdateCandidateDto {
  @ApiProperty({
    description: 'First name of the user',
    required: false,
    example: 'John',
    type: String,
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({
    description: 'Last name of the user',
    required: false,
    example: 'Doe',
    type: String,
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({
    description: 'Username of the user',
    required: false,
    example: 'johndoe123',
    type: String,
  })
  @IsOptional()
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
  @IsDateString()
  dob?: string;

  @ApiProperty({
    description: 'Gender of the user',
    required: false,
    example: 'Male',
    type: String,
  })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiProperty({
    description: 'Contact number of the user',
    required: false,
    example: '+1234567890',
    type: String,
  })
  @IsOptional()
  @IsPhoneNumber()
  contactNo?: string;

  @ApiProperty({
    description: 'Skill highlights of the candidate',
    required: false,
    example: 'JavaScript, Node.js, React',
    type: String,
  })
  @IsOptional()
  @IsString()
  skillHighlights?: string;

  @ApiProperty({
    description: 'Experience of the candidate',
    required: false,
    example: '5 years of experience in web development',
    type: String,
  })
  @IsOptional()
  @IsString()
  experience?: string;

  @ApiProperty({
    description: 'Availability of the candidate',
    required: false,
    example: 'Immediately',
    type: String,
  })
  @IsOptional()
  @IsString()
  availability?: string;

  @ApiProperty({
    description: 'Resume URL of the candidate',
    required: false,
    example: 'https://example.com/resume.pdf',
    type: String,
  })
  @IsOptional()
  @IsUrl()
  resumeURL?: string;

  @ApiProperty({
    description: 'LinkedIn URL of the candidate',
    required: false,
    example: 'https://linkedin.com/in/johndoe',
    type: String,
  })
  @IsOptional()
  @IsUrl()
  linkedInUrl?: string;

  @ApiProperty({
    description: 'GitHub URL of the candidate',
    required: false,
    example: 'https://github.com/johndoe',
    type: String,
  })
  @IsOptional()
  @IsUrl()
  githubUrl?: string;

  @ApiProperty({
    description: 'Facebook URL of the candidate',
    required: false,
    example: 'https://facebook.com/johndoe',
    type: String,
  })
  @IsOptional()
  @IsUrl()
  facebookUrl?: string;

  @ApiProperty({
    description: 'Twitter URL of the candidate',
    required: false,
    example: 'https://twitter.com/johndoe',
    type: String,
  })
  @IsOptional()
  @IsUrl()
  twitterUrl?: string;

  @ApiProperty({
    description: 'Discord URL of the candidate',
    required: false,
    example: 'https://discord.com/johndoe',
    type: String,
  })
  @IsOptional()
  @IsUrl()
  discordUrl?: string;
}