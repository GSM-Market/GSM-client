import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

const ToastContext = createContext();

const ToastItem = ({ toast, onRemove }) => {
  const timeoutRef = useRef(null);
  const removeTimeoutRef = useRef(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  
  // 에러 타입은 5초, 다른 타입은 3초
  const duration = toast.type === 'error' ? 5000 : 3000;

  useEffect(() => {
    // 일시정지 중이면 timeout 설정하지 않음
    if (isPaused) {
      return;
    }

    // fade-out 애니메이션을 위해 300ms 전에 isVisible을 false로 설정
    const fadeOutDelay = duration - 300;
    
    // fade-out 시작
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, fadeOutDelay);

    // 실제 제거는 duration 후에
    removeTimeoutRef.current = setTimeout(() => {
      onRemove(toast.id);
    }, duration);

    // cleanup 함수
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (removeTimeoutRef.current) {
        clearTimeout(removeTimeoutRef.current);
        removeTimeoutRef.current = null;
      }
    };
  }, [duration, isPaused, toast.id, onRemove]);

  const handleClose = () => {
    // 모든 timeout 정리
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (removeTimeoutRef.current) {
      clearTimeout(removeTimeoutRef.current);
      removeTimeoutRef.current = null;
    }
    // 즉시 제거
    setIsVisible(false);
    setTimeout(() => {
      onRemove(toast.id);
    }, 300); // fade-out 애니메이션 시간
  };

  const handleMouseEnter = () => {
    // 마우스를 올리면 일시정지 - 모든 timeout 정리
    setIsPaused(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (removeTimeoutRef.current) {
      clearTimeout(removeTimeoutRef.current);
      removeTimeoutRef.current = null;
    }
  };

  const handleMouseLeave = () => {
    // 마우스를 떼면 다시 시작 - 전체 duration으로 재시작
    setIsPaused(false);
    // useEffect가 다시 실행되어 timeout이 재설정됨
  };

  return (
    <div
      className={`min-w-[300px] px-4 py-3 rounded-button shadow-card flex items-center justify-between transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
      } ${
        toast.type === 'success' ? 'bg-green-500 text-white' :
        toast.type === 'error' ? 'bg-danger-500 text-white' :
        toast.type === 'warning' ? 'bg-yellow-500 text-white' :
        'bg-primary-500 text-white'
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span className="flex-1">{toast.message}</span>
      <button
        onClick={handleClose}
        className="ml-4 text-white hover:text-gray-200 transition-opacity flex-shrink-0"
        aria-label="닫기"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random(); // 고유 ID 생성
    const toast = { id, message, type };
    
    // 에러 타입인 경우, 기존 에러 Toast가 있으면 제거하고 새로 추가 (중복 방지)
    if (type === 'error') {
      setToasts(prev => {
        // 기존 에러 Toast 모두 제거
        const filtered = prev.filter(t => t.type !== 'error');
        return [...filtered, toast];
      });
    } else {
      setToasts(prev => [...prev, toast]);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};
