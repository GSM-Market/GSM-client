import axios from 'axios';

// API 기본 URL 결정: 환경 변수 > 현재 호스트 기반 > 프록시 사용
const getApiBaseUrl = () => {
  // 프로덕션 환경에서는 항상 상대 경로 사용 (nginx 프록시)
  if (import.meta.env.PROD) {
    console.log('📦 Production mode, using relative path: /api');
    return '/api';
  }
  
  // 환경 변수가 설정되어 있으면 우선 사용
  if (import.meta.env.VITE_API_BASE_URL) {
    const envUrl = import.meta.env.VITE_API_BASE_URL.trim();
    // 상대 경로인 경우 그대로 사용 (nginx 프록시)
    if (envUrl.startsWith('/')) {
      console.log('🔧 Using VITE_API_BASE_URL (relative):', envUrl);
      return envUrl;
    }
    // 절대 경로인 경우도 프로덕션에서는 무시하고 /api 사용 (nginx 프록시 강제)
    if (import.meta.env.PROD) {
      console.log('⚠️ VITE_API_BASE_URL이 절대 경로로 설정되어 있지만 프로덕션에서는 /api 사용 (nginx 프록시)');
      return '/api';
    }
    // 개발 환경에서만 절대 경로 사용
    console.log('🔧 Using VITE_API_BASE_URL (absolute):', envUrl);
    return envUrl;
  }
  
  // localhost가 아닌 경우도 nginx 프록시 사용 (Docker Compose 환경)
  // 직접 백엔드 포트로 접속하지 않고 nginx를 통해 프록시
  const hostname = window.location.hostname;
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    // Docker Compose 환경에서는 nginx를 통해 프록시
    console.log('🌐 Network access detected, using nginx proxy: /api');
    return '/api';
  }
  
  // localhost인 경우 프록시 사용 (Vite 프록시 설정)
  if (import.meta.env.DEV) {
    console.log('🏠 Localhost detected, using proxy: /api');
    return '/api';
  }
  
  // 기본값
  return '/api';
};

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터: baseURL 업데이트 및 토큰 추가
api.interceptors.request.use(
  (config) => {
    // 프로덕션 환경에서는 항상 상대 경로 사용 (nginx 프록시)
    if (import.meta.env.PROD) {
      config.baseURL = '/api';
    } else if (import.meta.env.VITE_API_BASE_URL?.startsWith('/')) {
      // 환경 변수가 상대 경로로 설정되어 있으면 그대로 사용
      config.baseURL = import.meta.env.VITE_API_BASE_URL;
    } else {
      // 매 요청마다 올바른 baseURL 확인
      const currentHostname = window.location.hostname;
      // localhost가 아니면 항상 nginx 프록시 사용 (Docker Compose 환경)
      if (currentHostname !== 'localhost' && currentHostname !== '127.0.0.1') {
        // Docker Compose 환경에서는 nginx를 통해 프록시 (직접 백엔드 포트 사용 안 함)
        config.baseURL = '/api';
      } else if (import.meta.env.VITE_API_BASE_URL && !import.meta.env.VITE_API_BASE_URL.startsWith('/')) {
        // 개발 환경에서만 절대 경로 사용
        config.baseURL = import.meta.env.VITE_API_BASE_URL;
      } else {
        // localhost인 경우 프록시 사용
        config.baseURL = '/api';
      }
    }
    
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // FormData인 경우 Content-Type을 자동으로 설정하도록 제거
    // 브라우저가 boundary를 포함한 올바른 Content-Type을 자동으로 설정함
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
      console.log('📤 FormData 전송, Content-Type 자동 설정됨');
    }
    
    console.log('📤 API 요청:', config.method?.toUpperCase(), config.baseURL + (config.url || ''));
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터: 401 에러 시 로그아웃
api.interceptors.response.use(
  (response) => {
    console.log('✅ API 응답 성공:', response.config.method?.toUpperCase(), response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ API 에러:', {
      method: error.config?.method?.toUpperCase(),
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // 커스텀 이벤트 발생 (App.jsx에서 감지)
      window.dispatchEvent(new Event('authChange'));
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;


