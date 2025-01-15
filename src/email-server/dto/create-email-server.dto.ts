import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsEmail
} from "class-validator";


export class CreateEmailServerDto {
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
      description: "Subject",
      nullable: false,
      required: true,
      type: "string",
      example: "This is the test subject",
    })
  @IsString({ message: 'Subject must be a string' })
  @IsNotEmpty({ message: 'Subject is required' })
  subject: string;

    @ApiProperty({
      description: "Body",
      nullable: false,
      required: true,
      type: "string",
      example: "This is the test body",
    })
  @IsString({ message: 'Body must be a string' })
  @IsNotEmpty({ message: 'Body is required' })
  body: string;
}