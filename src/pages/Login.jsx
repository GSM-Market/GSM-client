import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';

const Login = ({ onLogin }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 입력값 변경 시 에러 메시지 초기화하지 않음 (사용자가 명시적으로 닫을 때까지 유지)

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 로딩 중이면 무시
    if (loading) {
      return;
    }
    
    // 에러 상태는 입력값 변경 시에만 초기화 (여기서는 초기화하지 않음)
    setLoading(true);

    try {
      // 이메일 도메인 추가 (admin은 특별 처리)
      let fullEmail;
      if (formData.email.toLowerCase() === 'admin') {
        fullEmail = 'admin@gsm.hs.kr';
      } else {
        fullEmail = formData.email.includes('@') ? formData.email : `${formData.email}@gsm.hs.kr`;
      }
      console.log('📧 로그인 시도:', { input: formData.email, fullEmail });
      const data = await authService.login(fullEmail, formData.password);
      console.log('✅ 로그인 성공:', data);
      
      // 사용자 데이터 저장
      if (!data.user || !data.token) {
        throw new Error('로그인 응답 데이터가 올바르지 않습니다.');
      }
      
      console.log('💾 사용자 데이터 저장:', data.user);
      
      // 상태 초기화
      setError('');
      setLoading(false);
      
      // 사용자 데이터 저장 및 상태 업데이트
      onLogin(data.user, data.token);
      
      // Toast 표시
      showToast('로그인되었습니다!', 'success');
      
      // 상태 업데이트 후 네비게이션 (약간의 지연)
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 100);
    } catch (err) {
      // 실패 시 로딩만 해제하고 에러 상태는 유지
      setLoading(false);
      
      const errorData = err.response?.data || {};
      const errorMsg = errorData.error || '로그인에 실패했습니다.';
      
      // 에러 메시지 설정 (항상 설정하여 사라지지 않도록)
      setError(errorMsg);
      
      // Toast도 표시 (에러 타입은 자동으로 사라지지 않음)
      showToast(errorMsg, 'error');
    }
  };


  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <Card className="p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          로그인
        </h2>

        {error && (
          <div className="mb-4 p-4 rounded-button text-sm bg-danger-50 border border-danger-200 text-danger-700 flex items-start justify-between">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError('')}
              className="ml-4 text-danger-600 hover:text-danger-800 flex-shrink-0"
              aria-label="닫기"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              이메일
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.email}
                onChange={(e) => {
                  // @gsm.hs.kr 제거하고 입력값만 저장
                  const value = e.target.value.replace('@gsm.hs.kr', '').trim();
                  setFormData({ ...formData, email: value });
                }}
                placeholder="s25047"
                className="w-full px-4 py-2.5 pr-24 border border-gray-300 rounded-button focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                @gsm.hs.kr
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              이메일 앞부분만 입력하세요 (예: s25047)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              비밀번호
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => {
                setFormData({ ...formData, password: e.target.value });
              }}
              placeholder="비밀번호"
                className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-button focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            disabled={loading}
            className="w-full bg-primary-500 hover:bg-primary-600"
          >
            로그인
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-gray-600">계정이 없으신가요? </span>
          <Link 
            to="/register" 
            className="text-primary-600 hover:text-primary-700 font-medium transition"
          >
            회원가입
          </Link>
        </div>
      </Card>

    </div>
  );
};

export default Login;
