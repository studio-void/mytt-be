import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GoogleOAuthPayload } from './google.types';
import { User } from '@prisma/client';
import { google } from 'googleapis';
import { getGoogleOAuthConfig } from './google.config';

@Injectable()
export class GoogleAuthService {
  constructor(private prisma: PrismaService) {}

  async validateOrCreateUser(payload: GoogleOAuthPayload): Promise<User> {
    console.log('[validateOrCreateUser] Received payload:', {
      googleId: payload.googleId,
      email: payload.email,
      name: payload.name,
      hasAccessToken: !!payload.accessToken,
      hasRefreshToken: !!payload.refreshToken,
      refreshTokenValue: payload.refreshToken
        ? payload.refreshToken.substring(0, 20) + '...'
        : 'NONE',
    });

    // 기존 Google 계정으로 등록된 사용자 확인
    let user = await this.prisma.user.findFirst({
      where: {
        googleAccounts: {
          some: {
            googleId: payload.googleId,
          },
        },
      },
    });

    if (user) {
      console.log(
        `[validateOrCreateUser] Found existing user with googleId: ${payload.googleId}`,
      );
      // 기존 사용자의 Google 계정 정보 업데이트
      const updateData: Record<string, any> = {
        accessToken: payload.accessToken,
        expiresAt: payload.expiresIn
          ? new Date(Date.now() + payload.expiresIn * 1000)
          : new Date(Date.now() + 60 * 60 * 1000), // 기본값 1시간
      };

      if (payload.refreshToken && payload.refreshToken.trim()) {
        console.log('[validateOrCreateUser] Updating with new refreshToken');
        updateData.refreshToken = payload.refreshToken;
      } else {
        console.log(
          '[validateOrCreateUser] No refreshToken to update (undefined or empty)',
        );
      }

      console.log('[validateOrCreateUser] Update data:', updateData);
      await this.prisma.googleAccount.updateMany({
        where: {
          googleId: payload.googleId,
        },
        data: updateData,
      });

      return user;
    }

    // 이메일로 기존 사용자 확인
    user = await this.prisma.user.findUnique({
      where: { email: payload.email },
    });

    if (user) {
      console.log(
        `[validateOrCreateUser] Found existing user with email: ${payload.email}, adding Google account`,
      );
      // 기존 사용자에 Google 계정 추가
      const createData = {
        userId: user.id,
        googleId: payload.googleId,
        email: payload.email,
        accessToken: payload.accessToken,
        refreshToken:
          payload.refreshToken && payload.refreshToken.trim()
            ? payload.refreshToken
            : '',
        expiresAt: payload.expiresIn
          ? new Date(Date.now() + payload.expiresIn * 1000)
          : new Date(Date.now() + 60 * 60 * 1000),
      };

      console.log('[validateOrCreateUser] Creating Google account:', {
        ...createData,
        refreshToken: createData.refreshToken
          ? createData.refreshToken.substring(0, 20) + '...'
          : 'EMPTY',
      });

      await this.prisma.googleAccount.create({
        data: createData,
      });

      return user;
    }

    // 새로운 사용자 생성
    console.log(
      `[validateOrCreateUser] Creating new user with email: ${payload.email}`,
    );
    const createData = {
      userId: undefined, // 새로운 user.id는 자동생성
      googleId: payload.googleId,
      email: payload.email,
      accessToken: payload.accessToken,
      refreshToken:
        payload.refreshToken && payload.refreshToken.trim()
          ? payload.refreshToken
          : '',
      expiresAt: payload.expiresIn
        ? new Date(Date.now() + payload.expiresIn * 1000)
        : new Date(Date.now() + 60 * 60 * 1000),
    };

    console.log(
      '[validateOrCreateUser] Creating new user and Google account:',
      {
        email: payload.email,
        name: payload.name,
        googleId: payload.googleId,
        refreshToken: createData.refreshToken
          ? createData.refreshToken.substring(0, 20) + '...'
          : 'EMPTY',
      },
    );

    user = await this.prisma.user.create({
      data: {
        email: payload.email,
        name: payload.name,
        password: null,
        googleAccounts: {
          create: {
            googleId: payload.googleId,
            email: payload.email,
            accessToken: payload.accessToken,
            refreshToken:
              payload.refreshToken && payload.refreshToken.trim()
                ? payload.refreshToken
                : '',
            expiresAt: payload.expiresIn
              ? new Date(Date.now() + payload.expiresIn * 1000)
              : new Date(Date.now() + 60 * 60 * 1000),
          },
        },
      },
    });

    console.log(`[validateOrCreateUser] New user created with id: ${user.id}`);
    return user;
  }

