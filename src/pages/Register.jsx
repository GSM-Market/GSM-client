import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import { validateEmail, getEmailError, validatePassword, validateNickname } from '../utils/validation';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';

const Register = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [step, setStep] = useState(1); // 1: 회원가입, 2: 이메일 인증
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    nickname: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    // 프론트엔드 검증
    const emailError = getEmailError(formData.email);
    if (emailError) {
      setError(emailError);
      return;
    }

    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    // 비밀번호 확인 검증
    if (formData.password !== formData.passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    const nicknameError = validateNickname(formData.nickname);
    if (nicknameError) {
      setError(nicknameError);
      return;
    }

    setLoading(true);

    try {
      // 이메일 도메인 추가
      const fullEmail = formData.email.includes('@') ? formData.email : `${formData.email}@gsm.hs.kr`;
      const response = await authService.register(fullEmail, formData.password, formData.nickname);
      
      // 이메일 발송 실패 시 경고 메시지 표시
      if (response?.warning) {
        showToast(response.warning, 'warning');
        // 이메일 발송 실패해도 계정은 생성되었으므로 인증 단계로 진행
        setStep(2);
      } else {
        showToast('인증 코드가 발송되었습니다. 이메일을 확인해주세요.', 'success');
        setStep(2);
      }
    } catch (err) {
      const errorData = err.response?.data || {};
      const errorMsg = errorData.error || '회원가입에 실패했습니다.';
      setError(errorMsg);
      showToast(errorMsg, 'error');
      console.error('회원가입 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 이메일 도메인 추가
      const fullEmail = formData.email.includes('@') ? formData.email : `${formData.email}@gsm.hs.kr`;
      await authService.verifyEmail(fullEmail, verificationCode);
      showToast('회원가입이 완료되었습니다!', 'success');
      navigate('/login');
    } catch (err) {
      const errorMsg = err.response?.data?.error || '인증에 실패했습니다.';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError('');
    setLoading(true);

    try {
      // 이메일 도메인 추가
      const fullEmail = formData.email.includes('@') ? formData.email : `${formData.email}@gsm.hs.kr`;
      await authService.resendCode(fullEmail);
      showToast('인증 코드가 재발송되었습니다.', 'success');
    } catch (err) {
      const errorMsg = err.response?.data?.error || '재발송에 실패했습니다.';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (step === 1) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <Card className="p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            회원가입
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-danger-50 border border-danger-200 text-danger-700 rounded-button text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이메일 <span className="text-danger-500">*</span>
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
                비밀번호 <span className="text-danger-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    if (error) setError('');
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
              <p className="mt-1 text-xs text-gray-500">6자 이상 입력해주세요.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호 확인 <span className="text-danger-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPasswordConfirm ? 'text' : 'password'}
                  value={formData.passwordConfirm}
                  onChange={(e) => {
                    setFormData({ ...formData, passwordConfirm: e.target.value });
                    if (error) setError('');
                  }}
                  placeholder="비밀번호 확인"
                  className={`w-full px-4 py-2.5 pr-10 border rounded-button focus:outline-none focus:ring-2 ${
                    formData.passwordConfirm && formData.password !== formData.passwordConfirm
                      ? 'border-danger-500 focus:ring-danger-500'
                      : 'border-gray-300 focus:ring-primary-500 focus:border-transparent'
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPasswordConfirm ? (
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
              {formData.passwordConfirm && formData.password !== formData.passwordConfirm && (
                <p className="mt-1 text-xs text-danger-500">비밀번호가 일치하지 않습니다.</p>
              )}
              {formData.passwordConfirm && formData.password === formData.passwordConfirm && (
                <p className="mt-1 text-xs text-success-600">비밀번호가 일치합니다.</p>
              )}
              {!formData.passwordConfirm && (
                <p className="mt-1 text-xs text-gray-500">비밀번호를 다시 입력해주세요.</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이름 <span className="text-danger-500">*</span>
              </label>
              <input
                type="text"
                value={formData.nickname}
                onChange={(e) => {
                  setFormData({ ...formData, nickname: e.target.value });
                }}
                placeholder="실명을 입력하세요"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-button focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
              <p className="mt-1 text-xs text-danger-600 leading-tight">
                ⚠️ 반드시 실명을 입력해주세요.
              </p>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              disabled={loading}
              className="w-full bg-primary-500 hover:bg-primary-600"
            >
              회원가입
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">이미 계정이 있으신가요? </span>
            <Link 
              to="/login" 
              className="text-primary-600 hover:text-primary-700 font-medium transition"
            >
              로그인
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <Card className="p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          이메일 인증
        </h2>

        <p className="text-gray-600 mb-6 text-center">
          <span className="font-medium">{formData.email.includes('@') ? formData.email : `${formData.email}@gsm.hs.kr`}</span>로 발송된<br />
          인증 코드를 입력해주세요.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-danger-50 border border-danger-200 text-danger-700 rounded-button text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              인증 코드
            </label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setVerificationCode(value);
                if (error) setError('');
              }}
              placeholder="000000"
              maxLength="6"
              className="w-full px-4 py-3 border border-gray-300 rounded-button focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-center text-2xl tracking-widest font-mono"
              required
            />
            <p className="mt-2 text-xs text-gray-500 text-center">
              이 코드는 5분간 유효합니다.
            </p>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            disabled={loading || verificationCode.length !== 6}
            className="w-full"
          >
            인증하기
          </Button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={handleResendCode}
            disabled={loading}
            className="text-sm text-primary-600 hover:text-primary-700 disabled:opacity-50 transition"
          >
            인증 코드 재발송
          </button>
        </div>
      </Card>
    </div>
  );
};

export default Register;
