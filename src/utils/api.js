import axios from 'axios';

// API 기본 URL 결정: 환경 변수 > 현재 호스트 기반 > 프록시 사용
const getApiBaseUrl = () => {
  // 환경 변수가 설정되어 있으면 우선 사용
  if (import.meta.env.VITE_API_BASE_URL) {
    const envUrl = import.meta.env.VITE_API_BASE_URL.trim();
    // 상대 경로인 경우 그대로 사용 (nginx 프록시)
    if (envUrl.startsWith('/')) {
      console.log('🔧 Using VITE_API_BASE_URL (relative):', envUrl);
      return envUrl;
    }
    // 절대 경로인 경우 사용 (직접 백엔드 접속)
    console.log('🔧 Using VITE_API_BASE_URL (absolute):', envUrl);
    return envUrl;
  }
  
  // 프로덕션 환경에서는 상대 경로 사용 (프론트엔드와 백엔드가 같은 서버에서 서빙)
  if (import.meta.env.PROD) {
    console.log('📦 Production mode, using relative path: /api');
    return '/api';
  }
  
  // localhost가 아닌 경우 (다른 기기에서 접속) - 직접 백엔드 IP 사용
  const hostname = window.location.hostname;
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    const apiUrl = `http://${hostname}:3000/api`;
    console.log('🌐 Network access detected, using direct backend URL:', apiUrl);
    return apiUrl;
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
    // 환경 변수가 상대 경로로 설정되어 있으면 그대로 사용
    if (import.meta.env.VITE_API_BASE_URL?.startsWith('/')) {
      config.baseURL = import.meta.env.VITE_API_BASE_URL;
    } else {
      // 매 요청마다 올바른 baseURL 확인
      const currentHostname = window.location.hostname;
      if (currentHostname !== 'localhost' && currentHostname !== '127.0.0.1') {
        // 다른 기기에서 접속 시 직접 백엔드 IP 사용
        config.baseURL = `http://${currentHostname}:3000/api`;
      } else if (!import.meta.env.VITE_API_BASE_URL) {
        // localhost인 경우 프록시 사용
        config.baseURL = '/api';
      }
    }
    
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // FormData인 경우 Content-Type을 자동으로 설정하도록 제거
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
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


