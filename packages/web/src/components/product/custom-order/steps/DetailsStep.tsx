import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FaPlus, FaTimes, FaImage } from 'react-icons/fa';
import { OrderStepLayout, OrderStepButton } from '../common';

interface DetailsStepProps {
  desiredColor: string;
  request: string;
  attachments: File[];
  quantity?: number;
  onUpdateColor: (color: string) => void;
  onUpdateRequest: (request: string) => void;
  onUpdateQuantity?: (quantity: number) => void;
  onAddAttachments: (files: File[]) => void;
  onRemoveAttachment: (index: number) => void;
  onNext: () => void;
  onBack: () => void;
  stepIndex: number;
  totalSteps: number;
}

const MAX_QUANTITY = 100;

export function DetailsStep({
  desiredColor,
  request,
  attachments,
  quantity = 1,
  onUpdateColor,
  onUpdateRequest,
  onUpdateQuantity,
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
        {/* 주문 수량 (세트) */}
        {onUpdateQuantity && (
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              주문 수량
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="수량 줄이기"
                onClick={() => onUpdateQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="w-12 h-12 rounded-xl border-2 border-line text-xl font-bold
                         disabled:opacity-40 active:bg-surface transition-colors"
              >
                −
              </button>
              <div className="flex-1 text-center">
                <span className="text-2xl font-bold">{quantity}</span>
                <span className="ml-1 text-sm text-muted">세트</span>
              </div>
              <button
                type="button"
                aria-label="수량 늘리기"
                onClick={() => onUpdateQuantity(Math.min(MAX_QUANTITY, quantity + 1))}
                disabled={quantity >= MAX_QUANTITY}
                className="w-12 h-12 rounded-xl border-2 border-line text-xl font-bold
                         disabled:opacity-40 active:bg-surface transition-colors"
              >
                +
              </button>
            </div>
            <p className="text-xs text-muted mt-2">
              같은 디자인·같은 사이즈 기준입니다. 판매자는 수량을 반영한 총액으로 견적을 보냅니다.
            </p>
          </div>
        )}

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
            className="w-full px-4 py-4 border-2 border-line-strong rounded-xl text-base
                     focus:ring-2 focus:ring-brand focus:border-transparent
                     transition-all placeholder:text-muted"
          />
          <p className="text-xs text-muted mt-2">
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
            className="w-full px-4 py-4 border-2 border-line-strong rounded-xl text-base resize-none
                     focus:ring-2 focus:ring-brand focus:border-transparent
                     transition-all placeholder:text-muted"
          />
        </div>

        {/* 참고 이미지 첨부 */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            {t('product:customOrder.refImageLabel')}
            <span className="text-muted font-normal ml-1">({t('product:customOrder.refImageOptional')})</span>
          </label>

          {/* 첨부된 파일 목록 */}
          {attachments.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-3">
              {attachments.map((file, index) => (
                <div
                  key={index}
                  className="relative aspect-square bg-surface rounded-xl overflow-hidden"
                >
                  {file.type.startsWith('image/') ? (
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-xs text-muted truncate px-2">{file.name}</span>
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
            className="w-full py-4 border-2 border-dashed border-line rounded-xl
                     flex items-center justify-center gap-2 text-muted
                     hover:border-line-strong hover:bg-surface transition-colors"
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
          <p className="text-xs text-muted mt-2 text-center">
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
