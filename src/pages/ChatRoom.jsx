import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import chatService from '../services/chatService';
import { initSocket, disconnectSocket, getSocket } from '../utils/socket';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import Skeleton from '../components/ui/Skeleton';
import Badge from '../components/ui/Badge';
import { getImageUrl } from '../utils/config';

// 현재 사용자 정보를 안전하게 가져오는 함수 (컴포넌트 외부로 이동)
const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    const user = JSON.parse(userStr);
    return user && user.id ? user : null;
  } catch (e) {
    console.error('Failed to parse user from localStorage:', e);
    return null;
  }
};

const ChatRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const inputRef = useRef(null); // 입력창 포커스 유지를 위한 ref
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    loadConversation();
    
    // 현재 사용자 정보 확인
    const user = getCurrentUser();
    if (!user || !user.id) {
      console.error('❌ User not found in localStorage');
      showToast('로그인이 필요합니다.', 'error');
      navigate('/login');
    } else {
      console.log('✅ Current user loaded:', {
        id: user.id,
        nickname: user.nickname,
        email: user.email
      });
    }

    // 채팅 페이지일 때 body 스크롤 방지
    document.body.style.overflow = 'hidden';
    
    return () => {
      // 컴포넌트 언마운트 시 body 스크롤 복구
      document.body.style.overflow = '';
    };
  }, [id]);

  useEffect(() => {
    // Socket 연결 (conversation이 로드된 후)
    if (!conversation) return;

    const token = localStorage.getItem('token');
    if (token) {
      const socket = initSocket(token);
      socketRef.current = socket;

      socket.emit('join_conversation', conversation.id);

      // 연결 상태 관리
      const handleConnect = () => {
        setSocketConnected(true);
        socket.emit('join_conversation', conversation.id);
      };

      const handleDisconnect = () => {
        setSocketConnected(false);
      };

      const handleNewMessage = (newMessage) => {
        if (newMessage.conversation_id === conversation.id) {
          const currentUser = getCurrentUser();
          console.log('📨 New message received:', {
            messageId: newMessage.id,
            senderId: newMessage.sender_id,
            currentUserId: currentUser?.id,
            isMine: String(currentUser?.id) === String(newMessage.sender_id)
          });
          
          setMessages((prev) => {
            // 중복 체크
            const exists = prev.some(msg => msg.id === newMessage.id);
            if (exists) {
              return prev;
            }
            
            // 임시 메시지 교체
            const tempIndex = prev.findIndex(msg => msg.id?.toString().startsWith('temp-'));
            if (tempIndex !== -1 && prev[tempIndex].content === newMessage.content) {
              const updated = [...prev];
              updated[tempIndex] = newMessage;
              return updated;
            }
            
            return [...prev, newMessage];
          });
          
          // 내가 보낸 메시지가 아니면 읽음 처리
          if (currentUser && String(currentUser.id) !== String(newMessage.sender_id)) {
            socket.emit('mark_messages_read', { conversation_id: conversation.id });
          }
          
          scrollToBottom();
        }
      };

      const handleUserTyping = (data) => {
        if (data.conversation_id === conversation.id && data.user_id !== getCurrentUser()?.id) {
          setOtherUserTyping(true);
        }
      };

      const handleUserStoppedTyping = (data) => {
        if (data.conversation_id === conversation.id && data.user_id !== getCurrentUser()?.id) {
          setOtherUserTyping(false);
        }
      };

      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);
      socket.on('new_message', handleNewMessage);
      socket.on('user_typing', handleUserTyping);
      socket.on('user_stopped_typing', handleUserStoppedTyping);

      // 초기 연결 상태 확인
      setSocketConnected(socket.connected);

      return () => {
        socket.off('connect', handleConnect);
        socket.off('disconnect', handleDisconnect);
        socket.off('new_message', handleNewMessage);
        socket.off('user_typing', handleUserTyping);
        socket.off('user_stopped_typing', handleUserStoppedTyping);
        socket.emit('leave_conversation', conversation.id);
      };
    }
  }, [conversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversation = async () => {
    try {
      setLoading(true);
      // id는 conversation_id로 가정
      const conversationId = parseInt(id);
      
      if (isNaN(conversationId)) {
        throw new Error('Invalid conversation ID');
      }

      // 채팅방 정보와 메시지 동시 조회
      const [conversationData, messagesData] = await Promise.all([
        chatService.getConversation(conversationId),
        chatService.getMessages(conversationId)
      ]);

      setConversation(conversationData.conversation);
      const loadedMessages = messagesData.messages || [];
      setMessages(loadedMessages);
      
      // 디버깅: 로드된 메시지 정보 확인
      const currentUser = getCurrentUser();
      console.log('📋 Loaded messages:', {
        count: loadedMessages.length,
        currentUserId: currentUser?.id,
        messages: loadedMessages.map(msg => ({
          id: msg.id,
          senderId: msg.sender_id,
          senderNickname: msg.sender_nickname,
          content: msg.content?.substring(0, 20),
          isMine: String(currentUser?.id) === String(msg.sender_id)
        }))
      });
      
      // 읽지 않은 메시지 개수 업데이트 이벤트 발생
      window.dispatchEvent(new Event('unreadCountUpdate'));
      
      // 메시지 로드 후 읽음 처리
      const socket = getSocket();
      if (socket && socket.connected) {
        socket.emit('mark_messages_read', { conversation_id: conversationId });
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
      showToast('채팅방을 불러오는데 실패했습니다.', 'error');
      navigate('/chat');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!message.trim() || !conversation || sending) return;

    const content = message.trim();
    const currentUser = getCurrentUser();
    
    if (!currentUser || !currentUser.id) {
      showToast('로그인이 필요합니다.', 'error');
      navigate('/login');
      return;
    }
    
    const tempMessage = {
      id: `temp-${Date.now()}`,
      conversation_id: conversation.id,
      sender_id: currentUser.id, // 명시적으로 현재 사용자 ID 사용
      sender_nickname: currentUser.nickname,
      content,
      created_at: new Date().toISOString(),
      is_read: false
    };
    
    // 디버깅: 임시 메시지 정보 로그
    console.log('📤 Sending message:', {
      tempMessageId: tempMessage.id,
      senderId: tempMessage.sender_id,
      senderNickname: tempMessage.sender_nickname,
      content: content.substring(0, 30),
      currentUserId: currentUser.id
    });

    // 즉시 로컬 상태에 추가 (낙관적 업데이트)
    setMessages((prev) => [...prev, tempMessage]);
    setMessage('');
    setSending(true);
    scrollToBottom();

    try {
      const socket = getSocket();
      if (socket && socket.connected) {
        // Socket.io로 메시지 전송 (ACK 포함)
        socket.emit('send_message', {
          conversation_id: conversation.id,
          content
        }, (response) => {
          if (response && response.error) {
            // 전송 실패
            setMessages((prev) => prev.filter(msg => msg.id !== tempMessage.id));
            showToast(response.error, 'error');
            setSending(false);
          } else if (response && response.success) {
            // 전송 성공 (서버에서 new_message 이벤트로 실제 메시지가 올 것임)
            setTimeout(() => {
              window.dispatchEvent(new Event('unreadCountUpdate'));
            }, 500);
          }
        });
      } else {
        // Fallback: HTTP API로 전송
        const response = await chatService.sendMessage(conversation.id, content);
        // 임시 메시지를 실제 메시지로 교체
        setMessages((prev) => {
          const filtered = prev.filter(msg => msg.id !== tempMessage.id);
          return [...filtered, response.message];
        });
        // 읽지 않은 메시지 수 업데이트
        window.dispatchEvent(new Event('unreadCountUpdate'));
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // 실패 시 임시 메시지 제거
      setMessages((prev) => prev.filter(msg => msg.id !== tempMessage.id));
      showToast('메시지 전송에 실패했습니다.', 'error');
    } finally {
      setSending(false);
      // 메시지 전송 후 입력창 포커스 유지
      // requestAnimationFrame을 사용하여 렌더링 완료 후 포커스 복구
      requestAnimationFrame(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      });
    }
  };

  // 시간 포맷팅 함수 (HH:mm 형식)
  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };

  // 날짜 키 생성 함수 (YYYY-MM-DD HH:mm 형식)
  const getDateKey = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  // 같은 날짜와 분인지 확인하는 함수
  const isSameDateAndMinute = (dateString1, dateString2) => {
    if (!dateString1 || !dateString2) return false;
    return getDateKey(dateString1) === getDateKey(dateString2);
  };

  // 메시지 묶음의 마지막 메시지인지 확인 (다음 메시지와 날짜/분이 다르면 마지막)
  const isLastInGroup = (currentMsg, nextMsg) => {
    if (!nextMsg) return true; // 마지막 메시지는 항상 그룹의 마지막
    return !isSameDateAndMinute(currentMsg.created_at, nextMsg.created_at);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="p-8">
          <Skeleton className="h-8 w-1/2 mb-4" />
          <Skeleton className="h-64 w-full" />
        </Card>
      </div>
    );
  }

  if (!conversation) {
    return null;
  }

  // 현재 사용자 정보 가져오기 (컴포넌트 외부에 정의된 함수 사용)
  const currentUser = getCurrentUser();
  
  // 메시지가 내 메시지인지 확인하는 함수 (강화된 버전)
  const isMyMessage = (message) => {
    if (!currentUser || !currentUser.id) {
      console.warn('⚠️ Current user not found');
      return false;
    }

    if (!message || !message.sender_id) {
      console.warn('⚠️ Message or sender_id not found:', message);
      return false;
    }

    // 타입 변환을 확실히 하기 위해 문자열로 변환 후 비교
    const myId = String(currentUser.id).trim();
    const msgSenderId = String(message.sender_id).trim();
    
    const isMine = myId === msgSenderId;
    
    // 디버깅용 로그
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Message sender check:', {
        messageId: message.id,
        myId,
        msgSenderId,
        myIdType: typeof currentUser.id,
        msgSenderIdType: typeof message.sender_id,
        isMine,
        myNickname: currentUser.nickname,
        senderNickname: message.sender_nickname
      });
    }
    
    return isMine;
  };

  // 메시지 그룹핑을 위한 헬퍼 함수 (같은 사람이 연속으로 보낸 메시지인지 확인)
  const shouldShowSenderName = (currentMsg, prevMsg) => {
    if (!prevMsg) return true; // 첫 메시지는 항상 이름 표시
    if (isMyMessage(currentMsg)) return false; // 내 메시지는 이름 표시 안 함
    if (isMyMessage(prevMsg)) return true; // 이전 메시지가 내 메시지면 이름 표시
    if (currentMsg.sender_id !== prevMsg.sender_id) return true; // 다른 사람이 보낸 메시지면 이름 표시
    
    // 같은 사람이 연속으로 보낸 메시지인 경우, 시간 차이가 5분 이상이면 이름 표시
    const currentTime = new Date(currentMsg.created_at).getTime();
    const prevTime = new Date(prevMsg.created_at).getTime();
    const timeDiff = (currentTime - prevTime) / 1000 / 60; // 분 단위
    
    return timeDiff >= 5;
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-primary-50 overflow-hidden" style={{ height: '100vh', width: '100%', top: '64px' }}>
      <div className="flex flex-col max-w-4xl mx-auto w-full h-full overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>
        {/* 상단 고정 영역: 상품 정보 (스크롤 금지) */}
        <div className="flex-shrink-0 px-4 pt-2 pb-2" style={{ flexShrink: 0, zIndex: 10 }}>
          <Card className="p-3">
            <div className="flex items-center justify-between gap-3">
              {/* 뒤로가기 버튼 */}
              <Link to="/chat" className="text-primary-600 hover:text-primary-700 flex-shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              
              {/* 상품 정보 */}
              {conversation.product && (
                <Link to={`/products/${conversation.product_id}`} className="flex-1 flex items-center gap-3 min-w-0">
                  {conversation.product.image_url ? (
                    <img
                      src={getImageUrl(conversation.product.image_url)}
                      alt={conversation.product.title}
                      className="w-16 h-16 object-cover rounded-card flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded-card flex items-center justify-center flex-shrink-0">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 line-clamp-1">{conversation.product.title}</p>
                    <p className="text-base font-bold text-primary-600 mt-1">
                      {conversation.product.price?.toLocaleString()}원
                    </p>
                  </div>
                </Link>
              )}
              
              {/* 판매 상태 */}
              {conversation.product?.status && (
                <Badge variant={conversation.product.status === 'SELLING' ? 'success' : 'secondary'} className="flex-shrink-0">
                  {conversation.product.status === 'SELLING' ? '판매중' : '판매완료'}
                </Badge>
              )}
            </div>
          </Card>
        </div>

        {/* 중간 스크롤 영역: 채팅 메시지 리스트 (스크롤 가능) */}
        <div className="flex-1 min-h-0 px-4 py-2 overflow-hidden" style={{ flex: '1 1 0%', minHeight: 0, overflow: 'hidden' }}>
          <Card className="h-full flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ minHeight: 0 }}>
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>아직 메시지가 없습니다.</p>
              <p className="text-sm mt-2">첫 메시지를 보내보세요!</p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isMine = isMyMessage(msg);
              const prevMsg = index > 0 ? messages[index - 1] : null;
              const nextMsg = index < messages.length - 1 ? messages[index + 1] : null;
              const showSenderName = shouldShowSenderName(msg, prevMsg);
              
              // 같은 날짜와 분인지 확인 (이전 메시지와)
              // 첫 메시지(prevMsg가 null)는 항상 시간 표시
              const sameDateAndMinuteAsPrev = prevMsg ? isSameDateAndMinute(msg.created_at, prevMsg.created_at) : false;
              // 묶음의 마지막 메시지인지 확인 (다음 메시지가 없거나 날짜/분이 다르면 마지막)
              const isLast = !nextMsg || !isSameDateAndMinute(msg.created_at, nextMsg.created_at);
              
              // 시간 표시 조건: 첫 메시지이거나, 같은 날짜/분이 아니거나, 묶음의 마지막 메시지일 때
              const shouldShowTime = !prevMsg || !sameDateAndMinuteAsPrev || isLast;
              
              return (
                <div
                  key={msg.id || `msg-${index}`}
                  className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'} mb-1`}
                >
                  {/* 상대방 메시지일 때만 프로필 영역 표시 */}
                  {!isMine && showSenderName && (
                    <div className="w-8 h-8 rounded-full bg-primary-200 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-primary-700">
                        {msg.sender_nickname?.[0]?.toUpperCase() || '?'}
                      </span>
                    </div>
                  )}
                  {!isMine && !showSenderName && (
                    <div className="w-8 flex-shrink-0" />
                  )}
                  
                  {/* 메시지 버블 */}
                  <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-xs lg:max-w-md`}>
                    {/* 발신자 이름 (상대방 메시지이고 그룹의 첫 메시지일 때만) */}
                    {!isMine && showSenderName && (
                      <p className="text-xs font-semibold text-gray-600 mb-1 px-1">
                        {msg.sender_student_number ? `${msg.sender_student_number} ` : ''}{msg.sender_nickname || '알 수 없음'}
                      </p>
                    )}
                    
                    {/* 메시지 내용 */}
                    <div className={`px-4 py-2.5 rounded-2xl ${
                      isMine
                        ? 'bg-primary-500 text-white rounded-tr-sm'
                        : 'bg-gray-100 text-gray-900 rounded-tl-sm'
                    }`}>
                      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                        {msg.content}
                      </p>
                    </div>
                    
                    {/* 시간 표시: 첫 메시지이거나, 같은 분이 아니거나, 묶음의 마지막 메시지일 때만 표시 */}
                    {shouldShowTime && (
                      <p className={`text-xs mt-1 px-1 ${
                        isMine ? 'text-gray-500' : 'text-gray-400'
                      }`}>
                        {formatTime(msg.created_at)}
                      </p>
                    )}
                  </div>
                  
                  {/* 내 메시지일 때는 오른쪽에 공간만 유지 */}
                  {isMine && <div className="w-8 flex-shrink-0" />}
                </div>
              );
            })
          )}
            <div ref={messagesEndRef} />
          </div>

          {/* 타이핑 인디케이터 */}
          {otherUserTyping && (
            <div className="flex-shrink-0 px-4 py-2 text-sm text-gray-500 italic border-t">
              상대방이 입력 중...
            </div>
          )}

          {/* 연결 상태 표시 */}
          {!socketConnected && (
            <div className="flex-shrink-0 px-4 py-2 text-xs text-warning-600 bg-warning-50 border-t">
              연결이 끊어졌습니다. 재연결 중...
            </div>
          )}

          {/* 하단 고정 영역: 메시지 입력창 (스크롤 금지) */}
          <form onSubmit={handleSendMessage} className="flex-shrink-0 p-4 border-t">
          <div className="flex space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                
                // 타이핑 인디케이터 전송
                const socket = getSocket();
                if (socket && socket.connected && conversation) {
                  if (e.target.value.trim().length > 0 && !isTyping) {
                    setIsTyping(true);
                    socket.emit('typing_start', { conversation_id: conversation.id });
                  }
                  
                  // 타이핑 중지 타이머 리셋
                  if (typingTimeoutRef.current) {
                    clearTimeout(typingTimeoutRef.current);
                  }
                  
                  typingTimeoutRef.current = setTimeout(() => {
                    if (socket && socket.connected && conversation) {
                      socket.emit('typing_stop', { conversation_id: conversation.id });
                      setIsTyping(false);
                    }
                  }, 1000);
                }
              }}
              onBlur={() => {
                // 포커스 잃을 때 타이핑 중지
                const socket = getSocket();
                if (socket && socket.connected && conversation && isTyping) {
                  socket.emit('typing_stop', { conversation_id: conversation.id });
                  setIsTyping(false);
                }
                if (typingTimeoutRef.current) {
                  clearTimeout(typingTimeoutRef.current);
                }
              }}
              placeholder="메시지를 입력하세요..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-button focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={sending || !socketConnected}
              onKeyDown={(e) => {
                // Enter 키로 전송 시 포커스 유지
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={!message.trim() || sending || !socketConnected}
            >
              전송
            </Button>
          </div>
        </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;

