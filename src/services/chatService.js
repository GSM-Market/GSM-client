import api from '../utils/api';

const chatService = {
  // 채팅방 목록 조회
  getConversations: async () => {
    const response = await api.get('/chat/conversations');
    return response.data;
  },

  // 특정 상품에 대한 채팅방 조회 또는 생성
  getOrCreateConversation: async (productId) => {
    const response = await api.get(`/chat/conversations/product/${productId}`);
    return response.data;
  },

  // 특정 채팅방 정보 조회
  getConversation: async (conversationId) => {
    const response = await api.get(`/chat/conversations/${conversationId}`);
    return response.data;
  },

  // 특정 채팅방의 메시지 조회
  getMessages: async (conversationId) => {
    const response = await api.get(`/chat/conversations/${conversationId}/messages`);
    return response.data;
  },

  // 메시지 전송
  sendMessage: async (conversationId, content) => {
    const response = await api.post(`/chat/conversations/${conversationId}/messages`, {
      content
    });
    return response.data;
  },
};

export default chatService;

