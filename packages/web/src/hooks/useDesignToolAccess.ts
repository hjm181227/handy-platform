import { useState, useEffect, useCallback } from 'react';
import { designToolService } from '../services/apiService';
import type { DesignToolAccess, DesignToolPlan, DesignToolPlanId } from '@handy-platform/shared';

interface PaymentSession {
  orderId: string;
  amount: number;
  clientKey: string;
  orderName: string;
}

interface UseDesignToolAccessReturn {
  access: DesignToolAccess | null;
  plans: DesignToolPlan[];
  loading: boolean;
  error: string | null;
  subscribe: (planId: DesignToolPlanId, paymentMethod?: string) => Promise<PaymentSession | null>;
  approve: (paymentKey: string, orderId: string, amount: number) => Promise<boolean>;
  cancel: () => Promise<boolean>;
  changePlan: (planId: DesignToolPlanId) => Promise<PaymentSession | boolean>;
  refresh: () => Promise<void>;
}

export function useDesignToolAccess(autoFetch = true): UseDesignToolAccessReturn {
  const [access, setAccess] = useState<DesignToolAccess | null>(null);
  const [plans, setPlans] = useState<DesignToolPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAccess = useCallback(async () => {
    try {
      const response = await designToolService.getAccess();
      if (response.success && response.access) {
        setAccess(response.access);
      }
    } catch (err: any) {
      // 비로그인 상태에서는 에러를 무시
      console.debug('Design tool access fetch skipped (not logged in)');
    }
  }, []);

  const fetchPlans = useCallback(async () => {
    try {
      const response = await designToolService.getPlans();
      if (response.success && response.plans) {
        setPlans(response.plans);
      }
    } catch (err: any) {
      setError(err.message || '플랜 정보를 불러오는데 실패했습니다.');
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchAccess(), fetchPlans()]);
    } finally {
      setLoading(false);
    }
  }, [fetchAccess, fetchPlans]);

  useEffect(() => {
    if (autoFetch) {
      refresh();
    }
  }, [autoFetch, refresh]);

  const subscribe = useCallback(async (planId: DesignToolPlanId, paymentMethod?: string): Promise<PaymentSession | null> => {
    try {
      setLoading(true);
      setError(null);
      const response = await designToolService.subscribe({ planId, paymentMethod });
      if (response.success) {
        // free 플랜은 바로 구독 완료, pro 플랜은 결제 세션 반환
        if (response.subscription) {
          setAccess(response.subscription);
        }
        if (response.paymentSession) {
          return response.paymentSession as PaymentSession;
        }
        return null;
      }
      return null;
    } catch (err: any) {
      setError(err.message || '구독 처리에 실패했습니다.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const approve = useCallback(async (paymentKey: string, orderId: string, amount: number): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const response = await designToolService.approveSubscription({ paymentKey, orderId, amount });
      if (response.success && response.subscription) {
        setAccess(response.subscription);
        return true;
      }
      return false;
    } catch (err: any) {
      setError(err.message || '결제 승인에 실패했습니다.');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const cancel = useCallback(async (): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const response = await designToolService.cancelSubscription();
      if (response.success && response.subscription) {
        setAccess(response.subscription);
        return true;
      }
      return false;
    } catch (err: any) {
      setError(err.message || '구독 취소에 실패했습니다.');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const changePlan = useCallback(async (planId: DesignToolPlanId): Promise<PaymentSession | boolean> => {
    try {
      setLoading(true);
      setError(null);
      const response = await designToolService.changePlan(planId);
      if (response.success) {
        if (response.subscription) {
          setAccess(response.subscription);
          return true;
        }
        if (response.paymentSession) {
          return response.paymentSession as PaymentSession;
        }
      }
      return false;
    } catch (err: any) {
      setError(err.message || '플랜 변경에 실패했습니다.');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { access, plans, loading, error, subscribe, approve, cancel, changePlan, refresh };
}
