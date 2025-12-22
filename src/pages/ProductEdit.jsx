import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import productService from '../services/productService';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import Skeleton from '../components/ui/Skeleton';
import { getImageUrl } from '../utils/config';

const ProductEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    description: '',
    category: '기타',
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [existingImage, setExistingImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(true);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      setLoadingProduct(true);
      const data = await productService.getProduct(id);
      setFormData({
        title: data.title,
        price: data.price.toString(),
        description: data.description,
        category: data.category || '기타',
      });
      setExistingImage(data.image_url);
    } catch (error) {
      showToast('상품을 불러올 수 없습니다.', 'error');
      navigate('/');
    } finally {
      setLoadingProduct(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const formatPrice = (value) => {
    const numValue = value.replace(/,/g, '');
    if (isNaN(numValue)) return value;
    return numValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const handlePriceChange = (e) => {
    const value = e.target.value.replace(/,/g, '');
    setFormData({ ...formData, price: value });
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title || formData.title.trim().length < 2) {
      newErrors.title = '제목은 2자 이상 입력해주세요.';
    }
    
    const priceStr = String(formData.price).replace(/,/g, '');
    const priceNum = parseInt(priceStr, 10);
    const maxPrice = 2147483647; // INT 최대값
    
    if (!formData.price || !priceStr) {
      newErrors.price = '가격을 입력해주세요.';
    } else if (isNaN(priceNum) || priceNum <= 0) {
      newErrors.price = '올바른 가격을 입력해주세요.';
    } else if (priceNum > maxPrice) {
      newErrors.price = `가격은 ${maxPrice.toLocaleString()}원 이하여야 합니다.`;
    }
    
    if (!formData.description || formData.description.trim().length < 10) {
      newErrors.description = '설명은 최소 10자 이상 입력해주세요.';
    }
    
    // 이미지는 기존 이미지가 있거나 새 이미지를 선택해야 함
    if (!image && !existingImage) {
      newErrors.image = '이미지를 선택해주세요.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showToast('입력 정보를 확인해주세요.', 'error');
      return;
    }

    setLoading(true);

    try {
      const data = new FormData();
      const priceValue = String(formData.price).replace(/,/g, '').trim();
      
      data.append('title', formData.title.trim());
      data.append('price', priceValue);
      data.append('description', formData.description.trim());
      data.append('category', formData.category);
      if (image) {
        data.append('image', image);
      }

      await productService.updateProduct(id, data);
      showToast('상품이 수정되었습니다!', 'success');
      navigate(`/products/${id}`);
    } catch (err) {
      showToast(err.response?.data?.error || '상품 수정에 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loadingProduct) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Card className="p-8">
          <div className="space-y-4">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Card className="p-6 sm:p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">상품 수정</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              제목 <span className="text-danger-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => {
                setFormData({ ...formData, title: e.target.value });
                if (errors.title) setErrors({ ...errors, title: null });
              }}
              className={`w-full px-4 py-2.5 border rounded-button focus:outline-none focus:ring-2 ${
                errors.title
                  ? 'border-danger-500 focus:ring-danger-500'
                  : 'border-gray-300 focus:ring-primary-500 focus:border-transparent'
              }`}
              required
            />
            {errors.title && (
              <p className="mt-1 text-sm text-danger-500">{errors.title}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              가격 (원) <span className="text-danger-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={formatPrice(formData.price)}
                onChange={handlePriceChange}
                className={`w-full px-4 py-2.5 border rounded-button focus:outline-none focus:ring-2 ${
                  errors.price
                    ? 'border-danger-500 focus:ring-danger-500'
                    : 'border-gray-300 focus:ring-primary-500 focus:border-transparent'
                }`}
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">원</span>
            </div>
            {errors.price && (
              <p className="mt-1 text-sm text-danger-500">{errors.price}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              카테고리 <span className="text-danger-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-button focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
              required
            >
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
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              설명 <span className="text-danger-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => {
                setFormData({ ...formData, description: e.target.value });
                if (errors.description) setErrors({ ...errors, description: null });
              }}
              rows="6"
              className={`w-full px-4 py-2.5 border rounded-button focus:outline-none focus:ring-2 resize-none ${
                errors.description
                  ? 'border-danger-500 focus:ring-danger-500'
                  : 'border-gray-300 focus:ring-primary-500 focus:border-transparent'
              }`}
              required
            />
            {errors.description && (
              <p className="mt-1 text-sm text-danger-500">{errors.description}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {formData.description.length}/10자 이상 (현재: {formData.description.length}자)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              이미지 {!existingImage && <span className="text-danger-500">*</span>}
            </label>
            <div className="space-y-4">
              {existingImage && !imagePreview && (
                <div className="relative">
                  <img
                    src={getImageUrl(existingImage)}
                    alt="Current"
                    className="w-full max-h-64 object-cover rounded-card"
                  />
                  <p className="mt-2 text-sm text-gray-500">현재 이미지</p>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-button focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              {imagePreview && (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full max-h-64 object-cover rounded-card"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImage(null);
                      setImagePreview(null);
                    }}
                    className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-70"
                  >
                    ×
                  </button>
                  <p className="mt-2 text-sm text-gray-500">새 이미지</p>
                </div>
              )}
              {errors.image && (
                <p className="mt-1 text-sm text-danger-500">{errors.image}</p>
              )}
              {!existingImage && (
                <p className="mt-1 text-xs text-gray-500">이미지는 필수입니다.</p>
              )}
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              disabled={loading}
              className="flex-1"
            >
              수정하기
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={() => navigate(`/products/${id}`)}
              disabled={loading}
            >
              취소
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ProductEdit;
