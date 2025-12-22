import { useState, useEffect } from 'react';
import chatService from '../services/chatService';
import { initSocket, getSocket } from '../utils/socket';

export const useUnreadMessages = (user) => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    // 초기 읽지 않은 메시지 개수 로드
    const loadUnreadCount = async () => {
      try {
        const data = await chatService.getConversations();
        const totalUnread = (data.conversations || []).reduce((sum, conv) => {
          return sum + (conv.unread_count || 0);
        }, 0);
        setUnreadCount(totalUnread);
      } catch (error) {
        console.error('Failed to load unread count:', error);
      }
    };

    loadUnreadCount();

    // 브라우저 알림 권한 요청
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // unreadCountUpdate 이벤트 리스너 (채팅방 진입 시 호출)
    const handleUnreadCountUpdate = () => {
      loadUnreadCount();
    };

    window.addEventListener('unreadCountUpdate', handleUnreadCountUpdate);

    // Socket 연결 및 새 메시지 감지
    const token = localStorage.getItem('token');
    if (token) {
      const socket = initSocket(token);

      const handleNewMessage = (newMessage) => {
        // 새 메시지가 왔을 때 읽지 않은 개수 증가
        // 단, 현재 채팅방이 아니거나 내가 보낸 메시지가 아닐 때만
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (newMessage.sender_id !== currentUser.id) {
          // 현재 페이지가 채팅방이고, 해당 채팅방의 메시지면 읽지 않은 개수 증가하지 않음
          const currentPath = window.location.pathname;
          const isInChatRoom = currentPath.startsWith('/chat/');
          if (!isInChatRoom || !currentPath.includes(`/chat/${newMessage.conversation_id}`)) {
            setUnreadCount((prev) => prev + 1);
            
            // 브라우저 알림 표시
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('새 메시지', {
                body: `${newMessage.sender_nickname}: ${newMessage.content.substring(0, 50)}${newMessage.content.length > 50 ? '...' : ''}`,
                icon: '/favicon.ico',
                tag: `message-${newMessage.id}`,
                requireInteraction: false
              });
            }
          }
        }
      };

      socket.on('new_message', handleNewMessage);

      // 주기적으로 읽지 않은 메시지 개수 갱신 (30초마다)
      const interval = setInterval(() => {
        loadUnreadCount();
      }, 30000);

      return () => {
        window.removeEventListener('unreadCountUpdate', handleUnreadCountUpdate);
        socket.off('new_message', handleNewMessage);
        clearInterval(interval);
      };
    }

    return () => {
      window.removeEventListener('unreadCountUpdate', handleUnreadCountUpdate);
    };
  }, [user]);

  return unreadCount;
};

