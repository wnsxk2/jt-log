import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { loggerConfig } from './logger.config';

/**
 * Logger Module
 *
 * nestjs-pino를 사용한 중앙 집중식 로깅 모듈
 * - stdout으로 JSON 포맷 로그 출력
 * - ELK Stack, Loki 등에서 수집 가능
 * - TraceID를 통한 분산 추적 지원
 */
@Module({
  imports: [
    PinoLoggerModule.forRoot(loggerConfig),
  ],
  exports: [PinoLoggerModule],
})
export class LoggerModule {}
