import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClsModule } from 'nestjs-cls';
import * as Joi from 'joi';
import { v4 as uuidv4 } from 'uuid';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from './users/users.module';
import { PostsModule } from './posts/posts.module';
import { CommentsModule } from './comments/comments.module';
import { LoggerModule } from './common/logger/logger.module';

@Module({
  imports: [
    // 1. 환경 변수 설정 및 검증 (Config + Joi)
    ConfigModule.forRoot({
      isGlobal: true, // 다른 모듈에서 ConfigService를 바로 주입받을 수 있게 함
      validationSchema: Joi.object({
        // 아래 변수들이 .env에 없으면 서버 실행 시 에러 발생
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        PORT: Joi.number().default(3000),
        DATABASE_URL: Joi.string().required(), // Prisma DB 연결 주소

        // AccessToken 설정
        JWT_SECRET: Joi.string().required(), // AccessToken 서명 키
        JWT_EXPIRATION: Joi.string().default('15m'), // AccessToken 유효기간

        // RefreshToken 설정
        REFRESH_TOKEN_SECRET: Joi.string().required(), // RefreshToken 서명 키
        REFRESH_TOKEN_EXPIRATION: Joi.string().default('7d'), // RefreshToken 유효기간

        // Logging 설정
        LOG_LEVEL: Joi.string()
          .valid('fatal', 'error', 'warn', 'info', 'debug', 'trace')
          .default('info'),
      }),
    }),

    // 2. CLS (Continuation-Local Storage) 모듈
    // 요청별 컨텍스트 저장 (TraceID, RequestID 등)
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        generateId: true,
        // TraceID 생성 함수
        idGenerator: (req: Request) => {
          // X-Request-ID 헤더가 있으면 사용, 없으면 UUID 생성
          return req.headers['x-request-id'] as string || uuidv4();
        },
      },
    }),

    // 3. Logger 모듈 (Pino)
    LoggerModule,

    // 4. 비즈니스 모듈
    PrismaModule,
    AuthModule,
    UsersModule,
    PostsModule,
    CommentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
