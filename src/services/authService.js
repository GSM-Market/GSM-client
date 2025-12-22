import api from '../utils/api';

const authService = {
  // 회원가입
  register: async (email, password, nickname) => {
    const response = await api.post('/auth/register', {
      email,
      password,
      nickname,
    });
    return response.data;
  },

  // 이메일 인증
  verifyEmail: async (email, code) => {
    const response = await api.post('/auth/verify-email', {
      email,
      code,
    });
    return response.data;
  },

  // 인증 코드 재발송
  resendCode: async (email) => {
    const response = await api.post('/auth/resend-code', {
      email,
    });
    return response.data;
  },

  // 로그인
  login: async (email, password) => {
    const response = await api.post('/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  // 로그아웃
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};

export default authService;


