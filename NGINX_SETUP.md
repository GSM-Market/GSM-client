# Nginx 설정 가이드

## 파일 설명

### `nginx.conf`
- Docker 컨테이너 환경용 설정
- `backend:3000`으로 프록시 (Docker 네트워크 내부)
- 프로덕션 환경에서 사용

### `nginx.conf.localhost`
- 로컬 개발 환경용 설정
- `localhost:3000`으로 프록시
- 로컬에서 nginx로 테스트할 때 사용

## 사용 방법

### 방법 1: Docker Compose 사용 (권장)

`docker-compose.yml` 파일에 다음을 추가:

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "80:80"
    depends_on:
      - backend
    volumes:
      - ./frontend/dist:/usr/share/nginx/html:ro

  backend:
    build:
      context: ./backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    volumes:
      - ./backend/uploads:/app/uploads
```

실행:
```bash
docker-compose up -d
```

### 방법 2: 로컬 nginx 사용

1. **nginx 설치** (Windows)
   - https://nginx.org/en/download.html 에서 다운로드
   - 또는 Chocolatey: `choco install nginx`

2. **설정 파일 복사**
   ```bash
   # nginx 설치 디렉토리로 이동 (보통 C:\nginx)
   cd C:\nginx\conf
   
   # nginx.conf.localhost를 default.conf로 복사
   copy frontend\nginx.conf.localhost default.conf
   ```

3. **설정 파일 수정**
   - `root` 경로를 프론트엔드 빌드 디렉토리로 변경:
   ```nginx
   root C:/Users/user/Desktop/DOCK/frontend/dist;
   ```

4. **nginx 시작**
   ```bash
   nginx
   ```

5. **접속**
   - http://localhost 접속

### 방법 3: Docker 단독 사용

1. **프론트엔드 빌드**
   ```bash
   cd frontend
   npm run build
   ```

2. **Docker 이미지 빌드**
   ```bash
   docker build -t gsm-market-frontend ./frontend
   ```

3. **컨테이너 실행**
   ```bash
   docker run -d \
     -p 80:80 \
     -v ./frontend/dist:/usr/share/nginx/html:ro \
     --name gsm-market-frontend \
     gsm-market-frontend
   ```

## 설정 설명

### API 프록시 (`/api`)
- 모든 `/api/*` 요청을 백엔드로 전달
- WebSocket 업그레이드 지원

### Socket.io 프록시 (`/socket.io`)
- Socket.io 연결을 백엔드로 전달
- WebSocket 연결 유지

### 업로드 파일 프록시 (`/uploads`)
- 업로드된 이미지 파일을 백엔드에서 서빙
- 캐싱 설정 포함

### SPA 라우팅
- React Router를 위한 설정
- 모든 경로를 `index.html`로 리다이렉트

## 문제 해결

### 502 Bad Gateway
- 백엔드가 실행 중인지 확인
- `proxy_pass` URL이 올바른지 확인

### Socket.io 연결 실패
- WebSocket 업그레이드 헤더 확인
- 타임아웃 설정 확인

### 이미지가 보이지 않음
- `/uploads` 경로 프록시 확인
- 백엔드 업로드 디렉토리 확인

## 보안 설정 (프로덕션)

프로덕션 환경에서는 다음을 추가하세요:

```nginx
# HTTPS 리다이렉트
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # ... 기존 설정 ...
}
```

