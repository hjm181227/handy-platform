import { useState, useCallback, useEffect } from 'react';
import { Product, NailShape, NailLength, CreateCustomOrderResponse } from '@handy-platform/shared';
import { productService, orderService, imageService, userService } from '../services/apiService';
import { NailSizeData } from '@handy-platform/shared/src/services/user/UserService';

// 커스텀 주문 단계 정의
export type CustomOrderStep = 'shape' | 'length' | 'size' | 'details' | 'date' | 'confirm' | 'complete';

// 한 손의 손가락별 사이즈 타입
export interface HandSizes {
  thumb: string;
  index: string;
  middle: string;
  ring: string;
  little: string;
}

// 양손 사이즈 타입 (주문서용)
export interface FingerSizes {
  leftHand: HandSizes;
  rightHand: HandSizes;
}

// 커스텀 주문 폼 데이터
export interface CustomOrderFormData {
  shape: NailShape;
  length: NailLength;
  sizes: FingerSizes;
  desiredColor: string;
  request: string;
  attachments: File[];
  desiredDate: string;
}

// Hook 상태
interface CustomOrderFlowState {
  currentStep: CustomOrderStep;
  stepIndex: number;
  totalSteps: number;
  direction: 'forward' | 'backward';
  data: CustomOrderFormData;
  product: Product | null;
  userNailSize: NailSizeData | null;
  loading: boolean;
  submitting: boolean;
  error: string | null;
  createdOrder: CreateCustomOrderResponse | null;
  chatRoomId: string | null;
}

// 단계 순서 (complete 제외한 실제 단계 수)
const STEP_ORDER: CustomOrderStep[] = ['shape', 'length', 'size', 'details', 'date', 'confirm', 'complete'];
const VISIBLE_STEPS = STEP_ORDER.length - 1; // complete 단계는 프로그레스에서 제외

// 빈 손 사이즈
const emptyHandSizes: HandSizes = {
  thumb: '',
  index: '',
  middle: '',
  ring: '',
  little: '',
};

// 초기 데이터
const initialData: CustomOrderFormData = {
  shape: 'ROUND',
  length: 'MEDIUM',
  sizes: {
    leftHand: { ...emptyHandSizes },
    rightHand: { ...emptyHandSizes },
  },
  desiredColor: '',
  request: '',
  attachments: [],
  desiredDate: '',
};

