import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // dev 서버 설정
  server: {
    host: "0.0.0.0", // 컨테이너 외부(호스트)에서 접속 가능하게 함
    port: 5173, // 포트 고정 (원하는 포트로 변경 가능)
    watch: {
      usePolling: true, // 윈도우/Mac 파일 시스템 연동 문제 해결 (선택 사항)
    },
  },
  base: "/",
});
