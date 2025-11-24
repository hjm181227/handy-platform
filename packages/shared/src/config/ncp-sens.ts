/**
 * NCP SENS (Simple & Easy Notification Service) Configuration
 *
 * NCP SENS는 네이버 클라우드 플랫폼의 SMS/알림톡 발송 서비스입니다.
 *
 * 설정 방법:
 * 1. NCP Console에서 SENS 프로젝트 생성
 * 2. Service ID 확인 (프로젝트 설정에서)
 * 3. Access Key / Secret Key 발급 (마이페이지 > 인증키 관리)
 * 4. 발신번호 등록 및 승인
 *
 * 환경변수:
 * - NCP_ACCESS_KEY_ID: NCP Access Key
 * - NCP_SECRET_KEY: NCP Secret Key
 * - NCP_SENS_SERVICE_ID: SENS Service ID
 * - NCP_SENS_CALLING_NUMBER: 발신번호 (예: 01012345678)
 */

export interface NCPSENSConfig {
  accessKeyId: string;
  secretKey: string;
  serviceId: string;
  callingNumber: string;
  apiUrl: string;
}

/**
 * NCP SENS API 기본 URL
 */
export const NCP_SENS_API_BASE_URL = 'https://sens.apigw.ntruss.com';

/**
 * SMS 타입
 */
export enum SMSType {
  SMS = 'SMS',    // 단문 (90바이트, 한글 45자)
  LMS = 'LMS',    // 장문 (2000바이트, 한글 1000자)
  MMS = 'MMS',    // 멀티미디어 (이미지 첨부 가능)
}

/**
 * 인증 코드 설정
 */
export const VERIFICATION_CODE_CONFIG = {
  LENGTH: 6,                    // 인증 코드 길이 (6자리)
  EXPIRES_IN: 300,              // 만료 시간 (초) - 5분
  RESEND_COOLDOWN: 60,          // 재발송 대기 시간 (초) - 1분
  MAX_ATTEMPTS: 5,              // 최대 시도 횟수
  MESSAGE_TEMPLATE: (code: string) =>
    `[HANDY] 본인확인 인증번호는 [${code}]입니다. 5분 이내에 입력해주세요.`,
};

/**
 * NCP SENS 설정 가져오기
 *
 * 환경변수에서 설정을 읽어옵니다.
 * 백엔드에서만 사용되며, 프론트엔드에서는 사용하지 않습니다.
 */
export function getNCPSENSConfig(): NCPSENSConfig {
  const config: NCPSENSConfig = {
    accessKeyId: process.env.NCP_ACCESS_KEY_ID || '',
    secretKey: process.env.NCP_SECRET_KEY || '',
    serviceId: process.env.NCP_SENS_SERVICE_ID || '',
    callingNumber: process.env.NCP_SENS_CALLING_NUMBER || '',
    apiUrl: NCP_SENS_API_BASE_URL,
  };

  // 백엔드 환경에서만 검증
  if (typeof window === 'undefined') {
    const missingKeys = Object.entries(config)
      .filter(([key, value]) => !value && key !== 'apiUrl')
      .map(([key]) => key);

    if (missingKeys.length > 0) {
      console.warn(
        `[NCP SENS] Missing configuration keys: ${missingKeys.join(', ')}`
      );
    }
  }

  return config;
}

/**
 * 인증 코드 생성
 *
 * 6자리 숫자 랜덤 코드를 생성합니다.
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * 휴대폰 번호 포맷팅
 *
 * "010-1234-5678" → "01012345678"
 * "010 1234 5678" → "01012345678"
 */
export function formatPhoneNumber(phone: string): string {
  return phone.replace(/[^0-9]/g, '');
}

/**
 * 휴대폰 번호 유효성 검증
 *
 * 한국 휴대폰 번호 형식 검증 (010으로 시작하는 11자리)
 */
export function isValidPhoneNumber(phone: string): boolean {
  const cleaned = formatPhoneNumber(phone);
  return /^010\d{8}$/.test(cleaned);
}
