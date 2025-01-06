// import { ApiProperty } from '@nestjs/swagger';
// import {
//     IsString,
//     IsOptional,
//     IsNotEmpty,
//     IsInt,
//     Min,
//     IsJSON,
//     IsEnum,
// } from "class-validator";
//
// export enum InterviewStatus {
//     DRAFT = "DRAFT",
//     PUBLISHED = "PUBLISHED",
//     COMPLETED = "COMPLETED",
// }
//
// export class CreateInterviewDto {
//
//     @ApiProperty({
//         description: "Company ID",
//         nullable: false,
//         required: true,
//         type: "string",
//         example: "cm4quxjjs0003vuuc0arunrlf",
//     })
//     @IsNotEmpty()
//     companyId: string;
//
//     @ApiProperty({
//         description: "Title of the interview",
//         nullable: false,
//         required: true,
//         type: "string",
//         example: "Senior Engineer Interview",
//     })
//     @IsString()
//     @IsNotEmpty()
//     title: string;
//
//     @ApiProperty({
//         description: "Description of the interview",
//         nullable: true,
//         required: false,
//         type: "string",
//         example: "An interview for senior software engineering candidates.",
//     })
//     @IsString()
//     @IsOptional()
//     description?: string;
//
//     @ApiProperty({
//         description: "Questions in JSON format",
//         nullable: false,
//         required: true,
//         type: "array",
//         example: [
//             { question: "What is a binary tree?", type: "open-ended" },
//             { question: "Solve this coding challenge.", type: "coding" },
//         ],
//     })
//
//     @IsNotEmpty()
//     questions: Array<{ question: string; type: string }>;
//
//     @ApiProperty({
//         description: "Duration of the interview in minutes",
//         nullable: false,
//         required: true,
//         type: "number",
//         example: 60,
//     })
//     @IsInt()
//     @Min(1)
//     duration: number;
//
//     @ApiProperty({
//         description: "Status of the interview",
//         nullable: false,
//         required: true,
//         type: "string",
//         example: "DRAFT",
//     })
//     @IsString()
//     status:  "DRAFT" | "ACTIVE" | "COMPLETED" | 'ARCHIVED' | "PENDING";
//
// };

import { ApiProperty } from '@nestjs/swagger';
import {
    IsString,
    IsOptional,
    IsNotEmpty,
    IsDateString,
    IsEnum,
} from "class-validator";

export enum InterviewStatus {
    DRAFT = "DRAFT",
    ACTIVE = "ACTIVE",
    COMPLETED = "COMPLETED",
    ARCHIVED = "ARCHIVED",
    PENDING = "PENDING",
}

export class CreateInterviewDto {

    @ApiProperty({
        description: "Company ID",
        nullable: false,
        required: true,
        type: "string",
        example: "cm4quxjjs0003vuuc0arunrlf",
    })
    @IsNotEmpty()
    @IsString()
    companyID: string;

    @ApiProperty({
        description: "Job Title for the interview",
        nullable: true,
        required: false,
        type: "string",
        example: "Senior Software Engineer",
    })
    @IsNotEmpty()
    @IsString()
    jobTitle: string;

    @ApiProperty({
        description: "Job description for the interview",
        nullable: true,
        required: false,
        type: "string",
        example: "Looking for candidates with strong knowledge in Node.js and React.",
    })
    @IsOptional()
    @IsString()
    jobDescription?: string;

    @ApiProperty({
        description: "Required skills for the interview",
        nullable: true,
        required: false,
        type: "string",
        example: "Node.js, React, TypeScript",
    })
    @IsOptional()
    @IsString()
    requiredSkills?: string;

    @ApiProperty({
        description: "Scheduled date of the interview",
        nullable: false,
        required: true,
        type: "string",
        format: "date-time",
        example: "2024-12-01T10:00:00.000Z",
    })
    @IsNotEmpty()
    @IsDateString()
    scheduledDate: Date;

    @ApiProperty({
        description: "Scheduled date and time for the interview",
        nullable: false,
        required: true,
        type: "string",
        format: "date-time",
        example: "2024-12-01T14:00:00.000Z",
    })
    @IsNotEmpty()
    @IsDateString()
    scheduledAt: Date;

    @ApiProperty({
        description: "Status of the interview",
        nullable: false,
        required: true,
        enum: InterviewStatus,
        example: "DRAFT",
    })
    @IsNotEmpty()
    @IsEnum(InterviewStatus)
    status: InterviewStatus;
}
