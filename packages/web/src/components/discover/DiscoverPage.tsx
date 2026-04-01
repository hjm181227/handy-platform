import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { webApiService } from '../../services/apiService';
import SnapCard from '../snap/SnapCard';
import SnapDetailModal from '../snap/SnapDetailModal';

interface DiscoverPageProps {
  onGo: (path: string) => void;
  onOpen: (productUuid: string) => void;
}

export default function DiscoverPage({ onGo, onOpen }: DiscoverPageProps) {
  const { t } = useTranslation(['product', 'common']);
  const [snaps, setSnaps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [popularTags, setPopularTags] = useState<Array<{ tag: string; count: number }>>([]);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'popular' | 'newest'>('popular');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedSnap, setSelectedSnap] = useState<any>(null);

  useEffect(() => {
    webApiService.snap.getPopularTags().then(res => {
      if (res.success) setPopularTags(res.data.slice(0, 15));
    }).catch(() => {});
  }, []);

  const fetchSnaps = async (reset = false) => {
    try {
      setLoading(true);
      const currentPage = reset ? 1 : page;
      if (reset) setPage(1);

      const response = await webApiService.snap.getSnaps({
        page: currentPage,
        limit: 24,
        sort: sortBy,
        tag: activeTag || undefined,
      });

      if (response.success) {
        if (currentPage === 1) {
          setSnaps(response.data.snaps || []);
        } else {
          setSnaps(prev => [...prev, ...(response.data.snaps || [])]);
        }
        setTotalPages(response.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error('Discover fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSnaps(true);
  }, [sortBy, activeTag]);

  useEffect(() => {
    if (page > 1) fetchSnaps();
  }, [page]);

  return (
    <div className="handy-page-content max-w-7xl">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('product:discover.title')}</h1>
        <p className="mt-1 text-sm text-gray-500">{t('product:discover.subtitle')}</p>
      </div>

      {/* 정렬 + 태그 필터 */}
      <div className="mb-6 space-y-3">
        <div className="flex gap-2">
          <button
            onClick={() => setSortBy('popular')}
            className={`px-4 py-2 text-sm rounded-full transition-colors ${sortBy === 'popular' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {t('product:discover.popular')}
          </button>
          <button
            onClick={() => setSortBy('newest')}
            className={`px-4 py-2 text-sm rounded-full transition-colors ${sortBy === 'newest' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {t('product:discover.newest')}
          </button>
        </div>

        {popularTags.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveTag(null)}
              className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${!activeTag ? 'bg-[#E85A6B] text-white' : 'bg-[#FFF1F2] text-[#E85A6B] hover:bg-[#E85A6B]/10'}`}
            >
              {t('product:discover.all')}
            </button>
            {popularTags.map(tag => (
              <button
                key={tag.tag}
                onClick={() => setActiveTag(tag.tag)}
                className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${activeTag === tag.tag ? 'bg-[#E85A6B] text-white' : 'bg-[#FFF1F2] text-[#E85A6B] hover:bg-[#E85A6B]/10'}`}
              >
                #{tag.tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 로딩 */}
      {loading && snaps.length === 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded-xl bg-gray-200 animate-pulse" />
          ))}
        </div>
      )}

      {/* 그리드 */}
      {snaps.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {snaps.map(snap => (
            <SnapCard
              key={snap.id || snap.snapUuid}
              snap={snap}
              onSnapClick={setSelectedSnap}
              onCreatorClick={(uuid) => onGo(`/user/${uuid}`)}
            />
          ))}
        </div>
      )}

      {/* 빈 상태 */}
      {!loading && snaps.length === 0 && (
        <div className="text-center py-20">
          <p className="text-gray-500">{t('product:discover.noSnaps')}</p>
        </div>
      )}

      {/* 더보기 */}
      {page < totalPages && !loading && (
        <div className="text-center mt-8">
          <button
            onClick={() => setPage(prev => prev + 1)}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            {t('product:discover.loadMore')}
          </button>
        </div>
      )}

      {loading && snaps.length > 0 && (
        <div className="text-center mt-8">
          <div className="inline-block w-6 h-6 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
        </div>
      )}

      {/* 상세 모달 */}
      {selectedSnap && (
        <SnapDetailModal
          snap={selectedSnap}
          onClose={() => setSelectedSnap(null)}
          onCreatorClick={(uuid) => onGo(`/user/${uuid}`)}
          onProductClick={(uuid) => onOpen(uuid)}
          onTagClick={(tag) => { setActiveTag(tag); setSelectedSnap(null); }}
          onDelete={(uuid) => { setSnaps(prev => prev.filter(s => (s.id || s.snapUuid) !== uuid)); setSelectedSnap(null); }}
        />
      )}
    </div>
  );
}
