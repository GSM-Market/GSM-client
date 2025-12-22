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

const Admin = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();
  const activeTab = searchParams.get('tab') || 'products'; // products, users
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalProducts: 0, totalUsers: 0, sellingProducts: 0, soldProducts: 0 });
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
      } else {
        const data = await adminService.getAllUsers();
        const usersList = data.users || [];
        setUsers(usersList);
        // 통계 업데이트
        setStats(prev => ({
          ...prev,
          totalUsers: usersList.length
        }));
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
      </div>

      {/* 탭 메뉴 */}
      {activeTab === 'products' && (
        <div className="flex space-x-1 mb-6 border-b border-gray-200">
          <div className="px-6 py-3 font-medium text-primary-600 bg-primary-50 border-b-2 border-primary-500">
            게시물 관리
          </div>
        </div>
      )}
      {activeTab === 'users' && (
        <div className="flex space-x-1 mb-6 border-b border-gray-200">
          <div className="px-6 py-3 font-medium text-primary-600 bg-primary-50 border-b-2 border-primary-500">
            사용자 관리
          </div>
        </div>
      )}

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
      ) : (
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
      )}

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

