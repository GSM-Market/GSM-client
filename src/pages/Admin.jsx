import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { useToast } from '../components/ui/Toast';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import productService from '../services/productService';
import userService from '../services/userService';
import adminService from '../services/adminService';
import reportService from '../services/reportService';

const Admin = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();
  const activeTab = searchParams.get('tab') || 'products'; // products, users, reports
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalProducts: 0, totalUsers: 0, sellingProducts: 0, soldProducts: 0, pendingReports: 0 });
  const [showDeleteProductConfirm, setShowDeleteProductConfirm] = useState(false);
  const [showDeleteUserConfirm, setShowDeleteUserConfirm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.is_admin) {
      showToast('관리자 권한이 필요합니다.', 'error');
      navigate('/');
      return;
    }
    loadData();
  }, [activeTab, searchParams]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'products') {
        const data = await adminService.getAllProducts();
        const productsList = data.products || [];
        setProducts(productsList);
        // 통계 업데이트
        setStats(prev => ({
          ...prev,
          totalProducts: productsList.length,
          sellingProducts: productsList.filter(p => p.status === 'SELLING').length,
          soldProducts: productsList.filter(p => p.status === 'SOLD').length
        }));
      } else if (activeTab === 'users') {
        const data = await adminService.getAllUsers();
        const usersList = (data.users || []).map(user => ({
          ...user,
          nickname: user.nickname ? user.nickname.replace(/\s*0+\s*$/, '').trim() : user.nickname
        }));
        setUsers(usersList);
        // 통계 업데이트
        setStats(prev => ({
          ...prev,
          totalUsers: usersList.length
        }));
      } else if (activeTab === 'reports') {
        const data = await reportService.getAllReports();
        const reportsList = data.reports || [];
        setReports(reportsList);
        // 통계 업데이트
        setStats(prev => ({
          ...prev,
          pendingReports: reportsList.filter(r => r.status === 'PENDING').length
        }));
      }
      
      // 항상 신고 통계 업데이트 (다른 탭에서도 대기중 신고 수 표시)
      try {
        const reportsData = await reportService.getAllReports();
        const allReports = reportsData.reports || [];
        setStats(prev => ({
          ...prev,
          pendingReports: allReports.filter(r => r.status === 'PENDING').length
        }));
      } catch (err) {
        console.error('Failed to load reports for stats:', err);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      showToast('데이터를 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;
    try {
      await adminService.deleteProduct(selectedProduct.id);
      showToast('상품이 삭제되었습니다.', 'success');
      setProducts(products.filter(p => p.id !== selectedProduct.id));
      setShowDeleteProductConfirm(false);
      setSelectedProduct(null);
    } catch (error) {
      showToast('상품 삭제에 실패했습니다.', 'error');
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      await adminService.deleteUser(selectedUser.id);
      showToast('사용자가 삭제되었습니다.', 'success');
      const updatedUsers = users.filter(u => u.id !== selectedUser.id);
      setUsers(updatedUsers);
      // 통계 업데이트
      setStats(prev => ({
        ...prev,
        totalUsers: updatedUsers.length
      }));
      setShowDeleteUserConfirm(false);
      setSelectedUser(null);
    } catch (error) {
      showToast('사용자 삭제에 실패했습니다.', 'error');
    }
  };

  return (
    <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">관리자</h1>
        <p className="text-gray-600">전체 게시물과 사용자를 관리할 수 있습니다.</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">전체 게시물</p>
            <p className="text-2xl font-bold text-primary-600">{stats.totalProducts}</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">전체 사용자</p>
            <p className="text-2xl font-bold text-primary-600">{stats.totalUsers}</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">판매중 게시물</p>
            <p className="text-2xl font-bold text-green-600">{stats.sellingProducts}</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">대기중 신고</p>
            <p className="text-2xl font-bold text-red-600">{stats.pendingReports}</p>
          </div>
        </Card>
      </div>

      {/* 탭 메뉴 */}
      <div className="flex space-x-1 mb-6 border-b border-gray-200">
        <button
          onClick={() => setSearchParams({ tab: 'products' })}
          className={`px-6 py-3 font-medium transition ${
            activeTab === 'products'
              ? 'text-primary-600 bg-primary-50 border-b-2 border-primary-500'
              : 'text-gray-600 hover:text-primary-600'
          }`}
        >
          게시물 관리
        </button>
        <button
          onClick={() => setSearchParams({ tab: 'users' })}
          className={`px-6 py-3 font-medium transition ${
            activeTab === 'users'
              ? 'text-primary-600 bg-primary-50 border-b-2 border-primary-500'
              : 'text-gray-600 hover:text-primary-600'
          }`}
        >
          사용자 관리
        </button>
        <button
          onClick={() => setSearchParams({ tab: 'reports' })}
          className={`px-6 py-3 font-medium transition relative ${
            activeTab === 'reports'
              ? 'text-primary-600 bg-primary-50 border-b-2 border-primary-500'
              : 'text-gray-600 hover:text-primary-600'
          }`}
        >
          신고 관리
          {stats.pendingReports > 0 && (
            <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {stats.pendingReports}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : activeTab === 'products' ? (
        <div className="space-y-4">
          {products.length === 0 ? (
            <Card className="p-12">
              <EmptyState
                title="등록된 상품이 없습니다"
                description="아직 등록된 상품이 없습니다."
              />
            </Card>
          ) : (
            products.map((product) => (
              <Card key={product.id} className="p-4 hover:shadow-md transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900 truncate">{product.title}</h3>
                      <Badge variant={product.status === 'SELLING' ? 'success' : 'secondary'} className="flex-shrink-0">
                        {product.status === 'SELLING' ? '판매중' : '판매완료'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>작성자: {product.seller_nickname === '관리자' ? `${product.seller_nickname} (${product.seller_email || 'admin@gsm.hs.kr'})` : (product.seller_nickname || '탈퇴한 사용자')}</span>
                      {product.category && product.category !== '관리자' && (
                        <Badge variant="default" className="text-xs">{product.category}</Badge>
                      )}
                      <span>{product.price?.toLocaleString()}원</span>
                      {product.created_at && (
                        <span>{new Date(product.created_at).toLocaleDateString('ko-KR')}</span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      setSelectedProduct(product);
                      setShowDeleteProductConfirm(true);
                    }}
                    className="flex-shrink-0"
                  >
                    삭제
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      ) : activeTab === 'users' ? (
        <div className="space-y-4">
          {users.length === 0 ? (
            <Card className="p-12">
              <EmptyState
                title="등록된 사용자가 없습니다"
                description="아직 등록된 사용자가 없습니다."
              />
            </Card>
          ) : (
            users.map((user) => (
              <Card key={user.id} className="p-4 hover:shadow-md transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{user.nickname}</h3>
                      {user.is_admin && <Badge variant="danger" className="flex-shrink-0">관리자</Badge>}
                      {user.is_verified ? (
                        <Badge variant="success" className="flex-shrink-0">인증완료</Badge>
                      ) : (
                        <Badge variant="warning" className="flex-shrink-0">미인증</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{user.email}</p>
                    <div className="text-sm text-gray-500">
                      가입일: {user.created_at ? new Date(user.created_at).toLocaleDateString('ko-KR') : '-'}
                    </div>
                  </div>
                  {!user.is_admin && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(user);
                        setShowDeleteUserConfirm(true);
                      }}
                      className="flex-shrink-0"
                    >
                      삭제
                    </Button>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      ) : activeTab === 'reports' ? (
        <div className="space-y-4">
          {reports.length === 0 ? (
            <Card className="p-12">
              <EmptyState
                title="신고 내역이 없습니다"
                description="아직 접수된 신고가 없습니다."
              />
            </Card>
          ) : (
            reports.map((report) => (
              <Card key={report.id} className="p-4 hover:shadow-md transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={
                        report.status === 'PENDING' ? 'warning' :
                        report.status === 'RESOLVED' ? 'success' :
                        report.status === 'REJECTED' ? 'secondary' : 'default'
                      }>
                        {report.status === 'PENDING' ? '대기중' :
                         report.status === 'REVIEWED' ? '검토중' :
                         report.status === 'RESOLVED' ? '처리완료' : '거부됨'}
                      </Badge>
                      <Badge variant="default">
                        {report.report_type === 'PRODUCT' ? '상품' :
                         report.report_type === 'USER' ? '사용자' : '메시지'}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-1">신고 사유: {report.reason}</p>
                    {report.description && (
                      <p className="text-sm text-gray-600 mb-2">{report.description}</p>
                    )}
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>신고자: {report.reporter_nickname} ({report.reporter_email})</p>
                      <p>신고일: {new Date(report.created_at).toLocaleString('ko-KR')}</p>
                      {report.reviewed_by && (
                        <p>처리자: {report.reviewer_nickname} ({report.reviewer_email})</p>
                      )}
                      {report.report_type === 'PRODUCT' && (
                        <div className="mt-2 p-2 bg-gray-50 rounded">
                          <p className="font-medium text-xs mb-1">신고 대상:</p>
                          <p className="text-xs">
                            {report.product_title ? (
                              <>상품: {report.product_title} {report.product_price && `(${Number(report.product_price).toLocaleString()}원)`}</>
                            ) : (
                              <>상품 ID: {report.target_id}</>
                            )}
                          </p>
                        </div>
                      )}
                      {report.report_type === 'USER' && (
                        <div className="mt-2 p-2 bg-gray-50 rounded">
                          <p className="font-medium text-xs mb-1">신고 대상:</p>
                          <p className="text-xs">
                            {report.target_user_nickname ? (
                              <>사용자: {report.target_user_nickname} ({report.target_user_email})</>
                            ) : (
                              <>사용자 ID: {report.target_id}</>
                            )}
                          </p>
                        </div>
                      )}
                      {report.report_type === 'MESSAGE' && (
                        <div className="mt-2 p-2 bg-gray-50 rounded">
                          <p className="font-medium text-xs mb-1">신고 대상:</p>
                          <p className="text-xs">메시지 ID: {report.target_id}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  {report.status === 'PENDING' && (
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        variant="success"
                        size="sm"
                        onClick={async () => {
                          try {
                            await reportService.updateReportStatus(report.id, 'RESOLVED');
                            showToast('신고가 처리되었습니다.', 'success');
                            loadData();
                          } catch (error) {
                            showToast('신고 처리에 실패했습니다.', 'error');
                          }
                        }}
                      >
                        처리완료
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={async () => {
                          try {
                            await reportService.updateReportStatus(report.id, 'REJECTED');
                            showToast('신고가 거부되었습니다.', 'success');
                            loadData();
                          } catch (error) {
                            showToast('신고 처리에 실패했습니다.', 'error');
                          }
                        }}
                      >
                        거부
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      ) : null}

      <ConfirmDialog
        isOpen={showDeleteProductConfirm}
        onClose={() => {
          setShowDeleteProductConfirm(false);
          setSelectedProduct(null);
        }}
        onConfirm={handleDeleteProduct}
        title="상품을 삭제하시겠습니까?"
        message="삭제된 상품은 복구할 수 없습니다."
        confirmLabel="삭제"
        variant="danger"
      />

      <ConfirmDialog
        isOpen={showDeleteUserConfirm}
        onClose={() => {
          setShowDeleteUserConfirm(false);
          setSelectedUser(null);
        }}
        onConfirm={handleDeleteUser}
        title="사용자를 삭제하시겠습니까?"
        message="삭제된 사용자의 모든 데이터가 영구적으로 삭제됩니다."
        confirmLabel="삭제"
        variant="danger"
      />
    </div>
  );
};

export default Admin;

