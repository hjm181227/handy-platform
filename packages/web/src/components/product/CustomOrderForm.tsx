import { useState, useEffect } from 'react';
import { Product, NAIL_SHAPES, NAIL_SHAPE_NAME, NAIL_LENGTHS, NAIL_LENGTH_NAME, NailShape, NailLength, CreateCustomOrderResponse } from '@handy-platform/shared';
import { productService, orderService, imageService } from '../../services/apiService';
import { FaArrowLeft, FaPlus, FaTimes, FaCheckCircle, FaComments, FaShoppingBag } from 'react-icons/fa';
import { sendCustomOrderToChat, getChatRoomPath } from '../../lib/chat/orderChatService';

interface CustomOrderFormProps {
  productId: string;
  onBack: () => void;
  onGo: (to: string) => void;
}

// 손가락별 사이즈 타입
interface FingerSizes {
  thumb: string;
  index: string;
  middle: string;
  ring: string;
  pinky: string;
}

interface HandSizes {
  left: FingerSizes;
  right: FingerSizes;
}

// 손가락 한글명
const FINGER_NAMES: Record<keyof FingerSizes, string> = {
  thumb: '엄지',
  index: '검지',
  middle: '중지',
  ring: '약지',
  pinky: '소지'
};

export function CustomOrderForm({ productId, onBack, onGo }: CustomOrderFormProps) {
  // 상품 정보 로딩
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 폼 상태
  const [shape, setShape] = useState<string>('ROUND');
  const [length, setLength] = useState<string>('MEDIUM');
  const [sizeInputMode, setSizeInputMode] = useState<'manual' | 'load'>('manual');
  const [activeHand, setActiveHand] = useState<'left' | 'right'>('left');
  const [sizes, setSizes] = useState<HandSizes>({
    left: { thumb: '', index: '', middle: '', ring: '', pinky: '' },
    right: { thumb: '', index: '', middle: '', ring: '', pinky: '' }
  });
  const [request, setRequest] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [desiredColor, setDesiredColor] = useState('');
  const [desiredDate, setDesiredDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 성공 모달 상태
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdOrderData, setCreatedOrderData] = useState<CreateCustomOrderResponse | null>(null);
  const [chatRoomId, setChatRoomId] = useState<string | null>(null);

  // 상품 정보 로드
  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        const response = await productService.getProduct(productId);
        setProduct(response.data);
      } catch (err: any) {
        setError(err.message || '상품 정보를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
  }, [productId]);

  // 파일 첨부 핸들러
  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setAttachments(prev => [...prev, ...Array.from(files)]);
    }
    e.target.value = ''; // 같은 파일 재선택 가능하도록
  };

  // 파일 삭제 핸들러
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // 사이즈 입력 핸들러
  const handleSizeChange = (hand: 'left' | 'right', finger: keyof FingerSizes, value: string) => {
    setSizes(prev => ({
      ...prev,
      [hand]: { ...prev[hand], [finger]: value }
    }));
  };

  // 최소 선택 가능 날짜 (오늘 + 7일)
  const getMinDate = (): string => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split('T')[0];
  };

  // 주문하기 핸들러
  const handleSubmit = async () => {
    // 사이즈 필수 검증 (양손 모두)
    const leftFilled = Object.values(sizes.left).every(s => s.trim() !== '');
    const rightFilled = Object.values(sizes.right).every(s => s.trim() !== '');
    if (!leftFilled || !rightFilled) {
      alert('양손 모든 손가락 사이즈를 입력해주세요.');
      return;
    }

    // sellerUuid 확인
    if (!product?.sellerUuid) {
      alert('판매자 정보를 찾을 수 없습니다.');
      return;
    }

    try {
      setSubmitting(true);

      // 1. 첨부파일 업로드 (있는 경우)
      const imageUrls: string[] = [];
      for (const file of attachments) {
        // 이미지 파일만 업로드
        if (!file.type.startsWith('image/')) {
          console.warn('이미지가 아닌 파일 스킵:', file.name);
          continue;
        }

        // 1-1. Presigned URL 요청
        const presignedResponse = await imageService.getPresignedUrl({
          filename: file.name,
          contentType: file.type,
          uploadType: 'custom-order-reference'
        });

        // 1-2. S3에 직접 업로드
        const uploadHeaders: Record<string, string> = {
          'Content-Type': file.type,
          ...(presignedResponse.uploadHeaders || {})
        };
        const uploadResponse = await fetch(presignedResponse.presignedUrl, {
          method: 'PUT',
          body: file,
          headers: uploadHeaders,
        });

        if (!uploadResponse.ok) {
          throw new Error(`S3 upload failed: ${uploadResponse.status}`);
        }

        // 1-3. imageUrl 저장
        imageUrls.push(presignedResponse.imageUrl);
      }

      // 2. 커스텀 주문서 생성
      const orderResponse = await orderService.createCustomOrder({
        sellerUuid: product.sellerUuid,
        baseProductUuid: productId,
        baseProductType: product.productType || 'original',
        title: `${product.name} 커스텀 주문`,
        specifications: {
          shape: shape as NailShape,
          length: length as NailLength,
          sizes,
          desiredColor: desiredColor || undefined,
          desiredDate: desiredDate || undefined,
          designNotes: request || undefined,
          referenceImages: imageUrls.length > 0 ? imageUrls : undefined
        }
      });

      // 3. 응답 데이터 확인
      if (!orderResponse.data) {
        throw new Error('주문서 생성 응답이 올바르지 않습니다');
      }

      // 4. 채팅방 생성 및 주문서 메시지 전송 시도
      const chatResult = await sendCustomOrderToChat(product.sellerUuid!, orderResponse.data);
      if (chatResult.success && chatResult.roomId) {
        setChatRoomId(chatResult.roomId);
      }

      // 5. 성공 모달 표시
      setCreatedOrderData(orderResponse.data);
      setShowSuccessModal(true);

    } catch (error: any) {
      console.error('주문 제출 실패:', error);

      // 판매자가 커스텀 주문을 받지 않는 경우
      if (error.message?.includes('custom orders') || error.status === 400) {
        alert('이 판매자는 현재 커스텀 주문을 받지 않습니다.');
      } else {
        alert('주문 제출에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-600">{error || '상품을 찾을 수 없습니다.'}</p>
        <button onClick={onBack} className="text-blue-600 hover:underline">
          돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="sticky top-0 bg-white border-b z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
            <FaArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">커스텀 주문서 작성</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* 브랜드 정보 */}
        <div className="bg-white rounded-xl p-4 border">
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            브랜드
          </label>
          <p className="text-base text-gray-700">
            {product.seller?.companyName || product.brand || '브랜드 정보 없음'}
          </p>
        </div>

        {/* 쉐입 선택 */}
        <div className="bg-white rounded-xl p-4 border">
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            쉐입 선택 <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {NAIL_SHAPES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setShape(s)}
                className={`py-2.5 px-3 rounded-lg border-2 text-sm font-medium transition-all ${
                  shape === s
                    ? 'border-black bg-black text-white'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                {NAIL_SHAPE_NAME[s]}
              </button>
            ))}
          </div>
        </div>

        {/* 길이 선택 */}
        <div className="bg-white rounded-xl p-4 border">
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            길이 선택 <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {NAIL_LENGTHS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLength(l)}
                className={`py-2.5 px-3 rounded-lg border-2 text-sm font-medium transition-all ${
                  length === l
                    ? 'border-black bg-black text-white'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                {NAIL_LENGTH_NAME[l]}
              </button>
            ))}
          </div>
        </div>

        {/* 사이즈 */}
        <div className="bg-white rounded-xl p-4 border">
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            사이즈 <span className="text-red-500">*</span>
          </label>

          {/* 탭 */}
          <div className="flex border-b mb-4">
            <button
              type="button"
              onClick={() => setSizeInputMode('manual')}
              className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
                sizeInputMode === 'manual'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              직접 입력
            </button>
            <button
              type="button"
              onClick={() => setSizeInputMode('load')}
              className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
                sizeInputMode === 'load'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              사이즈 불러오기
            </button>
          </div>

          {sizeInputMode === 'manual' ? (
            <div className="space-y-4">
              {/* 왼손/오른손 탭 */}
              <div className="flex rounded-lg bg-gray-100 p-1">
                <button
                  type="button"
                  onClick={() => setActiveHand('left')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeHand === 'left'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  왼손 {Object.values(sizes.left).every(s => s.trim() !== '') ? '✓' : ''}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveHand('right')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeHand === 'right'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  오른손 {Object.values(sizes.right).every(s => s.trim() !== '') ? '✓' : ''}
                </button>
              </div>

              {/* 손가락 사이즈 입력 */}
              <div className="space-y-3">
                {(Object.keys(FINGER_NAMES) as Array<keyof FingerSizes>).map((finger) => (
                  <div key={finger} className="flex items-center gap-3">
                    <span className="w-12 text-sm text-gray-600">{FINGER_NAMES[finger]}</span>
                    <input
                      type="text"
                      value={sizes[activeHand][finger]}
                      onChange={(e) => handleSizeChange(activeHand, finger, e.target.value)}
                      placeholder="예: 5"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500">
                * 양손 모든 손가락의 네일 사이즈를 입력해주세요
              </p>
            </div>
          ) : (
            <div className="text-center py-8">
              <button
                type="button"
                onClick={() => alert('사이즈 불러오기 기능은 추후 구현됩니다.')}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
              >
                저장된 사이즈 불러오기
              </button>
              <p className="text-xs text-gray-500 mt-3">
                이전에 저장한 사이즈 정보를 불러옵니다
              </p>
            </div>
          )}
        </div>

        {/* 원하는 컬러 */}
        <div className="bg-white rounded-xl p-4 border">
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            원하는 컬러
          </label>
          <input
            type="text"
            value={desiredColor}
            onChange={(e) => setDesiredColor(e.target.value)}
            placeholder="예: 연한 핑크, 베이지, 빨간색 등"
            className="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-2">
            원하는 색상을 자유롭게 입력해주세요
          </p>
        </div>

        {/* 요청사항 */}
        <div className="bg-white rounded-xl p-4 border">
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            요청사항
          </label>
          <textarea
            value={request}
            onChange={(e) => setRequest(e.target.value)}
            placeholder="용도, 느낌, 사진 등등 자세하게 작성해주실수록 더 좋아요~ 첨부자료도 물론 가능합니다!"
            rows={4}
            className="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent resize-none"
          />

          {/* 첨부파일 목록 */}
          {attachments.length > 0 && (
            <div className="mt-3 space-y-2">
              {attachments.map((file, index) => (
                <div key={index} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                  <span className="flex-1 text-sm text-gray-600 truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(index)}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    <FaTimes className="w-3 h-3 text-gray-500" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 파일 첨부 버튼 */}
          <label className="mt-3 flex items-center justify-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <FaPlus className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">파일 첨부</span>
            <input
              type="file"
              multiple
              onChange={handleFileAttach}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx"
            />
          </label>
        </div>

        {/* 수령 희망 날짜 */}
        <div className="bg-white rounded-xl p-4 border">
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            수령 희망 날짜
          </label>
          <input
            type="date"
            value={desiredDate}
            onChange={(e) => setDesiredDate(e.target.value)}
            min={getMinDate()}
            className="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-2">
            제작 기간을 고려하여 최소 7일 이후 날짜를 선택해주세요
          </p>
        </div>

        {/* 주문하기 버튼 */}
        <div className="sticky bottom-0 bg-gray-50 pt-4 pb-6">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className={`w-full py-4 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 ${
              submitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-black hover:bg-gray-800 text-white'
            }`}
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>주문서 제출 중...</span>
              </>
            ) : (
              '주문하기'
            )}
          </button>
        </div>
      </div>

      {/* 성공 모달 */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* 배경 오버레이 */}
          <div className="absolute inset-0 bg-black bg-opacity-50" />

          {/* 모달 컨텐츠 */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
            {/* 성공 아이콘 */}
            <div className="pt-8 pb-4 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaCheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                주문서가 전송되었습니다!
              </h2>
              <p className="text-sm text-gray-600 px-6">
                판매자가 주문서를 확인하면 채팅으로 연락드릴 예정이에요.
              </p>
            </div>

            {/* 주문 요약 */}
            {createdOrderData && (
              <div className="mx-6 mb-6 p-4 bg-gray-50 rounded-xl">
                <p className="text-sm font-medium text-gray-900 mb-1">{createdOrderData.title}</p>
                <p className="text-xs text-gray-500">
                  {NAIL_SHAPE_NAME[createdOrderData.specifications.shape as NailShape]} · {NAIL_LENGTH_NAME[createdOrderData.specifications.length as NailLength]}
                </p>
              </div>
            )}

            {/* 버튼들 */}
            <div className="px-6 pb-6 space-y-3">
              {chatRoomId && (
                <button
                  onClick={() => onGo(getChatRoomPath(chatRoomId))}
                  className="w-full py-3.5 bg-purple-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-purple-700 transition-colors"
                >
                  <FaComments className="w-4 h-4" />
                  채팅으로 이동
                </button>
              )}
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  onBack();
                }}
                className="w-full py-3.5 bg-gray-100 text-gray-700 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
              >
                <FaShoppingBag className="w-4 h-4" />
                계속 쇼핑하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
