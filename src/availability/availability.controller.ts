import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { CalculateAvailabilityDto } from './dto/calculate-availability.dto';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';

interface AuthRequest extends Request {
  user?: { id: number };
}

@Controller('availability')
@UseGuards(JwtAuthGuard)
export class AvailabilityController {
  constructor(private availabilityService: AvailabilityService) {}

  @Post('calculate')
  async calculateAvailability(
    @Request() req: AuthRequest,
    @Body() calculateAvailabilityDto: CalculateAvailabilityDto,
  ) {
    if (!req.user?.id) {
      return { error: 'Unauthorized' };
    }

    const availability = await this.availabilityService.calculateAvailability(
      calculateAvailabilityDto,
    );

    return { data: availability };
  }
}
