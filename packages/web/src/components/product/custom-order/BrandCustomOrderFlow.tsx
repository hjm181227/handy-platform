import { useBrandCustomOrderFlow } from '../../../hooks/useBrandCustomOrderFlow';
import { NailShape, NailLength } from '@handy-platform/shared';
import { getChatRoomPath } from '../../../lib/chat/orderChatService';
import {
  ShapeStep,
  LengthStep,
  SizeStep,
  DetailsStep,
  DateStep,
  ConfirmStep,
  CompleteStep,
} from './steps';

interface BrandCustomOrderFlowProps {
  sellerUuid: string;
  brandName: string;
  onBack: () => void;
  onGo: (to: string) => void;
}

export function BrandCustomOrderFlow({ sellerUuid, brandName, onBack, onGo }: BrandCustomOrderFlowProps) {
  const {
    currentStep,
    stepIndex,
    totalSteps,
    data,
    userNailSize,
    loading,
    submitting,
    error,
    createdOrder,
    chatRoomId,
    nextStep,
    prevStep,
    updateData,
    updateSize,
    addAttachments,
    removeAttachment,
    setError,
    submitOrder,
    refreshNailSize,
  } = useBrandCustomOrderFlow(sellerUuid, brandName);

  const handleBack = () => {
    if (currentStep === 'shape') {
      onBack();
    } else {
      prevStep();
    }
  };

  const handleEdit = (targetStepIndex: number) => {
    const steps = ['shape', 'length', 'size', 'details', 'date', 'confirm'];
    for (let i = stepIndex; i > targetStepIndex; i--) {
      prevStep();
    }
  };

  const handleGoToChat = () => {
    if (chatRoomId) {
      onGo(getChatRoomPath(chatRoomId));
    }
  };

  const handleContinueShopping = () => {
    onBack();
  };

  const handleSubmit = async () => {
    const result = await submitOrder();
    if (!result.success && result.error) {
      // 에러는 훅에서 처리됨
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black mx-auto mb-4"></div>
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
          <DetailsStep
            desiredColor={data.desiredColor}
            request={data.request}
            attachments={data.attachments}
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
          <ConfirmStep
            data={data}
            brandName={brandName}
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
          <CompleteStep
            orderData={createdOrder}
            chatRoomId={chatRoomId}
            onGoToChat={handleGoToChat}
            onContinueShopping={handleContinueShopping}
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
