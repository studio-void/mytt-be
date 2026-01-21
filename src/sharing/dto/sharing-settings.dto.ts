import { IsString, IsArray, IsOptional, IsIn } from 'class-validator';

export class UpdateSharingSettingsDto {
  @IsString()
  @IsIn(['busy_only', 'basic_info', 'full_details'])
  readonly privacyLevel?: string; // 프론트엔드에서 privacyLevel로 보냄

  @IsString()
  @IsIn(['busy_only', 'basic_info', 'full_details'])
  readonly shareLevel?: string; // 백엔드 호환성

  @IsOptional()
  @IsArray()
  readonly allowedUsers?: string[];
}

export class SharingSettingsDto {
  id: string;
  userId: number;
  shareLevel: string;
  allowedUsers: string[];
  createdAt: Date;
  updatedAt: Date;
}
