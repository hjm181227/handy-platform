import { useState, useEffect, useRef, useCallback } from 'react';
import { webApiService } from '../../services/apiService';
import SnapCard from './SnapCard';
import SnapDetailModal from './SnapDetailModal';

interface SnapFeedProps {
  onCreatorClick?: (userUuid: string) => void;
  onProductClick?: (productUuid: string) => void;
}

type FeedTab = 'following' | 'explore';

export default function SnapFeed({ onCreatorClick, onProductClick }: SnapFeedProps) {
  const [activeTab, setActiveTab] = useState<FeedTab>('explore');
  const [snaps, setSnaps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [feedType, setFeedType] = useState<string>('trending');
  const [selectedSnap, setSelectedSnap] = useState<any | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // 인증 상태 확인
  useEffect(() => {
    webApiService.isAuthenticated().then(setIsAuthenticated);
  }, []);

  // 피드 데이터 로드
  const fetchFeed = useCallback(async (pageNum: number, reset = false) => {
    try {
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      let response;
      if (activeTab === 'following') {
        response = await webApiService.snap.getFeed({ page: pageNum, limit: 20 });
        if (response.success) {
          setFeedType(response.data.feedType);
        }
      } else {
        response = await webApiService.snap.getSnaps({ page: pageNum, limit: 20, sort: 'popular' });
      }

      if (response.success) {
        const newSnaps = response.data.snaps || response.data;
        if (reset || pageNum === 1) {
          setSnaps(Array.isArray(newSnaps) ? newSnaps : []);
        } else {
          setSnaps(prev => [...prev, ...(Array.isArray(newSnaps) ? newSnaps : [])]);
        }
        setTotalPages(response.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error('Feed fetch error:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [activeTab]);

  // 탭 변경 시 리셋
  useEffect(() => {
    setPage(1);
    setSnaps([]);
    fetchFeed(1, true);
  }, [activeTab, fetchFeed]);

  // 무한 스크롤 Intersection Observer
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && page < totalPages) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchFeed(nextPage);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [page, totalPages, loadingMore, fetchFeed]);

  const handleSnapClick = (snap: any) => setSelectedSnap(snap);
  const handleCloseModal = () => setSelectedSnap(null);

  return (
    <div>
      {/* 탭 */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1">
        {isAuthenticated && (
          <button
            onClick={() => setActiveTab('following')}
            className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'following'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            팔로잉
          </button>
        )}
        <button
          onClick={() => setActiveTab('explore')}
          className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'explore'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          탐색
        </button>
      </div>

      {/* 팔로잉 탭에서 trending 폴백 안내 */}
      {activeTab === 'following' && feedType === 'trending' && !loading && snaps.length > 0 && (
        <div className="mb-4 px-4 py-3 bg-[#FFF1F2] text-[#E85A6B] text-sm rounded-lg">
          아직 팔로우한 유저가 없어요. 인기 스냅을 보여드릴게요!
        </div>
      )}

      {/* 로딩 스켈레톤 */}
      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded-xl bg-gray-200 animate-pulse" />
          ))}
        </div>
      )}

      {/* 스냅 그리드 */}
      {!loading && snaps.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {snaps.map((snap) => (
            <SnapCard
              key={snap.id || snap.snapUuid}
              snap={snap}
              onSnapClick={handleSnapClick}
              onCreatorClick={onCreatorClick}
            />
          ))}
        </div>
      )}

      {/* 빈 상태 */}
      {!loading && snaps.length === 0 && (
        <div className="text-center py-20">
          <div className="text-4xl mb-4">
            {activeTab === 'following' ? '👥' : '✨'}
          </div>
          <p className="text-gray-500 mb-2">
            {activeTab === 'following'
              ? '팔로우한 유저의 스냅이 없습니다.'
              : '스냅이 아직 없습니다.'}
          </p>
          {activeTab === 'following' && (
            <button
              onClick={() => setActiveTab('explore')}
              className="mt-3 px-4 py-2 bg-[#E85A6B] text-white text-sm rounded-full hover:bg-[#D14A5B] transition-colors"
            >
              탐색에서 크리에이터 찾기
            </button>
          )}
        </div>
      )}

      {/* 무한 스크롤 트리거 */}
      <div ref={loadMoreRef} className="h-4" />

      {/* 추가 로딩 */}
      {loadingMore && (
        <div className="text-center py-6">
          <div className="inline-block w-6 h-6 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
        </div>
      )}

      {/* 상세 모달 */}
      {selectedSnap && (
        <SnapDetailModal
          snap={selectedSnap}
          onClose={handleCloseModal}
          onCreatorClick={onCreatorClick}
          onProductClick={onProductClick}
          onDelete={(uuid) => { setSnaps(prev => prev.filter(s => (s.id || s.snapUuid) !== uuid)); handleCloseModal(); }}
        />
      )}
    </div>
  );
}
