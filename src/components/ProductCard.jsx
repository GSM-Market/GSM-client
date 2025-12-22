import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Card from './ui/Card';
import Badge from './ui/Badge';
import { useToast } from './ui/Toast';
import productService from '../services/productService';
import favoriteService from '../services/favoriteService';
import ConfirmDialog from './ui/ConfirmDialog';
import { getImageUrl } from '../utils/config';

const ProductCard = ({ product: initialProduct, onDelete, showDelete = false, showEdit = false, onStatusChange }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [product, setProduct] = useState(initialProduct); // 내부 상태로 관리
  const [isFavorite, setIsFavorite] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  // prop이 변경되면 내부 상태 업데이트
  useEffect(() => {
    setProduct(initialProduct);
  }, [initialProduct]);

  useEffect(() => {
    // 로그인한 경우 좋아요 상태 확인
    if (user) {
      loadFavoriteStatus();
    }
  }, [product.id, user]);

  const loadFavoriteStatus = async () => {
    try {
      const data = await favoriteService.getFavoriteStatus(product.id);
      setIsFavorite(data.is_favorite);
    } catch (error) {
      console.error('Failed to load favorite status:', error);
    }
  };

  const toggleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      showToast('로그인이 필요합니다.', 'warning');
      return;
    }

    try {
      const data = await favoriteService.toggleFavorite(product.id);
      setIsFavorite(data.is_favorite);
      // 커스텀 이벤트 발생 (같은 탭에서도 감지 가능)
      window.dispatchEvent(new Event('favoritesUpdated'));
      // 좋아요 개수 업데이트를 위해 이벤트 발생
      window.dispatchEvent(new CustomEvent('productFavoriteUpdated', { 
        detail: { 
          productId: product.id, 
          isFavorite: data.is_favorite 
        } 
      }));
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      showToast('좋아요 처리에 실패했습니다.', 'error');
    }
  };

  const handleEdit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/products/${product.id}/edit`);
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      setDeleting(true);
      await productService.deleteProduct(product.id);
      showToast('상품이 삭제되었습니다.', 'success');
      if (onDelete) {
        onDelete(product.id);
      } else {
        window.location.reload();
      }
    } catch (error) {
      showToast(error.response?.data?.error || '삭제에 실패했습니다.', 'error');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleStatusToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!product.is_mine) return;
    
    const newStatus = product.status === 'SELLING' ? 'SOLD' : 'SELLING';
    
    try {
      const formData = new FormData();
      formData.append('status', newStatus);
      await productService.updateProduct(product.id, formData);
      
      // 로컬 상태 즉시 업데이트 (UI 반응성 향상)
      setProduct(prevProduct => ({
        ...prevProduct,
        status: newStatus
      }));
      
      // 성공 메시지 표시
      showToast(`상품 상태가 ${newStatus === 'SOLD' ? '판매완료' : '판매중'}으로 변경되었습니다.`, 'success');
      
      // 부모 컴포넌트에 상태 변경 알림 (로컬 상태 업데이트)
      if (onStatusChange) {
        onStatusChange(product.id, newStatus);
      }
      
      // 상품 목록 새로고침을 위해 이벤트 발생 (백그라운드 동기화)
      // 에러가 발생해도 이미 성공했으므로 조용히 처리됨
      setTimeout(() => {
        window.dispatchEvent(new Event('productStatusUpdated'));
      }, 100);
    } catch (error) {
      console.error('상태 변경 오류:', error);
      showToast(error.response?.data?.error || '상태 변경에 실패했습니다.', 'error');
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
    <Link
      to={`/products/${product.id}`}
      className="block"
    >
      <Card hover className="overflow-hidden h-full flex flex-col">
        <div className="relative w-full h-64 bg-gray-100 overflow-hidden">
          {product.image_url ? (
            <img
              src={getImageUrl(product.image_url)}
              alt={product.title}
              className="w-full h-full object-cover object-center"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          <div className="absolute top-2 right-2 flex flex-col items-end space-y-1 z-10">
            <button
              onClick={toggleFavorite}
              className={`p-2 rounded-full transition shadow-md ${
                isFavorite 
                  ? 'bg-danger-500 text-white hover:bg-danger-600' 
                  : 'bg-white bg-opacity-90 text-gray-600 hover:bg-opacity-100 hover:text-danger-500'
              }`}
              title={isFavorite ? '관심 상품 해제' : '관심 상품 추가'}
            >
              <svg className="w-5 h-5" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
            {product.status === 'SOLD' ? (
              <Badge variant="dark">판매완료</Badge>
            ) : (
              <Badge variant="success">판매중</Badge>
            )}
            {showEdit && product.is_mine && (
              <button
                onClick={handleEdit}
                className="p-2 rounded-full bg-primary-500 text-white hover:bg-primary-600 transition shadow-md"
                title="상품 수정"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
            {showDelete && product.is_mine && (
              <button
                onClick={handleDelete}
                className="p-2 rounded-full bg-danger-500 text-white hover:bg-danger-600 transition shadow-md"
                title="상품 삭제"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
        <div className="p-4 flex-1 flex flex-col">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-gray-900 line-clamp-2 flex-1 min-h-[3rem]">
              {product.title}
            </h3>
            {product.category && (
              <Badge variant="default" className="ml-2 flex-shrink-0">
                {product.category}
              </Badge>
            )}
          </div>
          <p className="text-primary-600 font-bold text-xl mb-2">
            {product.price.toLocaleString()}원
          </p>
          <div className="mt-auto space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center gap-2 flex-wrap">
                {(product.is_mine === true || product.is_mine === 1) && showEdit === true ? (
                  <button
                    onClick={handleStatusToggle}
                    className="text-xs px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-button transition shadow-sm"
                    title={product.status === 'SELLING' ? '판매완료로 변경' : '판매중으로 변경'}
                  >
                    {product.status === 'SELLING' ? '→ 판매완료' : '→ 판매중'}
                  </button>
                ) : null}
              </div>
              {product.created_at ? (
                <span className="flex-shrink-0">{formatDate(product.created_at)}</span>
              ) : null}
            </div>
            {/* 통계 정보 */}
            <div className="flex items-center gap-3 text-xs text-gray-400">
              {product.chat_count != null && Number(product.chat_count) > 0 && (
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>{product.chat_count}</span>
                </div>
              )}
              {product.favorite_count != null && Number(product.favorite_count) > 0 && (
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span>{product.favorite_count}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="상품을 삭제하시겠습니까?"
        message="삭제된 상품은 복구할 수 없습니다."
        confirmLabel={deleting ? '삭제 중...' : '삭제'}
        variant="danger"
      />
    </Link>
  );
};

export default ProductCard;

