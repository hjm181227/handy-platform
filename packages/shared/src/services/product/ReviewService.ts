import { BaseApiService } from '../base/BaseApiService';
import { 
  ApiResponse, 
  ReviewForm, 
  DetailedReview, 
  ReviewsResponse 
} from '../../types';
import { API_ENDPOINTS } from '../../config/api';

export abstract class BaseReviewService extends BaseApiService {
  // 리뷰 조회
  async getProductReviews(
    productId: string, 
    filters: { 
      page?: number; 
      rating?: number; 
      sortBy?: string; 
      verifiedOnly?: boolean 
    } = {}
  ): Promise<ReviewsResponse> {
    const queryString = this.buildQueryString(filters);
    const endpoint = queryString 
      ? `${API_ENDPOINTS.PRODUCTS.REVIEWS(productId)}?${queryString}` 
      : API_ENDPOINTS.PRODUCTS.REVIEWS(productId);
    return this.request<ReviewsResponse>(endpoint);
  }

  async getUserReviews(
    filters: { page?: number; limit?: number; sortBy?: string; sortOrder?: string } = {}
  ): Promise<ApiResponse<{ reviews: DetailedReview[]; pagination: any }>> {
    const queryString = this.buildQueryString(filters);
    const endpoint = queryString 
      ? `${API_ENDPOINTS.USER.REVIEWS}?${queryString}` 
      : API_ENDPOINTS.USER.REVIEWS;
    return this.request<ApiResponse<{ reviews: DetailedReview[]; pagination: any }>>(endpoint);
  }

  // 리뷰 작성
  async createReview(
    productId: string, 
    reviewData: ReviewForm & { 
      title?: string;
      images?: string[];
      detailRatings?: {
        quality: number;
        price: number;
        shipping: number;
        service: number;
      };
      tags?: string[];
    }
  ): Promise<ApiResponse<{ review: DetailedReview }>> {
    return this.request<ApiResponse<{ review: DetailedReview }>>(
      API_ENDPOINTS.PRODUCTS.REVIEW_CREATE(productId),
      {
        method: 'POST',
        body: JSON.stringify(reviewData),
      }
    );
  }

  async updateReview(
    productId: string, 
    reviewId: string, 
    reviewData: Partial<ReviewForm>
  ): Promise<ApiResponse<{ review: DetailedReview }>> {
    return this.request<ApiResponse<{ review: DetailedReview }>>(
      API_ENDPOINTS.PRODUCTS.REVIEW_UPDATE(productId, reviewId),
      {
        method: 'PUT',
        body: JSON.stringify(reviewData),
      }
    );
  }

  async deleteReview(productId: string, reviewId: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(
      API_ENDPOINTS.PRODUCTS.REVIEW_DELETE(productId, reviewId),
      {
        method: 'DELETE',
      }
    );
  }

  // 리뷰 도움이 됨 투표
  async markReviewHelpful(
    productId: string, 
    reviewId: string, 
    helpful: boolean
  ): Promise<ApiResponse> {
    return this.request<ApiResponse>(
      API_ENDPOINTS.PRODUCTS.REVIEW_HELPFUL(productId, reviewId),
      {
        method: 'POST',
        body: JSON.stringify({ vote: helpful ? 'up' : 'down' }),
      }
    );
  }

  async removeHelpfulVote(
    productId: string, 
    reviewId: string
  ): Promise<ApiResponse> {
    return this.request<ApiResponse>(
      API_ENDPOINTS.PRODUCTS.REVIEW_HELPFUL(productId, reviewId),
      {
        method: 'DELETE',
      }
    );
  }

  // 리뷰 신고
  async reportReview(
    productId: string, 
    reviewId: string, 
    reason: string,
    description?: string
  ): Promise<ApiResponse> {
    return this.request<ApiResponse>(
      API_ENDPOINTS.PRODUCTS.REVIEW_REPORT(productId, reviewId),
      {
        method: 'POST',
        body: JSON.stringify({ reason, description }),
      }
    );
  }
}

export class ReviewServiceFactory {
  static create(baseURL: string, getAuthHeaders: () => Promise<Record<string, string>>): BaseReviewService {
    return new (class extends BaseReviewService {})(baseURL, getAuthHeaders);
  }
}