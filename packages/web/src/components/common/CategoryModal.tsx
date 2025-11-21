import { useState, useEffect, useRef } from 'react';
import { webApiService } from '../../services/apiService';
import type { CategoryData, CategoryItem } from '@handy-platform/shared';
import { FaTimes, FaSearch } from 'react-icons/fa';
import { FiShoppingBag } from 'react-icons/fi';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
  isPage?: boolean; // 페이지 모드인지 (모바일 탭에서 접근)
  cartCount?: number; // 장바구니 아이템 개수
  onCart?: () => void; // 장바구니 클릭 핸들러
}

export function CategoryModal({ isOpen, onClose, onNavigate, isPage = false, cartCount = 0, onCart }: CategoryModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categoryData, setCategoryData] = useState<CategoryData | null>(null);
  const [activeTab, setActiveTab] = useState<'category' | 'brand' | 'service'>('category');
  const [activeFilter, setActiveFilter] = useState<'all' | 'male' | 'female'>('all');
  const [selectedType, setSelectedType] = useState<string>('style'); // 왼쪽 사이드바에서 선택된 타입
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // 모달 열림/닫힘 애니메이션
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // 모달 열릴 때 카테고리 데이터 로드
      loadCategories();
    } else {
      // 닫힐 때 애니메이션을 위한 딜레이
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // ESC 키로 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // 배경 클릭으로 닫기
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // 카테고리 데이터 로드
  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await webApiService.category.getCategories();

      if (response.success && response.data) {
        setCategoryData(response.data);
      } else {
        setError('카테고리를 불러올 수 없습니다.');
      }
    } catch (err: any) {
      console.error('Failed to load categories:', err);
      setError(err.message || '카테고리를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 카테고리 클릭 핸들러
  const handleCategoryClick = (categoryType: string, categoryValue: string) => {
    onClose();
    onNavigate(`/cat/${categoryType}/${categoryValue}`);
  };

  // 검색 핸들러
  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      setShowSearchSuggestions(false);
      onNavigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // 외부 클릭으로 검색 제안 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isVisible) return null;

  // 페이지 모드 (모바일 탭에서 /category로 접근)
  if (isPage) {
    return (
      <div className="min-h-screen bg-white pb-20 flex flex-col">
        {/* 통합 Sticky 헤더: 검색바 + 탭 */}
        <header className="handy-sticky-header">
          {/* 검색바 + 장바구니 */}
          <div className="flex items-center gap-3 px-4 py-2 border-b">
            {/* 검색바 */}
            <div className="flex-1 relative" ref={searchRef}>
              <form onSubmit={(e) => { e.preventDefault(); handleSearchSubmit(); }}>
                <div className="relative">
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setShowSearchSuggestions(true)}
                    placeholder="검색어를 입력하세요"
                    className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-gray-700"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <FaSearch className="w-4 h-4" />
                  </button>
                </div>
              </form>

              {/* 검색 제안 */}
              {showSearchSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border z-50 max-h-60 overflow-y-auto">
                  <div className="p-3">
                    <span className="text-xs font-medium text-gray-500 mb-2 block">추천 검색어</span>
                    <div className="flex flex-wrap gap-2">
                      {['네일아트', '젤네일', '매니큐어', '핸드크림'].map((keyword, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setSearchQuery(keyword);
                            setShowSearchSuggestions(false);
                            onNavigate(`/search?q=${encodeURIComponent(keyword)}`);
                          }}
                          className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                        >
                          {keyword}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 장바구니 버튼 */}
            {onCart && (
              <button
                onClick={onCart}
                className="relative w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                aria-label="장바구니"
              >
                <FiShoppingBag className="w-5 h-5 text-gray-700" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* 탭 */}
          <div className="flex border-b bg-white">
            {[
              { key: 'category' as const, label: '카테고리' },
              { key: 'brand' as const, label: '브랜드' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </header>

        {/* 콘텐츠 */}
        <div className="flex flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12 w-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12 w-full">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={loadCategories}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                다시 시도
              </button>
            </div>
          ) : activeTab === 'category' ? (
            categoryData ? (
              <>
                {/* 왼쪽 사이드바 - 카테고리 타입 목록 */}
                <div className="w-32 border-r border-gray-200 overflow-y-auto bg-gray-50 flex-shrink-0">
                  {categoryData.types.map((type) => {
                    const typeLabels: { [key: string]: string } = {
                      style: '스타일',
                      color: '컬러',
                      texture: '텍스쳐',
                      shape: '모양',
                      length: '길이',
                      tpo: 'TPO',
                      nation: '국가별'
                    };

                    const categories = categoryData.categories[type];
                    if (!categories || categories.length === 0) return null;

                    return (
                      <button
                        key={type}
                        onClick={() => setSelectedType(type)}
                        className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${
                          selectedType === type
                            ? 'bg-white text-blue-600'
                            : 'text-gray-700 hover:bg-white hover:text-gray-900'
                        }`}
                      >
                        {typeLabels[type] || type}
                      </button>
                    );
                  })}
                </div>

                {/* 오른쪽 콘텐츠 - 선택된 타입의 카테고리 아이템들 */}
                <div className="flex-1 overflow-y-auto p-3">
                  {(() => {
                    const categories = categoryData.categories[selectedType];
                    if (!categories || categories.length === 0) {
                      return (
                        <div className="text-center py-12 text-gray-500">
                          카테고리가 없습니다.
                        </div>
                      );
                    }

                    const typeLabels: { [key: string]: string } = {
                      style: '스타일',
                      color: '컬러',
                      texture: '텍스쳐',
                      shape: '모양',
                      length: '길이',
                      tpo: 'TPO',
                      nation: '국가별'
                    };

                    return (
                      <div>
                        {/* 타입 헤더 */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <span className="w-1 h-5 bg-blue-600 rounded"></span>
                            <h3 className="text-lg font-bold text-gray-900">
                              {typeLabels[selectedType] || selectedType}
                            </h3>
                          </div>
                          <button
                            onClick={() => handleCategoryClick(selectedType, 'all')}
                            className="text-sm text-gray-600 hover:text-blue-600 transition-colors underline"
                          >
                            전체 보기
                          </button>
                        </div>

                        {/* 카테고리 그리드 - 3컬럼 */}
                        <div className="grid grid-cols-3 gap-2">
                          {categories.map((category: CategoryItem) => (
                            <button
                              key={category.value}
                              onClick={() => handleCategoryClick(selectedType, category.value)}
                              className="flex flex-col items-center justify-center p-3 rounded-lg border border-gray-200 hover:border-blue-600 hover:shadow-md transition-all group bg-white"
                            >
                              {category.iconUrl ? (
                                <img
                                  src={category.iconUrl}
                                  alt={category.name}
                                  className="w-12 h-12 mb-2 object-contain"
                                />
                              ) : (
                                <div className="w-12 h-12 mb-2 rounded-full bg-gray-100 flex items-center justify-center">
                                  <span className="text-2xl text-gray-400">#</span>
                                </div>
                              )}
                              <span className="text-sm font-medium text-gray-900 group-hover:text-blue-600 text-center">
                                {category.name}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-gray-500 w-full">
                카테고리 데이터가 없습니다.
              </div>
            )
          ) : (
            <div className="text-center py-12 text-gray-500 w-full">
              브랜드 목록은 준비 중입니다.
            </div>
          )}
        </div>
      </div>
    );
  }

  // 모달 모드 (데스크탑 또는 헤더에서 열기)
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center transition-all duration-300"
      style={{ opacity: isOpen ? 1 : 0 }}
      onClick={handleBackdropClick}
    >
      {/* 배경 오버레이 */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* 모달 컨테이너 */}
      <div
        ref={modalRef}
        className={`
          relative bg-white transform transition-all duration-300 rounded-lg shadow-2xl
          max-w-4xl w-full max-h-[80vh] m-4
          ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}
        `}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-900">카테고리</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="닫기"
          >
            <FaTimes className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* 탭 */}
        <div className="flex border-b bg-white sticky top-[57px] z-10">
          {[
            { key: 'category' as const, label: '카테고리' },
            { key: 'brand' as const, label: '브랜드' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 콘텐츠 - 무신사 스타일 레이아웃 */}
        <div className="flex overflow-hidden md:max-h-[calc(80vh-180px)] max-md:flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-12 w-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12 w-full">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={loadCategories}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                다시 시도
              </button>
            </div>
          ) : activeTab === 'category' ? (
            categoryData ? (
              <>
                {/* 왼쪽 사이드바 - 카테고리 타입 목록 */}
                <div className="w-32 md:w-48 border-r border-gray-200 overflow-y-auto bg-gray-50 flex-shrink-0">
                  {categoryData.types.map((type) => {
                    const typeLabels: { [key: string]: string } = {
                      style: '스타일',
                      color: '컬러',
                      texture: '텍스쳐',
                      shape: '모양',
                      length: '길이',
                      tpo: 'TPO',
                      nation: '국가별'
                    };

                    const categories = categoryData.categories[type];
                    if (!categories || categories.length === 0) return null;

                    return (
                      <button
                        key={type}
                        onClick={() => setSelectedType(type)}
                        className={`w-full text-left px-6 py-3 text-sm font-medium transition-colors ${
                          selectedType === type
                            ? 'bg-white text-blue-600'
                            : 'text-gray-700 hover:bg-white hover:text-gray-900'
                        }`}
                      >
                        {typeLabels[type] || type}
                      </button>
                    );
                  })}
                </div>

                {/* 오른쪽 콘텐츠 - 선택된 타입의 카테고리 아이템들 */}
                <div className="flex-1 overflow-y-auto p-3 md:p-6">
                  {(() => {
                    const categories = categoryData.categories[selectedType];
                    if (!categories || categories.length === 0) {
                      return (
                        <div className="text-center py-12 text-gray-500">
                          카테고리가 없습니다.
                        </div>
                      );
                    }

                    const typeLabels: { [key: string]: string } = {
                      style: '스타일',
                      color: '컬러',
                      texture: '텍스쳐',
                      shape: '모양',
                      length: '길이',
                      tpo: 'TPO',
                      nation: '국가별'
                    };

                    return (
                      <div>
                        {/* 타입 헤더 */}
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-2">
                            <span className="w-1 h-5 bg-blue-600 rounded"></span>
                            <h3 className="text-lg font-bold text-gray-900">
                              {typeLabels[selectedType] || selectedType}
                            </h3>
                          </div>
                          <button
                            onClick={() => handleCategoryClick(selectedType, 'all')}
                            className="text-sm text-gray-600 hover:text-blue-600 transition-colors underline"
                          >
                            전체 보기
                          </button>
                        </div>

                        {/* 카테고리 그리드 - 3컬럼 */}
                        <div className="grid grid-cols-3 gap-2 md:gap-3">
                          {categories.map((category: CategoryItem) => (
                            <button
                              key={category.value}
                              onClick={() => handleCategoryClick(selectedType, category.value)}
                              className="flex flex-col items-center justify-center p-3 md:p-6 rounded-lg border border-gray-200 hover:border-blue-600 hover:shadow-md transition-all group bg-white"
                            >
                              {category.iconUrl ? (
                                <img
                                  src={category.iconUrl}
                                  alt={category.name}
                                  className="w-12 h-12 md:w-16 md:h-16 mb-2 md:mb-3 object-contain"
                                />
                              ) : (
                                <div className="w-12 h-12 md:w-16 md:h-16 mb-2 md:mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                                  <span className="text-2xl md:text-3xl text-gray-400">#</span>
                                </div>
                              )}
                              <span className="text-sm font-medium text-gray-900 group-hover:text-blue-600 text-center">
                                {category.name}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-gray-500 w-full">
                카테고리 데이터가 없습니다.
              </div>
            )
          ) : (
            <div className="text-center py-12 text-gray-500 w-full">
              브랜드 목록은 준비 중입니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
