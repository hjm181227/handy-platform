import { useState, useEffect } from 'react';
import { webApiService } from '../../services/apiService';
import { TitleBar, ProductGrid } from '../product/ProductGrid';
import type { Product } from '@handy-platform/shared';

interface SearchResultsPageProps {
  searchQuery: string;
  onOpen: (productId: string) => void;
  onAdd: (productId: string) => void;
  onLike?: (productId: string) => void;
  likedProducts?: string[];
}

export function SearchResultsPage({ searchQuery, onOpen, onAdd, onLike, likedProducts = [] }: SearchResultsPageProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // 검색 실행
  const performSearch = async (query: string) => {
    if (!query.trim() && hasSearched) {
      // 빈 검색어이고 이미 검색한 적이 있다면 그대로 유지
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setHasSearched(true);

      console.log('🔍 Performing search with query:', query);

      if (!query.trim()) {
        // 빈 검색어인 경우 전체 상품 조회
        const response = await webApiService.product.getProducts({
          page: '1',
          limit: '20',
          sortBy: 'createdAt',
          sortOrder: 'desc'
        });

        console.log('🔍 Search response (all products):', response);

        if (response.success && response.data) {
          setProducts(response.data);
          setTotalCount(response.data.length);
        } else {
          setProducts([]);
          setTotalCount(0);
        }
      } else {
        // 검색어가 있는 경우 검색 수행
        const response = await webApiService.product.searchProducts(query, {
          page: '1',
          limit: '20',
          sortBy: 'createdAt',
          sortOrder: 'desc'
        });

        console.log('🔍 Search response:', response);

        if (response.success && response.data) {
          setProducts(response.data);
          setTotalCount(response.data.length);
        } else {
          // API 응답은 성공했지만 데이터가 없는 경우
          setProducts([]);
          setTotalCount(0);
          
          if (response.error) {
            setError(`검색 중 오류가 발생했습니다: ${response.error}`);
          }
        }
      }
    } catch (error: any) {
      console.error('🔍 Search failed:', error);
      setProducts([]);
      setTotalCount(0);
      
      // 사용자 친화적 에러 메시지 설정
      if (error.message?.includes('fetch')) {
        setError('네트워크 연결을 확인해주세요.');
      } else if (error.status === 400) {
        setError('검색어가 올바르지 않습니다.');
      } else if (error.status >= 500) {
        setError('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      } else {
        setError('검색 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 검색어가 변경될 때마다 검색 실행
  useEffect(() => {
    performSearch(searchQuery);
  }, [searchQuery]);

  // 재시도 핸들러
  const handleRetry = () => {
    performSearch(searchQuery);
  };

  // 로딩 상태
  if (loading) {
    return (
      <>
        <TitleBar title={`검색: ${searchQuery || "전체"}`} desc="검색 중..." />
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 text-lg">검색 중입니다...</p>
            <p className="text-gray-400 text-sm mt-2">잠시만 기다려주세요</p>
          </div>
        </div>
      </>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <>
        <TitleBar title={`검색: ${searchQuery || "전체"}`} desc="검색 오류" />
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">검색 오류</h3>
            <p className="text-gray-600 text-center mb-6 max-w-md">{error}</p>
            <div className="flex gap-3">
              <button
                onClick={handleRetry}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                다시 시도
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                홈으로 가기
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // 빈 결과 상태
  if (hasSearched && products.length === 0 && !loading && !error) {
    return (
      <>
        <TitleBar 
          title={`검색: ${searchQuery || "전체"}`} 
          desc={searchQuery ? `'${searchQuery}'에 대한 검색 결과가 없습니다` : "등록된 상품이 없습니다"} 
        />
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">검색 결과 없음</h3>
            <p className="text-gray-600 text-center mb-6 max-w-md">
              {searchQuery ? (
                <>
                  '<span className="font-medium text-gray-900">{searchQuery}</span>'에 대한 검색 결과가 없습니다.
                  <br />다른 키워드로 다시 검색해보세요.
                </>
              ) : (
                '등록된 상품이 없습니다.'
              )}
            </p>
            <div className="flex gap-3">
              {searchQuery && (
                <button
                  onClick={() => performSearch('')}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  전체 상품 보기
                </button>
              )}
              <button
                onClick={() => window.location.href = '/'}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                홈으로 가기
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // 검색 결과 표시
  const resultText = totalCount > 0 
    ? `${totalCount}개의 결과`
    : '';

  const titleDesc = searchQuery 
    ? `'${searchQuery}'에 대한 ${resultText}` 
    : `전체 상품 ${resultText}`;

  return (
    <>
      <TitleBar 
        title={`검색: ${searchQuery || "전체"}`} 
        desc={titleDesc}
      />
      
      {/* 검색 결과 정보 */}
      <div className="container mx-auto px-4 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {searchQuery && (
              <>
                <span className="font-medium text-gray-900">'{searchQuery}'</span> 검색 결과 
              </>
            )}
            <span className="font-medium text-blue-600">{totalCount}개</span>
            {searchQuery && totalCount === 0 && (
              <span className="ml-2 text-gray-500">
                • 다른 키워드로 검색해보세요
              </span>
            )}
          </div>
          
          {searchQuery && totalCount > 0 && (
            <button
              onClick={() => performSearch('')}
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              전체 상품 보기
            </button>
          )}
        </div>
      </div>
      
      {/* 검색 결과 그리드 */}
      <ProductGrid
        title="" // 제목은 이미 TitleBar에서 표시했으므로 빈 문자열
        items={products}
        onOpen={onOpen}
        onAdd={onAdd}
        onLike={onLike}
        likedProducts={likedProducts}
      />

      {/* 검색 결과가 적을 때 추가 안내 */}
      {products.length > 0 && products.length < 5 && (
        <div className="container mx-auto px-4 py-8">
          <div className="bg-blue-50 rounded-lg p-6 text-center">
            <h4 className="text-lg font-medium text-blue-900 mb-2">더 많은 상품을 찾고 계신가요?</h4>
            <p className="text-blue-700 mb-4">
              다양한 키워드로 검색하거나 카테고리를 둘러보세요.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => performSearch('')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                전체 상품 보기
              </button>
              <button
                onClick={() => window.location.href = '/brands'}
                className="px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
              >
                브랜드 둘러보기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}