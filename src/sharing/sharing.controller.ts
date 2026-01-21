import {
  Controller,
  Get,
  Patch,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SharingService } from './sharing.service';
import { UpdateSharingSettingsDto } from './dto/sharing-settings.dto';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';

interface AuthRequest extends Request {
  user?: { id: number };
}

@Controller('sharing')
export class SharingController {
  constructor(private sharingService: SharingService) {}

  @Get('settings')
  @UseGuards(JwtAuthGuard)
  async getSettings(@Request() req: AuthRequest) {
    const userId = req.user?.id;
    if (!userId) {
      return { error: 'Unauthorized' };
    }

    const settings = await this.sharingService.getSettings(userId);
    return { data: settings };
  }

  @Put('settings')
  @UseGuards(JwtAuthGuard)
  async updateSettings(
    @Request() req: AuthRequest,
    @Body() updateSharingSettingsDto: UpdateSharingSettingsDto,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      return { error: 'Unauthorized' };
    }

    const settings = await this.sharingService.updateSettings(
      userId,
      updateSharingSettingsDto,
    );

    return { data: settings, message: 'Settings updated successfully' };
  }

  @Get('schedule/:userId')
  async getUserSchedule(@Param('userId') userId: string) {
    const schedule = await this.sharingService.getUserSchedule(Number(userId));
    return { data: schedule };
  }
}
