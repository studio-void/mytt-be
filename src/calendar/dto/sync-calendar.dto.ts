import { IsString, IsDateString, IsBoolean, IsOptional } from 'class-validator';

export class SyncCalendarDto {
  @IsString()
  readonly googleEventId: string;

  @IsString()
  readonly title: string;

  @IsOptional()
  @IsString()
  readonly description?: string;

  @IsDateString()
  readonly startTime: string;

  @IsDateString()
  readonly endTime: string;

  @IsOptional()
  @IsBoolean()
  readonly isAllDay?: boolean;

  @IsOptional()
  @IsBoolean()
  readonly isBusy?: boolean;
}

export class CalendarEventDto {
  id: string;
  userId: number;
  googleEventId: string;
  title: string;
  description: string | null;
  startTime: Date;
  endTime: Date;
  isAllDay: boolean;
  isBusy: boolean;
  syncedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
