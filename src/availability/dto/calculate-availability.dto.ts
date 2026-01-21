import { IsString, IsArray, IsDateString } from 'class-validator';

export class CalculateAvailabilityDto {
  @IsString()
  readonly meetingId: string;

  @IsArray()
  readonly participantIds: number[];

  @IsDateString()
  readonly startDate: string;

  @IsDateString()
  readonly endDate: string;

  @IsString()
  readonly timezone?: string;
}

export class TimeSlot {
  startTime: Date;
  endTime: Date;
  availability: number; // 0-1, 1이 모두 가능
}

export class AvailabilityDto {
  meetingId: string;
  timeSlots: TimeSlot[];
  participantCount: number;
}
