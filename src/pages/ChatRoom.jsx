import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import chatService from '../services/chatService';
import { initSocket, disconnectSocket, getSocket } from '../utils/socket';
import { validateMessage } from '../utils/profanityFilter';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import Skeleton from '../components/ui/Skeleton';
import Badge from '../components/ui/Badge';
import { getImageUrl } from '../utils/config';

const ChatRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const currentUserRef = useRef(null);

  // 현재 사용자 정보 가져오기 및 ref에 저장
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user && user.id) {
          currentUserRef.current = user;
        }
      } catch (e) {
        console.error('Failed to parse user:', e);
      }
    }
  }, []);

  useEffect(() => {
    loadConversation();

    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = '';
      if (socketRef.current) {
        disconnectSocket();
      }
    };
  }, [id]);

  useEffect(() => {
    if (!conversation || !currentUserRef.current) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = initSocket(token);
    socketRef.current = socket;

    socket.emit('join_conversation', conversation.id);

    const handleConnect = () => {
      setSocketConnected(true);
      socket.emit('join_conversation', conversation.id);
    };

    const handleDisconnect = () => {
      setSocketConnected(false);
    };

    const handleNewMessage = (newMessage) => {
      if (newMessage.conversation_id === conversation.id) {
        setMessages((prev) => {
          // 중복 체크
          const exists = prev.some(msg => msg.id === newMessage.id);
          if (exists) return prev;
          
          // 임시 메시지 교체 (내가 보낸 메시지이고 내용이 같은 경우)
          const myId = Number(currentUserRef.current?.id);
          const newSenderId = Number(newMessage.sender_id);
          
          if (myId === newSenderId) {
            const tempIndex = prev.findIndex(msg => 
              msg.id?.toString().startsWith('temp-') && 
              msg.content === newMessage.content &&
              Number(msg.sender_id) === myId
            );
            
            if (tempIndex !== -1) {
              const updated = [...prev];
              updated[tempIndex] = newMessage;
              return updated;
            }
          }
          
          return [...prev, newMessage];
        });
        
        // 상대방 메시지면 읽음 처리
        const myId = Number(currentUserRef.current?.id);
        const newSenderId = Number(newMessage.sender_id);
        if (myId !== newSenderId) {
          socket.emit('mark_messages_read', { conversation_id: conversation.id });
        }
        
        scrollToBottom();
      }
    };

    const handleUserTyping = (data) => {
      if (data.conversation_id === conversation.id) {
        const myId = Number(currentUserRef.current?.id);
        const typingUserId = Number(data.user_id);
        if (myId !== typingUserId) {
          setOtherUserTyping(true);
        }
      }
    };

    const handleUserStoppedTyping = (data) => {
      if (data.conversation_id === conversation.id) {
        const myId = Number(currentUserRef.current?.id);
        const typingUserId = Number(data.user_id);
        if (myId !== typingUserId) {
          setOtherUserTyping(false);
        }
      }
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stopped_typing', handleUserStoppedTyping);

    setSocketConnected(socket.connected);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stopped_typing', handleUserStoppedTyping);
      socket.emit('leave_conversation', conversation.id);
    };
  }, [conversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const loadConversation = async () => {
    try {
      setLoading(true);
      const conversationId = parseInt(id);
      
      if (isNaN(conversationId)) {
        throw new Error('Invalid conversation ID');
      }

      const [conversationData, messagesData] = await Promise.all([
        chatService.getConversation(conversationId),
        chatService.getMessages(conversationId)
      ]);

      setConversation(conversationData.conversation);
      setMessages(messagesData.messages || []);
      
      window.dispatchEvent(new Event('unreadCountUpdate'));

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
    
    if (!message.trim() || !conversation || sending || !currentUserRef.current) return;

    const content = message.trim();
    
    // 욕설 필터 검사 (프론트엔드 1차 차단)
    const validation = validateMessage(content);
    if (!validation.valid) {
      showToast(validation.error, 'error');
      return;
    }
    
    const myId = Number(currentUserRef.current.id);
    
    // 임시 메시지 추가
    const tempMessage = {
      id: `temp-${Date.now()}`,
      conversation_id: conversation.id,
      sender_id: myId,
      sender_nickname: currentUserRef.current.nickname,
      sender_avatar_url: currentUserRef.current.avatar_url || null,
      sender_student_number: currentUserRef.current.student_number || null,
      content,
      created_at: new Date().toISOString(),
      is_read: false
    };

    setMessages((prev) => [...prev, tempMessage]);
    setMessage('');
    setSending(true);
    scrollToBottom();

    try {
      const socket = getSocket();
      if (socket && socket.connected) {
        socket.emit('send_message', {
          conversation_id: conversation.id,
          content
        }, (response) => {
          if (response && response.error) {
            setMessages((prev) => prev.filter(msg => msg.id !== tempMessage.id));
            showToast(response.error, 'error');
            setSending(false);
          } else if (response && response.success) {
            setTimeout(() => {
              window.dispatchEvent(new Event('unreadCountUpdate'));
            }, 500);
          }
        });
      } else {
        const response = await chatService.sendMessage(conversation.id, content);
        setMessages((prev) => {
          const filtered = prev.filter(msg => msg.id !== tempMessage.id);
          return [...filtered, response.message];
        });
        window.dispatchEvent(new Event('unreadCountUpdate'));
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages((prev) => prev.filter(msg => msg.id !== tempMessage.id));
      showToast('메시지 전송에 실패했습니다.', 'error');
    } finally {
      setSending(false);
      requestAnimationFrame(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      });
    }
  };

  // 시간 포맷팅 (HH:mm)
  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  // 메시지가 내 메시지인지 확인 (카카오톡 스타일: 내 메시지는 오른쪽)
  const isMyMessage = (message) => {
    if (!currentUserRef.current || !message) return false;
    const myId = Number(currentUserRef.current.id);
    const senderId = Number(message.sender_id);
    return myId === senderId;
  };

  // 같은 사용자가 1분 이내에 보낸 연속 메시지인지 확인
  const isSameMessageGroup = (currentMsg, prevMsg) => {
    if (!prevMsg || !currentMsg) return false;
    if (Number(currentMsg.sender_id) !== Number(prevMsg.sender_id)) return false;
    
    const currentTime = new Date(currentMsg.created_at).getTime();
    const prevTime = new Date(prevMsg.created_at).getTime();
    const timeDiff = (currentTime - prevTime) / 1000 / 60; // 분 단위
    
    return timeDiff < 1; // 1분 이내
  };

  // 그룹의 첫 메시지인지 확인
  const isFirstInGroup = (currentMsg, prevMsg) => {
    if (!prevMsg) return true;
    if (Number(currentMsg.sender_id) !== Number(prevMsg.sender_id)) return true;
    return !isSameMessageGroup(currentMsg, prevMsg);
  };

  // 그룹의 마지막 메시지인지 확인
  const isLastInGroup = (currentMsg, nextMsg) => {
    if (!nextMsg) return true;
    if (Number(currentMsg.sender_id) !== Number(nextMsg.sender_id)) return true;
    return !isSameMessageGroup(currentMsg, nextMsg);
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

  return (
    <div className="fixed inset-0 flex flex-col bg-primary-50 overflow-hidden" style={{ height: '100vh', width: '100%', top: '64px' }}>
      <div className="flex flex-col max-w-4xl mx-auto w-full h-full overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>
        {/* 상단 고정 영역: 상품 정보 */}
        <div className="flex-shrink-0 px-4 pt-2 pb-2" style={{ flexShrink: 0, zIndex: 10 }}>
          <Card className="p-3">
            <div className="flex items-center justify-between gap-3">
              <Link to="/chat" className="text-primary-600 hover:text-primary-700 flex-shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              
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
              
              {conversation.product?.status && (
                <Badge variant={conversation.product.status === 'SELLING' ? 'success' : 'secondary'} className="flex-shrink-0">
                  {conversation.product.status === 'SELLING' ? '판매중' : '판매완료'}
                </Badge>
              )}
            </div>
          </Card>
        </div>

        {/* 중간 스크롤 영역: 채팅 메시지 리스트 */}
        <div className="flex-1 min-h-0 px-4 py-2 overflow-hidden" style={{ flex: '1 1 0%', minHeight: 0, overflow: 'hidden' }}>
          <Card className="h-full flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4" style={{ minHeight: 0 }}>
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <p>아직 메시지가 없습니다.</p>
                  <p className="text-sm mt-2">첫 메시지를 보내보세요!</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {messages.map((msg, index) => {
                    const prevMsg = index > 0 ? messages[index - 1] : null;
                    const nextMsg = index < messages.length - 1 ? messages[index + 1] : null;
                    
                    const mine = isMyMessage(msg);
                    const isFirst = isFirstInGroup(msg, prevMsg);
                    const isLast = isLastInGroup(msg, nextMsg);
                    const isGrouped = isSameMessageGroup(msg, prevMsg);

                    // 카카오톡 스타일: 내 메시지는 오른쪽, 상대방 메시지는 왼쪽
                    const justifyClass = mine ? 'justify-end' : 'justify-start';
                    const alignClass = mine ? 'items-end' : 'items-start';
                    const bubbleBgClass = mine ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-900';
                    const bubbleRoundedClass = mine 
                      ? (isGrouped ? 'rounded-tr-sm' : 'rounded-tr-lg rounded-tl-lg') 
                      : (isGrouped ? 'rounded-tl-sm' : 'rounded-tl-lg rounded-tr-lg');
                    const timeColorClass = mine ? 'text-gray-400' : 'text-gray-500';

                    return (
                      <div
                        key={msg.id || `msg-${index}`}
                        className={`flex items-end gap-2 ${justifyClass} ${isGrouped ? 'mb-0.5' : 'mb-2'}`}
                      >
                        {/* 상대방 메시지(왼쪽)일 때 프로필 표시 */}
                        {!mine && isFirst && (
                          msg.sender_avatar_url ? (
                            <img
                              src={getImageUrl(msg.sender_avatar_url)}
                              alt={msg.sender_nickname}
                              className="w-8 h-8 rounded-full object-cover border border-primary-200 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary-200 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-semibold text-primary-700">
                                {msg.sender_nickname?.[0]?.toUpperCase() || '?'}
                              </span>
                            </div>
                          )
                        )}
                        {!mine && !isFirst && <div className="w-8 flex-shrink-0" />}
                        
                        {/* 메시지 버블 */}
                        <div className={`flex flex-col ${alignClass} max-w-xs lg:max-w-md`}>
                          {/* 발신자 이름 (상대방 메시지이고 그룹의 첫 메시지일 때만) */}
                          {!mine && isFirst && (
                            <p className="text-xs font-semibold text-gray-600 mb-1 px-1">
                              {msg.sender_student_number && msg.sender_student_number !== '0' ? `${msg.sender_student_number} ` : ''}
                              {msg.sender_nickname || '알 수 없음'}
                            </p>
                          )}
                          
                          {/* 메시지 내용 */}
                          <div className={`px-4 py-2.5 rounded-2xl ${bubbleBgClass} ${bubbleRoundedClass}`}>
                            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                              {msg.content}
                            </p>
                          </div>
                          
                          {/* 시간 표시: 그룹의 마지막 메시지일 때만 */}
                          {isLast && (
                            <p className={`text-xs mt-1 px-1 ${timeColorClass}`}>
                              {formatTime(msg.created_at)}
                            </p>
                          )}
                        </div>
                        
                        {/* 내 메시지(오른쪽)일 때는 프로필 없음 (카카오톡 스타일) */}
                        {mine && <div className="w-8 flex-shrink-0" />}
                      </div>
                    );
                  })}
                </div>
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

            {/* 하단 고정 영역: 메시지 입력창 */}
            <form onSubmit={handleSendMessage} className="flex-shrink-0 p-4 border-t">
              <div className="flex space-x-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    
                    const socket = getSocket();
                    if (socket && socket.connected && conversation) {
                      if (e.target.value.trim().length > 0) {
                        socket.emit('typing_start', { conversation_id: conversation.id });
                      }
                      
                      if (typingTimeoutRef.current) {
                        clearTimeout(typingTimeoutRef.current);
                      }
                      
                      typingTimeoutRef.current = setTimeout(() => {
                        if (socket && socket.connected && conversation) {
                          socket.emit('typing_stop', { conversation_id: conversation.id });
                        }
                      }, 1000);
                    }
                  }}
                  onBlur={() => {
                    const socket = getSocket();
                    if (socket && socket.connected && conversation) {
                      socket.emit('typing_stop', { conversation_id: conversation.id });
                    }
                    if (typingTimeoutRef.current) {
                      clearTimeout(typingTimeoutRef.current);
                    }
                  }}
                  placeholder="메시지를 입력하세요..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-button focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={sending || !socketConnected}
                  onKeyDown={(e) => {
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