export function useCustomOrderFlow(productId: string) {
  const [state, setState] = useState<CustomOrderFlowState>({
    currentStep: 'shape',
    stepIndex: 0,
    totalSteps: VISIBLE_STEPS,
    direction: 'forward',
    data: initialData,
    product: null,
    userNailSize: null,
    loading: true,
    submitting: false,
    error: null,
    createdOrder: null,
    chatRoomId: null,
  });

  // 상품 정보 및 사용자 네일 사이즈 로드
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));

        // 상품 정보와 네일 사이즈를 병렬로 로드
        const [productResponse, nailSizeResponse] = await Promise.all([
          productService.getProduct(productId),
          userService.getNailSize().catch(() => ({ success: false, data: null })),
        ]);

        let initialSizes = initialData.sizes;

        // 사용자 네일 사이즈가 있으면 초기값으로 설정 (양손 모두)
        if (nailSizeResponse.success && nailSizeResponse.data) {
          const nailSize = nailSizeResponse.data;
          initialSizes = {
            leftHand: {
              thumb: nailSize.leftHand.thumb?.toString() || '',
              index: nailSize.leftHand.index?.toString() || '',
              middle: nailSize.leftHand.middle?.toString() || '',
              ring: nailSize.leftHand.ring?.toString() || '',
              little: nailSize.leftHand.little?.toString() || '',
            },
            rightHand: {
              thumb: nailSize.rightHand.thumb?.toString() || '',
              index: nailSize.rightHand.index?.toString() || '',
              middle: nailSize.rightHand.middle?.toString() || '',
              ring: nailSize.rightHand.ring?.toString() || '',
              little: nailSize.rightHand.little?.toString() || '',
            },
          };
        }

        setState(prev => ({
          ...prev,
          product: productResponse.data,
          userNailSize: nailSizeResponse.data || null,
          data: {
            ...prev.data,
            sizes: initialSizes,
          },
          loading: false,
        }));
      } catch (err: any) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: err.message || '데이터를 불러오는데 실패했습니다.',
        }));
      }
    };

    loadInitialData();
  }, [productId]);

  // 다음 단계로 이동
  const nextStep = useCallback(() => {
    setState(prev => {
      const nextIndex = prev.stepIndex + 1;
      if (nextIndex >= STEP_ORDER.length) return prev;

      return {
        ...prev,
        stepIndex: nextIndex,
        currentStep: STEP_ORDER[nextIndex],
        direction: 'forward',
        error: null,
      };
    });
  }, []);

  // 이전 단계로 이동
  const prevStep = useCallback(() => {
    setState(prev => {
      const prevIndex = prev.stepIndex - 1;
      if (prevIndex < 0) return prev;

      return {
        ...prev,
        stepIndex: prevIndex,
        currentStep: STEP_ORDER[prevIndex],
        direction: 'backward',
        error: null,
      };
    });
  }, []);

  // 데이터 업데이트
  const updateData = useCallback(<K extends keyof CustomOrderFormData>(
    field: K,
    value: CustomOrderFormData[K]
  ) => {
    setState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        [field]: value,
      },
    }));
  }, []);

  // 첨부파일 추가
  const addAttachments = useCallback((files: File[]) => {
    setState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        attachments: [...prev.data.attachments, ...files],
      },
    }));
  }, []);

  // 첨부파일 삭제
  const removeAttachment = useCallback((index: number) => {
    setState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        attachments: prev.data.attachments.filter((_, i) => i !== index),
      },
    }));
  }, []);

  // 사이즈 업데이트 (양손 지원)
  const updateSize = useCallback((hand: 'leftHand' | 'rightHand', finger: keyof HandSizes, value: string) => {
    setState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        sizes: {
          ...prev.data.sizes,
          [hand]: {
            ...prev.data.sizes[hand],
            [finger]: value,
          },
        },
      },
    }));
  }, []);

  // 에러 설정
  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  // 주문 제출
  const submitOrder = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    const { product, data } = state;

    if (!product?.sellerUuid) {
      return { success: false, error: '판매자 정보를 찾을 수 없습니다.' };
    }

    // 사이즈 필수 검증 (양손 모든 손가락)
    const leftHandFilled = Object.values(data.sizes.leftHand).every(s => s.trim() !== '');
    const rightHandFilled = Object.values(data.sizes.rightHand).every(s => s.trim() !== '');
    if (!leftHandFilled || !rightHandFilled) {
      return { success: false, error: '양손의 모든 손가락 사이즈를 입력해주세요.' };
    }

    setState(prev => ({ ...prev, submitting: true, error: null }));

    try {
      // 1. 첨부파일 업로드
      const imageUrls: string[] = [];
      for (const file of data.attachments) {
        if (!file.type.startsWith('image/')) continue;

        const presignedResponse = await imageService.getPresignedUrl({
          filename: file.name,
          contentType: file.type,
          uploadType: 'custom-order-reference',
        });

        const uploadHeaders: Record<string, string> = {
          'Content-Type': file.type,
          ...(presignedResponse.uploadHeaders || {}),
        };

        const uploadResponse = await fetch(presignedResponse.presignedUrl, {
          method: 'PUT',
          body: file,
          headers: uploadHeaders,
        });

        if (!uploadResponse.ok) {
          throw new Error(`이미지 업로드 실패: ${uploadResponse.status}`);
        }

        imageUrls.push(presignedResponse.imageUrl);
      }

      // 2. 커스텀 주문서 생성
      const orderResponse = await orderService.createCustomOrder({
        sellerUuid: product.sellerUuid,
        baseProductUuid: productId,
        baseProductType: product.productType || 'original',
        title: `${product.name} 커스텀 주문`,
        specifications: {
          shape: data.shape,
          length: data.length,
          sizes: data.sizes,
          desiredColor: data.desiredColor || undefined,
          desiredDate: data.desiredDate || undefined,
          designNotes: data.request || undefined,
          referenceImages: imageUrls.length > 0 ? imageUrls : undefined,
        },
      });

      if (!orderResponse.data) {
        throw new Error('주문서 생성 응답이 올바르지 않습니다');
      }

      // 3. 채팅방 생성 시도 (동적 import로 순환 참조 방지)
      let chatRoomId: string | null = null;
      try {
        const { sendCustomOrderToChat } = await import('../lib/chat/orderChatService');
        const chatResult = await sendCustomOrderToChat(product.sellerUuid, orderResponse.data);
        if (chatResult.success && chatResult.roomId) {
          chatRoomId = chatResult.roomId;
        }
      } catch (chatError) {
        console.warn('채팅방 생성 실패:', chatError);
      }

      setState(prev => ({
        ...prev,
        submitting: false,
        createdOrder: orderResponse.data,
        chatRoomId,
      }));

      // 완료 단계로 이동
      nextStep();

      return { success: true };
    } catch (error: any) {
      console.error('주문 제출 실패:', error);

      let errorMessage = '주문 제출에 실패했습니다. 다시 시도해주세요.';
      if (error.message?.includes('custom orders') || error.status === 400) {
        errorMessage = '이 판매자는 현재 커스텀 주문을 받지 않습니다.';
      }

      setState(prev => ({
        ...prev,
        submitting: false,
        error: errorMessage,
      }));

      return { success: false, error: errorMessage };
    }
  }, [state, productId, nextStep]);

  // 초기화
  const reset = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: 'shape',
      stepIndex: 0,
      direction: 'forward',
      data: initialData,
      error: null,
      createdOrder: null,
      chatRoomId: null,
    }));
  }, []);

  // 네일 사이즈 데이터가 있는지 확인
  const hasNailSizeData = useCallback(() => {
    return state.userNailSize !== null;
  }, [state.userNailSize]);

  // 사이즈가 모두 입력되었는지 확인 (양손)
  const isSizesComplete = useCallback(() => {
    const leftComplete = Object.values(state.data.sizes.leftHand).every(s => s.trim() !== '');
    const rightComplete = Object.values(state.data.sizes.rightHand).every(s => s.trim() !== '');
    return leftComplete && rightComplete;
  }, [state.data.sizes]);

  return {
    // 상태
    currentStep: state.currentStep,
    stepIndex: state.stepIndex,
    totalSteps: state.totalSteps,
    direction: state.direction,
    data: state.data,
    product: state.product,
    userNailSize: state.userNailSize,
    loading: state.loading,
    submitting: state.submitting,
    error: state.error,
    createdOrder: state.createdOrder,
    chatRoomId: state.chatRoomId,

    // 네비게이션
    nextStep,
    prevStep,
    reset,

    // 데이터 관리
    updateData,
    updateSize,
    addAttachments,
    removeAttachment,
    setError,

    // API
    submitOrder,

    // 유틸리티
    hasNailSizeData,
    isSizesComplete,
  };
}
