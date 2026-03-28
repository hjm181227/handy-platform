import { useState, useCallback, useEffect } from 'react';
import { NailShape, NailLength, CreateCustomOrderResponse } from '@handy-platform/shared';
import { orderService, imageService, userService } from '../services/apiService';
import { NailSizeData } from '@handy-platform/shared/src/services/user/UserService';

// 커스텀 주문 단계 정의
export type PublicCustomOrderStep = 'shape' | 'length' | 'size' | 'details' | 'date' | 'confirm' | 'complete';

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

// 공개 주문서 폼 데이터
export interface PublicCustomOrderFormData {
  title: string;
  shape: NailShape;
  length: NailLength;
  sizes: HandSizes;
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

const initialData: PublicCustomOrderFormData = {
  title: '',
  shape: 'ROUND',
  length: 'MEDIUM',
  sizes: {
    left: { ...emptyFingerSizes },
    right: { ...emptyFingerSizes },
  },
  desiredColor: '',
  request: '',
  attachments: [],
  desiredDate: '',
};

const STEP_ORDER: PublicCustomOrderStep[] = ['shape', 'length', 'size', 'details', 'date', 'confirm', 'complete'];
const VISIBLE_STEPS = STEP_ORDER.length - 1;

interface PublicCustomOrderFlowState {
  currentStep: PublicCustomOrderStep;
  stepIndex: number;
  totalSteps: number;
  direction: 'forward' | 'backward';
  data: PublicCustomOrderFormData;
  userNailSize: NailSizeData | null;
  loading: boolean;
  submitting: boolean;
  error: string | null;
  createdOrder: CreateCustomOrderResponse | null;
}

export function usePublicCustomOrderFlow() {
  const [state, setState] = useState<PublicCustomOrderFlowState>({
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
  });

  // 사용자 네일 사이즈 로드 (상품 로드 없음)
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));

        // 네일 사이즈는 로그인 상태에서만 조회 (토큰 없이 호출하면 401 → 토큰 만료 핸들러가 리다이렉트시킴)
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

  const updateData = useCallback(<K extends keyof PublicCustomOrderFormData>(
    field: K,
    value: PublicCustomOrderFormData[K]
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

    if (!data.title.trim()) {
      return { success: false, error: '주문서 제목을 입력해주세요.' };
    }

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

      // 2. 공개 커스텀 주문서 생성 (sellerUuid 없이)
      const orderResponse = await orderService.createCustomOrder({
        title: data.title,
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

      setState(prev => ({
        ...prev,
        submitting: false,
        createdOrder: orderResponse.data ?? null,
      }));

      nextStep();

      return { success: true };
    } catch (error: any) {
      console.error('주문 제출 실패:', error);

      const errorMessage = error.message || '주문 제출에 실패했습니다. 다시 시도해주세요.';

      setState(prev => ({
        ...prev,
        submitting: false,
        error: errorMessage,
      }));

      return { success: false, error: errorMessage };
    }
  }, [state, nextStep]);

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
    product: null, // 상품 없음
    userNailSize: state.userNailSize,
    loading: state.loading,
    submitting: state.submitting,
    error: state.error,
    createdOrder: state.createdOrder,
    chatRoomId: null, // 공개 주문은 채팅방 바로 생성 안함
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
