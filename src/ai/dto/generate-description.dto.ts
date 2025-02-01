import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class GenerateDescriptionDto{
  @ApiProperty({
    description: 'Users description',
    example: 'I want to interview for a Software Engineer position to handle new Application',
    nullable: false,
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  description: string;
}