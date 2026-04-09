import { BaseApiService } from '../base/BaseApiService';
import {
  ApiResponse,
  ProductQuestion,
  QuestionsResponse,
  CreateQuestionRequest,
  UpdateQuestionRequest,
} from '../../types';
import { API_ENDPOINTS } from '../../config/api';

export abstract class BaseQuestionService extends BaseApiService {
  /**
   * 상품 Q&A 목록 조회
   * @param productUuid 상품 UUID
   * @param options 페이지네이션 및 필터 옵션
   */
  async getProductQuestions(
    productUuid: string,
    options: {
      page?: number;
      limit?: number;
      status?: 'pending' | 'answered';
    } = {}
  ): Promise<QuestionsResponse> {
    const queryString = this.buildQueryString(options);
    const endpoint = queryString
      ? `${API_ENDPOINTS.PRODUCTS.QUESTIONS(productUuid)}?${queryString}`
      : API_ENDPOINTS.PRODUCTS.QUESTIONS(productUuid);
    return this.request<QuestionsResponse>(endpoint);
  }

  /**
   * 질문 등록
   * @param productUuid 상품 UUID
   * @param data 질문 데이터 (content, isSecret)
   */
  async createQuestion(
    productUuid: string,
    data: CreateQuestionRequest
  ): Promise<ApiResponse<{ question: ProductQuestion }>> {
    return this.request<ApiResponse<{ question: ProductQuestion }>>(
      API_ENDPOINTS.PRODUCTS.QUESTION_CREATE(productUuid),
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  /**
   * 질문 수정
   * @param questionUuid 질문 UUID
   * @param data 수정할 데이터 (content, isSecret)
   */
  async updateQuestion(
    questionUuid: string,
    data: UpdateQuestionRequest
  ): Promise<ApiResponse<{ question: ProductQuestion }>> {
    return this.request<ApiResponse<{ question: ProductQuestion }>>(
      API_ENDPOINTS.PRODUCTS.QUESTION_UPDATE(questionUuid),
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
  }

  /**
   * 질문 삭제
   * @param questionUuid 질문 UUID
   */
  async deleteQuestion(
    questionUuid: string
  ): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(
      API_ENDPOINTS.PRODUCTS.QUESTION_DELETE(questionUuid),
      {
        method: 'DELETE',
      }
    );
  }
}

export class QuestionServiceFactory {
  static create(
    baseURL: string,
    getAuthHeaders: () => Promise<Record<string, string>>
  ): BaseQuestionService {
    return new (class extends BaseQuestionService {})(baseURL, getAuthHeaders);
  }
}
