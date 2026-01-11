import { useState, useCallback } from 'react';
import { webApiService } from '../services/apiService';

// 회원가입 단계 정의
export type SignupStep = 'email' | 'password' | 'name' | 'phone' | 'complete';

// 회원가입 데이터
export interface SignupFormData {
  email: string;
  password: string;
  name: string;
  phone: string;
  verificationId: string;
}

// Hook 상태
interface SignupFlowState {
  currentStep: SignupStep;
  stepIndex: number;
  totalSteps: number;
  direction: 'forward' | 'backward';
  data: SignupFormData;
  loading: boolean;
  error: string | null;
}

// 단계 순서
const STEP_ORDER: SignupStep[] = ['email', 'password', 'name', 'phone', 'complete'];

// 초기 상태
const initialData: SignupFormData = {
  email: '',
  password: '',
  name: '',
  phone: '',
  verificationId: '',
};

export function useSignupFlow() {
  const [state, setState] = useState<SignupFlowState>({
    currentStep: 'email',
    stepIndex: 0,
    totalSteps: STEP_ORDER.length,
    direction: 'forward',
    data: initialData,
    loading: false,
    error: null,
  });

  // 다음 단계로 이동
  const nextStep = useCallback(() => {
    setState((prev) => {
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
    setState((prev) => {
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
  const updateData = useCallback(<K extends keyof SignupFormData>(
    field: K,
    value: SignupFormData[K]
  ) => {
    setState((prev) => ({
      ...prev,
      data: {
        ...prev.data,
        [field]: value,
      },
    }));
  }, []);

  // 여러 필드 동시 업데이트
  const updateMultipleData = useCallback((updates: Partial<SignupFormData>) => {
    setState((prev) => ({
      ...prev,
      data: {
        ...prev.data,
        ...updates,
      },
    }));
  }, []);

  // 로딩 상태 설정
  const setLoading = useCallback((loading: boolean) => {
    setState((prev) => ({ ...prev, loading }));
  }, []);

  // 에러 설정
  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error }));
  }, []);

  // 휴대폰 인증번호 발송
  const sendPhoneVerification = useCallback(async (phone: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await webApiService.auth.sendPhoneVerification(phone, 'registration');
      if (response.success) {
        updateMultipleData({
          phone,
          verificationId: response.data.verificationId,
        });
        return { success: true, expiresAt: response.data.expiresAt };
      }
      throw new Error('인증번호 발송에 실패했습니다.');
    } catch (error: any) {
      const message = error.message || '인증번호 발송에 실패했습니다.';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, updateMultipleData]);

  // 인증번호 확인
  const verifyPhoneCode = useCallback(async (code: string) => {
    const { verificationId } = state.data;
    if (!verificationId) {
      setError('인증 정보가 없습니다. 다시 시도해주세요.');
      return { success: false, error: '인증 정보가 없습니다.' };
    }

    setLoading(true);
    setError(null);
    try {
      const response = await webApiService.auth.verifyPhoneCode(verificationId, code);
      if (response.success) {
        return { success: true };
      }
      throw new Error('인증번호가 일치하지 않습니다.');
    } catch (error: any) {
      const message = error.message || '인증에 실패했습니다.';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [state.data, setLoading, setError]);

  // 회원가입 제출
  const submitSignup = useCallback(async () => {
    const { email, password, name, verificationId } = state.data;

    if (!email || !password || !name || !verificationId) {
      setError('필수 정보가 누락되었습니다.');
      return { success: false, error: '필수 정보가 누락되었습니다.' };
    }

    setLoading(true);
    setError(null);
    try {
      const response = await webApiService.auth.register({
        email,
        password,
        name,
        nickname: name, // 기본적으로 이름을 닉네임으로 사용
        verificationId,
      });

      if (response.token && response.user) {
        // 토큰 저장 및 사용자 정보 설정
        await webApiService.auth.setAuthToken(response.token, response.user);

        // 완료 단계로 이동
        nextStep();

        return { success: true, user: response.user };
      }

      throw new Error('회원가입에 실패했습니다.');
    } catch (error: any) {
      const message = error.message || '회원가입에 실패했습니다.';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [state.data, setLoading, setError, nextStep]);

  // 초기화
  const reset = useCallback(() => {
    setState({
      currentStep: 'email',
      stepIndex: 0,
      totalSteps: STEP_ORDER.length,
      direction: 'forward',
      data: initialData,
      loading: false,
      error: null,
    });
  }, []);

  // 특정 단계로 이동 (뒤로가기용)
  const goToStep = useCallback((step: SignupStep) => {
    const newIndex = STEP_ORDER.indexOf(step);
    if (newIndex === -1 || newIndex >= state.stepIndex) return;

    setState((prev) => ({
      ...prev,
      stepIndex: newIndex,
      currentStep: step,
      direction: 'backward',
      error: null,
    }));
  }, [state.stepIndex]);

  return {
    // 상태
    currentStep: state.currentStep,
    stepIndex: state.stepIndex,
    totalSteps: state.totalSteps,
    direction: state.direction,
    data: state.data,
    loading: state.loading,
    error: state.error,

    // 네비게이션
    nextStep,
    prevStep,
    goToStep,
    reset,

    // 데이터 관리
    updateData,
    updateMultipleData,

    // API 호출
    sendPhoneVerification,
    verifyPhoneCode,
    submitSignup,

    // 유틸리티
    setLoading,
    setError,
  };
}
