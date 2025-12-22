# 환경 변수 수정 가이드

## 문제
`ERR_CONNECTION_REFUSED` 오류가 발생하는 이유:
- `.env` 파일에 `VITE_API_BASE_URL=http://localhost:3000/api`가 설정되어 있음
- 백엔드 서버가 실행되지 않았거나, nginx를 사용하는 경우 상대 경로를 사용해야 함

## 해결 방법

### 방법 1: nginx를 사용하는 경우 (권장)

`frontend/.env` 파일을 열고 다음 중 하나를 선택:

**옵션 A: 환경 변수 제거 (상대 경로 사용)**
```env
# VITE_API_BASE_URL=http://localhost:3000/api
```

**옵션 B: 상대 경로로 변경**
```env
VITE_API_BASE_URL=/api
```

이렇게 하면 nginx가 `/api` 요청을 백엔드로 프록시합니다.

### 방법 2: 백엔드를 직접 사용하는 경우

1. **백엔드 서버 시작**
   ```bash
   cd backend
   npm start
   ```

2. **`.env` 파일 유지** (현재 설정 그대로)
   ```env
   VITE_API_BASE_URL=http://localhost:3000/api
   ```

### 방법 3: 개발 환경에서 Vite 프록시 사용

개발 환경(`npm run dev`)에서는 Vite의 프록시를 사용하므로:
- `.env` 파일에서 `VITE_API_BASE_URL` 제거 또는 주석 처리
- `vite.config.js`의 프록시 설정이 자동으로 작동

## 확인 사항

1. **백엔드 서버 실행 확인**
   ```bash
   # Windows PowerShell
   Get-NetTCPConnection -LocalPort 3000
   
   # 또는
   netstat -ano | findstr :3000
   ```

2. **프론트엔드 재시작**
   - `.env` 파일을 수정한 후 프론트엔드 개발 서버를 재시작해야 합니다.
   ```bash
   cd frontend
   npm run dev
   ```

3. **프로덕션 빌드**
   - 프로덕션 빌드 전에 `.env` 파일을 올바르게 설정해야 합니다.
   ```bash
   cd frontend
   npm run build
   ```

