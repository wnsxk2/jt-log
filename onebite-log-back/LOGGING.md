# 프로덕션 수준 로깅 시스템 가이드

## 개요

이 프로젝트는 **Pino Logger**를 사용한 프로덕션 수준의 로깅 시스템을 구현했습니다.
ELK Stack (Elasticsearch, Logstash, Kibana) 또는 Loki와 같은 중앙 집중식 로깅 시스템과 통합할 수 있도록 설계되었습니다.

## 주요 특징

### 1. **The 12-Factor App 준수**
- **표준 출력(stdout) 전용**: 모든 로그는 stdout으로 출력되며, 파일 저장을 하지 않습니다.
- **Docker/K8s 친화적**: 컨테이너 환경에서 로깅 드라이버가 로그를 수집할 수 있습니다.

### 2. **구조화된 로깅 (Structured Logging)**
- **JSON 포맷**: 프로덕션 환경에서는 순수 JSON 형식으로 출력
- **개발 환경 가독성**: 개발 환경에서는 `pino-pretty`로 컬러풀하게 출력
- **메타데이터 포함**: TraceID, RequestID, UserID, IP, UserAgent 등

### 3. **분산 추적 (Distributed Tracing)**
- **TraceID/RequestID**: 모든 로그에 자동으로 주입되어 요청 흐름 추적 가능
- **nestjs-cls 통합**: AsyncLocalStorage를 활용한 컨텍스트 전파
- **X-Request-ID 헤더 지원**: 클라이언트가 전달한 Request ID를 우선 사용

### 4. **PII 보호 (개인정보 마스킹)**
- **자동 마스킹**: 비밀번호, 토큰, 인증 헤더 등 민감 정보 자동 마스킹
- **Redact 패턴**: `req.body.password`, `req.headers.authorization` 등
- **마스킹 문자열**: `[REDACTED]`로 대체

### 5. **로그 레벨 관리**
- **INFO**: 주요 비즈니스 흐름의 성공 (회원가입, 로그인 성공 등)
- **WARN**: 예상치 못한 상황 (중복 이메일, 잘못된 비밀번호 등)
- **ERROR**: 즉각적인 조치가 필요한 오류 (예상치 못한 예외, 스택 트레이스 포함)
- **DEBUG**: 개발 단계의 상세 데이터 (프로덕션에서는 출력 안 됨)

## 환경 변수 설정

`.env` 파일에 다음 환경 변수를 추가하세요:

```env
# 로깅 설정
LOG_LEVEL=info  # fatal, error, warn, info, debug, trace 중 선택
NODE_ENV=development  # development 또는 production
```

### 로그 레벨별 의미
- `fatal`: 치명적인 오류 (애플리케이션 종료)
- `error`: 에러 로그만 출력
- `warn`: 경고 이상 출력
- `info`: 정보성 로그 이상 출력 (프로덕션 권장)
- `debug`: 디버그 로그 포함 (개발 환경 권장)
- `trace`: 모든 로그 출력 (매우 상세)

## 로그 출력 예시

### 개발 환경 (pino-pretty)
```
[2025-11-30 18:30:45.123] INFO (AuthService): Sign-in attempt started
    traceId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
    email: "user@example.com"
    userAgent: "Mozilla/5.0..."
    clientIp: "127.0.0.1"
```

### 프로덕션 환경 (JSON)
```json
{
  "level": 30,
  "time": "2025-11-30T09:30:45.123Z",
  "msg": "Sign-in attempt started",
  "context": "AuthService",
  "traceId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "email": "user@example.com",
  "userAgent": "Mozilla/5.0...",
  "clientIp": "127.0.0.1",
  "env": "production",
  "hostname": "api-server-01",
  "pid": 1234
}
```

## 비즈니스 로직에 로깅 추가하기

### 1. Service에 Logger 주입

```typescript
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class YourService {
  constructor(
    private readonly logger: PinoLogger,
    private readonly cls: ClsService,
  ) {
    this.logger.setContext(YourService.name);
  }

  async yourMethod() {
    const traceId = this.cls.getId();

    // INFO 로그
    this.logger.info({
      msg: 'Operation started',
      traceId,
      userId: 'user-123',
      customData: { key: 'value' },
    });

    try {
      // 비즈니스 로직...

      this.logger.info({
        msg: 'Operation completed successfully',
        traceId,
        userId: 'user-123',
      });
    } catch (error) {
      // ERROR 로그 (스택 트레이스 포함)
      this.logger.error({
        msg: 'Operation failed',
        traceId,
        userId: 'user-123',
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      });
      throw error;
    }
  }
}
```

### 2. 로그 레벨별 사용 가이드

#### INFO - 주요 비즈니스 흐름
```typescript
this.logger.info({
  msg: 'User signed up successfully',
  traceId,
  userId: result.userId,
  email: result.email,
});
```

#### WARN - 예상 가능한 문제 상황
```typescript
this.logger.warn({
  msg: 'Sign-up failed: Email already exists',
  traceId,
  email,
});
```

#### ERROR - 예상치 못한 오류
```typescript
this.logger.error({
  msg: 'Database connection failed',
  traceId,
  error: {
    name: error.name,
    message: error.message,
    stack: error.stack,
  },
});
```

#### DEBUG - 개발 단계 디버깅
```typescript
this.logger.debug({
  msg: 'Cache hit',
  traceId,
  cacheKey: 'user:123',
  ttl: 3600,
});
```

