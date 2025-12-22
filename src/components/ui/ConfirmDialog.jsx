const ConfirmDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmLabel = '확인',
  cancelLabel = '취소',
  variant = 'default'
}) => {
  if (!isOpen) return null;

  const variantStyles = {
    default: 'bg-primary-500 hover:bg-primary-600',
    danger: 'bg-danger-500 hover:bg-danger-600',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div 
        className="bg-white rounded-card shadow-card p-6 max-w-md w-full mx-4" 
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        {message && (
          <p className="text-sm text-gray-600 mb-6">{message}</p>
        )}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-button hover:bg-gray-200 transition"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 text-white rounded-button transition ${variantStyles[variant]}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;




