import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import productService from '../services/productService';
import chatService from '../services/chatService';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useToast } from '../components/ui/Toast';
import Skeleton from '../components/ui/Skeleton';
import { getImageUrl } from '../utils/config';

const ProductDetail = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      console.log('📤 상품 상세 조회 요청:', id);
      const response = await productService.getProduct(id);
      console.log('✅ 상품 상세 조회 응답:', response);
      
      // 응답 형식 확인: response.product 또는 response
      const productData = response.product || response;
      
      if (!productData) {
        throw new Error('상품 데이터를 찾을 수 없습니다.');
      }
      
      setProduct(productData);
    } catch (error) {
      console.error('❌ Failed to load product:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        id
      });
      
      const errorMsg = error.response?.data?.error || '상품을 불러올 수 없습니다.';
      showToast(errorMsg, 'error');
      
      // 에러가 발생하면 홈으로 이동
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await productService.deleteProduct(id);
      showToast('상품이 삭제되었습니다.', 'success');
      navigate('/');
    } catch (error) {
      showToast(error.response?.data?.error || '삭제에 실패했습니다.', 'error');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const formData = new FormData();
      formData.append('status', newStatus);
      await productService.updateProduct(id, formData);
      // 성공 메시지 표시
      showToast(`상품 상태가 ${newStatus === 'SOLD' ? '판매완료' : '판매중'}으로 변경되었습니다.`, 'success');
      // 상품 정보 다시 로드
      await loadProduct();
    } catch (error) {
      console.error('상태 변경 오류:', error);
      // 에러가 발생한 경우에만 에러 메시지 표시
      const errorMsg = error.response?.data?.error || '상태 변경에 실패했습니다.';
      showToast(errorMsg, 'error');
    }
  };

  const handleChat = async () => {
    if (!user) {
      showToast('로그인이 필요합니다.', 'warning');
      navigate('/login');
      return;
    }

    try {
      const data = await chatService.getOrCreateConversation(id);
      if (data.conversation?.id) {
        navigate(`/chat/${data.conversation.id}`);
      }
    } catch (error) {
      console.error('Failed to create conversation:', error);
      showToast(error.response?.data?.error || '채팅방을 생성하는데 실패했습니다.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Card className="p-8">
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton variant="card" className="w-full h-96" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Card className="overflow-hidden">
        <div className="grid md:grid-cols-2 gap-6 p-6">
          {/* 이미지 */}
          <div>
            {product.image_url ? (
              <img
                src={getImageUrl(product.image_url)}
                alt={product.title}
                className="w-full h-96 object-cover rounded-card"
              />
            ) : (
              <div className="w-full h-96 bg-gray-100 flex items-center justify-center rounded-card">
                <svg className="w-24 h-24 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>

          {/* 상품 정보 */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center flex-wrap gap-2 mb-2">
                {[
                  product.status === 'SOLD' && <Badge key="sold" variant="dark">판매완료</Badge>,
                  product.status === 'SELLING' && <Badge key="selling" variant="success">판매중</Badge>,
                  (product.is_mine === true || product.is_mine === 1) && <Badge key="mine" variant="default">내 상품</Badge>,
                  product.category && product.category !== '0' && product.category !== 0 && (
                    <Badge key="category" variant="default">{product.category}</Badge>
                  )
                ].filter(Boolean)}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {product.title}
              </h1>
              <p className="text-3xl font-bold text-primary-600 mb-4">
                {product.price.toLocaleString()}원
              </p>
              <div className="flex items-center space-x-2 text-gray-600 mb-4">
                <span>판매자: {product.seller_nickname || '탈퇴한 사용자'}</span>
                {(product.is_deleted_user === true || product.is_deleted_user === 1) ? (
                  <Badge variant="secondary" className="text-xs">탈퇴한 사용자</Badge>
                ) : null}
              </div>
              
              {/* 통계 정보 */}
              {(product.chat_count != null && Number(product.chat_count) > 0) ||
               (product.favorite_count != null && Number(product.favorite_count) > 0) ||
               (product.view_count != null && Number(product.view_count) > 0) ? (
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  {product.chat_count != null && Number(product.chat_count) > 0 && (
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span>채팅 {product.chat_count}</span>
                    </div>
                  )}
                  {product.favorite_count != null && Number(product.favorite_count) > 0 && (
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <span>관심 {product.favorite_count}</span>
                    </div>
                  )}
                  {product.view_count != null && Number(product.view_count) > 0 && (
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span>조회 {product.view_count}</span>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {product.is_mine ? (
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                <Link to={`/products/${id}/edit`}>
                  <Button variant="primary" size="md">
                    수정
                  </Button>
                </Link>
                <Button
                  variant="danger"
                  size="md"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={deleting}
                >
                  삭제
                </Button>
                {product.status === 'SELLING' ? (
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => handleStatusChange('SOLD')}
                  >
                    판매완료
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => handleStatusChange('SELLING')}
                  >
                    판매중으로 변경
                  </Button>
                )}
              </div>
            ) : (
              <div className="pt-4 border-t">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleChat}
                  className="w-full"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  채팅하기
                </Button>
              </div>
            )}

            <div className="pt-4 border-t">
              <h2 className="font-semibold text-gray-900 mb-3">상품 설명</h2>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {product.description}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* 삭제 확인 모달 */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="상품을 삭제하시겠습니까?"
        message="삭제된 상품은 복구할 수 없습니다."
        confirmLabel={deleting ? '삭제 중...' : '삭제'}
        variant="danger"
      />
    </div>
  );
};

export default ProductDetail;
