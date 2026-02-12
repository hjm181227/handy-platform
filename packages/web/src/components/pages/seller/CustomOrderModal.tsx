import { CustomOrderDetail, NailShape, NailLength } from '@handy-platform/shared';

interface CustomOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderDetail: CustomOrderDetail | null;
  loading: boolean;
  error: string | null;
}

// 쉐입 한글 변환
const SHAPE_LABELS: Record<NailShape, string> = {
  ROUND: '라운드',
  ALMOND: '아몬드',
  OVAL: '오벌',
  STILETTO: '스틸레토',
  SQUARE: '스퀘어',
  COFFIN: '코핀'
};

// 길이 한글 변환
const LENGTH_LABELS: Record<NailLength, string> = {
  SHORT: '숏',
  MEDIUM: '미디엄',
  LONG: '롱'
};

// 손가락 한글 변환
const FINGER_LABELS: Record<string, string> = {
  thumb: '엄지',
  index: '검지',
  middle: '중지',
  ring: '약지',
  pinky: '소지'
};

export function CustomOrderModal({ isOpen, onClose, orderDetail, loading, error }: CustomOrderModalProps) {
  if (!isOpen) return null;

  const specs = orderDetail?.specifications;

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
            <span className="text-xl">📋</span>
            커스텀 주문서
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-purple-100 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 본문 */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mb-4"></div>
              <p className="text-gray-500">주문서를 불러오는 중...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-red-600 font-medium">{error}</p>
            </div>
          ) : orderDetail && specs ? (
            <div className="space-y-6">
              {/* 주문서 제목 */}
              <div className="pb-4 border-b border-gray-100">
                <p className="text-sm text-gray-500 mb-1">주문서 제목</p>
                <p className="text-lg font-semibold text-gray-900">{orderDetail.title}</p>
              </div>

              {/* 기본 정보 */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                  기본 정보
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">쉐입</p>
                    <p className="font-medium text-gray-900">
                      {SHAPE_LABELS[specs.shape] || specs.shape}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">길이</p>
                    <p className="font-medium text-gray-900">
                      {LENGTH_LABELS[specs.length] || specs.length}
                    </p>
                  </div>
                </div>
              </div>

              {/* 양손 사이즈 */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                  사이즈 정보
                </h3>
                <div className="bg-gray-50 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-2 py-2 text-xs font-medium text-gray-500 text-center w-12"></th>
                        {Object.keys(specs.sizes.left).map((finger) => (
                          <th key={finger} className="px-2 py-2 text-xs font-medium text-gray-600 text-center">
                            {FINGER_LABELS[finger] || finger}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-200">
                        <td className="px-2 py-2.5 text-xs font-medium text-gray-500 text-center">왼손</td>
                        {Object.values(specs.sizes.left).map((size, idx) => (
                          <td key={idx} className="px-2 py-2.5 text-center">
                            <span className="inline-flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-700 font-bold rounded-full text-sm">
                              {size}
                            </span>
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="px-2 py-2.5 text-xs font-medium text-gray-500 text-center">오른손</td>
                        {Object.values(specs.sizes.right).map((size, idx) => (
                          <td key={idx} className="px-2 py-2.5 text-center">
                            <span className="inline-flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-700 font-bold rounded-full text-sm">
                              {size}
                            </span>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 추가 요청 */}
              {(specs.desiredColor || specs.desiredDate || specs.designNotes) && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                    추가 요청
                  </h3>
                  <div className="space-y-3">
                    {specs.desiredColor && (
                      <div className="flex items-start gap-3">
                        <span className="text-sm text-gray-500 min-w-[80px]">원하는 색상</span>
                        <span className="text-sm font-medium text-gray-900">{specs.desiredColor}</span>
                      </div>
                    )}
                    {specs.desiredDate && (
                      <div className="flex items-start gap-3">
                        <span className="text-sm text-gray-500 min-w-[80px]">수령 희망일</span>
                        <span className="text-sm font-medium text-gray-900">
                          {new Date(specs.desiredDate).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                    )}
                    {specs.designNotes && (
                      <div>
                        <p className="text-sm text-gray-500 mb-2">요청사항</p>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <p className="text-sm text-gray-800 whitespace-pre-wrap">{specs.designNotes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 참고 이미지 */}
              {specs.referenceImages && specs.referenceImages.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                    참고 이미지 ({specs.referenceImages.length}장)
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {specs.referenceImages.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="aspect-square rounded-lg overflow-hidden bg-gray-100 hover:opacity-90 transition-opacity group"
                      >
                        <img
                          src={url}
                          alt={`참고 이미지 ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                          <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                          </svg>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* 주문서 정보 */}
              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                  주문서 생성일: {new Date(orderDetail.createdAt).toLocaleString('ko-KR')}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">주문서 정보가 없습니다.</p>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
