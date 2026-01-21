import { Controller, Get } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';

@Controller()
export class AppController {
  @ApiOperation({
    summary: 'API 정보',
    description: 'API의 기본 정보를 반환합니다.',
  })
  @Get()
  root() {
    return {
      name: 'Template Backend',
      description: 'A backend service.',
      publishedAt: new Date().toISOString(),
      version: 'v1.0.0',
    };
  }
}
