import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsIn, IsNotEmpty } from "class-validator";

export class TopCandidatesRequestDto {
  @ApiProperty({
    description: 'ID of the interview',
    example: 'cln3z8y8a0000qy5q1q1q1q1q',
  })
  @IsNotEmpty()
  @IsString()
  interviewId: string;

  @ApiProperty({
    description: 'ID of the category (optional if type is overall)',
    example: 'cln3z8y8a0000qy5q1q1q1q1q',
    required: false,
  })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiProperty({
    description: 'Number of top candidates to return',
    example: 5,
    required: false,
    default: 10,
  })
  @IsOptional()
  @IsNumber()
  limit?: number;

  @ApiProperty({
    description: 'Type of score to sort by (overall or category)',
    example: 'overall',
    enum: ['overall', 'category'],
    default: 'overall',
  })
  @IsOptional()
  @IsIn(['overall', 'category'])
  type?: 'overall' | 'category';
}

export class CandidateResponseDto {
  @ApiProperty({
    description: 'Candidate ID',
    example: 'cln3z8y8a0000qy5q1q1q1q1q',
  })
  candidateId: string;

  @ApiProperty({
    description: 'Candidate name',
    example: 'John Doe',
  })
  name: string;

  @ApiProperty({
    description: 'Candidate email',
    example: 'john.doe@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Score of the candidate',
    example: 95.5,
  })
  score: number;

  @ApiProperty({
    description: 'Session ID of the interview',
    example: 'cln3z8y8a0000qy5q1q1q1q1q',
  })
  sessionId: string;
}