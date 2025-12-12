import { useState, useRef, useEffect } from 'react';
import { DetailedReview } from '@handy-platform/shared';
import { reviewService, imageService } from '../../services/apiService';

interface OrderItemForReview {
  productId: string;
  productName: string;
  productImage: string;
  orderId: string;
  orderItemId?: string;
  options?: Record<string, string>;
}

interface ReviewWriteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  orderItem?: OrderItemForReview;
  existingReview?: DetailedReview;
  mode: 'create' | 'edit';
}

interface ImageItem {
  file?: File;
  url: string;
  uploading?: boolean;
}

const MAX_IMAGES = 3;
const MIN_CONTENT_LENGTH = 10;
const MAX_CONTENT_LENGTH = 500;

export function ReviewWriteModal({
  isOpen,
  onClose,
  onSuccess,
  orderItem,
  existingReview,
  mode
}: ReviewWriteModalProps) {
  const [rating, setRating] = useState<number>(existingReview?.rating || 0);
  const [content, setContent] = useState<string>(existingReview?.content || '');
  const [images, setImages] = useState<ImageItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 수정 모드일 때 기존 이미지 로드
  useEffect(() => {
    if (mode === 'edit' && existingReview?.images) {
      setImages(existingReview.images.map(img => ({ url: img.url })));
    }
  }, [mode, existingReview]);

  // 모달 열릴 때 초기화
  useEffect(() => {
    if (isOpen && mode === 'create') {
      setRating(0);
      setContent('');
      setImages([]);
      setError(null);
    }
  }, [isOpen, mode]);

  if (!isOpen) return null;

  const isValid = rating >= 1 && content.length >= MIN_CONTENT_LENGTH && content.length <= MAX_CONTENT_LENGTH;
  const productId = orderItem?.productId || existingReview?.id?.split('-')[0] || '';

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = MAX_IMAGES - images.length;
    const filesToAdd = files.slice(0, remainingSlots);

    for (const file of filesToAdd) {
      // 파일 크기 체크 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('이미지 파일 크기는 5MB 이하여야 합니다.');
        continue;
      }

      // 미리보기용 URL 생성
      const previewUrl = URL.createObjectURL(file);
      setImages(prev => [...prev, { file, url: previewUrl, uploading: false }]);
    }

    // input 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => {
      const newImages = [...prev];
      // Blob URL 해제
      if (newImages[index].file) {
        URL.revokeObjectURL(newImages[index].url);
      }
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const uploadImage = async (file: File): Promise<string> => {
    try {
      // 1. Presigned URL 획득
      const presignedResponse = await imageService.getPresignedUrl({
        filename: file.name,
        contentType: file.type,
        uploadType: 'review'
      });

      // 2. S3에 업로드
      const uploadHeaders: Record<string, string> = {
        'Content-Type': file.type,
      };

      // presignedResponse.uploadHeaders가 있으면 추가
      if (presignedResponse.uploadHeaders) {
        Object.assign(uploadHeaders, presignedResponse.uploadHeaders);
      }

      await fetch(presignedResponse.presignedUrl, {
        method: 'PUT',
        body: file,
        headers: uploadHeaders
      });

      return presignedResponse.imageUrl;
    } catch (err) {
      console.error('Image upload failed:', err);
      throw new Error('이미지 업로드에 실패했습니다.');
    }
  };

  const handleSubmit = async () => {
    if (!isValid) return;

    // orderItem에서 가져오거나, 수정 모드일 때 existingReview에서 productUuid 추출
    let targetProductId = orderItem?.productId;
    if (!targetProductId && existingReview) {
      const productUuidObj = (existingReview as any).productUuid;
      // productUuid 필드 우선 (백엔드가 productUuid.productUuid로 반환)
      targetProductId = typeof productUuidObj === 'object'
        ? (productUuidObj?.productUuid || productUuidObj?.uuid || productUuidObj?._id)
        : productUuidObj;
    }
    if (!targetProductId) {
      setError('상품 정보를 찾을 수 없습니다. 다시 시도해주세요.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // 새 파일 업로드
      const uploadedUrls: string[] = [];

      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        if (img.file) {
          // 업로드 중 상태 표시
          setImages(prev => prev.map((item, idx) =>
            idx === i ? { ...item, uploading: true } : item
          ));

          const url = await uploadImage(img.file);
          uploadedUrls.push(url);

          setImages(prev => prev.map((item, idx) =>
            idx === i ? { ...item, uploading: false, url } : item
          ));
        } else {
          // 기존 이미지 URL 유지
          uploadedUrls.push(img.url);
        }
      }

      // 서버 API 스펙에 맞게 데이터 구성
      const reviewData = {
        rating,
        content: content,  // 서버는 'content' 필드를 기대
        images: uploadedUrls.length > 0 ? uploadedUrls.map((url, index) => ({
          imageUrl: url,
          filename: images[index]?.file?.name || `review_image_${index + 1}.jpg`,
        })) : undefined,  // 서버는 객체 배열 형식을 기대
      };

      if (mode === 'edit' && existingReview) {
        // 서버 스펙: reviewUuid 사용 - reviewUuid > uuid > _id > id 우선순위로 추출
        const reviewId = (existingReview as any).reviewUuid || (existingReview as any).uuid || (existingReview as any)._id || existingReview.id;
        if (!reviewId) {
          setError('리뷰 정보를 찾을 수 없습니다.');
          return;
        }
        await reviewService.updateReview(targetProductId, reviewId, reviewData);
      } else {
        await reviewService.createReview(targetProductId, reviewData);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Review submit failed:', err);
      setError(err.message || '리뷰 등록에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = () => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="p-1 focus:outline-none transition-transform hover:scale-110"
            disabled={submitting}
          >
            <svg
              className={`w-8 h-8 ${
                star <= (hoverRating || rating)
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-300 fill-gray-300'
              }`}
              viewBox="0 0 24 24"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </button>
        ))}
      </div>
    );
  };

  const getRatingText = (r: number) => {
    switch (r) {
      case 1: return '별로예요';
      case 2: return '그저 그래요';
      case 3: return '보통이에요';
      case 4: return '좋아요';
      case 5: return '최고예요!';
      default: return '별점을 선택해주세요';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* 모달 컨텐츠 */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-purple-50">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span className="text-xl">✍️</span>
            {mode === 'create' ? '리뷰 작성' : '리뷰 수정'}
          </h2>
          <button
            onClick={onClose}
            disabled={submitting}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-purple-100 transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 본문 */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
          {/* 상품 정보 */}
          {orderItem && (
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl mb-6">
              <img
                src={orderItem.productImage || '/placeholder-product.png'}
                alt={orderItem.productName}
                className="w-16 h-16 object-cover rounded-lg"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{orderItem.productName}</p>
                {orderItem.options && Object.keys(orderItem.options).length > 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    {Object.entries(orderItem.options).map(([key, value]) => (
                      <span key={key} className="mr-2">
                        {key}: {value}
                      </span>
                    ))}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 별점 선택 */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              상품은 어떠셨나요?
            </label>
            <div className="flex flex-col items-center gap-2">
              {renderStars()}
              <p className={`text-sm ${rating > 0 ? 'text-gray-700' : 'text-gray-400'}`}>
                {getRatingText(hoverRating || rating)}
              </p>
            </div>
          </div>

          {/* 리뷰 내용 */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              리뷰 내용
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="상품에 대한 솔직한 리뷰를 작성해주세요. (최소 10자)"
              className="w-full h-32 p-4 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-shadow"
              disabled={submitting}
              maxLength={MAX_CONTENT_LENGTH}
            />
            <div className="flex justify-between mt-2">
              <p className={`text-xs ${content.length < MIN_CONTENT_LENGTH ? 'text-red-500' : 'text-gray-400'}`}>
                {content.length < MIN_CONTENT_LENGTH && `최소 ${MIN_CONTENT_LENGTH}자 이상 작성해주세요`}
              </p>
              <p className={`text-xs ${content.length > MAX_CONTENT_LENGTH ? 'text-red-500' : 'text-gray-400'}`}>
                {content.length} / {MAX_CONTENT_LENGTH}
              </p>
            </div>
          </div>

          {/* 이미지 업로드 */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              사진 첨부 <span className="text-gray-400 font-normal">(선택, 최대 {MAX_IMAGES}장)</span>
            </label>

            <div className="flex gap-3 flex-wrap">
              {/* 기존 이미지 미리보기 */}
              {images.map((img, index) => (
                <div key={index} className="relative w-20 h-20">
                  <img
                    src={img.url}
                    alt={`리뷰 이미지 ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  {img.uploading && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    </div>
                  )}
                  {!submitting && !img.uploading && (
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}

              {/* 이미지 추가 버튼 */}
              {images.length < MAX_IMAGES && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={submitting}
                  className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-purple-500 hover:text-purple-500 transition-colors disabled:opacity-50"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-xs mt-1">추가</span>
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
            />

            <p className="text-xs text-gray-400 mt-2">
              이미지 파일 최대 5MB, JPG/PNG/GIF 형식
            </p>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-medium disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid || submitting}
            className="flex-1 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>등록 중...</span>
              </>
            ) : (
              <span>{mode === 'create' ? '리뷰 등록' : '수정 완료'}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReviewWriteModal;
export type { OrderItemForReview };
