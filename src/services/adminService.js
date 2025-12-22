import api from '../utils/api';

const adminService = {
  // 모든 상품 조회
  getAllProducts: async () => {
    const response = await api.get('/admin/products');
    return response.data;
  },

  // 모든 사용자 조회
  getAllUsers: async () => {
    const response = await api.get('/admin/users');
    return response.data;
  },

  // 상품 삭제
  deleteProduct: async (productId) => {
    const response = await api.delete(`/admin/products/${productId}`);
    return response.data;
  },

  // 사용자 삭제
  deleteUser: async (userId) => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },
};

export default adminService;


