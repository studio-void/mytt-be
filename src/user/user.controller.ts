import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { UserId } from './user.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from '../auth/roles/roles.decorator';
import { RolesGuard } from '../auth/roles/roles.guard';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({
    summary: '현재 사용자 정보 조회',
    description: '인증된 사용자의 정보를 반환합니다.',
  })
  @ApiBearerAuth('jwt')
  @ApiResponse({ status: 200, description: '사용자 정보 반환' })
  @ApiResponse({ status: 401, description: '인증 실패(JWT 누락 또는 만료)' })
  @ApiResponse({ status: 404, description: '해당 ID의 사용자를 찾을 수 없음' })
  @ApiBearerAuth('jwt')
  @UseGuards(JwtAuthGuard)
  @Get()
  async me(@UserId() userId: number) {
    return await this.userService.readById(userId);
  }

  @ApiOperation({
    summary: '회원가입',
    description: '새로운 사용자를 생성합니다.',
  })
  @ApiResponse({ status: 201, description: '사용자 생성 성공' })
  @ApiResponse({ status: 409, description: '이미 존재하는 이메일' })
  @Post()
  async create(@Body() user: CreateUserDto) {
    return await this.userService.create(user);
  }

  @ApiOperation({
    summary: '사용자 정보 수정',
    description: '현재 사용자의 정보를 수정합니다.',
  })
  @ApiResponse({ status: 200, description: '사용자 정보 수정 성공' })
  @ApiResponse({ status: 401, description: '인증 실패(JWT 누락 또는 만료)' })
  @ApiResponse({ status: 404, description: '해당 ID의 사용자를 찾을 수 없음' })
  @ApiBearerAuth('jwt')
  @UseGuards(JwtAuthGuard)
  @Patch()
  async update(@UserId() userId: number, @Body() user: UpdateUserDto) {
    return await this.userService.update(userId, user);
  }

  @ApiOperation({
    summary: '회원 탈퇴',
    description: '현재 사용자를 삭제합니다.',
  })
  @ApiResponse({ status: 200, description: '사용자 삭제 성공' })
  @ApiResponse({ status: 401, description: '인증 실패(JWT 누락 또는 만료)' })
  @ApiResponse({ status: 404, description: '해당 ID의 사용자를 찾을 수 없음' })
  @ApiBearerAuth('jwt')
  @UseGuards(JwtAuthGuard)
  @Delete()
  async delete(@UserId() userId: number) {
    return await this.userService.delete(userId);
  }

  @ApiOperation({
    summary: '관리자 테스트 데모',
    description: 'admin 권한이 있어야 접근 가능한 데모 API입니다.',
  })
  @ApiResponse({ status: 200, description: '관리자 권한 확인 성공' })
  @ApiResponse({ status: 401, description: '인증 실패(JWT 누락 또는 만료)' })
  @ApiResponse({ status: 403, description: '권한 없음(admin 아님)' })
  @ApiBearerAuth('jwt')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin')
  adminDemo() {
    return { message: '관리자 권한이 확인되었습니다.' };
  }
}
