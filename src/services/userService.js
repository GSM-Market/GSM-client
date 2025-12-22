import api from '../utils/api';

const userService = {
  // 내 정보 조회
  getMyInfo: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },

  // 내 상품 목록 조회
  getMyProducts: async (params = {}) => {
    console.log('📤 내 상품 API 호출:', params);
    try {
      const response = await api.get('/users/me/products', { params });
      console.log('✅ 내 상품 API 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ 내 상품 API 에러:', error);
      throw error;
    }
  },

  // 닉네임 변경
  updateNickname: async (nickname) => {
    const response = await api.put('/users/me/nickname', { nickname });
    return response.data;
  },

  // 회원 탈퇴
  deleteAccount: async (password) => {
    const response = await api.delete('/users/me', {
      data: { password },
    });
    return response.data;
  },
};

export default userService;


