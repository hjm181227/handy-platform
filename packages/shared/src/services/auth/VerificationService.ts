/**
 * SMS 인증 서비스
 *
 * 휴대폰 번호 본인 인증을 위한 SMS 코드 발송 및 검증 서비스입니다.
 *
 * 주요 기능:
 * - SMS 인증 코드 발송
 * - 인증 코드 검증
 * - 재발송 쿨다운 관리
 * - 인증 상태 확인
 */

import { BaseApiService } from '../base/BaseApiService';
import { API_ENDPOINTS } from '../../config/api';

/**
 * SMS 인증 코드 발송 요청
 */
export interface SendVerificationCodeRequest {
  phone: string;    // 휴대폰 번호 (예: "01012345678")
  type?: 'signup' | 'signin' | 'password-reset';  // 인증 타입
}

/**
 * SMS 인증 코드 발송 응답
 */
export interface SendVerificationCodeResponse {
  requestId: string;          // 요청 ID (검증 시 사용)
  expiresIn: number;          // 만료 시간 (초)
  nextRetryAt?: string;       // 다음 재발송 가능 시각 (ISO 8601)
}

/**
 * SMS 인증 코드 검증 요청
 */
export interface VerifyCodeRequest {
  phone: string;              // 휴대폰 번호
  code: string;               // 인증 코드 (6자리)
  requestId?: string;         // 요청 ID (선택사항)
}

/**
 * SMS 인증 코드 검증 응답
 */
export interface VerifyCodeResponse {
  verified: boolean;          // 검증 성공 여부
  verificationToken: string;  // 인증 완료 토큰 (회원가입 시 사용)
  expiresAt: string;          // 토큰 만료 시각 (ISO 8601)
  phone: string;              // 인증된 휴대폰 번호
}

/**
 * 인증 상태 확인 응답
 */
export interface VerificationStatusResponse {
  isVerified: boolean;        // 인증 완료 여부
  phone: string;              // 휴대폰 번호
  verifiedAt?: string;        // 인증 완료 시각 (ISO 8601)
  expiresAt?: string;         // 인증 만료 시각 (ISO 8601)
}

/**
 * SMS 인증 서비스 추상 클래스
 *
 * 플랫폼별 구현체가 이 클래스를 상속받아 구현합니다.
 * - Web: VerificationService.web.ts
 * - Native: VerificationService.native.ts
 */
export abstract class BaseVerificationService extends BaseApiService {
  /**
   * SMS 인증 코드 발송
   *
   * 사용자의 휴대폰 번호로 6자리 인증 코드를 발송합니다.
   * 재발송 쿨다운(1분)이 적용됩니다.
   *
   * @param request - 인증 코드 발송 요청
   * @returns 발송 결과 (요청 ID, 만료 시간 등)
   * @throws {ApiError} 발송 실패 시
   *
   * @example
   * ```typescript
   * const response = await verificationService.sendVerificationCode({
   *   phone: '01012345678',
   *   type: 'signup'
   * });
   * console.log('요청 ID:', response.requestId);
   * console.log('만료 시간:', response.expiresIn, '초');
   * ```
   */
  async sendVerificationCode(
    request: SendVerificationCodeRequest
  ): Promise<SendVerificationCodeResponse> {
    return this.request<SendVerificationCodeResponse>(
      API_ENDPOINTS.VERIFICATION.SEND_CODE,
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
  }

  /**
   * SMS 인증 코드 검증
   *
   * 사용자가 입력한 인증 코드를 검증하고,
   * 성공 시 회원가입에 사용할 수 있는 인증 토큰을 반환합니다.
   *
   * @param request - 인증 코드 검증 요청
   * @returns 검증 결과 (인증 토큰 등)
   * @throws {ApiError} 검증 실패 시 (잘못된 코드, 만료 등)
   *
   * @example
   * ```typescript
   * const response = await verificationService.verifyCode({
   *   phone: '01012345678',
   *   code: '123456'
   * });
   *
   * if (response.verified) {
   *   // 회원가입 폼에 토큰 저장
   *   setVerificationToken(response.verificationToken);
   * }
   * ```
   */
  async verifyCode(
    request: VerifyCodeRequest
  ): Promise<VerifyCodeResponse> {
    return this.request<VerifyCodeResponse>(
      API_ENDPOINTS.VERIFICATION.VERIFY_CODE,
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
  }

  /**
   * 인증 상태 확인
   *
   * 특정 휴대폰 번호의 인증 상태를 확인합니다.
   * 인증 완료 여부, 만료 시각 등을 반환합니다.
   *
   * @param phone - 휴대폰 번호
   * @returns 인증 상태
   *
   * @example
   * ```typescript
   * const status = await verificationService.checkVerificationStatus('01012345678');
   * if (status.isVerified) {
   *   console.log('인증 완료:', status.verifiedAt);
   * }
   * ```
   */
  async checkVerificationStatus(
    phone: string
  ): Promise<VerificationStatusResponse> {
    return this.request<VerificationStatusResponse>(
      API_ENDPOINTS.VERIFICATION.CHECK_STATUS(phone)
    );
  }

  /**
   * 인증 코드 재발송
   *
   * 이전 코드를 무효화하고 새로운 코드를 발송합니다.
   * 재발송 쿨다운(1분)이 적용됩니다.
   *
   * @param request - 재발송 요청
   * @returns 발송 결과
   * @throws {ApiError} 쿨다운 중이거나 발송 실패 시
   *
   * @example
   * ```typescript
   * try {
   *   const response = await verificationService.resendVerificationCode({
   *     phone: '01012345678',
   *     type: 'signup'
   *   });
   *   console.log('재발송 성공, 다음 재발송 가능:', response.nextRetryAt);
   * } catch (error) {
   *   console.error('재발송 실패:', error.message);
   * }
   * ```
   */
  async resendVerificationCode(
    request: SendVerificationCodeRequest
  ): Promise<SendVerificationCodeResponse> {
    return this.request<SendVerificationCodeResponse>(
      API_ENDPOINTS.VERIFICATION.RESEND_CODE,
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
  }
}
