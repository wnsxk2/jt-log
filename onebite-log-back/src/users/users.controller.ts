import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Request } from 'express';
import { UserResponseDto } from 'src/users/dto/user-response.dto';
import { UpdateUserDto } from 'src/users/dto/update-user.dto';
import { ResponseDto } from 'src/common/dto/respone.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '내 정보 조회' })
  @ApiResponse({ status: 200, description: '내 정보 조회 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async getMe(
    @Req() req: Request,
  ): Promise<ResponseDto<UserResponseDto | void>> {
    const user = await this.usersService.findUserById(req.user['userId']);
    return ResponseDto.success(new UserResponseDto(user));
  }

  @Patch('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '내 정보 수정' })
  @ApiResponse({ status: 200, description: '내 정보 수정 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async updateMe(
    @Req() req: Request,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<ResponseDto<UserResponseDto | void>> {
    const user = await this.usersService.updateUserById(
      req.user['userId'],
      updateUserDto,
    );
    return ResponseDto.success(new UserResponseDto(user));
  }

  @Get(':userId')
  @ApiOperation({ summary: '사용자 정보 조회' })
  @ApiResponse({ status: 200, description: '사용자 정보 조회 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async getUserById(
    @Param('userId') userId: string,
  ): Promise<ResponseDto<UserResponseDto | void>> {
    const user = await this.usersService.findUserById(userId);
    return ResponseDto.success(new UserResponseDto(user));
  }
}
