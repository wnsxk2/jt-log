import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  // bufferLogs: true로 설정하여 Logger 설정 전까지 로그를 버퍼링
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // 1. Logger 설정 (Pino)
  // NestJS 기본 Logger를 Pino Logger로 교체
  app.useLogger(app.get(Logger));

  // Logger 인스턴스 가져오기
  const logger = app.get(Logger);

  // 2. 보안 설정 (Helmet)
  // HTTP 헤더를 적절히 설정하여 보안 취약점을 방어합니다.
  app.use(helmet());

  // 3. 쿠키 파서 설정 (RefreshToken 쿠키 파싱에 필요)
  app.use(cookieParser());

  // 4. CORS 설정
  // 프론트엔드 도메인만 허용하도록 설정 (개발 단계에선 true로 모든 출처 허용)
  // credentials: true는 쿠키 전송을 허용 (RefreshToken 쿠키 전송에 필요)
  app.enableCors({
    origin: true, // 실제 배포 시에는 'https://your-domain.com'으로 변경 권장
    credentials: true,
  });

  // 5. 전역 유효성 검사 (Class Validator)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // DTO에 정의되지 않은 속성은 자동으로 제거 (보안)
      forbidNonWhitelisted: true, // DTO에 없는 속성이 오면 요청 자체를 막음 (선택 사항)
      transform: true, // 요청에서 넘어온 데이터를 DTO의 타입으로 자동 변환 (매우 중요)
    }),
  );

  // 6. 전역 예외 필터 (HTTP Exception Filter)
  // 모든 HTTP 예외를 ResponseDto 형식으로 통일합니다.
  app.useGlobalFilters(new HttpExceptionFilter());

  // 7. API 문서화 (Swagger)
  const config = new DocumentBuilder()
    .setTitle('My API Service')
    .setDescription('NestJS + Prisma + JWT API 문서')
    .setVersion('1.0')
    .addBearerAuth() // JWT 인증 버튼 추가
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document); // '/api-docs' 경로에서 문서 확인

  const port = process.env.PORT || 3000;

  // [중요] 이 설정이 있어야 백엔드가 '/api/...' 요청을 인식합니다.
  app.setGlobalPrefix('api');
  await app.listen(port);

  // 애플리케이션 시작 로그
  logger.log(
    `Application is running on: http://localhost:${port}`,
    'Bootstrap',
  );
  logger.log(
    `Environment: ${process.env.NODE_ENV || 'development'}`,
    'Bootstrap',
  );
  logger.log(
    `API Documentation: http://localhost:${port}/api-docs`,
    'Bootstrap',
  );
}

bootstrap().catch((error) => {
  // 부트스트랩 실패 시 에러 로그 출력 후 종료
  console.error('Failed to start application:', error);
  process.exit(1);
});
