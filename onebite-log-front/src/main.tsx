import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter } from "react-router";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "sonner";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 1. 데이터 신선도 유지 시간 (가장 중요)
      // 기본값 0 -> 5분으로 변경
      // 5분 내에는 재진입해도 API를 호출하지 않고 캐시된 데이터를 보여줌
      staleTime: 1000 * 60 * 5,

      // 2. 가비지 컬렉션 시간
      // staleTime보다 길게 설정해야 함 (보통 1.5배 ~ 2배)
      gcTime: 1000 * 60 * 10,

      // 3. 재시도 횟수
      // 기본값 3 -> 1 또는 0으로 줄임
      // 404, 500 에러가 떴을 때 3번이나 재시도하는 건 사용자에게 너무 느린 경험을 줌
      retry: 0,

      // 4. 창 포커스 시 재요청
      // 기본값 true -> false (선택 사항)
      // 사용자가 잠깐 다른 탭/앱 갔다 왔다고 바로 재요청하면 깜빡임이 심함
      refetchOnWindowFocus: false,

      // 5. 네트워크 재연결 시 재요청
      // 모바일 환경에서는 true가 좋음 (지하철 등에서 끊겼다 연결될 때 갱신)
      refetchOnReconnect: true,
    },
    mutations: {
      // Mutation 실패 시 재시도하지 않음 (중복 결제/생성 방지)
      retry: 0,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools />
      <Toaster />
      <App />
    </QueryClientProvider>
  </BrowserRouter>,
);
