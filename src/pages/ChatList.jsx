import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import chatService from '../services/chatService';
import { initSocket, getSocket } from '../utils/socket';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import { useToast } from '../components/ui/Toast';
import Skeleton from '../components/ui/Skeleton';
import Badge from '../components/ui/Badge';
import { getImageUrl } from '../utils/config';

const ChatList = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);

  useEffect(() => {
    // 인증 확인
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
      console.warn('⚠️ Not authenticated, redirecting to login');
      showToast('로그인이 필요합니다.', 'error');
      navigate('/login');
      return;
    }
    
    console.log('✅ User authenticated, loading conversations');
    loadConversations();
    
    // Socket 연결 및 새 메시지 감지
    if (token) {
      try {
        const socket = initSocket(token);
        socketRef.current = socket;

        const handleNewMessage = () => {
          console.log('📨 New message received, refreshing conversations');
          loadConversations();
        };

        const handleConversationUpdated = () => {
          console.log('🔄 Conversation updated, refreshing list');
          loadConversations();
        };

        socket.on('new_message', handleNewMessage);
        socket.on('conversation_updated', handleConversationUpdated);
        socket.on('connect', () => {
          console.log('✅ Socket connected for chat list');
        });
        socket.on('connect_error', (error) => {
          console.error('❌ Socket connection error:', error);
        });

        // 주기적으로 채팅방 목록 갱신 (읽지 않은 메시지 개수 업데이트)
        const interval = setInterval(() => {
          loadConversations();
        }, 30000);

        return () => {
          socket.off('new_message', handleNewMessage);
          socket.off('conversation_updated', handleConversationUpdated);
          clearInterval(interval);
        };
      } catch (error) {
        console.error('❌ Failed to initialize socket:', error);
      }
    }
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      console.log('📋 Loading conversations...');
      
      // 인증 확인
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('⚠️ No token found, redirecting to login');
        showToast('로그인이 필요합니다.', 'error');
        navigate('/login');
        return;
      }
      
      const data = await chatService.getConversations();
      console.log('✅ Conversations loaded:', data);
      
      setConversations(data.conversations || []);
      
      if (data.conversations && data.conversations.length > 0) {
        console.log(`✅ Found ${data.conversations.length} conversations`);
      } else {
        console.log('ℹ️ No conversations found');
      }
    } catch (error) {
      console.error('❌ Failed to load conversations:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // 401 에러 시 로그인 페이지로 리다이렉트
      if (error.response?.status === 401) {
        showToast('로그인이 필요합니다.', 'error');
        navigate('/login');
        return;
      }
      
      showToast('채팅방 목록을 불러오는데 실패했습니다.', 'error');
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  // 로딩 중이거나 에러 상태 확인
  if (loading) {
    return (
      <div className="min-h-screen bg-primary-50">
        <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">채팅</h1>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="p-4">
                <Skeleton className="h-20 w-full" />
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-50">
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">채팅</h1>

      {conversations.length === 0 ? (
        <Card className="p-12">
          <EmptyState
            icon={
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            }
            title="아직 채팅방이 없어요"
            description="상품 상세 페이지에서 채팅하기 버튼을 눌러 대화를 시작해보세요!"
            actionLabel="상품 둘러보기"
            onAction={() => navigate('/')}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {conversations.map((conv) => (
            <Link key={conv.id} to={`/chat/${conv.id}`}>
              <Card hover className="p-4">
                <div className="flex items-start space-x-4">
                  {/* 상품 이미지 */}
                  <div className="flex-shrink-0">
                    {conv.product_image ? (
                      <img
                        src={getImageUrl(conv.product_image)}
                        alt={conv.product_title}
                        className="w-16 h-16 object-cover rounded-card"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded-card flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* 채팅방 정보 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {conv.other_user_student_number && conv.other_user_student_number !== '0' ? `${conv.other_user_student_number} ` : ''}{conv.other_user_nickname}
                        </h3>
                        <p className="text-sm text-gray-600 truncate">
                          {conv.product_title}
                        </p>
                      </div>
                      {conv.unread_count > 0 && (
                        <Badge variant="danger" className="ml-2">
                          {conv.unread_count}
                        </Badge>
                      )}
                    </div>
                    {conv.last_message && (
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500 truncate flex-1">
                          {conv.last_message}
                        </p>
                        <span className="text-xs text-gray-400 ml-2">
                          {formatDate(conv.last_message_time)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
      </div>
    </div>
  );
};

export default ChatList;
