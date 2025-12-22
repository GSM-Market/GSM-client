import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import productService from '../services/productService';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import ImageUploadWithPreview from '../components/ImageUploadWithPreview';

const ProductCreate = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    description: '',
    category: '기타',
  });
  const [image, setImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

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
    
    if (!image) {
      newErrors.image = '이미지를 선택해주세요.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageSelect = (file) => {
    setImage(file);
    if (errors.image) {
      setErrors({ ...errors, image: null });
    }
  };

  const formatPrice = (value) => {
    const numValue = value.replace(/,/g, '');
    if (isNaN(numValue)) return value;
    return numValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const handlePriceChange = (e) => {
    let value = e.target.value.replace(/,/g, '');
    // 숫자만 허용
    value = value.replace(/[^0-9]/g, '');
    // 최대값 제한 (INT 최대값: 2,147,483,647)
    const maxValue = 2147483647;
    if (value && parseInt(value) > maxValue) {
      value = maxValue.toString();
      showToast(`가격은 ${maxValue.toLocaleString()}원 이하여야 합니다.`, 'warning');
    }
    setFormData({ ...formData, price: value });
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

      console.log('Submitting product:', {
        title: formData.title.trim(),
        price: priceValue,
        description: formData.description.trim(),
        hasImage: !!image
      });

      await productService.createProduct(data);
      showToast('상품이 등록되었습니다!', 'success');
      navigate('/');
    } catch (err) {
      console.error('❌ Product creation error:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      const errorMsg = err.response?.data?.error || err.response?.data?.details || '상품 등록에 실패했습니다.';
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Card className="p-6 sm:p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">상품 등록</h2>

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
              placeholder="상품 제목을 입력하세요"
              required
            />
            {errors.title && (
              <p className="mt-1 text-sm text-danger-500">{errors.title}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">2자 이상 입력해주세요</p>
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
                placeholder="0"
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
              placeholder="상품에 대한 자세한 설명을 입력하세요"
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
              이미지 <span className="text-danger-500">*</span>
            </label>
            <ImageUploadWithPreview
              onImageSelect={handleImageSelect}
              error={errors.image}
            />
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
              등록하기
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={() => navigate('/')}
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

export default ProductCreate;
