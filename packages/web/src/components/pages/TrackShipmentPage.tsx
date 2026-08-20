import { useEffect, useState } from 'react';
import { purchaseApiService } from '../../services/purchaseApiService';
import { PageHeader } from '../layout/PageHeader';
import { getTrackingUrl, findCarrier } from '../../utils/carrierTracking';

/**
 * 구매자 배송조회 화면 (/orders/:id/track).
 *
 * 기존에는 "배송조회" 버튼이 라우트 없는 경로로 이동해 주문상세가 대신
 * 렌더됐다. v1: 주문의 아이템별 송장번호·택배사를 표시하고 택배사 조회
 * 페이지로 연결한다 (실시간 배송 이력 API 연동은 후속 과제).
 */
export function TrackShipmentPage({ orderId, onGo }: { orderId: string; onGo: (to: string) => void }) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await purchaseApiService.getOrder(orderId);
        const data = (response as any)?.order || (response as any)?.data?.order || (response as any)?.data || response;
        setOrder(data);
      } catch (err) {
        console.error('Failed to load order for tracking:', err);
        setError('주문 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [orderId]);

  const items: any[] = order?.items || [];
  const trackedItems = items.filter(item => item.trackingNumber);
  // 아이템에 송장이 없으면 주문 레벨 송장으로 폴백
  const orderLevelTracking = !trackedItems.length && order?.trackingNumber
    ? [{ productName: '전체 주문', trackingNumber: order.trackingNumber, carrierCode: order.carrierCode, carrierName: order.carrierName }]
    : [];
  const rows = trackedItems.length ? trackedItems : orderLevelTracking;

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="배송조회" onBack={() => onGo('/my/orders')} />

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="text-center py-16 px-6">
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 text-sm border rounded-lg">다시 시도</button>
        </div>
      ) : (
        <div className="p-4 space-y-4">
          <div className="bg-white rounded-lg border p-4">
            <p className="text-xs text-gray-500">주문번호</p>
            <p className="text-sm font-semibold text-gray-900">{order?.orderNumber || orderId}</p>
          </div>

          {rows.length === 0 ? (
            <div className="bg-white rounded-lg border p-8 text-center">
              <p className="text-base font-medium text-gray-600 mb-1">아직 송장이 등록되지 않았습니다</p>
              <p className="text-sm text-gray-400">판매자가 상품을 발송하면 송장번호가 표시됩니다.</p>
            </div>
          ) : (
            rows.map((item: any, index: number) => {
              const carrier = findCarrier(item.carrierCode, item.carrierName);
              const url = getTrackingUrl(item.carrierCode, item.carrierName, item.trackingNumber);
              return (
                <div key={index} className="bg-white rounded-lg border p-4">
                  <p className="text-sm font-medium text-gray-900 mb-2">{item.productName || item.name || '상품'}</p>
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <p className="text-gray-500">{carrier?.name || item.carrierName || '택배사'}</p>
                      <p className="font-mono text-gray-900">{item.trackingNumber}</p>
                    </div>
                    {url ? (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-600"
                      >
                        배송 추적
                      </a>
                    ) : (
                      <button
                        onClick={() => {
                          navigator.clipboard?.writeText(item.trackingNumber);
                          alert('송장번호가 복사되었습니다. 택배사 홈페이지에서 조회해주세요.');
                        }}
                        className="px-4 py-2 border rounded-lg text-sm"
                      >
                        송장번호 복사
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}

          <button
            onClick={() => onGo(`/orders/${orderId}`)}
            className="w-full py-3 border rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            주문 상세 보기
          </button>
        </div>
      )}
    </div>
  );
}
