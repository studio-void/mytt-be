import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleAuthService } from '../auth/google/google.service';
import { SyncCalendarDto, CalendarEventDto } from './dto/sync-calendar.dto';
import { google } from 'googleapis';

@Injectable()
export class CalendarService {
  private calendar = google.calendar('v3');

  constructor(
    private prisma: PrismaService,
    private googleAuthService: GoogleAuthService,
  ) {}

  async syncCalendarEvents(userId: number): Promise<CalendarEventDto[]> {
    const accessToken = await this.googleAuthService.getAccessToken(userId);

    if (!accessToken) {
      throw new Error(
        'Google Calendar access token expired or not available. Please login again to continue.',
      );
    }

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    try {
      const response = await this.calendar.events.list({
        calendarId: 'primary',
        auth,
        maxResults: 100,
        timeMin: new Date().toISOString(),
        orderBy: 'startTime',
        singleEvents: true,
      });

      const events = response.data.items || [];

      // 데이터베이스에 저장
      const savedEvents: CalendarEventDto[] = [];

      for (const event of events) {
        const calendarEvent = await this.prisma.calendarEvent.upsert({
          where: {
            userId_googleEventId: {
              userId,
              googleEventId: event.id || '',
            },
          },
          update: {
            title: event.summary || 'Untitled',
            description: event.description || null,
            startTime: new Date(
              event.start?.dateTime || event.start?.date || '',
            ),
            endTime: new Date(event.end?.dateTime || event.end?.date || ''),
            isAllDay: !event.start?.dateTime,
            isBusy: event.transparency !== 'transparent',
            syncedAt: new Date(),
          },
          create: {
            userId,
            googleEventId: event.id || '',
            title: event.summary || 'Untitled',
            description: event.description || null,
            startTime: new Date(
              event.start?.dateTime || event.start?.date || '',
            ),
            endTime: new Date(event.end?.dateTime || event.end?.date || ''),
            isAllDay: !event.start?.dateTime,
            isBusy: event.transparency !== 'transparent',
          },
        });

        savedEvents.push(this.toDto(calendarEvent));
      }

      return savedEvents;
    } catch (error) {
      console.error('Error syncing calendar events:', error);
      throw new Error('Failed to sync calendar events');
    }
  }

  async getCalendarEvents(
    userId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<CalendarEventDto[]> {
    const events = await this.prisma.calendarEvent.findMany({
      where: {
        userId,
        startTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    return events.map((event) => this.toDto(event));
  }

  async getCalendarEvent(eventId: string): Promise<CalendarEventDto | null> {
    const event = await this.prisma.calendarEvent.findUnique({
      where: { id: eventId },
    });

    return event ? this.toDto(event) : null;
  }

  async deleteCalendarEvent(eventId: string, userId: number): Promise<void> {
    const event = await this.prisma.calendarEvent.findFirst({
      where: {
        id: eventId,
        userId,
      },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    await this.prisma.calendarEvent.delete({
      where: { id: eventId },
    });
  }

  private toDto(event: any): CalendarEventDto {
    return {
      id: event.id,
      userId: event.userId,
      googleEventId: event.googleEventId,
      title: event.title,
      description: event.description,
      startTime: event.startTime,
      endTime: event.endTime,
      isAllDay: event.isAllDay,
      isBusy: event.isBusy,
      syncedAt: event.syncedAt,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    };
  }
}
