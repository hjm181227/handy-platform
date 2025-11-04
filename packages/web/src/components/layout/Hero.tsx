import { useState, useEffect } from 'react';
import { webApiService } from '../../services/apiService';
import type { EventBanner } from '@handy-platform/shared';

export function EventBanners({ onGo }:{ onGo:(to:string)=>void }) {
  const [banners, setBanners] = useState<EventBanner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const response = await webApiService.banner.getPublicBanners({ limit: 3 });
        if (response.success && response.eventBanners) {
          // Filter active banners only
          const activeBanners = response.eventBanners.filter(banner => banner.isActive);
          setBanners(activeBanners);
        }
      } catch (error) {
        console.error('Failed to load event banners:', error);
        // Keep banners empty to show empty state
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, []);

  // Loading skeleton
  if (loading) {
    return (
      <section className="mx-auto max-w-7xl px-4 mt-3">
        <div className="grid md:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="relative rounded-lg overflow-hidden bg-gray-200 animate-pulse">
              <div className="h-[220px] md:h-[280px] w-full" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Empty state
  if (banners.length === 0) {
    return (
      <section className="mx-auto max-w-7xl px-4 mt-3">
        <div className="flex items-center justify-center h-[220px] md:h-[280px] bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <div className="text-center">
            <div className="text-gray-400 mb-2">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-600">이벤트 준비중입니다</p>
            <p className="text-sm text-gray-400 mt-1">곧 새로운 이벤트를 만나보세요!</p>
          </div>
        </div>
      </section>
    );
  }

  // Show banners
  return (
    <section className="mx-auto max-w-7xl px-4 mt-3">
      <div className="grid md:grid-cols-3 gap-3">
        {banners.map((banner, i)=>(
          <a
            key={banner._id || i}
            href={banner.redirectUrl || '#'}
            onClick={(e)=>{e.preventDefault(); if(banner.redirectUrl) onGo(banner.redirectUrl);}}
            className="relative group rounded-lg overflow-hidden bg-gray-100 transition-shadow duration-300"
            style={{
              boxShadow: '0 2px 8px 0 rgba(20, 20, 20, 0.04), 0 1px 3px 0 rgba(20, 20, 20, 0.02), 0 0 0 1px rgba(0, 0, 0, 0.02)'
            }}
          >
            <img
              src={banner.imageUrl}
              alt={banner.title}
              className="h-[220px] md:h-[280px] w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"/>
            <div className="absolute left-3 bottom-3 text-white">
              <div className="text-lg md:text-xl font-semibold">{banner.title}</div>
              {banner.description && <div className="text-sm text-gray-200">{banner.description}</div>}
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}