  async getAccessToken(userId: number): Promise<string | null> {
    const googleAccount = await this.prisma.googleAccount.findFirst({
      where: { userId },
    });

    if (!googleAccount) {
      console.log(
        `[getAccessToken] No Google account found for userId: ${userId}`,
      );
      return null;
    }

    console.log(`[getAccessToken] Found Google account for userId: ${userId}`);
    console.log(
      `[getAccessToken] Token expires at: ${googleAccount.expiresAt}`,
    );
    console.log(`[getAccessToken] Current time: ${new Date()}`);
    console.log(
      `[getAccessToken] Has refreshToken: ${!!googleAccount.refreshToken}`,
    );

    // 토큰이 유효하면 그대로 사용
    if (
      googleAccount.accessToken &&
      googleAccount.expiresAt &&
      googleAccount.expiresAt > new Date()
    ) {
      console.log(
        `[getAccessToken] Token is still valid for userId: ${userId}`,
      );
      return googleAccount.accessToken;
    }

    console.log(
      `[getAccessToken] Token expired or missing for userId: ${userId}`,
    );

    // 리프레시 토큰이 있으면 갱신 시도
    if (googleAccount.refreshToken && googleAccount.refreshToken.trim()) {
      console.log(
        `[getAccessToken] Attempting to refresh token with refreshToken for userId: ${userId}`,
      );
      const config = getGoogleOAuthConfig();
      const oauth2Client = new google.auth.OAuth2(
        config.clientID,
        config.clientSecret,
        config.callbackURL,
      );

      oauth2Client.setCredentials({
        refresh_token: googleAccount.refreshToken,
      });

      try {
        const { credentials } = await oauth2Client.refreshAccessToken();

        console.log(`[getAccessToken] Refresh successful, got credentials:`, {
          hasAccessToken: !!credentials.access_token,
          hasRefreshToken: !!credentials.refresh_token,
          expiryDate: credentials.expiry_date,
        });

        const newAccessToken = credentials.access_token;
        const newRefreshToken =
          credentials.refresh_token || googleAccount.refreshToken;
        const expiresAt = credentials.expiry_date
          ? new Date(credentials.expiry_date)
          : new Date(Date.now() + 60 * 60 * 1000);

        if (!newAccessToken) {
          console.log(
            `[getAccessToken] Failed to get new access token for userId: ${userId}`,
          );
          return null;
        }

        console.log(
          `[getAccessToken] Token refreshed successfully for userId: ${userId}`,
        );
        await this.prisma.googleAccount.update({
          where: { id: googleAccount.id },
          data: {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            expiresAt,
          },
        });

        return newAccessToken;
      } catch (error) {
        console.error(
          `[getAccessToken] Error refreshing token for userId: ${userId}:`,
          error,
        );
        // refresh token 갱신 실패 시 null 반환 -> 사용자 재로그인 필요
        return null;
      }
    }

    // refresh token이 없는 경우: access token이 만료되었으면 null 반환
    // Google이 refresh token을 주지 않는 경우를 대비하여,
    // 이미 발급받은 access token이 있으면 만료될 때까지 사용
    console.log(
      `[getAccessToken] No refresh token available for userId: ${userId}, access token has expired`,
    );
    console.log(
      `[getAccessToken] User needs to re-login to get a new access token`,
    );
    return null;
  }
}
