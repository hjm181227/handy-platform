import { NailShape, NailLength } from '@handy-platform/shared';
import { usePublicCustomOrderFlow } from '../../hooks/usePublicCustomOrderFlow';
import {
  ShapeStep,
  LengthStep,
  SizeStep,
  DetailsStep,
  DateStep,
} from '../product/custom-order/steps';

// 공개 주문서용 ConfirmStep (product 없이 동작)
function PublicConfirmStep({
  data,
  onSubmit,
  onBack,
  onEdit,
  submitting,
  error,
  stepIndex,
  totalSteps,
}: {
  data: any;
  onSubmit: () => void;
  onBack: () => void;
  onEdit: (stepIndex: number) => void;
  submitting: boolean;
  error: string | null;
  stepIndex: number;
  totalSteps: number;
}) {
  const shapeLabel: Record<string, string> = {
    ROUND: '라운드', ALMOND: '아몬드', OVAL: '오벌',
    STILETTO: '스틸레토', SQUARE: '스퀘어', COFFIN: '코핀',
  };
  const lengthLabel: Record<string, string> = {
    SHORT: '숏', MEDIUM: '미디엄', LONG: '롱',
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 bg-white z-10 border-b">
        <div className="flex items-center px-4 h-14">
          <button onClick={onBack} className="mr-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <h1 className="text-lg font-bold">주문서 확인</h1>
        </div>
        <div className="h-1 bg-gray-100">
          <div className="h-full bg-[#E85A6B] transition-all" style={{ width: `${(stepIndex / totalSteps) * 100}%` }} />
        </div>
      </div>

      <div className="px-5 py-6 space-y-6">
        {/* 제목 */}
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-500">주문서 제목</p>
            <p className="font-semibold mt-1">{data.title || '제목 없음'}</p>
          </div>
        </div>

        {/* 네일 사양 */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">쉐입</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">{shapeLabel[data.shape] || data.shape}</span>
              <button onClick={() => onEdit(0)} className="text-xs text-[#E85A6B]">수정</button>
            </div>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">길이</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">{lengthLabel[data.length] || data.length}</span>
              <button onClick={() => onEdit(1)} className="text-xs text-[#E85A6B]">수정</button>
            </div>
          </div>
          {data.desiredColor && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">희망 컬러</span>
              <span className="font-medium">{data.desiredColor}</span>
            </div>
          )}
          {data.desiredDate && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">수령 희망일</span>
              <span className="font-medium">{data.desiredDate}</span>
            </div>
          )}
        </div>

        {/* 사이즈 */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-medium text-gray-700">손가락 사이즈</p>
            <button onClick={() => onEdit(2)} className="text-xs text-[#E85A6B]">수정</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(['left', 'right'] as const).map(hand => (
              <div key={hand} className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-2">{hand === 'left' ? '왼손' : '오른손'}</p>
                <div className="space-y-1 text-xs">
                  {(['thumb', 'index', 'middle', 'ring', 'pinky'] as const).map(finger => (
                    <div key={finger} className="flex justify-between">
                      <span className="text-gray-400">
                        {{ thumb: '엄지', index: '검지', middle: '중지', ring: '약지', pinky: '소지' }[finger]}
                      </span>
                      <span>{data.sizes[hand][finger] || '-'}mm</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 요청사항 */}
        {data.request && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-medium text-gray-700">요청사항</p>
              <button onClick={() => onEdit(3)} className="text-xs text-[#E85A6B]">수정</button>
            </div>
            <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{data.request}</p>
          </div>
        )}

        {/* 참고 이미지 */}
        {data.attachments.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">참고 이미지</p>
            <div className="flex gap-2 overflow-x-auto">
              {data.attachments.map((file: File, i: number) => (
                <img
                  key={i}
                  src={URL.createObjectURL(file)}
                  alt={`참고 ${i + 1}`}
                  className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                />
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>
        )}

        <div className="bg-blue-50 text-blue-700 text-sm p-3 rounded-lg">
          주문서를 등록하면 입점 브랜드들이 확인 후 견적서를 보내드립니다.
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
        <button
          onClick={onSubmit}
          disabled={submitting}
          className="w-full py-4 bg-[#E85A6B] text-white rounded-xl font-bold text-base disabled:opacity-50"
        >
          {submitting ? '등록 중...' : '주문서 등록하기'}
        </button>
      </div>
    </div>
  );
}

// 공개 주문서용 CompleteStep
function PublicCompleteStep({ onGoToManagement }: { onGoToManagement: () => void }) {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-5">
      <div className="text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <path d="M20 6L9 17l-5-5" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h2 className="text-xl font-bold mb-2">주문서가 등록되었습니다!</h2>
        <p className="text-gray-500 text-sm mb-8">
          입점 브랜드들이 주문서를 확인하고<br/>
          견적서를 보내드릴 예정입니다.
        </p>
        <div className="space-y-3 w-full max-w-xs mx-auto">
          <button
            onClick={onGoToManagement}
            className="w-full py-3.5 bg-[#E85A6B] text-white rounded-xl font-bold"
          >
            내 주문서 관리
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full py-3.5 border border-gray-300 rounded-xl font-medium text-gray-700"
          >
            계속 쇼핑하기
          </button>
        </div>
      </div>
    </div>
  );
}

// 공개 주문서용 DetailsStep 래퍼 (title 필드 추가)
function PublicDetailsStep({
  title,
  desiredColor,
  request,
  attachments,
  onUpdateTitle,
  onUpdateColor,
  onUpdateRequest,
  onAddAttachments,
  onRemoveAttachment,
  onNext,
  onBack,
  stepIndex,
  totalSteps,
}: {
  title: string;
  desiredColor: string;
  request: string;
  attachments: File[];
  onUpdateTitle: (title: string) => void;
  onUpdateColor: (color: string) => void;
  onUpdateRequest: (request: string) => void;
  onAddAttachments: (files: File[]) => void;
  onRemoveAttachment: (index: number) => void;
  onNext: () => void;
  onBack: () => void;
  stepIndex: number;
  totalSteps: number;
}) {
  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 bg-white z-10 border-b">
        <div className="flex items-center px-4 h-14">
          <button onClick={onBack} className="mr-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <h1 className="text-lg font-bold">디자인 상세</h1>
        </div>
        <div className="h-1 bg-gray-100">
          <div className="h-full bg-[#E85A6B] transition-all" style={{ width: `${(stepIndex / totalSteps) * 100}%` }} />
        </div>
      </div>

      <div className="px-5 py-6 space-y-6 pb-28">
        {/* 주문서 제목 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            주문서 제목 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={e => onUpdateTitle(e.target.value)}
            placeholder="예: 봄 꽃 네일 맞춤 주문"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-[#E85A6B]"
            maxLength={100}
          />
        </div>

        {/* 기존 DetailsStep 필드들 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">희망 컬러</label>
          <input
            type="text"
            value={desiredColor}
            onChange={e => onUpdateColor(e.target.value)}
            placeholder="원하는 컬러를 입력해주세요 (선택)"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-[#E85A6B]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">디자인 요청사항</label>
          <textarea
            value={request}
            onChange={e => onUpdateRequest(e.target.value)}
            placeholder="원하는 디자인을 자세히 설명해주세요"
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-[#E85A6B] resize-none"
          />
        </div>

        {/* 참고 이미지 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">참고 이미지</label>
          <div className="flex gap-2 flex-wrap">
            {attachments.map((file, i) => (
              <div key={i} className="relative w-20 h-20">
                <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover rounded-lg" />
                <button
                  onClick={() => onRemoveAttachment(i)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            ))}
            <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-[#E85A6B]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#999" strokeWidth="2" strokeLinecap="round"/></svg>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={e => {
                  if (e.target.files) onAddAttachments(Array.from(e.target.files));
                  e.target.value = '';
                }}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
        <button
          onClick={onNext}
          disabled={!title.trim()}
          className="w-full py-4 bg-[#E85A6B] text-white rounded-xl font-bold disabled:opacity-50"
        >
          다음
        </button>
      </div>
    </div>
  );
}

export function PublicCustomOrderPage({ onGo }: { onGo: (to: string) => void }) {
  const {
    currentStep,
    stepIndex,
    totalSteps,
    data,
    userNailSize,
    loading,
    submitting,
    error,
    nextStep,
    prevStep,
    updateData,
    updateSize,
    addAttachments,
    removeAttachment,
    setError,
    submitOrder,
    refreshNailSize,
  } = usePublicCustomOrderFlow();

  const handleBack = () => {
    if (currentStep === 'shape') {
      history.back();
    } else {
      prevStep();
    }
  };

  const handleEdit = (targetStepIndex: number) => {
    for (let i = stepIndex; i > targetStepIndex; i--) {
      prevStep();
    }
  };

  const handleSubmit = async () => {
    await submitOrder();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#E85A6B] mx-auto mb-4"></div>
          <p className="text-gray-500">주문서를 준비하고 있어요...</p>
        </div>
      </div>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 'shape':
        return (
          <ShapeStep
            shape={data.shape}
            onSelect={(shape: NailShape) => updateData('shape', shape)}
            onNext={nextStep}
            onBack={handleBack}
            stepIndex={stepIndex + 1}
            totalSteps={totalSteps}
          />
        );
      case 'length':
        return (
          <LengthStep
            length={data.length}
            onSelect={(length: NailLength) => updateData('length', length)}
            onNext={nextStep}
            onBack={handleBack}
            stepIndex={stepIndex + 1}
            totalSteps={totalSteps}
          />
        );
      case 'size':
        return (
          <SizeStep
            sizes={data.sizes}
            userNailSize={userNailSize}
            onUpdateSize={updateSize}
            onRefreshNailSize={refreshNailSize}
            onNext={nextStep}
            onBack={handleBack}
            stepIndex={stepIndex + 1}
            totalSteps={totalSteps}
          />
        );
      case 'details':
        return (
          <PublicDetailsStep
            title={data.title}
            desiredColor={data.desiredColor}
            request={data.request}
            attachments={data.attachments}
            onUpdateTitle={(title: string) => updateData('title', title)}
            onUpdateColor={(color: string) => updateData('desiredColor', color)}
            onUpdateRequest={(request: string) => updateData('request', request)}
            onAddAttachments={addAttachments}
            onRemoveAttachment={removeAttachment}
            onNext={nextStep}
            onBack={handleBack}
            stepIndex={stepIndex + 1}
            totalSteps={totalSteps}
          />
        );
      case 'date':
        return (
          <DateStep
            desiredDate={data.desiredDate}
            onUpdateDate={(date: string) => updateData('desiredDate', date)}
            onNext={nextStep}
            onBack={handleBack}
            stepIndex={stepIndex + 1}
            totalSteps={totalSteps}
          />
        );
      case 'confirm':
        return (
          <PublicConfirmStep
            data={data}
            onSubmit={handleSubmit}
            onBack={handleBack}
            onEdit={handleEdit}
            submitting={submitting}
            error={error}
            stepIndex={stepIndex + 1}
            totalSteps={totalSteps}
          />
        );
      case 'complete':
        return (
          <PublicCompleteStep
            onGoToManagement={() => onGo('/my/custom-orders')}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="custom-order-flow">
      <div key={currentStep} className="animate-fade-in">
        {renderStep()}
      </div>
    </div>
  );
}
