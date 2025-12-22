import api from '../utils/api';

const favoriteService = {
  // 관심 상품 목록 조회
  getFavoriteProducts: async () => {
    const response = await api.get('/favorites');
    return response.data;
  },

  // 좋아요 추가/제거
  toggleFavorite: async (productId) => {
    const response = await api.post(`/favorites/${productId}`);
    return response.data;
  },

  // 좋아요 상태 확인
  getFavoriteStatus: async (productId) => {
    const response = await api.get(`/favorites/${productId}`);
    return response.data;
  },
};

export default favoriteService;

