import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAlert } from '../common';
import { cartService, productService } from '../../services/apiService';
import { Product } from '@handy-platform/shared';

interface ProductDetailProps {
  productId: string;
  onAddToCart?: () => void;
  onGo: (path: string) => void;
}

export function ProductDetail({ productId, onAddToCart, onGo }: ProductDetailProps) {
  const { t } = useTranslation(['common', 'product']);
  const { alert, error: showError } = useAlert();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      console.log('Loading product:', productId);
      
      const response = await productService.getProductDetail(productId);
      
      console.log('Product API response:', response);
      
      if (response.success && response.data) {
        setProduct(response.data);
        
        // 현재 API 스펙에서는 네일 옵션이 기본으로 포함되어 있으므로
        // 네일 형태의 기본 옵션 설정
        const defaultOptions: Record<string, string> = {
          shape: response.data.nailShape || 'ROUND',
          length: response.data.nailLength || 'MEDIUM'
        };
        setSelectedOptions(defaultOptions);
        
        console.log('Product loaded:', response.data);
      } else {
        throw new Error(t('common:productNotFound'));
      }
    } catch (err) {
      console.error('상품 로드 실패:', err);
      await showError(err, { title: t('common:loadFailed') });
      onGo('/'); // 메인 페이지로 이동
    } finally {
      setLoading(false);
    }
  };

  const handleOptionChange = (optionName: string, value: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [optionName]: value
    }));
  };

  const handleAddToCart = async () => {
    if (!product) return;

    try {
      setAddingToCart(true);
      
      console.log('Adding to cart:', {
        productId: product.id,
        quantity,
        options: selectedOptions
      });
      
      const response = await cartService.addToCart(
        product.id, // UUID 사용
        quantity,
        selectedOptions
      );

      console.log('Add to cart response:', response);

      if (response.success) {
        await alert(t('common:addedToCart'), {
          variant: 'success',
          title: t('common:addedToCartTitle')
        });
        
        onAddToCart?.();
      } else {
        throw new Error(response.error?.message || t('common:addToCartFailed'));
      }
    } catch (err: any) {
      console.error('장바구니 추가 실패:', err);
      
      let errorMessage = t('common:addToCartFailed');
      
      // API 에러 메시지 처리
      if (err.error?.code === 'MONTHLY_CAPACITY_EXCEEDED') {
        errorMessage = `제작 용량 부족: ${err.error.details.recommendedAction}`;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      await showError(new Error(errorMessage), {
        title: t('common:addToCartFailedTitle'),
        showRetry: true
      });
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = () => {
    // 바로 구매 시 임시 장바구니 아이템으로 체크아웃 페이지 이동
    if (!product) return;

    const tempCartItem = {
      id: 'temp_' + Date.now(),
      productId: product.id,
      product,
      quantity,
      selectedOptions,
      price: product.discountedPrice,
      totalPrice: product.discountedPrice * quantity,
      addedAt: new Date().toISOString()
    };

    // 체크아웃 페이지로 이동 (임시 아이템 포함)
    onGo(`/checkout?direct=true&item=${encodeURIComponent(JSON.stringify(tempCartItem))}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E85A6B] mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('common:loadingProductInfo')}</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('common:productNotFound')}</h1>
          <button
            onClick={() => onGo('/')}
            className="px-6 py-2 bg-[#E85A6B] text-white rounded-lg hover:bg-[#D14A5B]"
          >
            {t('common:goHome')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center">
          <button
            onClick={() => onGo('/')}
            className="mr-4 p-2 rounded-full hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-900 truncate">{t('common:productDetail')}</h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* 상품 이미지 */}
          <div className="relative">
            <div className="aspect-square bg-gray-100">
              {(() => {
                const allImages = [product.mainImageUrl, ...product.detailImages.map(img => img.url)];
                const currentImage = allImages[currentImageIndex];
                
                return currentImage ? (
                  <img
                    src={currentImage}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                  </div>
                );
              })()}
            </div>
            
            {/* 이미지 네비게이션 - 메인 + 상세 이미지들 */}
            {(() => {
              const totalImages = 1 + product.detailImages.length; // 메인 + 상세 이미지들
              return totalImages > 1 ? (
                <>
                  <button
                    onClick={() => setCurrentImageIndex(prev => 
                      prev === 0 ? totalImages - 1 : prev - 1
                    )}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setCurrentImageIndex(prev => 
                      prev === totalImages - 1 ? 0 : prev + 1
                    )}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  
                  {/* 이미지 인디케이터 */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    {Array.from({ length: totalImages }, (_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-2 h-2 rounded-full ${
                          currentImageIndex === index ? 'bg-white' : 'bg-white bg-opacity-50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              ) : null;
            })()}
          </div>

          {/* 상품 정보 */}
          <div className="p-6">
            {/* 상품명과 평점 */}
            <div className="mb-4">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>
              {product.shortDescription && (
                <p className="text-gray-600 mb-3">{product.shortDescription}</p>
              )}
              <div className="flex items-center space-x-3">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(product.rating.average)
                          ? 'text-yellow-400'
                          : 'text-gray-300'
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                  <span className="ml-2 text-sm text-gray-600">
                    {product.rating.average.toFixed(1)} ({t('common:reviewCount', { count: product.rating.count })})
                  </span>
                </div>
                {product.brand && (
                  <>
                    <span className="text-sm text-gray-500">|</span>
                    <span className="text-sm text-[#E85A6B]">{product.brand}</span>
                  </>
                )}
              </div>
            </div>

            {/* 가격 정보 */}
            <div className="mb-6">
              <div className="flex items-center space-x-3">
                {product.discountRate && product.discountRate > 0 && (
                  <>
                    <span className="text-lg text-gray-400 line-through">
                      ₩{product.price.toLocaleString()}
                    </span>
                    <span className="px-2 py-1 bg-red-100 text-red-600 text-sm font-medium rounded">
                      {t('product:detail.discountRate', { rate: product.discountRate })}
                    </span>
                  </>
                )}
              </div>
              <div className="text-3xl font-bold text-gray-900">
                ₩{product.discountedPrice.toLocaleString()}
              </div>
            </div>

            {/* 배송 정보 */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{t('common:processingDays')}</span>
                <span className="text-sm font-medium">{product.processingDays}{t('common:daysUnit')}</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-gray-600">{t('common:stockQuantity')}</span>
                <span className="text-sm font-medium">
                  {product.stockQuantity > 0 ? t('common:stockCount', { count: product.stockQuantity }) : t('common:outOfStock')}
                </span>
              </div>
            </div>

            {/* 네일 정보 */}
            <div className="mb-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('product:categoryType.shape')}
                  </label>
                  <div className="p-2 bg-gray-50 rounded text-sm">
                    {product.nailShape}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('product:categoryType.length')}
                  </label>
                  <div className="p-2 bg-gray-50 rounded text-sm">
                    {product.nailLength}
                  </div>
                </div>
              </div>
              
              {/* 네일 옵션 */}
              <div className="p-4 bg-[#FFF1F2] rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">{t('common:customizeOptions')}</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>{t('common:lengthCustom')}:</span>
                    <span>{product.nailOptions.lengthCustomizable ? t('common:available') : t('common:unavailable')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('common:shapeCustom')}:</span>
                    <span>{product.nailOptions.shapeCustomizable ? t('common:available') : t('common:unavailable')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('common:designCustom')}:</span>
                    <span>{product.nailOptions.designCustomizable ? t('common:available') : t('common:unavailable')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 수량 선택 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('common:quantity')}
              </label>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                  className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <span className="text-lg font-medium w-12 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(prev => Math.min(product.stockQuantity, prev + 1))}
                  className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50"
                  disabled={quantity >= product.stockQuantity}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
                <span className="text-sm text-gray-500">{t('common:stock')}: {t('common:stockCount', { count: product.stockQuantity })}</span>
              </div>
            </div>

            {/* 상품 설명 */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('common:description')}</h3>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>

            {/* 상품 통계 */}
            <div className="mb-8 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">{t('common:productInfo')}</h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-semibold text-gray-900">{product.stats.viewsCount}</div>
                  <div className="text-sm text-gray-600">{t('common:views')}</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-900">{product.stats.ordersCount}</div>
                  <div className="text-sm text-gray-600">{t('common:orderCount')}</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-900">{product.likesCount}</div>
                  <div className="text-sm text-gray-600">{t('common:likes')}</div>
                </div>
              </div>
            </div>

            {/* 액션 버튼들 */}
            <div className="space-y-3">
              <button
                onClick={handleBuyNow}
                disabled={!product.isInStock || product.stockQuantity === 0 || product.status !== 'active'}
                className="w-full bg-[#E85A6B] text-white py-4 rounded-lg font-semibold text-lg hover:bg-[#D14A5B] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {t('common:buyNow')}
              </button>
              
              <button
                onClick={handleAddToCart}
                disabled={addingToCart || !product.isInStock || product.stockQuantity === 0 || product.status !== 'active'}
                className="w-full border-2 border-[#E85A6B] text-[#E85A6B] py-4 rounded-lg font-semibold text-lg hover:bg-[#FFF1F2] disabled:border-gray-300 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {addingToCart ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#E85A6B] mr-2"></div>
                    {t('common:addingToCart')}
                  </div>
                ) : (
                  t('common:addToCart')
                )}
              </button>
            </div>

            {/* 재고 부족 안내 */}
            {(product.stockQuantity === 0 || product.status === 'outOfStock') && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-center font-medium">{t('common:outOfStockNotice')}</p>
              </div>
            )}
            
            {product.status === 'inactive' && (
              <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-gray-600 text-center font-medium">{t('common:inactiveProduct')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}