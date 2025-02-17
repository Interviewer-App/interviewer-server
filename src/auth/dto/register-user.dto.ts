import { ApiProperty } from "@nestjs/swagger";
import { Role } from "@prisma/client";

import { IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength, NotContains } from "class-validator";


export class RegisterUserDto {

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
        description: "Password: Min 6 characters, 1 uppercase, 1 lowercase and 1 number",
        nullable: false,
        required: true,
        type: "string",
        example: "Password123",
    })
    @IsString()
    @MinLength(6)
    @MaxLength(16)
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
        message: 'Password must contain at least one uppercase, one lowercase and one number',
    })
    @NotContains(' ', { message: 'El password no debe contener espacios' }) 
    password: string;
    
    @ApiProperty({
        description: "Confirm Password, it must be the same as the password",
        nullable: false,
        required: true,
        type: "string",
        example: "Password123",
    })
    @IsString()
    passwordconf: string;
    

    // @ApiProperty({
    //     description: "User Avatar Image",
    //     nullable: true,
    //     required: false,
    //     type: "string",
    //     example: "https://picsum.photos/200/300",
    // })
    // @IsString()
    // @IsOptional()
    // image: string;
    
    @ApiProperty({
        description: "User Role (CAMPANY, CANDIDATE, ADMIN)",
        nullable: false,
        required: true,
        type: "string",
        example: "COMPANY",
    })
    @IsString()
    @IsOptional()
    role?: Role;


    @ApiProperty({
        description: "user provider account type",
        nullable: false,
        required: true,
        type: "string",
        // example: "Google",
    })
    @IsString()
    @IsOptional()
    provider?: string;

    @ApiProperty({
        description: "user provider account type",
        nullable: false,
        required: true,
        type: "string",
        // example: "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",
    })
    @IsString()
    @IsOptional()
    providerAccountId?: string;


    @ApiProperty({
        description: "Company Name",
        nullable: false,
        required: true,
        type: "string",
        example: "Coullax",
    })
    @IsString()
    @IsOptional()
    companyname?: string;
}
