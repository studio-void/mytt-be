import {
  IsString,
  IsDateString,
  IsOptional,
  IsArray,
  IsEmail,
} from 'class-validator';

export class CreateMeetingDto {
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
  @IsString()
  readonly timezone?: string;

  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  readonly participants?: string[];
}

export class JoinMeetingDto {
  @IsString()
  readonly inviteCode: string;

  @IsOptional()
  @IsString()
  readonly email?: string;
}

export class MeetingDto {
  id: string;
  creatorId: number;
  title: string;
  description: string | null;
  inviteCode: string;
  startTime: Date;
  endTime: Date;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

export class MeetingDetailDto extends MeetingDto {
  participants: Array<{
    id: string;
    email: string | null;
    status: string;
  }>;
}
