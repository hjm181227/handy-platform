import React, { useState, useEffect, useCallback } from 'react';
import { ProductQuestion, PaginationInfo } from '@handy-platform/shared';
import { webApiService } from '../../services/apiService';
import { useAuth } from '../../hooks/useAuth';

interface ProductQAProps {
  productUuid: string;
  sellerUserId?: string;
}

const ProductQA: React.FC<ProductQAProps> = ({ productUuid, sellerUserId }) => {
  const { currentUser, isAuthenticated } = useAuth();

  // 상태 관리
  const [questions, setQuestions] = useState<ProductQuestion[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  // 질문 작성 상태
  const [newQuestion, setNewQuestion] = useState('');
  const [isSecret, setIsSecret] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 수정 상태
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editIsSecret, setEditIsSecret] = useState(false);

  // 판매자 본인 상품인지 확인
  const isOwnProduct = currentUser?.userUuid === sellerUserId;

  // Q&A 목록 로드
  const loadQuestions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await webApiService.question.getProductQuestions(productUuid, {
        page,
        limit: 10,
      });

      if (response.success && response.data) {
        setQuestions(response.data.questions);
        setPagination(response.data.pagination);
      }
    } catch (err) {
      console.error('Q&A 로드 실패:', err);
      setError('Q&A를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [productUuid, page]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  // 비밀글 내용 확인 권한
  const canViewSecret = (question: ProductQuestion) => {
    if (!question.isSecret) return true;
    if (!currentUser) return false;
    // 작성자 본인이거나 판매자인 경우
    return question.userUuid === currentUser.userUuid || currentUser.userUuid === sellerUserId;
  };

  // 수정/삭제 권한
  const canEdit = (question: ProductQuestion) => {
    if (!currentUser) return false;
    return question.userUuid === currentUser.userUuid && question.status === 'pending';
  };

  const canDelete = (question: ProductQuestion) => {
    if (!currentUser) return false;
    return question.userUuid === currentUser.userUuid;
  };

  // 질문 등록
  const handleSubmit = async () => {
    if (!newQuestion.trim()) return;
    if (isOwnProduct) {
      alert('브랜드 관리자는 본인 상품에 작성할 수 없습니다.');
      return;
    }
    if (newQuestion.length > 1000) {
      alert('질문은 1000자 이내로 작성해주세요.');
      return;
    }

    try {
      setSubmitting(true);
      const response = await webApiService.question.createQuestion(productUuid, {
        content: newQuestion.trim(),
        isSecret,
      });

      if (response.success) {
        setNewQuestion('');
        setIsSecret(false);
        setPage(1);
        loadQuestions();
      } else {
        alert(response.message || '질문 등록에 실패했습니다.');
      }
    } catch (err: any) {
      console.error('질문 등록 실패:', err);
      if (err.status === 403) {
        alert('브랜드 관리자는 본인 상품에 작성할 수 없습니다.');
      } else {
        alert(err.message || '질문 등록에 실패했습니다.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // 질문 수정
  const handleUpdate = async (questionUuid: string) => {
    if (!editContent.trim()) return;

    try {
      setSubmitting(true);
      const response = await webApiService.question.updateQuestion(questionUuid, {
        content: editContent.trim(),
        isSecret: editIsSecret,
      });

      if (response.success) {
        setEditingId(null);
        setEditContent('');
        loadQuestions();
      } else {
        alert(response.message || '질문 수정에 실패했습니다.');
      }
    } catch (err: any) {
      console.error('질문 수정 실패:', err);
      alert(err.message || '질문 수정에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // 질문 삭제
  const handleDelete = async (questionUuid: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const response = await webApiService.question.deleteQuestion(questionUuid);
      if (response.success) {
        loadQuestions();
      } else {
        alert(response.message || '질문 삭제에 실패했습니다.');
      }
    } catch (err: any) {
      console.error('질문 삭제 실패:', err);
      alert(err.message || '질문 삭제에 실패했습니다.');
    }
  };

  // 수정 모드 시작
  const startEdit = (question: ProductQuestion) => {
    setEditingId(question.questionUuid);
    setEditContent(question.content);
    setEditIsSecret(question.isSecret);
  };

  // 날짜 포맷
  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* 질문 입력창 */}
      {isAuthenticated && !isOwnProduct ? (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-sm mb-2">상품 문의하기</h3>
          <textarea
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="궁금한 점을 입력해주세요. (최대 1000자)"
            maxLength={1000}
            className="w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-black"
            rows={3}
          />
          <div className="flex items-center justify-between mt-2">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={isSecret}
                onChange={(e) => setIsSecret(e.target.checked)}
                className="w-4 h-4"
              />
              비밀글로 작성
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{newQuestion.length}/1000</span>
              <button
                onClick={handleSubmit}
                disabled={submitting || !newQuestion.trim()}
                className="px-4 py-2 bg-black text-white text-sm rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? '등록 중...' : '등록'}
              </button>
            </div>
          </div>
        </div>
      ) : !isAuthenticated ? (
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <p className="text-sm text-gray-600">로그인 후 질문하실 수 있습니다.</p>
        </div>
      ) : isOwnProduct ? (
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <p className="text-sm text-gray-600">브랜드 관리자는 본인 상품에 작성할 수 없습니다.</p>
        </div>
      ) : null}

      {/* 로딩 상태 */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      )}

      {/* 에러 상태 */}
      {error && (
        <div className="text-center py-8 text-red-500">
          <p>{error}</p>
          <button
            onClick={loadQuestions}
            className="mt-2 text-sm text-gray-600 underline"
          >
            다시 시도
          </button>
        </div>
      )}

      {/* Q&A 목록 */}
      {!loading && !error && (
        <>
          {questions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>등록된 Q&A가 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((qa) => (
                <div key={qa.questionUuid} className="border-b pb-4 last:border-b-0">
                  {/* 질문 */}
                  <div className="mb-2">
                    <div className="flex items-start gap-2">
                      <span className="inline-block bg-black text-white text-xs font-bold px-2 py-1 rounded flex-shrink-0">
                        Q
                      </span>
                      <div className="flex-1">
                        {editingId === qa.questionUuid ? (
                          // 수정 모드
                          <div className="space-y-2">
                            <textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="w-full p-2 border rounded text-sm"
                              rows={3}
                            />
                            <div className="flex items-center justify-between">
                              <label className="flex items-center gap-2 text-xs text-gray-600">
                                <input
                                  type="checkbox"
                                  checked={editIsSecret}
                                  onChange={(e) => setEditIsSecret(e.target.checked)}
                                  className="w-3 h-3"
                                />
                                비밀글
                              </label>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="text-xs text-gray-500"
                                >
                                  취소
                                </button>
                                <button
                                  onClick={() => handleUpdate(qa.questionUuid)}
                                  disabled={submitting}
                                  className="text-xs text-blue-500"
                                >
                                  저장
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          // 일반 표시
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">{qa.userName}</span>
                              {qa.isSecret && (
                                <span className="text-xs text-gray-500">🔒</span>
                              )}
                              <span className="text-xs text-gray-500">{formatDate(qa.createdAt)}</span>
                              {qa.status === 'pending' && (
                                <span className="text-xs text-orange-500">답변대기</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-700">
                              {canViewSecret(qa) ? qa.content : '비밀글입니다.'}
                            </p>
                            {/* 수정/삭제 버튼 */}
                            {(canEdit(qa) || canDelete(qa)) && (
                              <div className="flex gap-2 mt-1">
                                {canEdit(qa) && (
                                  <button
                                    onClick={() => startEdit(qa)}
                                    className="text-xs text-gray-500 hover:text-gray-700"
                                  >
                                    수정
                                  </button>
                                )}
                                {canDelete(qa) && (
                                  <button
                                    onClick={() => handleDelete(qa.questionUuid)}
                                    className="text-xs text-red-500 hover:text-red-700"
                                  >
                                    삭제
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 답변 */}
                  {qa.status === 'answered' && qa.answer?.content && (
                    <div className="ml-6 mt-2">
                      <div className="flex items-start gap-2">
                        <span className="inline-block bg-white text-black border text-xs font-bold px-2 py-1 rounded flex-shrink-0">
                          A
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-600">판매자</span>
                            <span className="text-xs text-gray-500">
                              {formatDate(qa.answer.answeredAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">
                            {canViewSecret(qa) ? qa.answer.content : '비밀글입니다.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 페이지네이션 */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!pagination.hasPrev}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                이전
              </button>
              <span className="text-sm text-gray-600">
                {pagination.currentPage} / {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!pagination.hasNext}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                다음
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProductQA;
