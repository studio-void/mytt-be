import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { Payload } from './jwt/jwt.payload';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private userService: UserService,
  ) {}

  async login({ email, password }: LoginDto) {
    const user = await this.userService.readByEmail(email);

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Password is incorrect');
    }

    const payload: Payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
    };

    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  logout() {
    // JWT는 stateless하므로 서버에서 토큰을 직접 무효화할 수 없습니다.
    // 클라이언트에서 토큰을 삭제하도록 안내하는 메시지를 반환합니다.
    // 추후 Redis나 데이터베이스를 활용한 토큰 블랙리스트 기능을 구현할 수 있습니다.

    return {
      message: 'Logout successful',
      success: true,
      timestamp: new Date().toISOString(),
    };
  }
}
