import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CalculateAvailabilityDto,
  TimeSlot,
  AvailabilityDto,
} from './dto/calculate-availability.dto';

@Injectable()
export class AvailabilityService {
  constructor(private prisma: PrismaService) {}

  async calculateAvailability(
    calculateAvailabilityDto: CalculateAvailabilityDto,
  ): Promise<AvailabilityDto> {
    const { meetingId, participantIds, startDate, endDate } =
      calculateAvailabilityDto;

    const start = new Date(startDate);
    const end = new Date(endDate);

    // 모든 참여자의 캘린더 이벤트 가져오기
    const allEvents = await this.prisma.calendarEvent.findMany({
      where: {
        userId: { in: participantIds },
        startTime: { gte: start },
        endTime: { lte: end },
      },
    });

    // 모든 참여자의 불가능 시간 가져오기
    const unavailableTimes = await this.prisma.unavailableTime.findMany({
      where: {
        userId: { in: participantIds },
        startTime: { gte: start },
        endTime: { lte: end },
      },
    });

    // 30분 단위 슬롯으로 분할
    const timeSlots = this.generateTimeSlots(start, end);

    // 각 슬롯의 가용성 계산
    const availabilitySlots: TimeSlot[] = timeSlots.map((slot) => {
      let availableCount = 0;

      for (const participantId of participantIds) {
        const hasConflict = allEvents.some(
          (event) =>
            event.userId === participantId &&
            event.isBusy &&
            this.hasTimeOverlap(slot, event),
        );

        const hasUnavailable = unavailableTimes.some(
          (unavailable) =>
            unavailable.userId === participantId &&
            this.hasTimeOverlap(slot, unavailable),
        );

        if (!hasConflict && !hasUnavailable) {
          availableCount++;
        }
      }

      return {
        startTime: slot.startTime,
        endTime: slot.endTime,
        availability: availableCount / participantIds.length,
      };
    });

    return {
      meetingId,
      timeSlots: availabilitySlots,
      participantCount: participantIds.length,
    };
  }

  private generateTimeSlots(
    start: Date,
    end: Date,
    intervalMinutes: number = 30,
  ): Array<{ startTime: Date; endTime: Date }> {
    const slots: Array<{ startTime: Date; endTime: Date }> = [];
    const current = new Date(start);

    while (current < end) {
      const slotEnd = new Date(current.getTime() + intervalMinutes * 60000);
      if (slotEnd > end) break;

      slots.push({
        startTime: new Date(current),
        endTime: new Date(slotEnd),
      });

      current.setMinutes(current.getMinutes() + intervalMinutes);
    }

    return slots;
  }

  private hasTimeOverlap(
    slot: { startTime: Date; endTime: Date },
    event: any,
  ): boolean {
    return slot.startTime < event.endTime && slot.endTime > event.startTime;
  }
}
