import { useState, useEffect, useRef, useMemo } from 'react';
import { webApiService } from '../../services/apiService';
import type { EventBanner } from '@handy-platform/shared';

export function EventBanners({ onGo }:{ onGo:(to:string)=>void }) {
  const [banners, setBanners] = useState<EventBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  // Helper function to get items per slide based on window width
  const getItemsPerSlide = () => {
    if (windowWidth < 640) return 1;  // Mobile: 1 banner
    if (windowWidth < 1024) return 2; // Tablet: 2 banners
    return 3; // Desktop: 3 banners
  };

  // Create extended banner array for infinite loop: [...banners, ...banners, ...banners]
  const extendedBanners = useMemo(() => {
    if (banners.length === 0) return [];
    return [...banners, ...banners, ...banners];
  }, [banners]);

  // Track window width for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const response = await webApiService.banner.getPublicBanners({ limit: 3 });
        if (response.success && response.eventBanners) {
          // Filter active banners only
          const activeBanners = response.eventBanners.filter(banner => banner.isActive);
          setBanners(activeBanners);
          // Set initial index to middle set (for infinite loop)
          setCurrentIndex(activeBanners.length);
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

  // Auto-play slider (4 seconds interval)
  useEffect(() => {
    if (banners.length <= 1) return;

    const startAutoPlay = () => {
      autoPlayRef.current = setInterval(() => {
        setCurrentIndex((prevIndex) => prevIndex + 1);
      }, 4000);
    };

    startAutoPlay();

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [banners.length]);

  // Handle infinite loop jump
  useEffect(() => {
    if (banners.length === 0) return;

    // Jump to middle set when reaching boundaries (without transition)
    if (currentIndex >= banners.length * 2) {
      setTimeout(() => {
        setIsTransitioning(false);
        setCurrentIndex(banners.length);
        setTimeout(() => setIsTransitioning(true), 50);
      }, 500);
    } else if (currentIndex < banners.length) {
      setTimeout(() => {
        setIsTransitioning(false);
        setCurrentIndex(banners.length * 2 - 1);
        setTimeout(() => setIsTransitioning(true), 50);
      }, 500);
    }
  }, [currentIndex, banners.length]);

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      setCurrentIndex(currentIndex + 1);
      resetAutoPlay();
    }
    if (isRightSwipe) {
      setCurrentIndex(currentIndex - 1);
      resetAutoPlay();
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

  const resetAutoPlay = () => {
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
    }
    autoPlayRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => prevIndex + 1);
    }, 4000);
  };

  // Navigation handlers for arrow buttons
  const handlePrev = () => {
    setCurrentIndex(currentIndex - 1);
    resetAutoPlay();
  };

  const handleNext = () => {
    setCurrentIndex(currentIndex + 1);
    resetAutoPlay();
  };

  // Loading skeleton
  if (loading) {
    return (
      <section className="mt-3">
        <div className="overflow-hidden px-4 sm:px-0">
          <div className="flex gap-0">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex-shrink-0 w-full sm:w-1/2 lg:w-1/3">
                <div className="relative overflow-hidden bg-gray-200 animate-pulse">
                  <div className="aspect-[4/3] w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Empty state
  if (banners.length === 0) {
    return (
      <section className="mt-3">
        <div className="px-4">
          <div className="flex items-center justify-center h-[220px] sm:h-[250px] lg:h-[280px] bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
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
        </div>
      </section>
    );
  }

  // Show banners
  return (
    <section className="mt-3">
      {/* Carousel Slider (Mobile: 1 banner, Tablet: 2 banners, Desktop: 3 banners) */}
      {banners.length > 1 ? (
        <div className="group relative overflow-hidden px-4 sm:px-0">
          <div
            className="flex ease-out"
            style={{
              transform: (() => {
                const itemsPerSlide = getItemsPerSlide();
                const slideGroup = Math.floor(currentIndex / itemsPerSlide);
                return `translateX(-${slideGroup * 100}%)`;
              })(),
              transition: isTransitioning ? 'transform 500ms' : 'none'
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {extendedBanners.map((banner, i) => {
              // Calculate actual index for opacity (middle set should match)
              const actualIndex = i % banners.length;
              const currentActualIndex = currentIndex % banners.length;

              return (
                <div
                  key={`${banner._id || banner.bannerId}-${i}`}
                  className={`flex-shrink-0 w-full sm:w-1/2 lg:w-1/3 transition-opacity duration-300 ${
                    actualIndex === currentActualIndex ? 'opacity-100' : 'opacity-50'
                  } sm:opacity-100`}
                >
                  <a
                    href={banner.redirectUrl || '#'}
                    onClick={(e) => {
                      e.preventDefault();
                      if (banner.redirectUrl) onGo(banner.redirectUrl);
                    }}
                    className="relative block overflow-hidden bg-gray-100 transition-shadow duration-300"
                    style={{
                      boxShadow: '0 2px 8px 0 rgba(20, 20, 20, 0.04), 0 1px 3px 0 rgba(20, 20, 20, 0.02), 0 0 0 1px rgba(0, 0, 0, 0.02)'
                    }}
                  >
                    <img
                      src={banner.imageUrl}
                      alt={banner.title}
                      className="aspect-[4/3] w-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute left-3 bottom-3 text-white">
                      <div className="text-lg sm:text-xl font-semibold">{banner.title}</div>
                      {banner.description && <div className="text-sm text-gray-200">{banner.description}</div>}
                    </div>
                  </a>
                </div>
              );
            })}
          </div>

          {/* Navigation Arrows (Desktop only, visible on hover) */}
          <button
            onClick={handlePrev}
            className="hidden lg:flex absolute left-6 top-1/2 -translate-y-1/2 z-10
                       opacity-0 group-hover:opacity-100 transition-opacity duration-300
                       w-10 h-10 items-center justify-center
                       bg-white rounded-full shadow-lg hover:bg-gray-100"
            aria-label="Previous slide"
          >
            <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={handleNext}
            className="hidden lg:flex absolute right-6 top-1/2 -translate-y-1/2 z-10
                       opacity-0 group-hover:opacity-100 transition-opacity duration-300
                       w-10 h-10 items-center justify-center
                       bg-white rounded-full shadow-lg hover:bg-gray-100"
            aria-label="Next slide"
          >
            <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      ) : (
        // Single banner (no slider)
        <div className="px-4 sm:px-0">
          {banners.map((banner, i) => (
            <a
              key={banner._id || i}
              href={banner.redirectUrl || '#'}
              onClick={(e) => {
                e.preventDefault();
                if (banner.redirectUrl) onGo(banner.redirectUrl);
              }}
              className="relative block group overflow-hidden bg-gray-100 transition-shadow duration-300"
              style={{
                boxShadow: '0 2px 8px 0 rgba(20, 20, 20, 0.04), 0 1px 3px 0 rgba(20, 20, 20, 0.02), 0 0 0 1px rgba(0, 0, 0, 0.02)'
              }}
            >
              <img
                src={banner.imageUrl}
                alt={banner.title}
                className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute left-3 bottom-3 text-white">
                <div className="text-lg sm:text-xl font-semibold">{banner.title}</div>
                {banner.description && <div className="text-sm text-gray-200">{banner.description}</div>}
              </div>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
