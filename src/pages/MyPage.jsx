import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import userService from '../services/userService';
import { useToast } from '../components/ui/Toast';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import Skeleton from '../components/ui/Skeleton';

const MyPage = ({ onLogout }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, selling: 0, sold: 0 });
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [editingNickname, setEditingNickname] = useState(false);
  const [newNickname, setNewNickname] = useState('');

  useEffect(() => {
    loadUserInfo();
    loadStats();
  }, []);

  const loadUserInfo = async () => {
    try {
      setLoading(true);
      const data = await userService.getMyInfo();
      setUserInfo(data);
      setNewNickname(data.nickname || '');
    } catch (error) {
      console.error('Failed to load user info:', error);
      showToast('사용자 정보를 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await userService.getMyProducts();
      const products = data.products || [];
      setStats({
        total: products.length,
        selling: products.filter(p => p.status === 'SELLING').length,
        sold: products.filter(p => p.status === 'SOLD').length,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleLogout = () => {
    onLogout();
    showToast('로그아웃 되었습니다.', 'success');
    navigate('/');
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      showToast('비밀번호를 입력해주세요.', 'error');
      return;
    }

    try {
      setDeleting(true);
      await userService.deleteAccount(deletePassword);
      onLogout();
      showToast('회원 탈퇴가 완료되었습니다.', 'success');
      navigate('/');
    } catch (error) {
      showToast(error.response?.data?.error || '회원 탈퇴에 실패했습니다.', 'error');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
      setDeletePassword('');
    }
  };

  const handleNicknameEdit = () => {
    setEditingNickname(true);
  };

  const handleNicknameCancel = () => {
    setEditingNickname(false);
    setNewNickname(userInfo?.nickname || '');
  };

  const handleNicknameSave = async () => {
    if (!newNickname || newNickname.trim().length < 2) {
      showToast('닉네임은 2자 이상이어야 합니다.', 'error');
      return;
    }

    if (newNickname.trim().length > 20) {
      showToast('닉네임은 20자 이하여야 합니다.', 'error');
      return;
    }

    try {
      const data = await userService.updateNickname(newNickname.trim());
      setUserInfo(data.user);
      // localStorage의 user 정보도 업데이트
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      storedUser.nickname = data.user.nickname;
      localStorage.setItem('user', JSON.stringify(storedUser));
      showToast('닉네임이 변경되었습니다.', 'success');
      setEditingNickname(false);
    } catch (error) {
      const errorMsg = error.response?.data?.error || '닉네임 변경에 실패했습니다.';
      showToast(errorMsg, 'error');
    }
  };

  if (loading) {
    return (
      <div className="max-w-container mx-auto px-4 py-8">
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        </div>
      </div>
    );
  }

  if (!userInfo) {
    return (
      <div className="max-w-container mx-auto px-4 py-8">
        <EmptyState
          title="사용자 정보를 불러올 수 없습니다"
          description="다시 시도해주세요"
          actionLabel="새로고침"
          onAction={() => window.location.reload()}
        />
      </div>
    );
  }

  const getInitials = (nickname) => {
    return nickname?.[0]?.toUpperCase() || 'U';
  };

  return (
    <div className="max-w-container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* 프로필 카드 */}
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
            <div className="w-20 h-20 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-2xl font-bold">
                {getInitials(userInfo.nickname)}
              </span>
            </div>
            <div className="flex-1 text-center sm:text-left w-full">
              {editingNickname ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newNickname}
                    onChange={(e) => setNewNickname(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-button focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="닉네임"
                    maxLength={20}
                  />
                  <div className="flex space-x-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleNicknameSave}
                    >
                      저장
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleNicknameCancel}
                    >
                      취소
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-center sm:justify-start space-x-2 mb-2">
                    <h1 className="text-2xl font-bold text-gray-900">{userInfo.nickname}</h1>
                    <button
                      onClick={handleNicknameEdit}
                      className="text-gray-400 hover:text-primary-600 transition"
                      title="닉네임 수정"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-gray-600 mb-1">{userInfo.email}</p>
                  <div className="flex items-center justify-center sm:justify-start space-x-2 mt-2">
                    {userInfo.is_verified ? (
                      <Badge variant="success">인증 완료</Badge>
                    ) : (
                      <Badge variant="warning">인증 필요</Badge>
                    )}
                    <span className="text-sm text-gray-500">
                      가입일: {userInfo.created_at ? new Date(userInfo.created_at).toLocaleDateString('ko-KR') : '-'}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </Card>

                {/* 내 활동 요약 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="p-6 hover:shadow-card transition-shadow cursor-pointer" onClick={() => navigate('/my-products')}>
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-1">내 상품</p>
                      <p className="text-3xl font-bold text-primary-600">{stats.total}</p>
                      <p className="text-xs text-gray-500 mt-1">전체 상품 수</p>
                    </div>
                  </Card>
                  <Card className="p-6 hover:shadow-card transition-shadow cursor-pointer" onClick={() => navigate('/my-products?status=SELLING')}>
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-1">판매중</p>
                      <p className="text-3xl font-bold text-green-600">{stats.selling}</p>
                      <p className="text-xs text-gray-500 mt-1">현재 판매 중</p>
                    </div>
                  </Card>
                  <Card className="p-6 hover:shadow-card transition-shadow cursor-pointer" onClick={() => navigate('/my-products?status=SOLD')}>
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-1">판매완료</p>
                      <p className="text-3xl font-bold text-gray-600">{stats.sold}</p>
                      <p className="text-xs text-gray-500 mt-1">완료된 거래</p>
                    </div>
                  </Card>
                </div>


        {/* 빠른 액션 */}
        {!userInfo.is_admin && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">빠른 액션</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link to="/products/create">
                <Button variant="primary" size="md" className="w-full">
                  상품 등록하기
                </Button>
              </Link>
              <Link to="/my-products">
                <Button variant="secondary" size="md" className="w-full">
                  내 상품 관리
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {/* 계정 설정 */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">계정 설정</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-button">
              <div>
                <p className="font-medium text-gray-900">이메일 인증</p>
                <p className="text-sm text-gray-500">
                  {userInfo.is_verified ? '인증이 완료되었습니다' : '이메일 인증을 완료해주세요'}
                </p>
              </div>
              {userInfo.is_verified ? (
                <Badge variant="success">완료</Badge>
              ) : (
                <Badge variant="warning">미인증</Badge>
              )}
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-button">
              <div>
                <p className="font-medium text-gray-900">가입일</p>
                <p className="text-sm text-gray-500">
                  {userInfo.created_at ? new Date(userInfo.created_at).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : '-'}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* 계정 관리 */}
        <Card className="p-6 border-2 border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">계정 관리</h2>
          <div className="space-y-3">
            <Button
              variant="secondary"
              size="md"
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full"
            >
              로그아웃
            </Button>
            <Button
              variant="danger"
              size="md"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full"
            >
              회원 탈퇴
            </Button>
          </div>
        </Card>
      </div>

      {/* 로그아웃 확인 모달 */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="로그아웃 하시겠습니까?"
        message="로그아웃하면 다시 로그인해야 합니다."
        confirmLabel="로그아웃"
        variant="default"
      />

      {/* 회원 탈퇴 확인 모달 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => {
          setShowDeleteConfirm(false);
          setDeletePassword('');
        }}>
          <div 
            className="bg-white rounded-card shadow-card p-6 max-w-md w-full mx-4" 
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">회원 탈퇴 하시겠습니까?</h3>
            <p className="text-sm text-gray-600 mb-4">회원 탈퇴 시 모든 데이터가 영구적으로 삭제됩니다.</p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">비밀번호 확인</label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                className="w-full px-4 py-2 border border-gray-300 rounded-button focus:outline-none focus:ring-2 focus:ring-danger-500"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletePassword('');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-button hover:bg-gray-200 transition"
              >
                취소
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting || !deletePassword}
                className="px-4 py-2 text-white bg-danger-500 rounded-button hover:bg-danger-600 transition disabled:opacity-50"
              >
                {deleting ? '탈퇴 중...' : '탈퇴하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyPage;
