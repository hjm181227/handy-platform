import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation(['product', 'common', 'nail']);
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
      title={t('product:customOrder.styleQuestion')}
      subtitle={t('product:customOrder.styleSubtitle')}
    >
      <div className="space-y-6 flex-1">
        {/* 원하는 컬러 */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            {t('product:customOrder.desiredColor')}
          </label>
          <input
            type="text"
            value={desiredColor}
            onChange={(e) => onUpdateColor(e.target.value)}
            placeholder={t('product:customOrder.colorPlaceholder')}
            className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl text-base
                     focus:ring-2 focus:ring-black focus:border-transparent
                     transition-all placeholder:text-gray-400"
          />
          <p className="text-xs text-gray-500 mt-2">
            {t('product:customOrder.colorHint')}
          </p>
        </div>

        {/* 요청사항 */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            {t('product:customOrder.requestNotesLabel')}
          </label>
          <textarea
            value={request}
            onChange={(e) => onUpdateRequest(e.target.value)}
            placeholder={t('product:customOrder.requestDetailPlaceholder')}
            rows={4}
            className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl text-base resize-none
                     focus:ring-2 focus:ring-black focus:border-transparent
                     transition-all placeholder:text-gray-400"
          />
        </div>

        {/* 참고 이미지 첨부 */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            {t('product:customOrder.refImageLabel')}
            <span className="text-gray-400 font-normal ml-1">({t('product:customOrder.refImageOptional')})</span>
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
            <span>{t('product:customOrder.addRefImage')}</span>
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
            {t('product:customOrder.refImageHint')}
          </p>
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="sticky bottom-0 bg-white pt-4 pb-6 -mx-5 px-5 border-t mt-6">
        <OrderStepButton onClick={onNext}>
          {t('product:customOrder.next')}
        </OrderStepButton>
      </div>
    </OrderStepLayout>
  );
}
