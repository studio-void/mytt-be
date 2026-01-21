import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateMeetingDto,
  JoinMeetingDto,
  MeetingDto,
  MeetingDetailDto,
} from './dto/create-meeting.dto';

@Injectable()
export class MeetingService {
  constructor(private prisma: PrismaService) {}

  async createMeeting(
    userId: number,
    createMeetingDto: CreateMeetingDto,
  ): Promise<MeetingDto> {
    const inviteCode = this.generateInviteCode();

    const meeting = await this.prisma.meeting.create({
      data: {
        creatorId: userId,
        title: createMeetingDto.title,
        description: createMeetingDto.description,
        inviteCode,
        startTime: new Date(createMeetingDto.startTime),
        endTime: new Date(createMeetingDto.endTime),
        timezone: createMeetingDto.timezone || 'UTC',
        participants: {
          create: {
            userId,
            status: 'accepted',
          },
        },
      },
    });

    return this.toDto(meeting);
  }

  async joinMeeting(
    userId: number,
    joinMeetingDto: JoinMeetingDto,
  ): Promise<MeetingDetailDto> {
    const meeting = await this.prisma.meeting.findUnique({
      where: { inviteCode: joinMeetingDto.inviteCode },
      include: { participants: true },
    });

    if (!meeting) {
      throw new Error('Meeting not found');
    }

    // 이미 참여했는지 확인
    const existingParticipant = meeting.participants.find(
      (p) => p.userId === userId,
    );

    if (!existingParticipant) {
      await this.prisma.meetingParticipant.create({
        data: {
          meetingId: meeting.id,
          userId,
          status: 'pending',
        },
      });
    }

    return this.toDetailDto(meeting);
  }

  async getMeetingDetail(meetingId: string): Promise<MeetingDetailDto> {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
      include: { participants: true },
    });

    if (!meeting) {
      throw new Error('Meeting not found');
    }

    return this.toDetailDto(meeting);
  }

  async getMeetingByCode(inviteCode: string): Promise<MeetingDetailDto> {
    const meeting = await this.prisma.meeting.findUnique({
      where: { inviteCode },
      include: { participants: true },
    });

    if (!meeting) {
      throw new Error('Meeting not found');
    }

    return this.toDetailDto(meeting);
  }

  async updateParticipantStatus(
    meetingId: string,
    userId: number,
    status: string,
  ): Promise<void> {
    await this.prisma.meetingParticipant.update({
      where: {
        meetingId_userId: {
          meetingId,
          userId,
        },
      },
      data: { status },
    });
  }

  async joinMeetingByCode(
    userId: number,
    inviteCode: string,
  ): Promise<MeetingDetailDto> {
    const meeting = await this.prisma.meeting.findUnique({
      where: { inviteCode },
      include: { participants: true },
    });

    if (!meeting) {
      throw new Error('Meeting not found');
    }

    // 이미 참여했는지 확인
    const existingParticipant = meeting.participants.find(
      (p) => p.userId === userId,
    );

    if (!existingParticipant) {
      await this.prisma.meetingParticipant.create({
        data: {
          meetingId: meeting.id,
          userId,
          status: 'accepted',
        },
      });
    }

    return this.toDetailDto(meeting);
  }

  async getMeetingParticipants(inviteCode: string) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { inviteCode },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!meeting) {
      throw new Error('Meeting not found');
    }

    return meeting.participants
      .filter((p) => p.user !== null)
      .map((p) => ({
        userId: p.userId,
        email: p.user!.email,
        status: p.status,
      }));
  }

  async getMeetingAvailability(inviteCode: string) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { inviteCode },
      include: {
        participants: {
          include: {
            user: {
              include: {
                calendarEvents: {
                  where: {
                    startTime: { gte: new Date() },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!meeting) {
      throw new Error('Meeting not found');
    }

    // 모든 참가자의 바쁜 시간대 수집
    const busySlots = meeting.participants
      .filter((p) => p.user !== null && p.userId !== null)
      .flatMap((p) =>
        p
          .user!.calendarEvents.filter((event) => event.isBusy)
          .map((event) => ({
            userId: p.userId!,
            startTime: event.startTime,
            endTime: event.endTime,
          })),
      );

    // 시간대별 가용성 계산 (예: 오전 9시 ~ 오후 6시, 30분 단위)
    const availabilitySlots = this.calculateAvailabilitySlots(
      meeting.startTime,
      meeting.endTime,
      busySlots,
      meeting.participants.length,
    );

    return {
      meetingId: meeting.id,
      participantCount: meeting.participants.length,
      busySlots,
      availabilitySlots,
    };
  }

  private calculateAvailabilitySlots(
    startTime: Date,
    endTime: Date,
    busySlots: Array<{ userId: number; startTime: Date; endTime: Date }>,
    participantCount: number,
  ): Array<{
    startTime: Date;
    endTime: Date;
    availableCount: number;
    availability: number;
    isOptimal: boolean;
  }> {
    const slots: Array<{
      startTime: Date;
      endTime: Date;
      availableCount: number;
      availability: number;
      isOptimal: boolean;
    }> = [];
    const current = new Date(startTime);
    const slotDuration = 30; // 30분 단위

    while (current < endTime) {
      const slotEnd = new Date(current.getTime() + slotDuration * 60000);
      if (slotEnd > endTime) break;

      // 이 시간대에 바쁜 사람 수 계산
      const busyCount = new Set(
        busySlots
          .filter((busy) => current < busy.endTime && slotEnd > busy.startTime)
          .map((busy) => busy.userId),
      ).size;

      const availableCount = participantCount - busyCount;

      slots.push({
        startTime: new Date(current),
        endTime: new Date(slotEnd),
        availableCount,
        availability: availableCount / participantCount,
        isOptimal: availableCount === participantCount,
      });

      current.setMinutes(current.getMinutes() + slotDuration);
    }

    // 가용성 높은 순으로 정렬
    return slots.sort((a, b) => b.availability - a.availability);
  }

  private generateInviteCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  private toDto(meeting: any): MeetingDto {
    return {
      id: meeting.id,
      creatorId: meeting.creatorId,
      title: meeting.title,
      description: meeting.description,
      inviteCode: meeting.inviteCode,
      startTime: meeting.startTime,
      endTime: meeting.endTime,
      timezone: meeting.timezone,
      createdAt: meeting.createdAt,
      updatedAt: meeting.updatedAt,
    };
  }

  private toDetailDto(meeting: any): MeetingDetailDto {
    return {
      ...this.toDto(meeting),
      participants: meeting.participants.map((p: any) => ({
        id: p.id,
        email: p.email,
        status: p.status,
      })),
    };
  }
}
