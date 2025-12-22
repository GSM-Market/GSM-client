import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import favoriteService from '../services/favoriteService';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import { ProductCardSkeleton } from '../components/ui/Skeleton';
import { useToast } from '../components/ui/Toast';
import ProductCard from '../components/ProductCard';

const Favorites = () => {
  const { showToast } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadFavorites();
    
    // 좋아요 변경 감지
    const handleFavoritesUpdated = () => {
      loadFavorites();
    };
    
    window.addEventListener('favoritesUpdated', handleFavoritesUpdated);
    window.addEventListener('productFavoriteUpdated', handleFavoritesUpdated);
    
    return () => {
      window.removeEventListener('favoritesUpdated', handleFavoritesUpdated);
      window.removeEventListener('productFavoriteUpdated', handleFavoritesUpdated);
    };
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await favoriteService.getFavoriteProducts();
      setProducts(data.products || []);
    } catch (err) {
      console.error('❌ Failed to load favorites:', err);
      const errorMsg = '관심목록을 불러오는데 실패했습니다.';
      setError(errorMsg);
      showToast(errorMsg, 'error');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">관심목록</h1>
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
            title="관심목록을 불러올 수 없습니다"
            description={error}
            actionLabel="다시 시도"
            onAction={loadFavorites}
          />
        </Card>
      ) : products.length === 0 ? (
        <Card className="p-12">
          <EmptyState
            icon={
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            }
            title="아직 관심 상품이 없어요"
            description="하트 아이콘을 눌러 관심 상품을 추가해보세요!"
            actionLabel="상품 둘러보기"
            onAction={() => (window.location.href = '/')}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard 
              key={product.id} 
              product={product}
              onDelete={(deletedId) => {
                setProducts(products.filter(p => p.id !== deletedId));
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites;

