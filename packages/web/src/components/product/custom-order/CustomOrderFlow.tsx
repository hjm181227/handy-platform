import { useCustomOrderFlow } from '../../../hooks/useCustomOrderFlow';
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

interface CustomOrderFlowProps {
  productId: string;
  onBack: () => void;
  onGo: (to: string) => void;
}

export function CustomOrderFlow({ productId, onBack, onGo }: CustomOrderFlowProps) {
  const {
    currentStep,
    stepIndex,
    totalSteps,
    data,
    product,
    userNailSize,
    loading,
    submitting,
    error,
    createdOrder,
    chatRoomId,
    chatDeliveryFailed,
    nextStep,
    prevStep,
    updateData,
    updateSize,
    addAttachments,
    removeAttachment,
    setError,
    submitOrder,
    refreshNailSize,
  } = useCustomOrderFlow(productId);

  // 뒤로가기 핸들러
  const handleBack = () => {
    if (currentStep === 'shape') {
      onBack(); // 첫 단계에서 뒤로가면 주문서 작성 종료
    } else {
      prevStep();
    }
  };

  // 특정 단계로 이동 (수정 버튼 클릭 시)
  const handleEdit = (targetStepIndex: number) => {
    // 현재 단계보다 이전 단계로만 이동 가능
    const steps = ['shape', 'length', 'size', 'details', 'date', 'confirm'];
    for (let i = stepIndex; i > targetStepIndex; i--) {
      prevStep();
    }
  };

  // 채팅으로 이동
  const handleGoToChat = () => {
    if (chatRoomId) {
      onGo(getChatRoomPath(chatRoomId));
    }
  };

  // 계속 쇼핑하기
  const handleContinueShopping = () => {
    onBack();
  };

  // 주문 제출
  const handleSubmit = async () => {
    const result = await submitOrder();
    if (!result.success && result.error) {
      // 에러는 훅에서 처리됨
    }
  };

  // 로딩 상태
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

  // 에러 상태 (상품 로드 실패)
  if (!product) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4 px-5">
        <p className="text-gray-600 text-center">
          {error || '상품 정보를 불러오는데 실패했습니다.'}
        </p>
        <button
          onClick={onBack}
          className="text-brand hover:underline font-medium"
        >
          돌아가기
        </button>
      </div>
    );
  }

  // 현재 단계에 맞는 컴포넌트 렌더링
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
            fixed={product.nailOptions?.shapeCustomizable === false}
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
            fixed={product.nailOptions?.lengthCustomizable === false}
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
            quantity={data.quantity}
            onUpdateQuantity={(q: number) => updateData('quantity', q)}
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
            product={product}
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
            chatDeliveryFailed={chatDeliveryFailed}
            onGoToChat={handleGoToChat}
            onContinueShopping={handleContinueShopping}
          />
        );

      default:
        return null;
    }
  };

  // 애니메이션 적용
  return (
    <div className="custom-order-flow">
      <div key={currentStep} className="animate-fade-in">
        {renderStep()}
      </div>
    </div>
  );
}
