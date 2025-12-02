import { Params } from 'nestjs-pino';
import { IncomingMessage, ServerResponse } from 'http';
import type { LevelWithSilent } from 'pino';

/**
 * Pino Logger 설정
 *
 * 프로덕션 환경에서는:
 * - 순수 JSON 형식으로 stdout에 출력
 * - ELK Stack, Loki 등 중앙 집중식 로깅 시스템에서 수집 가능
 * - TraceID를 통한 분산 추적 지원
 * - PII 정보 자동 마스킹
 *
 * 개발 환경에서는:
 * - pino-pretty로 가독성 있게 출력
 */
export const loggerConfig: Params = {
  pinoHttp: {
    // 로그 레벨 설정 (환경에 따라 다르게 설정)
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),

    // Transport 설정 (stdout 강제)
    transport: process.env.NODE_ENV !== 'production'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'yyyy-mm-dd HH:MM:ss.l',
            ignore: 'pid,hostname',
            singleLine: false,
            messageFormat: '{context} {msg}',
          },
        }
      : undefined, // production에서는 transport 없음 (순수 JSON 출력)

    // 기본 옵션
    base: {
      // 환경 정보
      env: process.env.NODE_ENV || 'development',
      // hostname과 pid는 컨테이너 환경에서 유용
      ...(process.env.NODE_ENV === 'production' && {
        hostname: process.env.HOSTNAME,
        pid: process.pid,
      }),
    },

    // 민감 정보 마스킹 (PII 보호)
    redact: {
      paths: [
        // 요청 본문의 민감 정보
        'req.body.password',
        'req.body.confirmPassword',
        'req.body.currentPassword',
        'req.body.newPassword',
        'req.body.token',
        'req.body.refreshToken',
        'req.body.accessToken',
        'req.body.cardNumber',
        'req.body.cvv',
        'req.body.ssn',
        'req.body.socialSecurityNumber',

        // 요청 헤더의 민감 정보
        'req.headers.authorization',
        'req.headers.cookie',
        'req.headers["x-api-key"]',

        // 응답의 민감 정보
        'res.headers["set-cookie"]',

        // 컨텍스트 내 민감 정보
        'context.password',
        'context.token',
        'context.refreshToken',
        'context.accessToken',
      ],
      // 마스킹 문자열
      censor: '[REDACTED]',
    },

    // 타임스탬프 포맷 (ISO 8601)
    timestamp: () => `,"time":"${new Date().toISOString()}"`,

    // 커스텀 로그 레벨 (Pino 기본 레벨 사용)
    customLogLevel: (
      req: IncomingMessage,
      res: ServerResponse<IncomingMessage>,
      error?: Error,
    ): LevelWithSilent => {
      // 에러가 있으면 error 레벨
      if (error) return 'error';

      // HTTP 상태 코드에 따른 레벨 설정
      if (res.statusCode >= 500) return 'error';
      if (res.statusCode >= 400) return 'warn';
      if (res.statusCode >= 300) return 'info';

      // Health check는 debug 레벨 (로그 노이즈 감소)
      if (req.url === '/health' || req.url === '/') return 'debug';

      return 'info';
    },

    // 커스텀 성공 메시지
    customSuccessMessage: (
      req: IncomingMessage,
      res: ServerResponse<IncomingMessage>,
    ): string => {
      return `${req.method} ${req.url} ${res.statusCode}`;
    },

    // 커스텀 에러 메시지
    customErrorMessage: (
      req: IncomingMessage,
      res: ServerResponse<IncomingMessage>,
      error: Error,
    ): string => {
      return `${req.method} ${req.url} ${res.statusCode} - ${error.message}`;
    },

    // 커스텀 속성 추가 (TraceID, 메타데이터 등)
    customAttributeKeys: {
      req: 'request',
      res: 'response',
      err: 'error',
      responseTime: 'duration',
    },

    // HTTP 요청/응답 로그 포맷
    serializers: {
      req: (req: IncomingMessage & { id?: string }) => ({
        id: req.id, // Request ID (nestjs-cls에서 주입)
        method: req.method,
        url: req.url,
        // query: req.query, // 필요시 활성화 (민감 정보 주의)
        // params: req.params, // 필요시 활성화
        userAgent: req.headers['user-agent'],
        ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
        // body는 로깅하지 않음 (민감 정보 포함 가능성)
      }),

      res: (res: ServerResponse<IncomingMessage>) => ({
        statusCode: res.statusCode,
        // headers: res.getHeaders(), // 필요시 활성화
      }),

      err: (err: Error) => ({
        type: err.name,
        message: err.message,
        // 프로덕션에서도 스택 트레이스는 포함 (디버깅 필수)
        stack: err.stack,
      }),
    },

    // 자동 로깅 설정
    autoLogging: {
      // Health check 엔드포인트는 자동 로깅 제외
      ignore: (req: IncomingMessage) => {
        return req.url === '/health' && process.env.NODE_ENV === 'production';
      },
    },
  },
};
