import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  UpdateSharingSettingsDto,
  SharingSettingsDto,
} from './dto/sharing-settings.dto';

@Injectable()
export class SharingService {
  constructor(private prisma: PrismaService) {}

  async getSettings(userId: number): Promise<SharingSettingsDto> {
    let settings = await this.prisma.sharingSettings.findUnique({
      where: { userId },
    });

    // 설정이 없으면 기본값으로 생성
    if (!settings) {
      settings = await this.prisma.sharingSettings.create({
        data: {
          userId,
          shareLevel: 'busy_only',
          allowedUsers: [],
        },
      });
    }

    return this.toDto(settings);
  }

  async updateSettings(
    userId: number,
    updateSharingSettingsDto: UpdateSharingSettingsDto,
  ): Promise<SharingSettingsDto> {
    // privacyLevel 또는 shareLevel 중 하나 사용
    const shareLevel =
      updateSharingSettingsDto.privacyLevel ||
      updateSharingSettingsDto.shareLevel ||
      'busy_only';

    let settings = await this.prisma.sharingSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      settings = await this.prisma.sharingSettings.create({
        data: {
          userId,
          shareLevel,
          allowedUsers: updateSharingSettingsDto.allowedUsers || [],
        },
      });
    } else {
      settings = await this.prisma.sharingSettings.update({
        where: { userId },
        data: {
          shareLevel,
          allowedUsers: updateSharingSettingsDto.allowedUsers || [],
        },
      });
    }

    return this.toDto(settings);
  }

  async getCalendarDataByShareLevel(
    userId: number,
    requesterId: number,
  ): Promise<any> {
    const settings = await this.prisma.sharingSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      return null;
    }

    // 자신의 데이터면 전체 공개
    if (userId === requesterId) {
      return await this.prisma.calendarEvent.findMany({
        where: { userId },
      });
    }

    // 공유 범위 확인
    if (settings.shareLevel === 'busy_only') {
      // Busy 여부만 반환
      return await this.prisma.calendarEvent.findMany({
        where: { userId },
        select: {
          startTime: true,
          endTime: true,
          isBusy: true,
        },
      });
    }

    if (settings.shareLevel === 'basic_info') {
      // 제목과 시간 반환
      return await this.prisma.calendarEvent.findMany({
        where: { userId },
        select: {
          title: true,
          startTime: true,
          endTime: true,
          isBusy: true,
        },
      });
    }

    if (settings.shareLevel === 'full_details') {
      // 전체 정보 반환
      return await this.prisma.calendarEvent.findMany({
        where: { userId },
      });
    }

    return null;
  }

  async getUserSchedule(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const settings = await this.getSettings(userId);
    const events = await this.getPublicEvents(userId, settings.shareLevel);

    return {
      userId: user.id,
      userEmail: user.email,
      privacyLevel: settings.shareLevel,
      events,
    };
  }

  private async getPublicEvents(userId: number, shareLevel: string) {
    const now = new Date();

    if (shareLevel === 'busy_only') {
      const events = await this.prisma.calendarEvent.findMany({
        where: {
          userId,
          endTime: { gte: now },
        },
        select: {
          id: true,
          startTime: true,
          endTime: true,
          isBusy: true,
        },
        orderBy: { startTime: 'asc' },
      });

      return events.map((e) => ({
        id: e.id,
        startTime: e.startTime,
        endTime: e.endTime,
        isBusy: e.isBusy,
      }));
    }

    if (shareLevel === 'basic_info') {
      const events = await this.prisma.calendarEvent.findMany({
        where: {
          userId,
          endTime: { gte: now },
        },
        select: {
          id: true,
          title: true,
          startTime: true,
          endTime: true,
          isBusy: true,
        },
        orderBy: { startTime: 'asc' },
      });

      return events;
    }

    if (shareLevel === 'full_details') {
      const events = await this.prisma.calendarEvent.findMany({
        where: {
          userId,
          endTime: { gte: now },
        },
        orderBy: { startTime: 'asc' },
      });

      return events;
    }

    return [];
  }

  private toDto(settings: any): SharingSettingsDto {
    return {
      id: settings.id,
      userId: settings.userId,
      shareLevel: settings.shareLevel,
      allowedUsers: settings.allowedUsers,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt,
    };
  }
}
