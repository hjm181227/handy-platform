import { useRef } from 'react';
import { FaPlus, FaTimes, FaImage } from 'react-icons/fa';
import { OrderStepLayout, OrderStepButton } from '../common';

interface DetailsStepProps {
  desiredColor: string;
  request: string;
  attachments: File[];
  onUpdateColor: (color: string) => void;
  onUpdateRequest: (request: string) => void;
  onAddAttachments: (files: File[]) => void;
  onRemoveAttachment: (index: number) => void;
  onNext: () => void;
  onBack: () => void;
  stepIndex: number;
  totalSteps: number;
}

export function DetailsStep({
  desiredColor,
  request,
  attachments,
  onUpdateColor,
  onUpdateRequest,
  onAddAttachments,
  onRemoveAttachment,
  onNext,
  onBack,
  stepIndex,
  totalSteps,
}: DetailsStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 파일 첨부 핸들러
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      onAddAttachments(Array.from(files));
    }
    e.target.value = '';
  };

  // 파일 선택 버튼 클릭
  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <OrderStepLayout
      currentStep={stepIndex}
      totalSteps={totalSteps}
      onBack={onBack}
      title="어떤 스타일을 원하세요?"
      subtitle="원하는 컬러나 디자인을 자유롭게 알려주세요"
    >
      <div className="space-y-6 flex-1">
        {/* 원하는 컬러 */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            원하는 컬러
          </label>
          <input
            type="text"
            value={desiredColor}
            onChange={(e) => onUpdateColor(e.target.value)}
            placeholder="예: 연한 핑크, 베이지, 빨간색"
            className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl text-base
                     focus:ring-2 focus:ring-black focus:border-transparent
                     transition-all placeholder:text-gray-400"
          />
          <p className="text-xs text-gray-500 mt-2">
            정확한 색상명 또는 느낌을 자유롭게 입력해주세요
          </p>
        </div>

        {/* 요청사항 */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            요청사항
          </label>
          <textarea
            value={request}
            onChange={(e) => onUpdateRequest(e.target.value)}
            placeholder="용도, 원하는 느낌, 참고 이미지 설명 등을 자세하게 작성해주시면 더 좋아요!"
            rows={4}
            className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl text-base resize-none
                     focus:ring-2 focus:ring-black focus:border-transparent
                     transition-all placeholder:text-gray-400"
          />
        </div>

        {/* 참고 이미지 첨부 */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            참고 이미지
            <span className="text-gray-400 font-normal ml-1">(선택)</span>
          </label>

          {/* 첨부된 파일 목록 */}
          {attachments.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-3">
              {attachments.map((file, index) => (
                <div
                  key={index}
                  className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden"
                >
                  {file.type.startsWith('image/') ? (
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-xs text-gray-500 truncate px-2">{file.name}</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => onRemoveAttachment(index)}
                    className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full
                             flex items-center justify-center hover:bg-black/80"
                  >
                    <FaTimes className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 파일 첨부 버튼 */}
          <button
            type="button"
            onClick={handleAttachClick}
            className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl
                     flex items-center justify-center gap-2 text-gray-600
                     hover:border-gray-400 hover:bg-gray-50 transition-colors"
          >
            <FaImage className="w-5 h-5" />
            <span>참고 이미지 추가</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <p className="text-xs text-gray-500 mt-2 text-center">
            원하는 디자인의 참고 이미지를 첨부해주세요
          </p>
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="sticky bottom-0 bg-white pt-4 pb-6 -mx-5 px-5 border-t mt-6">
        <OrderStepButton onClick={onNext}>
          다음
        </OrderStepButton>
      </div>
    </OrderStepLayout>
  );
}
