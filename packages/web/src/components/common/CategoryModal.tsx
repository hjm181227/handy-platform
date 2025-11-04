import { useState, useEffect, useRef } from 'react';
import { webApiService } from '../../services/apiService';
import type { CategoryData, CategoryItem } from '@handy-platform/shared';
import { FaTimes } from 'react-icons/fa';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

export function CategoryModal({ isOpen, onClose, onNavigate }: CategoryModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categoryData, setCategoryData] = useState<CategoryData | null>(null);
  const [activeTab, setActiveTab] = useState<'category' | 'brand' | 'service'>('category');
  const [activeFilter, setActiveFilter] = useState<'all' | 'male' | 'female'>('all');
  const [selectedType, setSelectedType] = useState<string>('style'); // 왼쪽 사이드바에서 선택된 타입

  const modalRef = useRef<HTMLDivElement>(null);

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

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${
        isOpen ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleBackdropClick}
    >
      {/* 배경 오버레이 */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* 모달 컨테이너 */}
      <div
        ref={modalRef}
        className={`relative bg-white rounded-lg shadow-2xl transform transition-all duration-300
          md:max-w-4xl md:w-full md:max-h-[80vh] md:m-4
          max-md:fixed max-md:inset-0 max-md:rounded-none max-md:w-full max-md:h-full
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
            { key: 'brand' as const, label: '브랜드' },
            { key: 'service' as const, label: '서비스' }
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

        {/* 필터 */}
        <div className="flex gap-2 p-4 border-b bg-gray-50 sticky top-[114px] z-10">
          {[
            { key: 'all' as const, label: '전체' },
            { key: 'male' as const, label: '남성' },
            { key: 'female' as const, label: '여성' }
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeFilter === filter.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* 콘텐츠 - 무신사 스타일 레이아웃 */}
        <div className="flex overflow-hidden max-h-[calc(80vh-180px)] max-md:max-h-[calc(100vh-180px)]">
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
                <div className="w-32 md:w-48 border-r border-gray-200 overflow-y-auto bg-gray-50">
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
                <div className="flex-1 overflow-y-auto p-6">
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
                        <div className="grid grid-cols-3 gap-3">
                          {categories.map((category: CategoryItem) => (
                            <button
                              key={category.value}
                              onClick={() => handleCategoryClick(selectedType, category.value)}
                              className="flex flex-col items-center justify-center p-6 rounded-lg border border-gray-200 hover:border-blue-600 hover:shadow-md transition-all group bg-white"
                            >
                              {category.iconUrl ? (
                                <img
                                  src={category.iconUrl}
                                  alt={category.name}
                                  className="w-16 h-16 mb-3 object-contain"
                                />
                              ) : (
                                <div className="w-16 h-16 mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                                  <span className="text-3xl text-gray-400">#</span>
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
          ) : activeTab === 'brand' ? (
            <div className="text-center py-12 text-gray-500 w-full">
              브랜드 목록은 준비 중입니다.
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 w-full">
              서비스 목록은 준비 중입니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
