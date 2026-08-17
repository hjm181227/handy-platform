import { useState, useCallback, useEffect } from 'react';
import { NailShape, NailLength, CreateCustomOrderResponse } from '@handy-platform/shared';
import { orderService, imageService, userService } from '../services/apiService';
import { NailSizeData } from '@handy-platform/shared/src/services/user/UserService';

// 커스텀 주문 단계 정의
export type BrandCustomOrderStep = 'shape' | 'length' | 'size' | 'details' | 'date' | 'confirm' | 'complete';

// 손가락별 사이즈 타입
export interface FingerSizes {
  thumb: string;
  index: string;
  middle: string;
  ring: string;
  pinky: string;
}

// 양손 사이즈
export interface HandSizes {
  left: FingerSizes;
  right: FingerSizes;
}

// 브랜드 커스텀 주문 폼 데이터
export interface BrandCustomOrderFormData {
  shape: NailShape;
  length: NailLength;
  sizes: HandSizes;
  quantity: number;
  desiredColor: string;
  request: string;
  attachments: File[];
  desiredDate: string;
}

const emptyFingerSizes: FingerSizes = {
  thumb: '',
  index: '',
  middle: '',
  ring: '',
  pinky: '',
};

const initialData: BrandCustomOrderFormData = {
  shape: 'ROUND',
  length: 'MEDIUM',
  sizes: {
    left: { ...emptyFingerSizes },
    right: { ...emptyFingerSizes },
  },
  quantity: 1,
  desiredColor: '',
  request: '',
  attachments: [],
  desiredDate: '',
};

const STEP_ORDER: BrandCustomOrderStep[] = ['shape', 'length', 'size', 'details', 'date', 'confirm', 'complete'];
const VISIBLE_STEPS = STEP_ORDER.length - 1;

interface BrandCustomOrderFlowState {
  currentStep: BrandCustomOrderStep;
  stepIndex: number;
  totalSteps: number;
  direction: 'forward' | 'backward';
  data: BrandCustomOrderFormData;
  userNailSize: NailSizeData | null;
  loading: boolean;
  submitting: boolean;
  error: string | null;
  createdOrder: CreateCustomOrderResponse | null;
  chatRoomId: string | null;
}

