import { useState, useCallback, useEffect, useRef } from 'react';
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

// sessionStorage 초안 저장 (뒤로가기·새로고침 시 입력 유실 방지)
const getDraftKey = (sellerUuid: string) => `customOrderDraft:brand:${sellerUuid}`;
// complete 단계로는 복원하지 않음 (최대 confirm 단계까지)
const DRAFT_MAX_STEP_INDEX = STEP_ORDER.indexOf('confirm');

// File 객체(첨부 이미지)는 직렬화 불가하므로 제외하고 저장
type BrandCustomOrderDraftData = Omit<BrandCustomOrderFormData, 'attachments'>;

interface BrandCustomOrderDraft {
  stepIndex: number;
  data: BrandCustomOrderDraftData;
  attachmentCount: number;
  savedAt: number;
}

function readDraft(key: string): BrandCustomOrderDraft | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed.data || typeof parsed.data !== 'object') {
      return null;
    }
    return parsed as BrandCustomOrderDraft;
  } catch {
    return null;
  }
}

function clearDraft(key: string) {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // 초안 삭제 실패는 무시
  }
}

// 초안 사이즈에 유효한 값이 하나라도 있는지 확인
function draftHasSizes(sizes: HandSizes | undefined): boolean {
  if (!sizes?.left || !sizes?.right) return false;
  return [...Object.values(sizes.left), ...Object.values(sizes.right)]
    .some(v => typeof v === 'string' && v.trim() !== '');
}

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

  // 초안 복원 확인을 이미 진행한 초안 키 (StrictMode의 이중 실행 방지)
  const draftPromptedKeyRef = useRef<string | null>(null);

  // 사용자 네일 사이즈 로드
  useEffect(() => {
    const draftKey = getDraftKey(sellerUuid);

    const loadInitialData = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));

        // 저장된 초안이 있으면 복원 여부 확인
        let restoredDraft: BrandCustomOrderDraft | null = null;
        if (draftPromptedKeyRef.current !== draftKey) {
          draftPromptedKeyRef.current = draftKey;
          const draft = readDraft(draftKey);
          if (draft) {
            if (window.confirm('작성 중이던 주문서가 있습니다. 이어서 작성할까요?')) {
              restoredDraft = draft;
              if (draft.attachmentCount > 0) {
                window.alert('첨부했던 이미지는 저장할 수 없어 복원되지 않았습니다. 필요하시면 이미지를 다시 첨부해주세요.');
              }
            } else {
              clearDraft(draftKey);
            }
          }
        }

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

        setState(prev => {
          // 초안 복원: 직렬화 저장된 필드 복원 (첨부 이미지는 제외됨)
          if (restoredDraft) {
            const stepIndex = Math.min(Math.max(Number(restoredDraft.stepIndex) || 0, 0), DRAFT_MAX_STEP_INDEX);
            const draftSizes = restoredDraft.data.sizes;
            return {
              ...prev,
              userNailSize: nailSizeResponse.data || null,
              stepIndex,
              currentStep: STEP_ORDER[stepIndex],
              data: {
                ...initialData,
                ...restoredDraft.data,
                attachments: [],
                sizes: draftHasSizes(draftSizes)
                  ? {
                      left: { ...emptyFingerSizes, ...draftSizes.left },
                      right: { ...emptyFingerSizes, ...draftSizes.right },
                    }
                  : initialSizes,
              },
              loading: false,
            };
          }

          return {
            ...prev,
            userNailSize: nailSizeResponse.data || null,
            data: {
              ...prev.data,
              sizes: initialSizes,
            },
            loading: false,
          };
        });
      } catch (err: any) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: err.message || '데이터를 불러오는데 실패했습니다.',
        }));
      }
    };

    loadInitialData();
  }, [sellerUuid]);

  // 상태 변경 시마다 직렬화 가능한 필드만 sessionStorage에 초안 저장
  useEffect(() => {
    if (state.loading || state.submitting || state.createdOrder || state.currentStep === 'complete') {
      return;
    }

    const { attachments, ...serializable } = state.data;

    // 의미 있는 진행이 없으면 저장하지 않음 (불필요한 복원 확인 방지)
    const hasProgress =
      state.stepIndex > 0 ||
      serializable.desiredColor.trim() !== '' ||
      serializable.request.trim() !== '' ||
      serializable.desiredDate !== '' ||
      serializable.quantity !== 1 ||
      attachments.length > 0;
    if (!hasProgress) return;

    try {
      const draft: BrandCustomOrderDraft = {
        stepIndex: Math.min(state.stepIndex, DRAFT_MAX_STEP_INDEX),
        data: serializable,
        attachmentCount: attachments.length,
        savedAt: Date.now(),
      };
      sessionStorage.setItem(getDraftKey(sellerUuid), JSON.stringify(draft));
    } catch {
      // 저장 실패는 무시 (초안은 부가 기능)
    }
  }, [state.data, state.stepIndex, state.loading, state.submitting, state.createdOrder, state.currentStep, sellerUuid]);

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

      // 제출 성공 시 초안 삭제
      clearDraft(getDraftKey(sellerUuid));

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
