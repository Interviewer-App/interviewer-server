import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsEmail
} from "class-validator";


export class EmailInvitationDto {
  @ApiProperty({
    description: "Email",
    nullable: false,
    required: true,
    type: "string",
    example: "test@gmail.com",
  })
  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty({ message: 'Recipient email (to) is required' })
  to: string;

  @ApiProperty({
    description: "Interview Id",
    nullable: false,
    required: true,
    type: "string",
    example: "skjdn893hduifbfybdh982",
  })
  @IsString({ message: 'Interview Id must be a string' })
  @IsNotEmpty({ message: 'Interview Id is required' })
  interviewId: string;

}