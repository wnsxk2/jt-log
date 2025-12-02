import { getAccessToken } from "@/store/session";
import { useSessionStore } from "@/store/session";

type ApiResponse<T> = {
  result: "success" | "error";
  data?: T;
  error?: {
    code: string;
    message: string;
  };
};

// 토큰 갱신 중인지 확인하는 플래그
let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;

/**
 * 토큰 갱신 함수
 * - 동시에 여러 요청이 실패해도 한 번만 갱신하도록 처리
 */
async function handleTokenRefresh(): Promise<void> {
  // 이미 갱신 중이면 기존 Promise를 반환
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;

  refreshPromise = (async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_PUBLIC_API_URL}/auth/refresh`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error("토큰 갱신 실패");
      }

      const body = (await response.json()) as ApiResponse<{
        id: string;
        email: string;
        accessToken: string;
      }>;

      if (body.result === "error" || !body.data) {
        throw new Error(body.error?.message || "토큰 갱신 실패");
      }

      // 새 토큰을 스토어에 저장
      const setSession = useSessionStore.getState().actions.setSession;
      setSession({
        accessToken: body.data.accessToken,
        expiresIn: 3600, // 1시간 (백엔드 설정에 맞게 조정)
        expiresAt: Date.now() + 3600 * 1000,
        user: {
          id: body.data.id,
          email: body.data.email,
        },
      });
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit & { hasToken?: boolean; skipTokenRefresh?: boolean } = {},
): Promise<ApiResponse<T>> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const { hasToken, skipTokenRefresh, ...restOptions } = options;

  if (hasToken) {
    (headers as Record<string, string>)["Authorization"] =
      `Bearer ${getAccessToken()}`;
  }

  const config: RequestInit = {
    ...restOptions,
    headers,
    credentials: "include",
    cache: options.cache || "no-cache",
  };

  if (options.body && typeof options.body !== "string") {
    config.body = JSON.stringify(options.body);
  }

  const url = `${import.meta.env.VITE_PUBLIC_API_URL}${endpoint}`;

  try {
    const response = await fetch(url, config);

    // 1. 204 No Content 처리 (성공으로 간주)
    if (response.status === 204) {
      return {
        result: "success",
        data: undefined,
      } as ApiResponse<T>;
    }

    // 2. 응답 본문 읽기
    const body = (await response.json()) as ApiResponse<T>;

    // 3. 401 처리 (토큰 만료)
    if (
      response.status === 401 &&
      body.error?.code === "TOKEN_EXPIRED" &&
      !skipTokenRefresh
    ) {
      console.log("토큰 만료 감지. 토큰 갱신 시도...");

      try {
        // 토큰 갱신
        await handleTokenRefresh();

        console.log("토큰 갱신 성공. 원래 요청 재시도...");

        // 원래 요청 재시도 (skipTokenRefresh로 무한 루프 방지)
        return fetchApi<T>(endpoint, {
          ...options,
          skipTokenRefresh: true,
          hasToken: true,
        });
      } catch (refreshError) {
        console.error("토큰 갱신 실패:", refreshError);
        // 갱신 실패 시 로그아웃 처리 또는 로그인 페이지로 리다이렉트
        // 여기서는 원래 에러를 그대로 throw
        throw new Error(
          `${body.error?.code || response.status} ${body.error?.message || response.statusText}`,
        );
      }
    }

    // 4. 에러 응답 처리
    if (!response.ok || body.result === "error") {
      const errorCode = body.error?.code ?? response.status.toString();
      const errorMessage = body.error?.message ?? response.statusText;

      throw new Error(`${errorCode} ${errorMessage}`);
    }

    // 5. 성공 응답 처리
    return body;
  } catch (error) {
    // 6. 네트워크 에러 등 fetch 자체 실패
    throw new Error(
      error instanceof Error ? error.message : "알 수 없는 네트워크 오류",
    );
  }
}
