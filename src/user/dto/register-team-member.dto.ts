import { ApiProperty } from "@nestjs/swagger";
import { Role, TeamRole } from "@prisma/client";

import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  NotContains
} from "class-validator";
import { InterviewCategory } from "../../interview-session/dto/create-interview-session.dto";


export class RegisterTeamMemberDto {

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
    description: "Company Id",
    nullable: false,
    required: true,
    type: "string",
    example: "dkjfndmWPOD092ZDCDVJ2O",
  })
  @IsString()
  @IsOptional()
  companyId: string;

  @ApiProperty({
    description: "Team Role of the Company",
    nullable: false,
    required: true,
    enum: TeamRole,
    example: TeamRole.HIRING_MANAGER,
  })
  @IsEnum(TeamRole)
  @IsNotEmpty()
  teamRole: TeamRole;

}
