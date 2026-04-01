/**
 * 에러 코드에 따른 사용자 친화적 메시지 매핑
 * i18n 래퍼 — 기존 인터페이스 유지, 내부에서 i18next 호출
 */

import i18n from '../i18n';

export interface ErrorMessage {
  title: string;
  message: string;
  action?: string;
}

/**
 * 에러 코드에 따른 사용자 친화적 메시지 반환
 */
export function getErrorMessage(errorCode: string, fallbackMessage?: string): ErrorMessage {
  const titleKey = `error:${errorCode}.title`;
  const messageKey = `error:${errorCode}.message`;
  const actionKey = `error:${errorCode}.action`;

  const title = i18n.exists(titleKey) ? i18n.t(titleKey) : '';
  const message = i18n.exists(messageKey) ? i18n.t(messageKey) : '';

  if (title) {
    return {
      title,
      message: message || fallbackMessage || '',
      action: i18n.exists(actionKey) ? i18n.t(actionKey) : i18n.t('error:defaultAction'),
    };
  }

  // 에러 코드가 없거나 매핑되지 않은 경우 기본 메시지 반환
  return {
    title: i18n.t('error:defaultTitle'),
    message: fallbackMessage || i18n.t('error:UNKNOWN_ERROR.message'),
    action: i18n.t('error:defaultAction'),
  };
}

/**
 * HTTP 상태 코드에 따른 기본 에러 메시지
 */
export function getErrorMessageFromStatus(status: number, message?: string): ErrorMessage {
  switch (status) {
    case 400:
      return getErrorMessage('VALIDATION_ERROR', message);
    case 401:
      return getErrorMessage('TOKEN_INVALID', message);
    case 403:
      return getErrorMessage('ACCESS_DENIED', message);
    case 404:
      return getErrorMessage('PRODUCT_NOT_FOUND', message);
    case 408:
      return getErrorMessage('TIMEOUT', message);
    case 409:
      return getErrorMessage('USER_ALREADY_EXISTS', message);
    case 422:
      return getErrorMessage('VALIDATION_ERROR', message);
    case 429:
      return getErrorMessage('TOO_MANY_REQUESTS', message);
    case 500:
      return getErrorMessage('SERVER_ERROR', message);
    case 502:
    case 503:
      return getErrorMessage('SERVICE_UNAVAILABLE', message);
    case 504:
      return getErrorMessage('TIMEOUT', message);
    default:
      return getErrorMessage('UNKNOWN_ERROR', message);
  }
}

/**
 * ApiError 객체에서 사용자 친화적 메시지 추출
 */
export function getErrorMessageFromApiError(error: any): ErrorMessage {
  // 에러 객체에서 코드 추출
  const errorCode = error?.code || error?.error?.code || error?.response?.data?.code;
  const message = error?.message || error?.error?.message || error?.response?.data?.message;
  const status = error?.status || error?.response?.status;

  if (errorCode) {
    return getErrorMessage(errorCode, message);
  }

  if (status) {
    return getErrorMessageFromStatus(status, message);
  }

  return getErrorMessage('UNKNOWN_ERROR', message);
}