export function useBrandCustomOrderFlow(sellerUuid: string, brandName: string) {
  const [state, setState] = useState<BrandCustomOrderFlowState>({
    currentStep: 'shape',
    stepIndex: 0,
    totalSteps: VISIBLE_STEPS,
    direction: 'forward',
    data: initialData,
    userNailSize: null,
    loading: true,
    submitting: false,
    error: null,
    createdOrder: null,
    chatRoomId: null,
  });

  // 사용자 네일 사이즈 로드
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));

        const token = localStorage.getItem('accessToken');
        const nailSizeResponse = token
          ? await userService.getNailSize().catch(() => ({ success: false, data: null }))
          : { success: false, data: null };

        let initialSizes = initialData.sizes;

        if (nailSizeResponse.success && nailSizeResponse.data) {
          const nailSize = nailSizeResponse.data;
          initialSizes = {
            left: {
              thumb: nailSize.leftHand.thumb?.toString() || '',
              index: nailSize.leftHand.index?.toString() || '',
              middle: nailSize.leftHand.middle?.toString() || '',
              ring: nailSize.leftHand.ring?.toString() || '',
              pinky: nailSize.leftHand.little?.toString() || '',
            },
            right: {
              thumb: nailSize.rightHand.thumb?.toString() || '',
              index: nailSize.rightHand.index?.toString() || '',
              middle: nailSize.rightHand.middle?.toString() || '',
              ring: nailSize.rightHand.ring?.toString() || '',
              pinky: nailSize.rightHand.little?.toString() || '',
            },
          };
        }

        setState(prev => ({
          ...prev,
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
  }, []);

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

  const updateData = useCallback(<K extends keyof BrandCustomOrderFormData>(
    field: K,
    value: BrandCustomOrderFormData[K]
  ) => {
    setState(prev => ({
      ...prev,
      data: { ...prev.data, [field]: value },
    }));
  }, []);

  const addAttachments = useCallback((files: File[]) => {
    setState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        attachments: [...prev.data.attachments, ...files],
      },
    }));
  }, []);

  const removeAttachment = useCallback((index: number) => {
    setState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        attachments: prev.data.attachments.filter((_, i) => i !== index),
      },
    }));
  }, []);

  const updateSize = useCallback((hand: 'left' | 'right', finger: keyof FingerSizes, value: string) => {
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

  const refreshNailSize = useCallback(async () => {
    try {
      const response = await userService.getNailSize();
      if (response.success && response.data) {
        const nailSize = response.data;
        const newSizes = {
          left: {
            thumb: nailSize.leftHand.thumb?.toString() || '',
            index: nailSize.leftHand.index?.toString() || '',
            middle: nailSize.leftHand.middle?.toString() || '',
            ring: nailSize.leftHand.ring?.toString() || '',
            pinky: nailSize.leftHand.little?.toString() || '',
          },
          right: {
            thumb: nailSize.rightHand.thumb?.toString() || '',
            index: nailSize.rightHand.index?.toString() || '',
            middle: nailSize.rightHand.middle?.toString() || '',
            ring: nailSize.rightHand.ring?.toString() || '',
            pinky: nailSize.rightHand.little?.toString() || '',
          },
        };
        setState(prev => ({
          ...prev,
          userNailSize: nailSize,
          data: { ...prev.data, sizes: newSizes },
        }));
      }
    } catch {
      // 조용히 실패
    }
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const submitOrder = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    const { data } = state;

    const leftFilled = Object.values(data.sizes.left).every(s => s.trim() !== '');
    const rightFilled = Object.values(data.sizes.right).every(s => s.trim() !== '');
    if (!leftFilled || !rightFilled) {
      return { success: false, error: '양손 모든 손가락 사이즈를 입력해주세요.' };
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

      // 2. 커스텀 주문서 생성 (sellerUuid 포함)
      const orderResponse = await orderService.createCustomOrder({
        sellerUuid,
        title: `${brandName} 커스텀 주문`,
        specifications: {
          shape: data.shape,
          length: data.length,
          sizes: data.sizes,
          quantity: data.quantity > 1 ? data.quantity : undefined,
          desiredColor: data.desiredColor || undefined,
          desiredDate: data.desiredDate || undefined,
          designNotes: data.request || undefined,
          referenceImages: imageUrls.length > 0 ? imageUrls : undefined,
        },
      });

      if (!orderResponse.data) {
        throw new Error('주문서 생성 응답이 올바르지 않습니다');
      }

      // 3. 채팅방 생성 시도
      let chatRoomId: string | null = null;
      try {
        const { sendCustomOrderToChat } = await import('../lib/chat/orderChatService');
        const chatResult = await sendCustomOrderToChat(sellerUuid, orderResponse.data);
        if (chatResult.success && chatResult.roomId) {
          chatRoomId = chatResult.roomId;
        }
      } catch (chatError) {
        console.warn('채팅방 생성 실패:', chatError);
      }

      setState(prev => ({
        ...prev,
        submitting: false,
        createdOrder: orderResponse.data ?? null,
        chatRoomId,
      }));

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
  }, [state, sellerUuid, brandName, nextStep]);

  const hasNailSizeData = useCallback(() => {
    return state.userNailSize !== null;
  }, [state.userNailSize]);

  const isSizesComplete = useCallback(() => {
    const leftComplete = Object.values(state.data.sizes.left).every(s => s.trim() !== '');
    const rightComplete = Object.values(state.data.sizes.right).every(s => s.trim() !== '');
    return leftComplete && rightComplete;
  }, [state.data.sizes]);

  return {
    currentStep: state.currentStep,
    stepIndex: state.stepIndex,
    totalSteps: state.totalSteps,
    direction: state.direction,
    data: state.data,
    userNailSize: state.userNailSize,
    loading: state.loading,
    submitting: state.submitting,
    error: state.error,
    createdOrder: state.createdOrder,
    chatRoomId: state.chatRoomId,
    nextStep,
    prevStep,
    updateData,
    updateSize,
    addAttachments,
    removeAttachment,
    setError,
    refreshNailSize,
    submitOrder,
    hasNailSizeData,
    isSizesComplete,
  };
}
