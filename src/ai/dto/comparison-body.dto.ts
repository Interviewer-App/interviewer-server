import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class ComparisonBodyDto{
  @ApiProperty({
    description: 'Session ID 1',
    nullable: false,
    required: true,
    type: 'string',
    example: 'cm4quxjjs0003vuuc0arunrlf',
  })
  @IsString()
  @IsNotEmpty()
  sessionId1: string;

  @ApiProperty({
    description: 'Session ID 2',
    nullable: false,
    required: true,
    type: 'string',
    example: 'cm4quxjjs0003vuuc0arunrlf',
  })
  @IsString()
  @IsNotEmpty()
  sessionId2: string;
}