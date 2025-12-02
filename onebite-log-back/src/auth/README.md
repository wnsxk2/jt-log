# 인증(Auth) 모듈 가이드

## 개요

이 모듈은 JWT 기반 인증을 제공합니다:
- **AccessToken**: 짧은 유효기간(기본 15분), JSON 응답으로 전달
- **RefreshToken**: 긴 유효기간(기본 7일), HttpOnly 쿠키로 전달

## 환경 변수 설정

`.env` 파일에 다음 변수들을 설정해야 합니다:

```env
# AccessToken 설정
JWT_SECRET=your-access-token-secret-key  # 필수
JWT_EXPIRATION=15m                        # 선택 (기본: 15m)

# RefreshToken 설정
REFRESH_TOKEN_SECRET=your-refresh-token-secret-key  # 필수
REFRESH_TOKEN_EXPIRATION=7d                          # 선택 (기본: 7d)
```

> **중요**: `JWT_SECRET`과 `REFRESH_TOKEN_SECRET`은 반드시 서로 다른 값을 사용하세요.

## API 엔드포인트

### 1. 로그인 - `POST /auth/sign-in`

이메일/비밀번호로 로그인합니다.

**요청:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**응답:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com"
}
```

**쿠키:**
- `refresh_token`: HttpOnly, Secure, SameSite=Strict 쿠키로 설정됨

### 2. 토큰 재발급 - `POST /auth/refresh`

RefreshToken으로 새 AccessToken을 발급받습니다.

**요청:**
- 쿠키에 `refresh_token`이 포함되어 있어야 함

**응답:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com"
}
```

### 3. 로그아웃 - `POST /auth/logout`

현재 세션에서 로그아웃합니다.

**응답:**
```json
{
  "message": "로그아웃되었습니다."
}
```

## 프론트엔드 사용 가이드

### AccessToken 저장 및 사용

```typescript
// 로그인 응답에서 accessToken 저장 (메모리 또는 상태 관리)
let accessToken = response.accessToken;

// API 요청 시 Authorization 헤더에 포함
fetch('/api/protected', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
```

### 토큰 만료 처리

```typescript
// 401 에러 발생 시 토큰 재발급 시도
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const response = await fetch(url, {
    ...options,
    credentials: 'include', // 쿠키 포함 필수
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (response.status === 401) {
    // 토큰 재발급 시도
    const refreshResponse = await fetch('/auth/refresh', {
      method: 'POST',
      credentials: 'include'
    });

    if (refreshResponse.ok) {
      const data = await refreshResponse.json();
      accessToken = data.accessToken;

      // 원래 요청 재시도
      return fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${accessToken}`
        }
      });
    } else {
      // 재발급 실패 시 로그인 페이지로 이동
      window.location.href = '/sign-in';
    }
  }

  return response;
}
```

### Axios 인터셉터 예시

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
  withCredentials: true // 쿠키 전송 필수
});

let accessToken = '';

// 요청 인터셉터: AccessToken 자동 포함
api.interceptors.request.use(config => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// 응답 인터셉터: 401 시 자동 재발급
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { data } = await api.post('/auth/refresh');
        accessToken = data.accessToken;
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch {
        // 재발급 실패 시 로그인 페이지로
        window.location.href = '/sign-in';
      }
    }

    return Promise.reject(error);
  }
);
```

## 보안 고려사항

### RefreshToken 회전 (Rotation)

이 구현은 RefreshToken 회전을 사용합니다:
- 토큰 재발급 시 이전 RefreshToken은 즉시 무효화
- 새로운 RefreshToken 발급
- 토큰 탈취 시 피해 최소화

### HttpOnly 쿠키의 장점

- JavaScript에서 직접 접근 불가 (XSS 공격 방지)
- 브라우저가 자동으로 요청에 포함
- `SameSite=Strict`로 CSRF 공격 방지

### 세션 관리

- DB의 `Session` 테이블에서 활성 세션 관리
- 사용자별 여러 기기에서 동시 로그인 가능
- `logoutAll()` 메서드로 모든 기기에서 로그아웃 가능

## Supabase → NestJS 인증 전환 시 고려사항

현재 프론트엔드는 Supabase를 사용 중입니다. NestJS 인증으로 전환 시:

1. **API 엔드포인트 변경**
  - Supabase `signInWithPassword` → `POST /auth/sign-in`
  - Supabase `signOut` → `POST /auth/logout`

2. **세션 관리 방식 변경**
  - Supabase의 자동 세션 관리 → 직접 AccessToken/RefreshToken 관리
  - `session-provider.tsx` 수정 필요

3. **OAuth 지원**
  - 현재 NestJS에는 OAuth 미구현
  - 필요시 `passport-github`, `passport-google` 등 추가 구현 필요

4. **프론트엔드 변경 사항**
  - API 호출 시 `credentials: 'include'` 옵션 필수
  - AccessToken 상태 관리 로직 추가
  - 401 에러 시 자동 재발급 로직 구현

