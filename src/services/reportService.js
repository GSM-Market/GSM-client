import api from '../utils/api';

const reportService = {
  // 신고 생성
  createReport: async (reportType, targetId, reason, description) => {
    const response = await api.post('/reports', {
      reportType,
      targetId,
      reason,
      description
    });
    return response.data;
  },

  // 모든 신고 조회 (관리자)
  getAllReports: async (status, reportType) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (reportType) params.append('reportType', reportType);
    
    const response = await api.get(`/reports?${params.toString()}`);
    return response.data;
  },

  // 신고 상태 업데이트 (관리자)
  updateReportStatus: async (reportId, status) => {
    const response = await api.put(`/reports/${reportId}/status`, {
      status
    });
    return response.data;
  }
};

export default reportService;