## 중앙 집중식 로깅 시스템 연동

### Docker Compose + Fluentd 예시

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    environment:
      - NODE_ENV=production
      - LOG_LEVEL=info
    logging:
      driver: fluentd
      options:
        fluentd-address: localhost:24224
        tag: api.{{.Name}}

  fluentd:
    image: fluent/fluentd:v1.16
    volumes:
      - ./fluentd/conf:/fluentd/etc
    ports:
      - "24224:24224"
```

### Kubernetes + Loki 예시

```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-server
spec:
  template:
    spec:
      containers:
      - name: api
        image: your-image
        env:
        - name: NODE_ENV
          value: "production"
        - name: LOG_LEVEL
          value: "info"
        # Loki는 stdout을 자동으로 수집
```

## PII 마스킹 규칙

다음 필드는 자동으로 `[REDACTED]`로 마스킹됩니다:

### 요청 본문 (req.body)
- `password`, `confirmPassword`, `currentPassword`, `newPassword`
- `token`, `refreshToken`, `accessToken`
- `cardNumber`, `cvv`
- `ssn`, `socialSecurityNumber`

### 요청 헤더 (req.headers)
- `authorization`
- `cookie`
- `x-api-key`

### 응답 헤더 (res.headers)
- `set-cookie`

### 추가 마스킹이 필요한 경우

`src/common/logger/logger.config.ts` 파일의 `redact.paths` 배열에 추가하세요:

```typescript
redact: {
  paths: [
    // 기존 패턴...
    'req.body.creditCard',  // 추가 마스킹 필드
    'req.body.phoneNumber',
  ],
  censor: '[REDACTED]',
}
```

## HTTP 요청 자동 로깅

모든 HTTP 요청은 자동으로 로깅됩니다:

```json
{
  "level": 30,
  "time": "2025-11-30T09:30:45.123Z",
  "request": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "method": "POST",
    "url": "/auth/sign-in",
    "userAgent": "Mozilla/5.0...",
    "ip": "127.0.0.1"
  },
  "response": {
    "statusCode": 201
  },
  "duration": 245,
  "msg": "POST /auth/sign-in 201"
}
```

### Health Check 로그 제외

프로덕션 환경에서는 `/health` 엔드포인트는 자동 로깅에서 제외됩니다.

## 로그 쿼리 예시 (Elasticsearch)

### TraceID로 요청 전체 흐름 조회
```
GET /logs-*/_search
{
  "query": {
    "term": {
      "traceId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
    }
  },
  "sort": [{ "time": "asc" }]
}
```

### 특정 사용자의 에러 로그 조회
```
GET /logs-*/_search
{
  "query": {
    "bool": {
      "must": [
        { "term": { "userId": "user-123" } },
        { "term": { "level": 50 } }  // ERROR level
      ]
    }
  }
}
```

### 로그인 실패 패턴 분석
```
GET /logs-*/_search
{
  "query": {
    "bool": {
      "must": [
        { "match": { "msg": "Sign-in failed" } },
        { "range": { "time": { "gte": "now-1h" } } }
      ]
    }
  },
  "aggs": {
    "failure_reasons": {
      "terms": { "field": "msg.keyword" }
    }
  }
}
```

## 모니터링 및 알림

### 권장 알림 설정

1. **ERROR 레벨 로그 급증**
   - 5분 내 ERROR 로그 10건 이상 발생 시 알림

2. **인증 실패 패턴**
   - 동일 IP에서 1분 내 로그인 실패 5회 이상 시 알림

3. **응답 시간 지연**
   - 평균 응답 시간 1초 이상 지속 시 알림

4. **세션 탈취 의심**
   - "possible token theft" 메시지 발생 시 즉시 알림

## 성능 고려사항

### 로그 오버헤드 최소화

1. **프로덕션 로그 레벨**: `info` 이상으로 설정
2. **Debug 로그**: 개발 환경에서만 사용
3. **대용량 데이터 로깅 금지**: 요청/응답 body 전체를 로깅하지 않음
4. **비동기 처리**: Pino는 기본적으로 비동기 로깅 사용

### 로그 볼륨 관리

```typescript
// Health check처럼 자주 발생하는 엔드포인트는 로그 제외
autoLogging: {
  ignore: (req) => {
    return req.url === '/health' && process.env.NODE_ENV === 'production';
  },
}
```

## 문제 해결

### 로그가 출력되지 않는 경우

1. **LOG_LEVEL 확인**: 환경 변수가 올바르게 설정되었는지 확인
2. **NODE_ENV 확인**: `production`에서는 `info` 이상만 출력됨
3. **Logger 주입 확인**: Service에 PinoLogger가 올바르게 주입되었는지 확인

### JSON 파싱 오류 발생 시

1. **Transport 제거**: 프로덕션에서는 `pino-pretty` transport 비활성화 확인
2. **Stdout 리다이렉션**: 로그를 파일로 저장하지 않고 stdout으로 출력 확인

## 참고 자료

- [Pino Documentation](https://getpino.io/)
- [nestjs-pino](https://github.com/iamolegga/nestjs-pino)
- [The 12-Factor App - Logs](https://12factor.net/logs)
- [nestjs-cls](https://github.com/Papooch/nestjs-cls)
