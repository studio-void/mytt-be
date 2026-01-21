import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { getGoogleOAuthConfig } from './google.config';
import { GoogleProfile, GoogleOAuthPayload } from './google.types';

@Injectable()
export class GoogleOAuthStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    const config = getGoogleOAuthConfig();
    super({
      clientID: config.clientID,
      clientSecret: config.clientSecret,
      callbackURL: config.callbackURL,
      scope: [
        'profile',
        'email',
        'https://www.googleapis.com/auth/calendar.readonly',
      ],
      accessType: 'offline',
      prompt: 'consent',
      maxAge: 0, // Google의 캐시된 권한 무시, 항상 동의 화면 표시
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: GoogleProfile,
    done: (err: Error | null, user?: GoogleOAuthPayload) => void,
  ): Promise<void> {
    try {
      console.log('[GoogleOAuthStrategy.validate] Called with:');
      console.log(
        `  - accessToken: ${accessToken ? accessToken.substring(0, 20) + '...' : 'NONE'}`,
      );
      console.log(
        `  - refreshToken: ${refreshToken ? refreshToken.substring(0, 20) + '...' : 'NONE'}`,
      );
      console.log(`  - profile.id: ${profile.id}`);
      console.log(`  - profile.emails: ${JSON.stringify(profile.emails)}`);

      const user: GoogleOAuthPayload = {
        googleId: profile.id,
        email: profile.emails?.[0]?.value || '',
        name: profile.displayName || '',
        accessToken,
        refreshToken: refreshToken || undefined,
      };

      console.log('[GoogleOAuthStrategy.validate] Payload:', {
        googleId: user.googleId,
        email: user.email,
        name: user.name,
        hasAccessToken: !!user.accessToken,
        hasRefreshToken: !!user.refreshToken,
      });

      done(null, user);
    } catch (error) {
      console.error('[GoogleOAuthStrategy.validate] Error:', error);
      done(error as Error);
    }
  }
}
