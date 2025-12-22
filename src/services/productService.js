import api from '../utils/api';

const productService = {
  // 상품 목록 조회
  getProducts: async (params = {}) => {
    console.log('📤 상품 목록 API 호출:', params);
    try {
      const response = await api.get('/products', { params });
      console.log('✅ 상품 목록 API 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ 상품 목록 API 에러:', error);
      throw error;
    }
  },

  // 상품 상세 조회
  getProduct: async (id) => {
    console.log('📤 상품 상세 API 호출:', id);
    try {
      const response = await api.get(`/products/${id}`);
      console.log('✅ 상품 상세 API 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ 상품 상세 API 에러:', error);
      throw error;
    }
  },

  // 상품 등록
  createProduct: async (formData) => {
    console.log('📤 상품 등록 요청 전송');
    console.log('FormData 내용:');
    for (let [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`  ${key}: File(${value.name}, ${value.size} bytes)`);
      } else {
        console.log(`  ${key}: ${value}`);
      }
    }
    
    // FormData를 보낼 때는 Content-Type을 설정하지 않아야 함 (axios가 자동으로 boundary 추가)
    const response = await api.post('/products', formData);
    
    console.log('✅ 상품 등록 응답:', response.data);
    return response.data;
  },

  // 상품 수정
  updateProduct: async (id, formData) => {
    // FormData를 보낼 때는 Content-Type을 설정하지 않아야 함
    const response = await api.put(`/products/${id}`, formData);
    return response.data;
  },

  // 상품 삭제
  deleteProduct: async (id) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },
};

export default productService;


