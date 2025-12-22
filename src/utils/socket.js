import { io } from 'socket.io-client';

let socket = null;

export const initSocket = (token) => {
  if (socket) {
    return socket;
  }

  // 환경 변수 또는 현재 호스트 기반으로 Socket.io 서버 URL 결정
  const getSocketUrl = () => {
    // 환경 변수가 설정되어 있으면 우선 사용
    if (import.meta.env.VITE_SOCKET_URL) {
      return import.meta.env.VITE_SOCKET_URL;
    }
    
    // 프로덕션 환경에서는 현재 origin 사용 (프론트엔드와 백엔드가 같은 서버에서 서빙)
    if (import.meta.env.PROD) {
      return window.location.origin;
    }
    
    // API_BASE_URL에서 추출
    if (import.meta.env.VITE_API_BASE_URL) {
      return import.meta.env.VITE_API_BASE_URL.replace('/api', '');
    }
    
    // localhost가 아닌 경우 (다른 기기에서 접속) - 직접 백엔드 IP 사용
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return `http://${window.location.hostname}:3000`;
    }
    
    // localhost인 경우
    return 'http://localhost:3000';
  };
  
  const socketUrl = getSocketUrl();

  socket = io(socketUrl, {
    auth: {
      token
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    timeout: 20000
  });

  socket.on('connect', () => {
    console.log('✅ Socket connected');
    // 연결 성공 이벤트 발생
    window.dispatchEvent(new CustomEvent('socketConnected'));
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ Socket disconnected:', reason);
    // 연결 해제 이벤트 발생
    window.dispatchEvent(new CustomEvent('socketDisconnected', { detail: { reason } }));
    
    // 서버 측에서 연결이 끊긴 경우 자동 재연결 시도
    if (reason === 'io server disconnect') {
      // 서버가 연결을 끊은 경우, 클라이언트가 수동으로 다시 연결해야 함
      setTimeout(() => {
        if (token) {
          console.log('🔄 Attempting to reconnect...');
          socket.connect();
        }
      }, 1000);
    }
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
    // 연결 오류 이벤트 발생
    window.dispatchEvent(new CustomEvent('socketError', { detail: { error } }));
  });

  socket.on('reconnect', (attemptNumber) => {
    console.log('✅ Socket reconnected after', attemptNumber, 'attempts');
    window.dispatchEvent(new CustomEvent('socketReconnected', { detail: { attemptNumber } }));
  });

  socket.on('reconnect_attempt', (attemptNumber) => {
    console.log('🔄 Reconnection attempt', attemptNumber);
  });

  socket.on('reconnect_error', (error) => {
    console.error('❌ Reconnection error:', error);
  });

  socket.on('reconnect_failed', () => {
    console.error('❌ Reconnection failed');
    window.dispatchEvent(new CustomEvent('socketReconnectFailed'));
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => {
  return socket;
};



