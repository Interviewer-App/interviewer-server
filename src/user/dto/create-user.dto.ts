import { ApiProperty } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { IsOptional, IsString } from "class-validator";

import { RegisterUserDto } from "src/auth/dto/register-user.dto";

export class CreateUserDto extends RegisterUserDto {
    @ApiProperty({
        description: "User Role (CAMPANY, CANDIDATE, ADMIN)",
        default: "user",
        type: "string",
        example: "CANDIDATE",
    })
    @IsString()
    @IsOptional()
    role?: Role;

}
