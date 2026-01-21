import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { MeetingService } from './meeting.service';
import { CreateMeetingDto, JoinMeetingDto } from './dto/create-meeting.dto';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';

interface AuthRequest extends Request {
  user?: { id: number };
}

@Controller('meeting')
@UseGuards(JwtAuthGuard)
export class MeetingController {
  constructor(private meetingService: MeetingService) {}

  @Post()
  async createMeeting(
    @Request() req: AuthRequest,
    @Body() createMeetingDto: CreateMeetingDto,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      return { error: 'Unauthorized' };
    }

    const meeting = await this.meetingService.createMeeting(
      userId,
      createMeetingDto,
    );

    return { data: meeting, message: 'Meeting created successfully' };
  }

  @Post('join')
  async joinMeeting(
    @Request() req: AuthRequest,
    @Body() joinMeetingDto: JoinMeetingDto,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      return { error: 'Unauthorized' };
    }

    const meeting = await this.meetingService.joinMeeting(
      userId,
      joinMeetingDto,
    );

    return { data: meeting, message: 'Joined meeting successfully' };
  }

  @Get(':meetingId')
  async getMeetingDetail(@Param('meetingId') meetingId: string) {
    const meeting = await this.meetingService.getMeetingDetail(meetingId);
    return { data: meeting };
  }

  @Get('code/:inviteCode')
  async getMeetingByCode(@Param('inviteCode') inviteCode: string) {
    const meeting = await this.meetingService.getMeetingByCode(inviteCode);
    return { data: meeting };
  }

  @Post('code/:inviteCode/join')
  async joinMeetingByCode(
    @Request() req: AuthRequest,
    @Param('inviteCode') inviteCode: string,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      return { error: 'Unauthorized' };
    }

    const meeting = await this.meetingService.joinMeetingByCode(
      userId,
      inviteCode,
    );

    return { data: meeting, message: 'Joined meeting successfully' };
  }

  @Get('code/:inviteCode/participants')
  async getMeetingParticipants(@Param('inviteCode') inviteCode: string) {
    const participants =
      await this.meetingService.getMeetingParticipants(inviteCode);
    return { data: participants };
  }

  @Get('code/:inviteCode/availability')
  async getMeetingAvailability(@Param('inviteCode') inviteCode: string) {
    const availability =
      await this.meetingService.getMeetingAvailability(inviteCode);
    return { data: availability };
  }

  @Patch(':meetingId/status')
  async updateStatus(
    @Request() req: AuthRequest,
    @Param('meetingId') meetingId: string,
    @Body('status') status: string,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      return { error: 'Unauthorized' };
    }

    await this.meetingService.updateParticipantStatus(
      meetingId,
      userId,
      status,
    );

    return { message: 'Status updated successfully' };
  }
}
