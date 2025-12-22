import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import productService from '../services/productService';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import { ProductCardSkeleton } from '../components/ui/Skeleton';
import Button from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import ProductCard from '../components/ProductCard';

const Home = () => {
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    sort: 'latest',
    status: '',
    keyword: '',
    category: '',
  });

  useEffect(() => {
    console.log('🏠 Home 컴포넌트 마운트/업데이트');
    loadProducts();
  }, [filters]);

  useEffect(() => {
    // 좋아요 변경 시 상품 목록 갱신 (좋아요 개수 업데이트)
    const handleProductFavoriteUpdated = () => {
      loadProducts();
    };

    window.addEventListener('productFavoriteUpdated', handleProductFavoriteUpdated);

    return () => {
      window.removeEventListener('productFavoriteUpdated', handleProductFavoriteUpdated);
    };
  }, [filters]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('📤 상품 목록 조회 요청:', filters);
      
      const data = await productService.getProducts(filters);
      console.log('✅ 상품 목록 조회 응답:', data);
      
      // 응답이 없는 경우 처리
      if (!data) {
        console.warn('⚠️ 응답 데이터가 없습니다.');
        setProducts([]);
        setLoading(false);
        return;
      }
      
      // products가 배열인지 확인
      if (data && Array.isArray(data.products)) {
        console.log(`📦 ${data.products.length}개의 상품 로드됨`);
        setProducts(data.products);
      } else if (data && Array.isArray(data)) {
        // 응답이 배열로 직접 오는 경우
        console.log(`📦 ${data.length}개의 상품 로드됨 (직접 배열)`);
        setProducts(data);
      } else {
        console.warn('⚠️ 예상하지 못한 응답 형식:', data);
        setProducts([]);
      }
    } catch (err) {
      console.error('❌ Failed to load products:', err);
      console.error('Error details:', err.response?.data || err.message);
      const errorMsg = err.response?.data?.error || '상품을 불러오는데 실패했습니다.';
      setError(errorMsg);
      showToast(errorMsg, 'error');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadProducts();
  };

  return (
    <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">중고거래</h1>

        {/* 검색 및 필터 카드 */}
        <Card className="p-4 sm:p-6 mb-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="상품명 또는 설명으로 검색..."
                value={filters.keyword}
                onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-button focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <div className="flex gap-3">
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  className="px-4 py-2.5 border border-gray-300 rounded-button focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                >
                  <option value="">전체 카테고리</option>
                  <option value="전자제품">전자제품</option>
                  <option value="학용품">학용품</option>
                  <option value="의류">의류</option>
                  <option value="도서">도서</option>
                  <option value="스포츠">스포츠</option>
                  <option value="뷰티/미용">뷰티/미용</option>
                  <option value="식품">식품</option>
                  <option value="가구/인테리어">가구/인테리어</option>
                  <option value="악세서리">악세서리</option>
                  <option value="기타">기타</option>
                </select>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="px-4 py-2.5 border border-gray-300 rounded-button focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                >
                  <option value="">전체</option>
                  <option value="SELLING">판매중</option>
                  <option value="SOLD">판매완료</option>
                </select>
                <select
                  value={filters.sort}
                  onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
                  className="px-4 py-2.5 border border-gray-300 rounded-button focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                >
                  <option value="latest">최신순</option>
                  <option value="price_asc">가격 낮은순</option>
                  <option value="price_desc">가격 높은순</option>
                </select>
                <Button type="submit" variant="primary" size="md">
                  검색
                </Button>
              </div>
            </div>
          </form>
        </Card>
      </div>

      {/* 상품 목록 */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
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
            title="아직 등록된 상품이 없어요"
            description="첫 상품을 등록해보세요!"
            actionLabel="상품 등록하기"
            onAction={() => {
              const user = JSON.parse(localStorage.getItem('user') || 'null');
              if (user) {
                navigate('/products/create');
              } else {
                showToast('로그인이 필요합니다.', 'warning');
                navigate('/login');
              }
            }}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
