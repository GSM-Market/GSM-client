import { useEffect, useState } from 'react';

const AlertDialog = ({ 
  isOpen, 
  onClose, 
  title, 
  message,
  confirmLabel = '확인',
  confirmAction,
  variant = 'default',
  persistent = false, // 배경 클릭으로 닫히지 않도록
  minDisplayTime = 0 // 최소 표시 시간 (ms)
}) => {
  const [canClose, setCanClose] = useState(false);
  const [startTime, setStartTime] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setStartTime(Date.now());
      setCanClose(false);
      
      if (minDisplayTime > 0) {
        const timer = setTimeout(() => {
          setCanClose(true);
        }, minDisplayTime);
        
        return () => clearTimeout(timer);
      } else {
        setCanClose(true);
      }
    }
  }, [isOpen, minDisplayTime]);

  if (!isOpen) return null;

  const variantStyles = {
    default: 'bg-primary-500 hover:bg-primary-600',
    danger: 'bg-danger-500 hover:bg-danger-600',
    warning: 'bg-yellow-500 hover:bg-yellow-600',
    info: 'bg-primary-500 hover:bg-primary-600',
  };

  const handleConfirm = () => {
    // confirmAction 실행 (이 함수에서 상태 변경 및 페이지 이동 처리)
    if (confirmAction) {
      confirmAction();
    }
    // confirmAction이 실행된 후 onClose 호출
    // confirmAction에서 이미 상태를 변경하므로 여기서도 호출
    onClose();
  };

  const handleBackdropClick = (e) => {
    // persistent가 true이면 배경 클릭을 완전히 무시
    if (persistent) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    // persistent가 false이고 canClose가 true일 때만 닫기
    if (canClose) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity" 
      onClick={handleBackdropClick}
      style={{ pointerEvents: 'auto' }}
    >
      <div 
        className="bg-white rounded-card shadow-card p-6 max-w-md w-full mx-4" 
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start space-x-4 mb-4">
          <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
            variant === 'danger' ? 'bg-danger-100' :
            variant === 'warning' ? 'bg-yellow-100' :
            variant === 'info' ? 'bg-primary-100' :
            'bg-primary-100'
          }`}>
            {variant === 'danger' ? (
              <svg className="w-6 h-6 text-danger-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            ) : variant === 'warning' ? (
              <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
            {message && (
              <p className="text-sm text-gray-600 leading-relaxed mb-4">{message}</p>
            )}
          </div>
        </div>
        <div className="flex justify-end">
          <button
            onClick={handleConfirm}
            className={`px-6 py-2.5 text-white rounded-button transition font-medium ${variantStyles[variant]}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertDialog;

