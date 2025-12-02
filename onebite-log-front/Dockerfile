FROM node:20-alpine3.20 AS builder

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY . .

# [중요] 빌드 시점에 환경변수 주입 (ARG -> ENV)
ARG VITE_PUBLIC_URL
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_PUBLIC_API_URL

ENV VITE_PUBLIC_URL=$VITE_PUBLIC_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_PUBLIC_API_URL=$VITE_PUBLIC_API_URL

RUN npm run build

# 2단계: 실행 (Nginx 환경)
FROM nginx:alpine

# 기본 Nginx 설정을 삭제하고 우리가 만든 설정 파일을 복사
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 1단계에서 빌드한 결과물을 Nginx의 웹 루트로 복사
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]