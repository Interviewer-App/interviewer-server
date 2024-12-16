import { ApiProperty } from '@nestjs/swagger';
import {
    IsString,
    IsOptional,
    IsNotEmpty,
    IsInt,
    Min,
    IsJSON,
    IsEnum,
} from "class-validator";

export enum InterviewStatus {
    DRAFT = "DRAFT",
    PUBLISHED = "PUBLISHED",
    COMPLETED = "COMPLETED",
}

export class CreateInterviewDto {

    @ApiProperty({
        description: "Company ID",
        nullable: false,
        required: true,
        type: "string",
        example: "cm4quxjjs0003vuuc0arunrlf",
    })
    @IsString()
    @IsNotEmpty()
    companyId: string;

    @ApiProperty({
        description: "Title of the interview",
        nullable: false,
        required: true,
        type: "string",
        example: "Senior Engineer Interview",
    })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty({
        description: "Description of the interview",
        nullable: true,
        required: false,
        type: "string",
        example: "An interview for senior software engineering candidates.",
    })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({
        description: "Questions in JSON format",
        nullable: false,
        required: true,
        type: "array",
        example: [
            { question: "What is a binary tree?", type: "open-ended" },
            { question: "Solve this coding challenge.", type: "coding" },
        ],
    })
    
    @IsNotEmpty()
    questions: Array<{ question: string; type: string }>;;

    @ApiProperty({
        description: "Duration of the interview in minutes",
        nullable: false,
        required: true,
        type: "number",
        example: 60,
    })
    @IsInt()
    @Min(1)
    duration: number;

    @ApiProperty({
        description: "Status of the interview",
        nullable: false,
        required: true,
        type: "string",
        example: "DRAFT",
    })
    @IsString()
    status:  "DRAFT" | "PUBLISHED" | "COMPLETED";

};