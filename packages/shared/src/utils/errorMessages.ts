/**
 * 에러 코드에 따른 사용자 친화적 메시지 매핑
 */

export interface ErrorMessage {
  title: string;
  message: string;
  action?: string;
}

export const ERROR_MESSAGES: Record<string, ErrorMessage> = {
  // 인증 관련 에러
  USER_ALREADY_EXISTS: {
    title: '이미 가입된 계정입니다',
    message: '이미 가입된 이메일 주소입니다. 로그인을 시도해보세요.',
    action: '로그인하기'
  },
  USER_NOT_FOUND: {
    title: '계정을 찾을 수 없습니다',
    message: '등록되지 않은 이메일 주소입니다. 회원가입을 해주세요.',
    action: '회원가입하기'
  },
  INVALID_CREDENTIALS: {
    title: '로그인 정보가 올바르지 않습니다',
    message: '이메일 또는 비밀번호가 잘못되었습니다. 다시 확인해주세요.',
    action: '다시 시도'
  },
  INVALID_PASSWORD: {
    title: '비밀번호가 올바르지 않습니다',
    message: '비밀번호가 일치하지 않습니다. 다시 입력해주세요.',
    action: '다시 시도'
  },
  TOKEN_EXPIRED: {
    title: '로그인이 만료되었습니다',
    message: '로그인 세션이 만료되었습니다. 다시 로그인해주세요.',
    action: '로그인하기'
  },
  TOKEN_INVALID: {
    title: '인증 정보가 유효하지 않습니다',
    message: '로그인 정보에 문제가 있습니다. 다시 로그인해주세요.',
    action: '로그인하기'
  },
  ACCESS_DENIED: {
    title: '접근 권한이 없습니다',
    message: '이 기능을 사용할 권한이 없습니다.',
    action: '확인'
  },

  // 유효성 검사 에러
  VALIDATION_ERROR: {
    title: '입력 정보를 확인해주세요',
    message: '입력하신 정보에 오류가 있습니다. 다시 확인해주세요.',
    action: '수정하기'
  },
  EMAIL_INVALID: {
    title: '이메일 형식이 올바르지 않습니다',
    message: '올바른 이메일 주소를 입력해주세요.',
    action: '수정하기'
  },
  PASSWORD_TOO_SHORT: {
    title: '비밀번호가 너무 짧습니다',
    message: '비밀번호는 최소 6자 이상이어야 합니다.',
    action: '수정하기'
  },
  PASSWORD_TOO_WEAK: {
    title: '비밀번호가 너무 간단합니다',
    message: '더 강력한 비밀번호를 설정해주세요.',
    action: '수정하기'
  },
  PHONE_INVALID: {
    title: '휴대폰 번호가 올바르지 않습니다',
    message: '올바른 휴대폰 번호를 입력해주세요.',
    action: '수정하기'
  },

  // 상품 관련 에러
  PRODUCT_NOT_FOUND: {
    title: '상품을 찾을 수 없습니다',
    message: '요청하신 상품이 존재하지 않거나 삭제되었습니다.',
    action: '상품 목록으로'
  },
  PRODUCT_OUT_OF_STOCK: {
    title: '상품이 품절되었습니다',
    message: '현재 재고가 부족하여 주문할 수 없습니다.',
    action: '알림 신청'
  },
  INSUFFICIENT_STOCK: {
    title: '재고가 부족합니다',
    message: '요청하신 수량보다 재고가 부족합니다.',
    action: '수량 조정'
  },

  // 장바구니 관련 에러
  CART_ITEM_NOT_FOUND: {
    title: '장바구니 상품을 찾을 수 없습니다',
    message: '장바구니에서 해당 상품을 찾을 수 없습니다.',
    action: '장바구니 새로고침'
  },
  CART_EMPTY: {
    title: '장바구니가 비어있습니다',
    message: '주문할 상품을 먼저 장바구니에 담아주세요.',
    action: '쇼핑 계속하기'
  },

  // 주문 관련 에러
  ORDER_NOT_FOUND: {
    title: '주문을 찾을 수 없습니다',
    message: '요청하신 주문 정보를 찾을 수 없습니다.',
    action: '주문 내역으로'
  },
  ORDER_ALREADY_CANCELLED: {
    title: '이미 취소된 주문입니다',
    message: '해당 주문은 이미 취소 처리되었습니다.',
    action: '주문 내역으로'
  },
  ORDER_CANNOT_CANCEL: {
    title: '주문을 취소할 수 없습니다',
    message: '배송이 시작된 주문은 취소할 수 없습니다.',
    action: '고객센터 문의'
  },

  // 결제 관련 에러
  PAYMENT_FAILED: {
    title: '결제에 실패했습니다',
    message: '결제 처리 중 문제가 발생했습니다. 다시 시도해주세요.',
    action: '다시 결제'
  },
  PAYMENT_CANCELLED: {
    title: '결제가 취소되었습니다',
    message: '사용자에 의해 결제가 취소되었습니다.',
    action: '다시 결제'
  },
  INSUFFICIENT_FUNDS: {
    title: '잔액이 부족합니다',
    message: '결제할 잔액이 부족합니다. 다른 결제 방법을 선택해주세요.',
    action: '결제 방법 변경'
  },

  // 쿠폰/포인트 관련 에러
  COUPON_NOT_FOUND: {
    title: '쿠폰을 찾을 수 없습니다',
    message: '유효하지 않은 쿠폰입니다.',
    action: '쿠폰 다시 확인'
  },
  COUPON_EXPIRED: {
    title: '쿠폰이 만료되었습니다',
    message: '사용 기간이 지난 쿠폰입니다.',
    action: '다른 쿠폰 사용'
  },
  COUPON_ALREADY_USED: {
    title: '이미 사용된 쿠폰입니다',
    message: '한 번 사용된 쿠폰은 재사용할 수 없습니다.',
    action: '다른 쿠폰 사용'
  },
  INSUFFICIENT_POINTS: {
    title: '포인트가 부족합니다',
    message: '사용 가능한 포인트보다 많은 포인트를 사용하려고 합니다.',
    action: '포인트 조정'
  },

  // 서버/네트워크 에러
  NETWORK_ERROR: {
    title: '네트워크 연결 오류',
    message: '인터넷 연결을 확인하고 다시 시도해주세요.',
    action: '다시 시도'
  },
  SERVER_ERROR: {
    title: '서버 오류가 발생했습니다',
    message: '일시적인 서버 오류입니다. 잠시 후 다시 시도해주세요.',
    action: '다시 시도'
  },
  TIMEOUT: {
    title: '요청 시간이 초과되었습니다',
    message: '서버 응답이 지연되고 있습니다. 다시 시도해주세요.',
    action: '다시 시도'
  },
  SERVICE_UNAVAILABLE: {
    title: '서비스를 이용할 수 없습니다',
    message: '현재 서비스 점검 중입니다. 잠시 후 이용해주세요.',
    action: '확인'
  },

  // 파일 업로드 에러
  FILE_TOO_LARGE: {
    title: '파일 크기가 너무 큽니다',
    message: '업로드할 수 있는 파일 크기를 초과했습니다.',
    action: '다른 파일 선택'
  },
  INVALID_FILE_TYPE: {
    title: '지원하지 않는 파일 형식입니다',
    message: '허용된 파일 형식만 업로드할 수 있습니다.',
    action: '다른 파일 선택'
  },

  // 권한 관련 에러
  PERMISSION_DENIED: {
    title: '권한이 없습니다',
    message: '이 작업을 수행할 권한이 없습니다.',
    action: '확인'
  },
  ACCOUNT_SUSPENDED: {
    title: '계정이 정지되었습니다',
    message: '이용 약관 위반으로 계정이 정지되었습니다.',
    action: '고객센터 문의'
  },

  // 기본 에러
  UNKNOWN_ERROR: {
    title: '알 수 없는 오류가 발생했습니다',
    message: '예상치 못한 오류가 발생했습니다. 고객센터에 문의해주세요.',
    action: '고객센터 문의'
  }
};

/**
 * 에러 코드에 따른 사용자 친화적 메시지 반환
 */
export function getErrorMessage(errorCode: string, fallbackMessage?: string): ErrorMessage {
  const errorMessage = ERROR_MESSAGES[errorCode];
  
  if (errorMessage) {
    return errorMessage;
  }

  // 에러 코드가 없거나 매핑되지 않은 경우 기본 메시지 반환
  return {
    title: '오류가 발생했습니다',
    message: fallbackMessage || ERROR_MESSAGES.UNKNOWN_ERROR.message,
    action: '확인'
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
      return {
        title: '너무 많은 요청',
        message: '잠시 후 다시 시도해주세요.',
        action: '확인'
      };
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