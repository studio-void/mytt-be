import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { GoogleOAuthModule } from './auth/google/google.module';
import { CalendarModule } from './calendar/calendar.module';
import { MeetingModule } from './meeting/meeting.module';
import { SharingModule } from './sharing/sharing.module';
import { AvailabilityModule } from './availability/availability.module';
import jwtConfig from './auth/jwt/jwt.config';
import userConfig from './user/user.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [jwtConfig, userConfig],
    }),
    PrismaModule,
    AuthModule,
    UserModule,
    GoogleOAuthModule,
    CalendarModule,
    MeetingModule,
    SharingModule,
    AvailabilityModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
