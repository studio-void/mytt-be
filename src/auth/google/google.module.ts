import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { GoogleOAuthStrategy } from './google.strategy';
import { GoogleAuthService } from './google.service';
import { GoogleOAuthController } from './google.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'google' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  providers: [GoogleOAuthStrategy, GoogleAuthService],
  controllers: [GoogleOAuthController],
  exports: [GoogleAuthService],
})
export class GoogleOAuthModule {}
