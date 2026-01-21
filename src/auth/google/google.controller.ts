import { Controller, Get, UseGuards, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { GoogleOAuthGuard } from './google.guard';
import { GoogleAuthService } from './google.service';
import { GoogleOAuthPayload } from './google.types';
import { JwtService } from '@nestjs/jwt';

interface AuthenticatedRequest extends Request {
  user?: GoogleOAuthPayload;
}

@Controller('auth/google')
export class GoogleOAuthController {
  constructor(
    private googleAuthService: GoogleAuthService,
    private jwtService: JwtService,
  ) {}

  @Get('login')
  @UseGuards(GoogleOAuthGuard)
  async googleLogin() {
    // Google OAuth 로그인 페이지로 리디렉션
  }

  @Get('callback')
  @UseGuards(GoogleOAuthGuard)
  async googleCallback(@Req() req: AuthenticatedRequest, @Res() res: Response) {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication failed' });
    }

    try {
      const user = await this.googleAuthService.validateOrCreateUser(req.user);

      const token = this.jwtService.sign(
        {
          id: user.id,
          email: user.email,
          name: user.name,
          isAdmin: user.isAdmin,
        },
        { expiresIn: '7d' },
      );

      // 토큰을 쿼리 파라미터로 Frontend로 리디렉션
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  @Get('profile')
  async getProfile(@Req() req: AuthenticatedRequest) {
    if (!req.user) {
      return { error: 'Not authenticated' };
    }
    return req.user;
  }
}
