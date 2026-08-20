import { useState, useEffect } from 'react';
import { webApiService } from '../../services/apiService';
import type { EventBanner } from '@handy-platform/shared';

interface BannerDetailPageProps {
  bannerId: string;
  onGo: (to: string) => void;
}

// D-day 계산
function getDday(endDate: string): string {
  const end = new Date(endDate);
  const now = new Date();
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return '종료';
  if (diff === 0) return 'D-Day';
  return `D-${diff}`;
}

// CTA 설정 해석 (동작은 추후 구현)
function resolveCtaConfig(redirectUrl: string | undefined) {
  if (!redirectUrl) return null;

  if (redirectUrl === '/contact-inquiry') {
    return { label: '입점 문의하기', bgColor: '#ff073a', hoverBgColor: '#e00030' };
  }
  if (redirectUrl === 'app-download') {
    return { label: '앱 다운로드', bgColor: '#1A1A1A', hoverBgColor: '#333333' };
  }
  return { label: '이벤트 참여하기', bgColor: '#E85A6B', hoverBgColor: '#D14A5B' };
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

// 이벤트 상태 판별
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

export function BannerDetailPage({ bannerId, onGo }: BannerDetailPageProps) {
  const [banner, setBanner] = useState<EventBanner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [relatedBanners, setRelatedBanners] = useState<EventBanner[]>([]);

  useEffect(() => {
    const fetchBanner = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await webApiService.banner.getBannerDetail(bannerId);
        if (response.success && response.eventBanner) {
          setBanner(response.eventBanner);
        } else {
          setError(response.error || '배너를 찾을 수 없습니다.');
        }
      } catch (err: any) {
        console.error('배너 상세 조회 실패:', err);
        setError('배너를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchBanner();
  }, [bannerId]);

  // 다른 이벤트 로드
  useEffect(() => {
    const fetchRelated = async () => {
      try {
        const response = await webApiService.banner.getPublicBanners({ limit: 5 });
        if (response.success && response.eventBanners) {
          setRelatedBanners(
            response.eventBanners
              .filter(b => b.isActive && (b._id || b.bannerId) !== bannerId)
              .slice(0, 4)
          );
        }
      } catch {
        // 관련 이벤트 실패는 무시
      }
    };

    fetchRelated();
  }, [bannerId]);

  const formatDateFull = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

  // 로딩 상태
  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        {/* 모바일 로딩 */}
        <div className="md:hidden">
          <div className="animate-pulse">
            <div className="w-full h-[260px] bg-surface" />
            <div className="p-5 space-y-3">
              <div className="h-5 bg-surface rounded w-1/3" />
              <div className="h-7 bg-surface rounded w-3/4" />
              <div className="h-4 bg-surface rounded w-full" />
              <div className="h-4 bg-surface rounded w-2/3" />
            </div>
          </div>
        </div>
        {/* 데스크톱 로딩 */}
        <div className="hidden md:block mx-auto max-w-7xl px-4 py-6">
          <div className="animate-pulse">
            <div className="h-5 bg-surface rounded w-32 mb-6" />
            <div className="w-full h-[350px] bg-surface rounded-2xl" />
            <div className="mt-6 space-y-3">
              <div className="h-8 bg-surface rounded w-1/2" />
              <div className="h-4 bg-surface rounded w-full" />
              <div className="h-4 bg-surface rounded w-2/3" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error || !banner) {
    return (
      <div className="min-h-screen bg-white">
        {/* 모바일 헤더 */}
        <header className="md:hidden sticky top-0 z-30 bg-white border-b">
          <div className="flex items-center justify-between px-4 py-3">
            <button onClick={() => history.back()} className="p-1 text-gray-600">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 6l-6 6 6 6" />
              </svg>
            </button>
            <span className="text-base font-semibold">이벤트</span>
            <div className="w-8" />
          </div>
        </header>
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="text-center py-20">
            <div className="text-muted mb-3">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-600 mb-1">배너를 찾을 수 없습니다</p>
            <p className="text-sm text-muted mb-5">{error || '존재하지 않거나 만료된 이벤트입니다.'}</p>
            <button
              onClick={() => onGo('/event')}
              className="rounded-full bg-brand text-white px-6 py-2 hover:bg-brand-600"
            >
              이벤트 목록으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  const status = getEventStatus(banner);
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('ko-KR');

  return (
    <div className="min-h-screen bg-white">
      {/* ===== 데스크톱 레이아웃 ===== */}
      <div className="hidden md:block">
        <div className="mx-auto max-w-7xl px-4 py-6">
          {/* 뒤로가기 버튼 */}
          <div className="mb-6">
            <button
              onClick={() => onGo('/event')}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-muted hover:text-ink hover:bg-surface rounded-lg transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor">
                <path d="M19 12H5m7-7l-7 7 7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              이벤트 목록으로 돌아가기
            </button>
          </div>

          {/* 히어로 배너 */}
          <div className="relative overflow-hidden rounded-2xl mb-8">
            <div className="relative">
              <img
                src={banner.imageUrl}
                alt={banner.title}
                className="w-full aspect-[21/9] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

              {/* 배너 위 정보 */}
              <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8">
                <div className="flex items-center gap-3 mb-3">
                  {/* 상태 뱃지 */}
                  <span
                    className="px-3 py-1 rounded-full text-xs font-bold"
                    style={{ backgroundColor: status.bgColor, color: status.color }}
                  >
                    {status.label}
                  </span>
                  {/* D-day */}
                  {banner.endDate && new Date(banner.endDate) >= new Date() && (
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white rounded-full text-xs font-bold">
                      {getDday(banner.endDate)}
                    </span>
                  )}
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">{banner.title}</h1>
                {banner.description && (
                  <p className="text-white/80 text-base lg:text-lg max-w-2xl">{banner.description}</p>
                )}
              </div>
            </div>

            {/* 이벤트 정보 카드 */}
            <div className="bg-white -mt-1 relative z-10 p-6 rounded-b-2xl">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {/* 기간 */}
                {(banner.startDate || banner.endDate) && (
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-3 bg-brand-50 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="text-sm font-bold text-gray-900 mb-1">이벤트 기간</div>
                    <div className="text-xs text-muted">
                      {banner.startDate && formatDateFull(banner.startDate)}
                      {banner.startDate && banner.endDate && ' ~ '}
                      {banner.endDate && formatDateFull(banner.endDate)}
                    </div>
                  </div>
                )}

                {/* 상태 */}
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-3 bg-green-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-sm font-bold text-gray-900 mb-1">진행 상태</div>
                  <div className="text-xs text-muted">{status.label}</div>
                </div>

                {/* D-day */}
                {banner.endDate && new Date(banner.endDate) >= new Date() && (
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-3 bg-yellow-100 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">{getDday(banner.endDate)}</div>
                    <div className="text-xs text-muted">남은 기간</div>
                  </div>
                )}

                {/* CTA */}
                {(() => {
                  const cta = resolveCtaConfig(banner.redirectUrl);
                  return cta ? (
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center" style={{ backgroundColor: cta.bgColor + '1A' }}>
                        <svg className="w-6 h-6" style={{ color: cta.bgColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </div>
                      <button
                        onClick={() => onGo(banner.redirectUrl!)}
                        className="text-sm font-bold hover:underline"
                        style={{ color: cta.bgColor }}
                      >
                        {cta.label}
                      </button>
                    </div>
                  ) : null;
                })()}
              </div>
            </div>
          </div>

          {/* 상세 이미지 */}
          {banner.detailImages && banner.detailImages.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">이벤트 상세</h2>
              <div className="space-y-4">
                {[...banner.detailImages]
                  .sort((a, b) => a.displayOrder - b.displayOrder)
                  .map((img, i) => (
                    <img
                      key={i}
                      src={img.imageUrl}
                      alt={`${banner.title} 상세 ${i + 1}`}
                      className="w-full rounded-2xl block"
                      loading="lazy"
                    />
                  ))}
              </div>
            </div>
          )}

          {/* 다른 이벤트 */}
          {relatedBanners.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">다른 이벤트</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {relatedBanners.map((related) => {
                  const relatedId = related._id || related.bannerId;
                  return (
                    <div
                      key={relatedId}
                      onClick={() => handleBannerClick(related, onGo)}
                      className="cursor-pointer group"
                    >
                      <div className="relative w-full overflow-hidden rounded-xl bg-surface">
                        <img
                          src={related.imageUrl}
                          alt={related.title}
                          className="aspect-[16/9] w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                      <p className="text-sm font-semibold text-gray-900 mt-2 line-clamp-1">{related.title}</p>
                      {(related.startDate || related.endDate) && (
                        <p className="text-xs text-muted mt-1">
                          {related.startDate && new Date(related.startDate).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}
                          {related.startDate && related.endDate && ' ~ '}
                          {related.endDate && new Date(related.endDate).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== 모바일 레이아웃 (신규 디자인) ===== */}
      <div className="md:hidden">
        {/* 모바일 헤더 - 히어로 이미지 위에 오버레이 */}
        <div className="relative">
          {/* 히어로 이미지 */}
          <div className="relative w-full h-[260px] overflow-hidden">
            <img
              src={banner.imageUrl}
              alt={banner.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/30" />

            {/* 상단 네비게이션 */}
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-[env(safe-area-inset-top)] py-3 z-10">
              <button
                onClick={() => history.back()}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-sm"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 6l-6 6 6 6" />
                </svg>
              </button>
              <span className="text-white text-base font-semibold">이벤트</span>
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: banner.title, url: window.location.href });
                  }
                }}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-sm"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
              </button>
            </div>

            {/* 상태 뱃지 */}
            <div
              className="absolute top-14 left-4 px-2.5 py-1 rounded-full text-[11px] font-bold"
              style={{ backgroundColor: status.bgColor, color: status.color }}
            >
              {status.label}
            </div>

            {/* 히어로 텍스트 */}
            <div className="absolute bottom-4 left-4 right-4">
              <h1 className="text-xl font-bold text-white leading-tight mb-1">{banner.title}</h1>
              {banner.description && (
                <p className="text-[13px] text-white/80 line-clamp-1">{banner.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* 이벤트 정보 카드 */}
        <div className="px-5 py-5">
          {/* 기간 + D-day */}
          {(banner.startDate || banner.endDate) && (
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-4 h-4 text-muted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-[13px] text-muted">
                {banner.startDate && formatDate(banner.startDate)}
                {banner.startDate && banner.endDate && ' ~ '}
                {banner.endDate && formatDate(banner.endDate)}
              </span>
              {banner.endDate && new Date(banner.endDate) >= new Date() && (
                <span className="ml-auto px-2 py-0.5 bg-green-50 text-green-600 text-[11px] font-semibold rounded-md">
                  {getDday(banner.endDate)}
                </span>
              )}
            </div>
          )}

          {/* 설명 */}
          {banner.description && (
            <p className="text-[14px] text-muted leading-relaxed whitespace-pre-line">
              {banner.description}
            </p>
          )}
        </div>

        {/* 구분선 */}
        <div className="h-2 bg-surface" />

        {/* 상세 이미지 */}
        {banner.detailImages && banner.detailImages.length > 0 && (
          <>
            <div className="px-5 py-5">
              <h2 className="text-base font-bold text-gray-900 mb-4">이벤트 상세</h2>
              <div className="space-y-3">
                {[...banner.detailImages]
                  .sort((a, b) => a.displayOrder - b.displayOrder)
                  .map((img, i) => (
                    <img
                      key={i}
                      src={img.imageUrl}
                      alt={`${banner.title} 상세 ${i + 1}`}
                      className="w-full rounded-xl block"
                      loading="lazy"
                    />
                  ))}
              </div>
            </div>
            <div className="h-2 bg-surface" />
          </>
        )}

        {/* 다른 이벤트 */}
        {relatedBanners.length > 0 && (
          <>
            <div className="px-5 py-5">
              <h2 className="text-base font-bold text-gray-900 mb-4">다른 이벤트</h2>
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                {relatedBanners.map((related) => {
                  const relatedId = related._id || related.bannerId;
                  return (
                    <div
                      key={relatedId}
                      onClick={() => handleBannerClick(related, onGo)}
                      className="flex-shrink-0 w-[160px] cursor-pointer"
                    >
                      <div className="w-full h-[100px] rounded-xl overflow-hidden bg-surface mb-2">
                        <img
                          src={related.imageUrl}
                          alt={related.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <p className="text-[12px] font-semibold text-gray-900 line-clamp-1">{related.title}</p>
                      {(related.startDate || related.endDate) && (
                        <p className="text-[11px] text-muted mt-0.5">
                          {related.startDate && new Date(related.startDate).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}
                          {related.startDate && related.endDate && ' ~ '}
                          {related.endDate && new Date(related.endDate).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* CTA 버튼 - redirectUrl이 있을 때만 */}
        {(() => {
          const cta = resolveCtaConfig(banner.redirectUrl);
          return cta ? (
            <div className="sticky bottom-0 px-5 py-4 bg-white border-t">
              <button
                onClick={() => onGo(banner.redirectUrl!)}
                className="w-full py-3.5 text-white text-[15px] font-bold rounded-xl transition-colors"
                style={{ backgroundColor: cta.bgColor }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = cta.hoverBgColor)}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = cta.bgColor)}
              >
                {cta.label}
              </button>
            </div>
          ) : null;
        })()}
      </div>
    </div>
  );
}
