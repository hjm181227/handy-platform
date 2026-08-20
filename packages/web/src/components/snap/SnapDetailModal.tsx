import { useState, useEffect, useRef } from 'react';
import { likesService, followService } from '../../services/apiService';
import { webApiService } from '../../services/apiService';
import { useAuth } from '../../hooks/useAuth';
import SnapComments from './SnapComments';
import type { SnapReportReason } from '@handy-platform/shared';

interface SnapDetailModalProps {
  snap: any;
  onClose: () => void;
  onCreatorClick?: (userUuid: string) => void;
  onProductClick?: (productUuid: string) => void;
  onTagClick?: (tag: string) => void;
  onDelete?: (snapUuid: string) => void;
}

const REPORT_REASONS: { value: SnapReportReason; label: string }[] = [
  { value: 'spam', label: '스팸' },
  { value: 'inappropriate', label: '부적절한 콘텐츠' },
  { value: 'copyright', label: '저작권 침해' },
  { value: 'harassment', label: '괴롭힘' },
  { value: 'misinformation', label: '허위정보' },
  { value: 'other', label: '기타' },
];

export default function SnapDetailModal({ snap, onClose, onCreatorClick, onProductClick, onTagClick, onDelete }: SnapDetailModalProps) {
  const { currentUser } = useAuth();
  const [isLiked, setIsLiked] = useState(snap.isLiked || false);
  const [likesCount, setLikesCount] = useState(snap.likesCount || 0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);

  // 팔로우 상태
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // 더보기 메뉴
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // 삭제 확인
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 신고 모달
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState<SnapReportReason | ''>('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportLoading, setReportLoading] = useState(false);

  // 토스트
  const [toast, setToast] = useState<string | null>(null);

  const isOwner = currentUser?.userUuid === snap.creator?.userUuid;
  const snapUuid = snap.id || snap.snapUuid;

  const images = snap.images && snap.images.length > 0
    ? snap.images.map((img: any) => img.imageUrl || img)
    : [snap.imageUrl];

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showReportModal) { setShowReportModal(false); return; }
        if (showDeleteConfirm) { setShowDeleteConfirm(false); return; }
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [onClose, showReportModal, showDeleteConfirm]);

  // 팔로우 상태 조회
  useEffect(() => {
    if (!currentUser || isOwner || !snap.creator?.userUuid) return;
    const followApi = followService || webApiService.follow;
    if (!followApi) return;
    followApi.getFollowStatus(snap.creator.userUuid)
      .then((res: any) => { if (res.success) setIsFollowing(res.data.isFollowing); })
      .catch(() => {});
  }, [currentUser, isOwner, snap.creator?.userUuid]);

  // 더보기 메뉴 외부 클릭 닫기
  useEffect(() => {
    if (!showMoreMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showMoreMenu]);

  // 토스트 자동 숨김
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const wasLiked = isLiked;
    const prevCount = likesCount;
    setIsLiked(!wasLiked);
    setLikesCount((prev: number) => prev + (wasLiked ? -1 : 1));
    try {
      if (wasLiked) {
        await likesService.unlike('snap', snapUuid);
      } else {
        await likesService.like('snap', snapUuid);
      }
    } catch {
      setIsLiked(wasLiked);
      setLikesCount(prevCount);
    }
  };

  const handleFollow = async () => {
    const followApi = followService || webApiService.follow;
    if (followLoading || !followApi) return;
    if (!snap.creator?.userUuid) {
      console.error('[SnapDetail] Follow failed: creator userUuid is missing', snap.creator);
      return;
    }
    setFollowLoading(true);
    const was = isFollowing;
    setIsFollowing(!was);
    try {
      if (was) {
        await followApi.unfollow(snap.creator.userUuid);
      } else {
        await followApi.follow(snap.creator.userUuid);
      }
    } catch (err: any) {
      console.error('[SnapDetail] Follow error:', err);
      setIsFollowing(was);
      setToast(err?.message || '팔로우 처리에 실패했습니다');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/snap/${snapUuid}`;
    const shareData = {
      title: snap.title || '네일 스냅',
      text: snap.description || '핸디에서 공유한 네일 스냅을 확인해보세요!',
      url,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url);
        setToast('링크가 복사되었습니다');
      }
    } catch {
      // user cancelled share or clipboard failed
      try {
        await navigator.clipboard.writeText(url);
        setToast('링크가 복사되었습니다');
      } catch {}
    }
  };

  const handleDelete = async () => {
    try {
      await webApiService.snap.deleteSnap(snapUuid);
      setToast('게시글이 삭제되었습니다');
      onDelete?.(snapUuid);
      setTimeout(() => onClose(), 500);
    } catch {
      setToast('삭제에 실패했습니다');
    }
    setShowDeleteConfirm(false);
  };

  const handleReport = async () => {
    if (!reportReason || reportLoading) return;
    setReportLoading(true);
    try {
      await webApiService.snap.reportSnap(snapUuid, {
        reason: reportReason,
        description: reportReason === 'other' ? reportDescription : undefined,
      });
      setToast('신고가 접수되었습니다');
      setShowReportModal(false);
      setReportReason('');
      setReportDescription('');
    } catch (err: any) {
      console.error('[SnapDetail] Report error:', err, 'status:', err?.status, 'message:', err?.message);
      if (err?.status === 409) {
        setToast('이미 신고한 게시글입니다');
      } else if (err?.status === 400) {
        setToast(err?.message || '신고할 수 없는 게시글입니다');
      } else {
        setToast(err?.message || '신고 접수에 실패했습니다');
      }
    } finally {
      setReportLoading(false);
    }
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex(prev => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex(prev => (prev < images.length - 1 ? prev + 1 : 0));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/90 md:p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full md:max-w-4xl max-h-[95vh] md:max-h-[90vh] bg-white rounded-t-2xl md:rounded-2xl overflow-hidden shadow-2xl flex flex-col md:grid md:grid-cols-2"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모바일 상단 바 */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <button onClick={onClose} className="text-lg text-gray-800">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-base font-semibold text-gray-900">스냅 상세</span>
          <div className="w-6" />
        </div>

        {/* 데스크톱 닫기 버튼 */}
        <button
          onClick={onClose}
          className="hidden md:flex absolute top-3 right-3 z-10 p-1.5 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
        >
          <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* 이미지 영역 */}
        <div className="relative bg-gray-100 md:h-full">
          <img
            src={images[currentImageIndex]}
            className="w-full aspect-square md:aspect-auto md:h-full object-cover"
            alt={snap.title || 'Nail snap'}
          />

          {images.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full hover:bg-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full hover:bg-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_: any, i: number) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i === currentImageIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* 콘텐츠 영역 */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-5 md:pt-14 flex flex-col gap-4">
            {/* 프로필 + 팔로우 + 더보기 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {snap.creator?.avatar ? (
                  <img
                    src={snap.creator.avatar}
                    className="w-10 h-10 rounded-full border border-gray-200 cursor-pointer"
                    alt=""
                    onClick={() => onCreatorClick?.(snap.creator?.userUuid)}
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-full bg-gray-200 cursor-pointer"
                    onClick={() => onCreatorClick?.(snap.creator?.userUuid)}
                  />
                )}
                <div>
                  <button
                    onClick={() => onCreatorClick?.(snap.creator?.userUuid)}
                    className="text-sm font-semibold text-gray-900 hover:underline"
                  >
                    {snap.creator?.nickname || snap.creator?.name || ''}
                  </button>
                  <p className="text-xs text-gray-400">
                    {new Date(snap.createdAt).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* 팔로우 버튼 - 본인이 아닐 때만 */}
                {!isOwner && currentUser && (
                  <button
                    onClick={handleFollow}
                    disabled={followLoading}
                    className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-colors ${
                      isFollowing
                        ? 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-500'
                        : 'bg-brand text-white hover:bg-brand-600'
                    }`}
                  >
                    {isFollowing ? '팔로잉' : '팔로우'}
                  </button>
                )}
                {/* 더보기 메뉴 */}
                {currentUser && (
                  <div className="relative" ref={moreMenuRef}>
                    <button
                      onClick={() => setShowMoreMenu(!showMoreMenu)}
                      className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="5" r="1.5" />
                        <circle cx="12" cy="12" r="1.5" />
                        <circle cx="12" cy="19" r="1.5" />
                      </svg>
                    </button>
                    {showMoreMenu && (
                      <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
                        {isOwner ? (
                          <button
                            onClick={() => { setShowMoreMenu(false); setShowDeleteConfirm(true); }}
                            className="w-full px-4 py-2.5 text-left text-sm text-red-500 hover:bg-red-50 transition-colors"
                          >
                            삭제
                          </button>
                        ) : (
                          <button
                            onClick={() => { setShowMoreMenu(false); setShowReportModal(true); }}
                            className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            신고
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 액션 바 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={handleLike} className="flex items-center gap-1 text-sm text-gray-800">
                  <svg
                    className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : 'fill-none text-gray-700'}`}
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                  <span className="font-medium">{likesCount}</span>
                </button>
                <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-1 text-sm text-gray-800">
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>댓글</span>
                </button>
                <button onClick={handleShare} className="flex items-center gap-1 text-sm text-gray-800">
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  <span>공유</span>
                </button>
              </div>
              <span className="text-xs text-gray-400">조회 {snap.viewsCount || 0}</span>
            </div>

            {/* 구분선 */}
            <div className="h-px bg-gray-100" />

            {/* 제목 & 설명 */}
            {snap.title && (
              <h2 className="text-lg font-bold text-gray-900">{snap.title}</h2>
            )}
            {snap.description && (
              <p className="text-sm text-gray-800 leading-relaxed">{snap.description}</p>
            )}

            {/* 댓글 */}
            {showComments && (
              <SnapComments snapUuid={snapUuid} />
            )}

            {/* 태그 */}
            {snap.tags && snap.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {snap.tags.map((tag: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => { onTagClick?.(tag); onClose(); }}
                    className="px-3 py-1.5 bg-brand-50 text-brand text-xs font-medium rounded-full hover:bg-[#FFE4E6] transition-colors"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}

            {/* 구분선 */}
            {snap.relatedProducts && snap.relatedProducts.length > 0 && (
              <div className="h-px bg-gray-100" />
            )}

            {/* 연관 상품 */}
            {snap.relatedProducts && snap.relatedProducts.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[15px] font-bold text-gray-900">연관 상품</span>
                </div>
                <div className="flex gap-2.5 overflow-x-auto pb-2">
                  {snap.relatedProducts.map((product: any) => (
                    <button
                      key={product.productUuid || product}
                      onClick={() => {
                        onProductClick?.(product.productUuid || product);
                        onClose();
                      }}
                      className="flex-shrink-0 w-[100px]"
                    >
                      {product.mainImageUrl ? (
                        <div className="w-[100px] h-[100px] rounded-xl overflow-hidden bg-gray-100 mb-1.5">
                          <img src={product.mainImageUrl} className="w-full h-full object-cover" alt={product.name || ''} />
                        </div>
                      ) : (
                        <div className="w-[100px] h-[100px] rounded-xl bg-gray-100 mb-1.5" />
                      )}
                      <p className="text-[11px] text-gray-800 font-medium line-clamp-2 leading-tight">{product.name || '상품 보기'}</p>
                      {product.price && (
                        <p className="text-xs font-bold text-brand mt-0.5">
                          {product.salePrice ? (
                            <>{product.salePrice.toLocaleString()}원</>
                          ) : (
                            <>{product.price.toLocaleString()}원</>
                          )}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 삭제 확인 모달 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-2">게시글 삭제</h3>
            <p className="text-sm text-gray-500 mb-6">정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 신고 모달 */}
      {showReportModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50" onClick={() => setShowReportModal(false)}>
          <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-1">게시글 신고</h3>
            <p className="text-sm text-gray-500 mb-4">신고 사유를 선택해주세요</p>
            <div className="flex flex-col gap-2 mb-4">
              {REPORT_REASONS.map(r => (
                <button
                  key={r.value}
                  onClick={() => setReportReason(r.value)}
                  className={`px-4 py-2.5 rounded-xl text-sm text-left transition-colors ${
                    reportReason === r.value
                      ? 'bg-brand-50 text-brand font-semibold border border-brand'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-transparent'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            {reportReason === 'other' && (
              <textarea
                value={reportDescription}
                onChange={e => setReportDescription(e.target.value)}
                maxLength={500}
                placeholder="상세 설명을 입력해주세요 (최대 500자)"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm resize-none h-24 focus:outline-none focus:border-brand mb-4"
              />
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setShowReportModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleReport}
                disabled={!reportReason || reportLoading}
                className="flex-1 py-2.5 rounded-xl bg-brand text-white text-sm font-medium hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {reportLoading ? '처리중...' : '신고하기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 토스트 */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[70] px-5 py-3 bg-gray-900 text-white text-sm rounded-full shadow-lg animate-fade-in">
          {toast}
        </div>
      )}
    </div>
  );
}
