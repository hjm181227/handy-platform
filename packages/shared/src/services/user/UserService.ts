import { BaseApiService } from '../base/BaseApiService';
import { API_ENDPOINTS } from '../../config/api';

/**
 * 손톱 사이즈 데이터 구조
 */
export interface NailSizeData {
  leftHand: {
    thumb: number;
    index: number;
    middle: number;
    ring: number;
    little: number;
  };
  rightHand: {
    thumb: number;
    index: number;
    middle: number;
    ring: number;
    little: number;
  };
  measuredAt: string;  // ISO 8601 날짜 문자열
}

/**
 * 손톱 사이즈 업데이트 요청
 */
export interface UpdateNailSizeRequest {
  hand: 'left' | 'right';
  finger: 'thumb' | 'index' | 'middle' | 'ring' | 'little';
  size: number;
}

/**
 * 손톱 사이즈 업데이트 응답
 */
export interface UpdateNailSizeResponse {
  hand: 'left' | 'right';
  finger: 'thumb' | 'index' | 'middle' | 'ring' | 'little';
  size: number;
  updatedAt: string;
}

/**
 * API 응답 래퍼
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * 사용자 관련 API 서비스
 */
export abstract class BaseUserService extends BaseApiService {
  /**
   * 사용자 손톱 사이즈 조회
   */
  async getNailSize(): Promise<ApiResponse<NailSizeData | null>> {
    return this.request<ApiResponse<NailSizeData | null>>(
      API_ENDPOINTS.USERS.NAIL_SIZE,
      {
        method: 'GET',
      }
    );
  }

  /**
   * 손톱 사이즈 업데이트
   * @param hand - 손 ('left' | 'right')
   * @param finger - 손가락 ('thumb' | 'index' | 'middle' | 'ring' | 'little')
   * @param size - 손톱 사이즈 (mm)
   */
  async updateNailSize(
    hand: 'left' | 'right',
    finger: 'thumb' | 'index' | 'middle' | 'ring' | 'little',
    size: number
  ): Promise<ApiResponse<UpdateNailSizeResponse>> {
    const requestData: UpdateNailSizeRequest = {
      hand,
      finger,
      size,
    };

    return this.request<ApiResponse<UpdateNailSizeResponse>>(
      API_ENDPOINTS.USERS.NAIL_SIZE,
      {
        method: 'PATCH',
        body: JSON.stringify(requestData),
      }
    );
  }
}

/**
 * UserService 팩토리
 */
export class UserServiceFactory {
  static create(baseURL: string, getAuthHeaders: () => Promise<Record<string, string>>): BaseUserService {
    return new (class extends BaseUserService {
      constructor() {
        super(baseURL, getAuthHeaders);
      }
    })();
  }
}
