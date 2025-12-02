import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { PrismaModule } from 'src/prisma/prisma.module';
import { JwtStrategy } from './jwt.strategy';
import { AuthController } from 'src/auth/auth.controller';
import { AuthService } from 'src/auth/auth.service';

@Module({
  imports: [
    // PrismaModule - DB 접근을 위해 필요
    PrismaModule,
    PassportModule,
    // JwtModule을 비동기로 설정 (ConfigService를 기다렸다가 비밀키를 가져와야 하기 때문)
    // AccessToken 발급용 기본 설정. RefreshToken은 서비스에서 별도 옵션으로 발급
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRATION') ?? '15m',
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [JwtModule, PassportModule], // 다른 모듈에서 Auth가 필요할 경우를 대비
})
export class AuthModule {}
