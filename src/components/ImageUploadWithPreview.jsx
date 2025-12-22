import { useState, useRef } from 'react';
import ImageCropper from './ImageCropper';
import Button from './ui/Button';
import Card from './ui/Card';

// 실제 노출 비율 상수
const ASPECT_RATIOS = {
  list: 1, // 목록 썸네일: 1:1 (ProductCard는 h-64, w-full이지만 object-cover로 1:1 비율이 가장 적합)
  detail: 4 / 3, // 상세 페이지: 4:3 (ProductDetail은 h-96, w-full이지만 4:3이 적합)
};

const ImageUploadWithPreview = ({ onImageSelect, error, existingImageUrl = null }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [currentAspectRatio, setCurrentAspectRatio] = useState(ASPECT_RATIOS.list);
  const [previewMode, setPreviewMode] = useState('list'); // 'list' or 'detail'
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 파일 크기 체크 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('이미지 크기는 10MB 이하여야 합니다.');
      return;
    }

    // 이미지 파일인지 확인
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageSrc(reader.result);
      setShowCropper(true);
      setCurrentAspectRatio(ASPECT_RATIOS.list);
      setPreviewMode('list');
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (file) => {
    setCroppedImage(file);
    setShowCropper(false);
    setImageSrc(null);
    
    // 부모 컴포넌트에 크롭된 이미지 전달
    onImageSelect(file);
  };

  const handleCancelCrop = () => {
    setShowCropper(false);
    setImageSrc(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = () => {
    setCroppedImage(null);
    setImageSrc(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onImageSelect(null);
  };

  const handleReEdit = () => {
    if (croppedImage) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageSrc(reader.result);
        setShowCropper(true);
        setCurrentAspectRatio(ASPECT_RATIOS.list);
        setPreviewMode('list');
      };
      reader.readAsDataURL(croppedImage);
    }
  };

  // 미리보기 URL 생성
  const previewUrl = croppedImage 
    ? URL.createObjectURL(croppedImage)
    : existingImageUrl;

  return (
    <div className="space-y-4">
      {/* 파일 선택 */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-button focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        <p className="mt-1 text-xs text-gray-500">
          이미지는 필수입니다. (최대 10MB)
        </p>
        {error && (
          <p className="mt-1 text-sm text-danger-500">{error}</p>
        )}
      </div>

      {/* 이미지 미리보기 및 실제 노출 프리뷰 */}
      {previewUrl && (
        <Card className="p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-700">이미지 미리보기</h4>
            <div className="flex items-center gap-2">
              {croppedImage && (
                <button
                  type="button"
                  onClick={handleReEdit}
                  className="px-3 py-1.5 text-sm bg-primary-500 text-white rounded-button hover:bg-primary-600 transition"
                >
                  다시 편집
                </button>
              )}
              <button
                type="button"
                onClick={handleRemoveImage}
                className="p-1.5 text-gray-500 hover:text-danger-600 hover:bg-danger-50 rounded-button transition"
                title="이미지 제거"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* 프리뷰 모드 선택 */}
          <div className="flex space-x-2 mb-4">
            <button
              type="button"
              onClick={() => setPreviewMode('list')}
              className={`px-3 py-1.5 text-sm rounded-button transition ${
                previewMode === 'list'
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              목록에서 보기
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode('detail')}
              className={`px-3 py-1.5 text-sm rounded-button transition ${
                previewMode === 'detail'
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              상세에서 보기
            </button>
          </div>

          {/* 목록 썸네일 프리뷰 */}
          {previewMode === 'list' && (
            <div className="space-y-2">
              <p className="text-xs text-gray-600 mb-2">상품 목록에서 이렇게 보여요</p>
              <div className="w-full max-w-xs mx-auto">
                <div className="relative w-full aspect-square bg-white rounded-card overflow-hidden border-2 border-primary-300 shadow-md">
                  <img
                    src={previewUrl}
                    alt="List preview"
                    className="w-full h-full object-cover object-center"
                  />
                </div>
                <p className="text-xs text-center text-gray-500 mt-2">1:1 비율 (256×256px)</p>
              </div>
            </div>
          )}

          {/* 상세 페이지 프리뷰 */}
          {previewMode === 'detail' && (
            <div className="space-y-2">
              <p className="text-xs text-gray-600 mb-2">상세 페이지에서 이렇게 보여요</p>
              <div className="w-full max-w-md mx-auto">
                <div className="relative w-full aspect-[4/3] bg-white rounded-card overflow-hidden border-2 border-primary-300 shadow-md">
                  <img
                    src={previewUrl}
                    alt="Detail preview"
                    className="w-full h-full object-cover object-center"
                  />
                </div>
                <p className="text-xs text-center text-gray-500 mt-2">4:3 비율 (384px 높이)</p>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* 크롭 모달 */}
      {showCropper && imageSrc && (
        <ImageCropper
          imageSrc={imageSrc}
          aspectRatio={currentAspectRatio}
          onCropComplete={handleCropComplete}
          onCancel={handleCancelCrop}
        />
      )}
    </div>
  );
};

export default ImageUploadWithPreview;

