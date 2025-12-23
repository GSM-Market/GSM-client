import { useState } from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import { useToast } from './ui/Toast';
import reportService from '../services/reportService';

const ReportDialog = ({ isOpen, onClose, reportType, targetId, targetInfo }) => {
  const { showToast } = useToast();
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const reportReasons = [
    '부적절한 내용',
    '스팸/광고',
    '욕설/비방',
    '사기/거짓 정보',
    '저작권 침해',
    '기타'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!reason) {
      showToast('신고 사유를 선택해주세요.', 'error');
      return;
    }

    setLoading(true);
    try {
      await reportService.createReport(reportType, targetId, reason, description);
      showToast('신고가 접수되었습니다. 관리자가 검토 후 조치하겠습니다.', 'success');
      onClose();
      // 폼 초기화
      setReason('');
      setDescription('');
    } catch (error) {
      const errorMsg = error.response?.data?.error || '신고 접수에 실패했습니다.';
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const getTargetName = () => {
    if (reportType === 'PRODUCT') {
      return targetInfo?.title || `상품 #${targetId}`;
    } else if (reportType === 'USER') {
      return targetInfo?.nickname || `사용자 #${targetId}`;
    } else if (reportType === 'MESSAGE') {
      return `메시지 #${targetId}`;
    }
    return '항목';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md p-6 bg-white shadow-2xl border-2 border-gray-300">
        <h2 className="text-xl font-bold text-gray-900 mb-4">신고하기</h2>
        
        <div className="mb-4">
          <p className="text-sm text-gray-700 mb-2 font-medium">신고 대상:</p>
          <p className="font-semibold text-gray-900">{getTargetName()}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              신고 사유 <span className="text-danger-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {reportReasons.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className={`px-3 py-2 text-sm rounded-button border transition ${
                    reason === r
                      ? 'bg-primary-500 text-white border-primary-500'
                      : 'bg-white text-gray-900 border-gray-300 hover:border-primary-300'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              상세 설명 (선택)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="신고 사유에 대한 상세 설명을 입력해주세요."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-button focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              취소
            </Button>
            <Button
              type="submit"
              variant="danger"
              className="flex-1"
              loading={loading}
              disabled={loading || !reason}
            >
              신고하기
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ReportDialog;

