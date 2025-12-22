import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

const ToastContext = createContext();

const ToastItem = ({ toast, onRemove }) => {
  const timeoutRef = useRef(null);

  useEffect(() => {
    // 5초 후 자동으로 제거
    timeoutRef.current = setTimeout(() => {
      onRemove(toast.id);
    }, 5000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [toast.id, onRemove]);

  const handleClose = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    onRemove(toast.id);
  };

  return (
    <div
      className={`min-w-[300px] px-4 py-3 rounded-button shadow-card flex items-center justify-between transition-all duration-300 animate-in slide-in-from-right ${
        toast.type === 'success' ? 'bg-green-500 text-white' :
        toast.type === 'error' ? 'bg-danger-500 text-white' :
        toast.type === 'warning' ? 'bg-yellow-500 text-white' :
        'bg-primary-500 text-white'
      }`}
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
    setToasts(prev => [...prev, toast]);
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



