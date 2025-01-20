// import { ApiProperty } from '@nestjs/swagger';
// import {
//     IsString,
//     IsOptional,
//     IsNotEmpty,
//     IsDateString,
//     IsEnum,
// } from "class-validator";
//
// export enum InterviewStatus {
//     DRAFT = "DRAFT",
//     ACTIVE = "ACTIVE",
//     COMPLETED = "COMPLETED",
//     ARCHIVED = "ARCHIVED",
//     PENDING = "PENDING",
// }
//
// export enum InterviewCategory {
//     Technical = "Technical",
//     Behavioural = "Behavioural"
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
//     @IsString()
//     companyID: string;
//
//     @ApiProperty({
//         description: "Job Title for the interview",
//         nullable: true,
//         required: false,
//         type: "string",
//         example: "Senior Software Engineer",
//     })
//     @IsNotEmpty()
//     @IsString()
//     jobTitle: string;
//
//     @ApiProperty({
//         description: "Job description for the interview",
//         nullable: true,
//         required: false,
//         type: "string",
//         example: "Looking for candidates with strong knowledge in Node.js and React.",
//     })
//     @IsOptional()
//     @IsString()
//     jobDescription?: string;
//
//     @ApiProperty({
//         description: "Interview Category",
//         nullable: false,
//         required: true,
//         enum: InterviewCategory,
//         example: InterviewCategory.Technical,
//     })
//     @IsNotEmpty()
//     @IsEnum(InterviewCategory)
//     interviewCategory: InterviewCategory;
//
//     @ApiProperty({
//         description: "Required skills for the interview",
//         nullable: true,
//         required: false,
//         type: "string",
//         example: "Node.js, React, TypeScript",
//     })
//     @IsOptional()
//     @IsString()
//     requiredSkills?: string;
//
//     @ApiProperty({
//         description: "Scheduled date of the interview",
//         nullable: false,
//         required: true,
//         type: "string",
//         format: "date-time",
//         example: "2024-12-01T10:00:00.000Z",
//     })
//     @IsNotEmpty()
//     @IsDateString()
//     scheduledDate: Date;
//
//     @ApiProperty({
//         description: "Scheduled date and time for the interview",
//         nullable: false,
//         required: true,
//         type: "string",
//         format: "date-time",
//         example: "2024-12-01T14:00:00.000Z",
//     })
//     @IsNotEmpty()
//     @IsDateString()
//     scheduledAt: Date;
//
//     @ApiProperty({
//         description: "Status of the interview",
//         nullable: false,
//         required: true,
//         enum: InterviewStatus,
//         example: "DRAFT",
//     })
//     @IsNotEmpty()
//     @IsEnum(InterviewStatus)
//     status: InterviewStatus;
// }
import { ApiProperty } from '@nestjs/swagger';
import {
    IsString,
    IsOptional,
    IsNotEmpty,
    IsDateString,
    IsEnum,
    IsArray,
    ValidateNested,
    IsInt,
    Min,
    Max,
} from "class-validator";
import { Type } from 'class-transformer';

export enum InterviewStatus {
    DRAFT = "DRAFT",
    ACTIVE = "ACTIVE",
    COMPLETED = "COMPLETED",
    ARCHIVED = "ARCHIVED",
    PENDING = "PENDING",
}

export enum InterviewCategory {
    Technical = "Technical",
    Behavioural = "Behavioural"
}

export class CategoryAssignmentDto {
    @ApiProperty({
        description: "Category ID",
        nullable: false,
        required: true,
        type: "string",
        example: "cl4quxjjs0003vuuc0arunrlf",
    })
    @IsString()
    @IsNotEmpty()
    categoryId: string;

    @ApiProperty({
        description: "Percentage assigned to this category",
        nullable: false,
        required: true,
        type: "number",
        example: 50,
    })
    @IsInt()
    @Min(1)
    @Max(100)
    percentage: number;
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
        description: "Interview Category",
        nullable: false,
        required: true,
        enum: InterviewCategory,
        example: InterviewCategory.Technical,
    })
    @IsNotEmpty()
    @IsEnum(InterviewCategory)
    interviewCategory: InterviewCategory;

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
        description: "Start date of the interview",
        nullable: false,
        required: true,
        type: "string",
        format: "date-time",
        example: "2024-12-01T10:00:00.000Z",
    })
    @IsNotEmpty()
    @IsDateString()
    startDate: Date;

    @ApiProperty({
        description: "End date for the interview",
        nullable: false,
        required: true,
        type: "string",
        format: "date-time",
        example: "2024-12-01T14:00:00.000Z",
    })
    @IsNotEmpty()
    @IsDateString()
    endDate: Date;

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

    @ApiProperty({
        description: "Category assignments for the interview",
        nullable: false,
        required: true,
        type: [CategoryAssignmentDto],
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CategoryAssignmentDto)
    categoryAssignments: CategoryAssignmentDto[];
}