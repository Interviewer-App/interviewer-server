import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class DailySession {
  @ApiProperty({
    description: 'Session start time (HH:mm format)',
    example: '09:00',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({
    description: 'Session end time (HH:mm format)',
    example: '17:00',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  endTime: string;

  @ApiProperty({
    description: 'Interval between sessions in minutes',
    example: 30,
    required: true,
  })
  @IsNumber()
  @IsNotEmpty()
  intervalMinutes: number;
}

export class GenerateSchedulesDto {
  @ApiProperty({
    description: 'Duration of interview slots in minutes',
    example: 60,
    required: true,
  })
  @IsNumber()
  @IsNotEmpty()
  duration: number;

  @ApiProperty({
    description: 'Start date of availability range (ISO format)',
    example: '2024-12-01T00:00:00.000Z',
    required: true,
  })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({
    description: 'End date of availability range (ISO format)',
    example: '2024-12-07T00:00:00.000Z',
    required: true,
  })
  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @ApiProperty({
    description: 'Slots of Daily Interview Sessions Conduct',
    example: [
      {
        startTime: '09:00',
        endTime: '12:00',
        intervalMinutes: 30,
      },
      {
        startTime: '13:00',
        endTime: '17:00',
        intervalMinutes: 30,
      },
    ],
    required: true,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DailySession)
  dailySessions: DailySession[];

  @ApiProperty({
    description: 'Dates with no availability (ISO date strings)',
    // example: ['2024-12-25', '2024-12-31'],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  nonWorkingDates?: string[];
}