import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth() // Swagger에서 Bearer 토큰 입력 UI 활성화
  @ApiOperation({ summary: '테스트 API (인증 필요)' })
  @ApiResponse({ status: 200, description: '성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  getHello(): string {
    return this.appService.getHello();
  }
}
