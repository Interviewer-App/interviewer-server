import { IsString } from 'class-validator';

export class CreateFeedbackDto {
  @IsString()
  feedbackText: string;
}