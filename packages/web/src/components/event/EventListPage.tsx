import { useState, useEffect } from 'react';
import { webApiService } from '../../services/apiService';
import type { EventBanner } from '@handy-platform/shared';

interface EventListPageProps {
  onGo: (to: string) => void;
}

function getEventStatus(banner: EventBanner): { label: string; color: string; bgColor: string } {
  const now = new Date();
  if (banner.endDate && new Date(banner.endDate) < now) {
    return { label: '종료됨', color: '#71717A', bgColor: '#F4F4F5' };
  }
  if (banner.startDate && new Date(banner.startDate) > now) {
    return { label: '예정', color: '#2563EB', bgColor: '#DBEAFE' };
  }
  return { label: '진행중', color: '#FFFFFF', bgColor: '#E85A6B' };
}

function getDday(endDate: string): string {
  const end = new Date(endDate);
  const now = new Date();
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return '종료';
  if (diff === 0) return 'D-Day';
  return `D-${diff}`;
}

function handleBannerClick(banner: EventBanner, onGo: (to: string) => void) {
  const hasDetailImages = (banner.detailImages?.length ?? 0) > 0;
  const bid = banner._id || banner.bannerId || banner.bannerUuid;

  if (hasDetailImages) {
    if (bid) onGo(`/event/${bid}`);
    return;
  }

  if (banner.redirectUrl) {
    const url = banner.redirectUrl;
    if (/^https?:\/\//i.test(url)) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      onGo(url);
    }
    return;
  }

  if (bid) onGo(`/event/${bid}`);
}

export function EventListPage({ onGo }: EventListPageProps) {
  const [banners, setBanners] = useState<EventBanner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const response = await webApiService.banner.getPublicBanners({ limit: 20 });
        if (response.success && response.eventBanners) {
          setBanners(response.eventBanners.filter(b => b.isActive));
        }
      } catch (error) {
        console.error('Failed to load event banners:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBanners();
  }, []);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });

  // 로딩 상태
  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-5">
        <div className="text-center py-20">
          <div className="w-12 h-12 border-4 border-[#E85A6B]/20 border-t-[#E85A6B] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-gray-500">이벤트를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 빈 상태
  if (banners.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-5">
        {/* 데스크톱 헤더 */}
        <div className="py-4 border-b hidden md:block">
          <h1 className="text-xl font-semibold">이벤트</h1>
        </div>
        {/* 모바일 헤더 */}
        <header className="md:hidden sticky top-0 z-30 bg-white border-b -mx-4 px-4">
          <div className="flex items-center justify-between py-3">
            <button onClick={() => onGo('/')} className="p-1 text-gray-600">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 6l-6 6 6 6" />
              </svg>
            </button>
            <span className="text-base font-semibold">이벤트</span>
            <div className="w-8" />
          </div>
        </header>
        <div className="flex flex-col items-center justify-center min-h-64 px-6 py-12">
          <div className="text-gray-400 mb-3">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-lg font-medium text-gray-600">이벤트 준비중입니다</p>
          <p className="text-sm text-gray-400 mt-1">곧 새로운 이벤트를 만나보세요!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* 데스크톱 헤더 */}
      <div className="mx-auto max-w-7xl px-4 py-4 border-b hidden md:block">
        <div>
          <h1 className="text-xl font-semibold">이벤트</h1>
          <p className="text-sm text-gray-600 mt-1">
            총 {banners.length}개 이벤트
          </p>
        </div>
      </div>

      {/* 모바일 헤더 */}
      <header className="md:hidden sticky top-0 z-30 bg-white border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => onGo('/')} className="p-1 text-gray-600">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>
          <span className="text-base font-semibold">이벤트</span>
          <div className="w-8" />
        </div>
      </header>

      {/* 이벤트 그리드 */}
      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* 모바일 카운트 */}
        <div className="flex items-center justify-between mb-4 md:hidden">
          <span className="text-sm font-semibold text-gray-800">
            총 {banners.length}개 이벤트
          </span>
        </div>

        {/* 데스크톱: 그리드 / 모바일: 리스트 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {banners.map((banner) => {
            const bid = banner._id || banner.bannerId || banner.bannerUuid;
            const status = getEventStatus(banner);
            return (
              <div
                key={bid}
                onClick={() => handleBannerClick(banner, onGo)}
                className="cursor-pointer group"
              >
                <div className="relative w-full overflow-hidden rounded-2xl bg-gray-100">
                  <img
                    src={banner.imageUrl}
                    alt={banner.title}
                    className="aspect-[16/9] w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  {/* 상태 뱃지 */}
                  <div
                    className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-bold"
                    style={{ backgroundColor: status.bgColor, color: status.color }}
                  >
                    {status.label}
                  </div>
                  {/* D-day 뱃지 */}
                  {banner.endDate && new Date(banner.endDate) >= new Date() && (
                    <div className="absolute top-3 right-3 px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-full text-[11px] font-bold text-[#E85A6B]">
                      {getDday(banner.endDate)}
                    </div>
                  )}
                  {/* 제목 + 설명 */}
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="text-white text-lg font-bold leading-tight">{banner.title}</h3>
                    {banner.description && (
                      <p className="text-white/70 text-[13px] mt-1 line-clamp-1">{banner.description}</p>
                    )}
                  </div>
                </div>
                {/* 날짜 */}
                {(banner.startDate || banner.endDate) && (
                  <div className="flex items-center gap-1.5 mt-2.5 text-[13px] text-gray-400">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>
                      {banner.startDate && formatDate(banner.startDate)}
                      {banner.startDate && banner.endDate && ' ~ '}
                      {banner.endDate && formatDate(banner.endDate)}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
