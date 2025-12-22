import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import userService from '../services/userService';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import { ProductCardSkeleton } from '../components/ui/Skeleton';
import { useToast } from '../components/ui/Toast';
import ProductCard from '../components/ProductCard';

const MyProducts = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProducts();
  }, [searchParams]);

  // 상품 상태 변경 이벤트 리스너
  useEffect(() => {
    const handleProductStatusUpdated = async () => {
      // 상태 변경 후 목록 새로고침 (에러 발생 시 조용히 처리, Toast 표시 안 함)
      try {
        setError(null);
        const data = await userService.getMyProducts();
        
        let allProducts = [];
        if (data && Array.isArray(data.products)) {
          allProducts = data.products;
        } else if (data && Array.isArray(data)) {
          allProducts = data;
        } else if (data && data.data && Array.isArray(data.data.products)) {
          allProducts = data.data.products;
        }
        
        const statusFilter = searchParams.get('status');
        if (statusFilter) {
          const filtered = allProducts.filter(p => p.status === statusFilter);
          setProducts(filtered);
        } else {
          setProducts(allProducts);
        }
      } catch (err) {
        // 상태 변경 후 새로고침 실패는 조용히 처리 (이미 성공 메시지가 표시되었으므로)
        console.warn('상품 목록 새로고침 실패 (무시됨):', err);
      }
    };
    
    window.addEventListener('productStatusUpdated', handleProductStatusUpdated);
    return () => {
      window.removeEventListener('productStatusUpdated', handleProductStatusUpdated);
    };
  }, [searchParams]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('📤 내 상품 조회 요청');
      
      const data = await userService.getMyProducts();
      console.log('✅ 내 상품 조회 응답:', data);
      
      // 응답 형식 확인
      let allProducts = [];
      if (data && Array.isArray(data.products)) {
        allProducts = data.products;
      } else if (data && Array.isArray(data)) {
        // 응답이 배열로 직접 오는 경우
        allProducts = data;
      } else if (data && data.data && Array.isArray(data.data.products)) {
        // 중첩된 응답 형식
        allProducts = data.data.products;
      } else {
        console.warn('⚠️ 예상하지 못한 응답 형식:', data);
        allProducts = [];
      }
      
      console.log(`📦 총 ${allProducts.length}개의 상품 로드됨`);
      
      // URL 파라미터로 필터링
      const statusFilter = searchParams.get('status');
      if (statusFilter) {
        const filtered = allProducts.filter(p => p.status === statusFilter);
        console.log(`🔍 ${statusFilter} 필터 적용: ${filtered.length}개`);
        setProducts(filtered);
      } else {
        setProducts(allProducts);
      }
    } catch (err) {
      console.error('❌ Failed to load products:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      const errorMsg = err.response?.data?.error || '상품을 불러오는데 실패했습니다.';
      setError(errorMsg);
      showToast(errorMsg, 'error');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  return (
    <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">내 상품</h1>
        {/* Header에 이미 "상품등록" 버튼이 있으므로 중복 제거 */}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <Card className="p-12">
          <EmptyState
            title="상품을 불러올 수 없습니다"
            description={error}
            actionLabel="다시 시도"
            onAction={loadProducts}
          />
        </Card>
      ) : products.length === 0 ? (
        <Card className="p-12">
          <EmptyState
            icon={
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            }
            title={
              searchParams.get('status') === 'SELLING' 
                ? '판매중인 상품이 없습니다' 
                : searchParams.get('status') === 'SOLD'
                ? '판매완료된 상품이 없습니다'
                : '아직 등록한 상품이 없어요'
            }
            description={
              searchParams.get('status') === 'SELLING' 
                ? '현재 판매중인 상품이 없습니다.' 
                : searchParams.get('status') === 'SOLD'
                ? '판매완료된 상품이 없습니다.'
                : '첫 상품을 등록해보세요!'
            }
            actionLabel={!searchParams.get('status') ? '상품 등록하기' : undefined}
            onAction={!searchParams.get('status') ? () => navigate('/products/create') : undefined}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              showEdit={true}
              showDelete={true}
              onDelete={(deletedId) => {
                setProducts(products.filter(p => p.id !== deletedId));
              }}
              onStatusChange={(productId, newStatus) => {
                setProducts(products.map(p => 
                  p.id === productId ? { ...p, status: newStatus } : p
                ));
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyProducts;
