import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import userConfig from './user.config';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigType } from '@nestjs/config';
import { User } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';

export type UserSelect = Partial<Record<keyof User, true>>;

@Injectable()
export class UserService {
  constructor(
    @Inject(userConfig.KEY) private config: ConfigType<typeof userConfig>,
    private prisma: PrismaService,
  ) {}

  // 민감한 정보를 포함한 필드 선택 (관리자용)
  private getAdminUserSelect(): UserSelect {
    return {
      id: true,
      email: true,
      name: true,
      isAdmin: true,
      createdAt: true,
      updatedAt: true,
    };
  }

  // 민감한 정보를 제외한 기본 필드 선택 (일반 사용자용)
  private getBasicUserSelect(): UserSelect {
    return {
      id: true,
      email: true,
      name: true,
      isAdmin: true,
      createdAt: true,
      updatedAt: true,
    };
  }

  async create(user: CreateUserDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: user.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(
      user.password,
      parseInt(this.config.auth.passwordSaltRounds, 10),
    );

    return await this.prisma.user.create({
      data: { ...user, password: hashedPassword },
    });
  }

  async read() {
    return await this.prisma.user.findMany({
      select: this.getBasicUserSelect(),
    });
  }

  async readById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: this.getBasicUserSelect(),
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async readByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    return user;
  }

  async update(id: number, newUser: UpdateUserDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const data: UpdateUserDto = { ...newUser };
    if (newUser.password) {
      const rawRounds = Number(this.config.auth.passwordSaltRounds);
      const rounds = Number.isFinite(rawRounds) ? rawRounds : 10;
      const saltRounds = Math.min(Math.max(rounds, 4), 15);
      data.password = await bcrypt.hash(newUser.password, saltRounds);
    }

    return await this.prisma.user.update({
      where: { id },
      data,
      select: this.getBasicUserSelect(),
    });
  }

  async delete(id: number) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return await this.prisma.user.delete({
      where: { id },
      select: this.getBasicUserSelect(),
    });
  }
}
