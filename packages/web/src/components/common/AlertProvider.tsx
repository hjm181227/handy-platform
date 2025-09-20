import React, { createContext, useContext, useEffect, useState } from 'react';
import { AlertState, alertService } from '@handy-platform/shared';
import { AlertModal } from './AlertModal';

interface AlertContextType {
  alerts: AlertState[];
  alert: (message: string, options?: any) => Promise<void>;
  confirm: (message: string, options?: any) => Promise<boolean>;
  error: (error: Error | string, options?: any) => Promise<any>;
  prompt: (message: string, options?: any) => Promise<string | null>;
  dismiss: (id?: string) => void;
  dismissAll: () => void;
  resetRetryCounter: (error: Error | string) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

interface AlertProviderProps {
  children: React.ReactNode;
}

export function AlertProvider({ children }: AlertProviderProps) {
  const [alerts, setAlerts] = useState<AlertState[]>([]);

  useEffect(() => {
    // AlertService 상태 변경 구독
    const unsubscribe = alertService.subscribe((newAlerts) => {
      setAlerts(newAlerts);
    });

    return unsubscribe;
  }, []);

  const contextValue: AlertContextType = {
    alerts,
    alert: (message, options) => alertService.alert(message, options),
    confirm: (message, options) => alertService.confirm(message, options),
    error: (error, options) => alertService.error(error, options),
    prompt: (message, options) => alertService.prompt(message, options),
    dismiss: (id) => alertService.dismiss(id),
    dismissAll: () => alertService.dismissAll(),
    resetRetryCounter: (error) => alertService.resetRetryCounter(error),
  };

  return (
    <AlertContext.Provider value={contextValue}>
      {children}
      {/* 현재 표시할 알림이 있으면 모달 렌더링 */}
      {alerts.length > 0 && alerts[0] && (
        <AlertModal
          alert={alerts[0]}
          onResolve={(result) => alertService.resolveAlert(alerts[0].id, result)}
          onReject={(reason) => alertService.rejectAlert(alerts[0].id, reason)}
        />
      )}
    </AlertContext.Provider>
  );
}

export function useAlert(): AlertContextType {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
}