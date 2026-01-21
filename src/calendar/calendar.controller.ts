import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';

interface AuthRequest extends Request {
  user?: { id: number };
}

@Controller('calendar')
@UseGuards(JwtAuthGuard)
export class CalendarController {
  constructor(private calendarService: CalendarService) {}

  @Post('sync')
  async syncCalendar(@Request() req: AuthRequest) {
    const userId = req.user?.id;
    if (!userId) {
      return { error: 'Unauthorized' };
    }

    try {
      const events = await this.calendarService.syncCalendarEvents(userId);
      return { data: events, message: 'Calendar synced successfully' };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to sync calendar';
      return { error: message, success: false };
    }
  }

  @Get('events')
  async getEvents(
    @Request() req: AuthRequest,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      return { error: 'Unauthorized' };
    }

    try {
      const events = await this.calendarService.getCalendarEvents(
        userId,
        new Date(startDate),
        new Date(endDate),
      );
      return { data: events };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to fetch calendar events';
      return { error: message, success: false };
    }
  }

  @Get('events/:eventId')
  async getEvent(
    @Request() req: AuthRequest,
    @Param('eventId') eventId: string,
  ) {
    const event = await this.calendarService.getCalendarEvent(eventId);
    return { data: event };
  }

  @Delete('events/:eventId')
  async deleteEvent(
    @Request() req: AuthRequest,
    @Param('eventId') eventId: string,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      return { error: 'Unauthorized' };
    }

    await this.calendarService.deleteCalendarEvent(eventId, userId);
    return { message: 'Event deleted successfully' };
  }
}
