import { useState, useEffect, useCallback } from 'react';
import { SellerLayout } from '../../layout/SellerLayout';
import { webApiService } from '../../../services/apiService';
import { MdQuestionAnswer, MdSearch, MdRefresh } from 'react-icons/md';

interface QAManagementProps {
  onGo: (path: string) => void;
}

interface ProductQuestion {
  questionUuid: string;
  productUuid: string;
  productName?: string;
  sellerUuid: string;
  userUuid: string;
  userName: string;
  content: string;
  isSecret: boolean;
  status: 'pending' | 'answered' | 'deleted';
  answer?: {
    content: string;
    answeredAt: string;
    updatedAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface QAStats {
  pending: number;
  answered: number;
  total: number;
}

const STATUS_MAP = {
  pending: { label: '미답변', color: 'bg-orange-100 text-orange-800' },
  answered: { label: '답변완료', color: 'bg-green-100 text-green-800' },
} as const;

export function QAManagement({ onGo }: QAManagementProps) {
  // 상태 관리
  const [questions, setQuestions] = useState<ProductQuestion[]>([]);
  const [stats, setStats] = useState<QAStats>({ pending: 0, answered: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 필터 상태
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'answered'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 답변 모달 상태
  const [answerModal, setAnswerModal] = useState<{
    isOpen: boolean;
    question: ProductQuestion | null;
    mode: 'create' | 'edit';
  }>({ isOpen: false, question: null, mode: 'create' });
  const [answerContent, setAnswerContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 날짜 포맷
  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  // Q&A 목록 로드
  const loadQuestions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: any = { page, limit: 20 };
      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }

      const response = await webApiService.seller.getProductQuestions(filters);

      if (response.success && response.data) {
        setQuestions(response.data.questions || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
      }
    } catch (err: any) {
      console.error('Q&A 로드 실패:', err);
      setError('Q&A 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  // 통계 로드
  const loadStats = useCallback(async () => {
    try {
      const response = await webApiService.seller.getProductQuestionsStats();
      if (response.success && response.data?.stats) {
        setStats(response.data.stats);
      }
    } catch (err) {
      console.error('Q&A 통계 로드 실패:', err);
    }
  }, []);

  // 초기 로드
  useEffect(() => {
    loadQuestions();
    loadStats();
  }, [loadQuestions, loadStats]);

  // 필터 변경 시 페이지 리셋
  const handleStatusFilterChange = (status: 'all' | 'pending' | 'answered') => {
    setStatusFilter(status);
    setPage(1);
  };

  // 답변 모달 열기
  const openAnswerModal = (question: ProductQuestion, mode: 'create' | 'edit') => {
    setAnswerModal({ isOpen: true, question, mode });
    setAnswerContent(mode === 'edit' && question.answer ? question.answer.content : '');
  };

  // 답변 모달 닫기
  const closeAnswerModal = () => {
    setAnswerModal({ isOpen: false, question: null, mode: 'create' });
    setAnswerContent('');
  };

  // 답변 등록/수정
  const handleSubmitAnswer = async () => {
    if (!answerModal.question || !answerContent.trim()) return;

    try {
      setSubmitting(true);
      const questionUuid = answerModal.question.questionUuid;

      if (answerModal.mode === 'create') {
        await webApiService.seller.createQuestionAnswer(questionUuid, answerContent.trim());
      } else {
        await webApiService.seller.updateQuestionAnswer(questionUuid, answerContent.trim());
      }

      closeAnswerModal();
      loadQuestions();
      loadStats();
    } catch (err: any) {
      console.error('답변 처리 실패:', err);
      alert(err.message || '답변 처리에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // 답변 삭제
  const handleDeleteAnswer = async (questionUuid: string) => {
    if (!confirm('답변을 삭제하시겠습니까?')) return;

    try {
      await webApiService.seller.deleteQuestionAnswer(questionUuid);
      loadQuestions();
      loadStats();
    } catch (err: any) {
      console.error('답변 삭제 실패:', err);
      alert(err.message || '답변 삭제에 실패했습니다.');
    }
  };

  return (
    <SellerLayout title="Q&A 관리" onGo={onGo}>
      <div className="p-4 md:p-6 space-y-6">
        {/* 통계 카드 */}
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => handleStatusFilterChange('all')}
            className={`p-4 rounded-lg border text-center transition-colors ${
              statusFilter === 'all' ? 'border-black bg-gray-50' : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-gray-600">전체</p>
          </button>
          <button
            onClick={() => handleStatusFilterChange('pending')}
            className={`p-4 rounded-lg border text-center transition-colors ${
              statusFilter === 'pending' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
            <p className="text-sm text-gray-600">미답변</p>
          </button>
          <button
            onClick={() => handleStatusFilterChange('answered')}
            className={`p-4 rounded-lg border text-center transition-colors ${
              statusFilter === 'answered' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <p className="text-2xl font-bold text-green-600">{stats.answered}</p>
            <p className="text-sm text-gray-600">답변완료</p>
          </button>
        </div>

        {/* 새로고침 버튼 */}
        <div className="flex justify-end">
          <button
            onClick={() => { loadQuestions(); loadStats(); }}
            className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-black"
          >
            <MdRefresh className="w-4 h-4" />
            새로고침
          </button>
        </div>

        {/* 로딩 상태 */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        )}

        {/* 에러 상태 */}
        {error && (
          <div className="text-center py-8 text-red-500">
            <p>{error}</p>
            <button onClick={loadQuestions} className="mt-2 text-sm text-gray-600 underline">
              다시 시도
            </button>
          </div>
        )}

        {/* Q&A 목록 */}
        {!loading && !error && (
          <>
            {questions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <MdQuestionAnswer className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>
                  {statusFilter === 'all'
                    ? '등록된 Q&A가 없습니다.'
                    : statusFilter === 'pending'
                    ? '미답변 Q&A가 없습니다.'
                    : '답변완료된 Q&A가 없습니다.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((qa) => (
                  <div key={qa.questionUuid} className="bg-white border rounded-lg p-4">
                    {/* 질문 헤더 */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded ${STATUS_MAP[qa.status as keyof typeof STATUS_MAP]?.color || 'bg-gray-100'}`}>
                          {STATUS_MAP[qa.status as keyof typeof STATUS_MAP]?.label || qa.status}
                        </span>
                        {qa.isSecret && (
                          <span className="text-xs text-gray-500">🔒 비밀글</span>
                        )}
                        {qa.productName && (
                          <span className="text-xs text-gray-500">{qa.productName}</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">{formatDate(qa.createdAt)}</span>
                    </div>

                    {/* 질문 내용 */}
                    <div className="mb-3">
                      <div className="flex items-start gap-2">
                        <span className="inline-block bg-black text-white text-xs font-bold px-2 py-1 rounded flex-shrink-0">
                          Q
                        </span>
                        <div className="flex-1">
                          <p className="text-sm font-medium mb-1">{qa.userName}</p>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{qa.content}</p>
                        </div>
                      </div>
                    </div>

                    {/* 답변 내용 */}
                    {qa.status === 'answered' && qa.answer?.content && (
                      <div className="ml-6 mt-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-start gap-2">
                          <span className="inline-block bg-white text-black border text-xs font-bold px-2 py-1 rounded flex-shrink-0">
                            A
                          </span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-gray-600">판매자</span>
                              <span className="text-xs text-gray-500">{formatDate(qa.answer.answeredAt)}</span>
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{qa.answer.content}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 액션 버튼 */}
                    <div className="flex justify-end gap-2 mt-3 pt-3 border-t">
                      {qa.status === 'pending' ? (
                        <button
                          onClick={() => openAnswerModal(qa, 'create')}
                          className="px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800"
                        >
                          답변하기
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => openAnswerModal(qa, 'edit')}
                            className="px-3 py-1.5 text-sm text-gray-600 hover:text-black"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleDeleteAnswer(qa.questionUuid)}
                            className="px-3 py-1.5 text-sm text-red-500 hover:text-red-700"
                          >
                            삭제
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  이전
                </button>
                <span className="text-sm text-gray-600">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* 답변 모달 */}
      {answerModal.isOpen && answerModal.question && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b">
              <h3 className="font-semibold">
                {answerModal.mode === 'create' ? '답변 등록' : '답변 수정'}
              </h3>
            </div>

            <div className="p-4 space-y-4">
              {/* 원본 질문 */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium">{answerModal.question.userName}</span>
                  <span className="text-xs text-gray-500">{formatDate(answerModal.question.createdAt)}</span>
                </div>
                <p className="text-sm text-gray-700">{answerModal.question.content}</p>
              </div>

              {/* 답변 입력 */}
              <div>
                <label className="block text-sm font-medium mb-1">답변 내용</label>
                <textarea
                  value={answerContent}
                  onChange={(e) => setAnswerContent(e.target.value)}
                  placeholder="답변을 입력해주세요. (최대 2000자)"
                  maxLength={2000}
                  rows={6}
                  className="w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-black"
                />
                <p className="text-xs text-gray-500 text-right mt-1">{answerContent.length}/2000</p>
              </div>
            </div>

            <div className="p-4 border-t flex justify-end gap-2">
              <button
                onClick={closeAnswerModal}
                className="px-4 py-2 text-sm text-gray-600 hover:text-black"
              >
                취소
              </button>
              <button
                onClick={handleSubmitAnswer}
                disabled={submitting || !answerContent.trim()}
                className="px-4 py-2 bg-black text-white text-sm rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? '처리 중...' : answerModal.mode === 'create' ? '등록' : '수정'}
              </button>
            </div>
          </div>
        </div>
      )}
    </SellerLayout>
  );
}

export default QAManagement;
