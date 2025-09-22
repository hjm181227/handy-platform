import { useState, useEffect } from 'react';
import { webApiService } from '../../../services/apiService';
import { useAlert } from '../../common';
import { 
  ProductionCapacity, 
  UpdateProductionCapacityRequest,
  AddExtraCapacityRequest 
} from '@handy-platform/shared';

interface ProductionManageProps {
  onGo: (path: string) => void;
}

export function ProductionManage({ onGo }: ProductionManageProps) {
  const { alert, error: showError, resetRetryCounter } = useAlert();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [capacity, setCapacity] = useState<ProductionCapacity | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // 모달 상태
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [extraModalOpen, setExtraModalOpen] = useState(false);

  // 월별 생산량 데이터 로드
  const loadCapacity = async (year: number, month: number) => {
    try {
      setLoading(true);
      setError('');

      const response = await webApiService.production.getProductionCapacity(year, month);
      setCapacity(response.data);
    } catch (err: any) {
      console.error('생산량 데이터 로드 실패:', err);
      setError('생산량 데이터를 불러오는데 실패했습니다.');
      setCapacity(null);
    } finally {
      setLoading(false);
    }
  };

  // 년도/월 변경시 데이터 로드
  useEffect(() => {
    loadCapacity(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth]);

  // 년도 선택 옵션
  const yearOptions = [];
  const currentYear = new Date().getFullYear();
  for (let year = currentYear; year <= currentYear + 1; year++) {
    yearOptions.push(year);
  }

  // 월 선택 옵션
  const monthOptions = [];
  for (let month = 1; month <= 12; month++) {
    monthOptions.push(month);
  }

  // 가동률에 따른 상태 색상
  const getStatusColor = (rate: number) => {
    if (rate >= 90) return 'bg-red-100 text-red-800 border-red-200';
    if (rate >= 70) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  const getStatusText = (rate: number) => {
    if (rate >= 90) return '포화';
    if (rate >= 70) return '혼잡';
    return '여유';
  };

  // 용량 조정 모달
  const AdjustModal = () => {
    const [adjustData, setAdjustData] = useState({
      maxOrders: capacity?.maxOrders || 0,
      reason: ''
    });
    const [adjustLoading, setAdjustLoading] = useState(false);

    const handleAdjust = async () => {
      if (!adjustData.reason.trim()) {
        await alert('조정 사유를 입력해주세요.', { variant: 'warning' });
        return;
      }

      if (adjustData.maxOrders === capacity?.maxOrders) {
        await alert('변경된 값이 없습니다.', { variant: 'warning' });
        return;
      }

      try {
        setAdjustLoading(true);
        await webApiService.production.updateProductionCapacity(
          selectedYear, 
          selectedMonth, 
          adjustData as UpdateProductionCapacityRequest
        );
        
        // 성공 시 재시도 카운터 리셋
        resetRetryCounter('생산량 조정');
        
        await alert('생산량이 조정되었습니다!', { 
          variant: 'success',
          title: '조정 완료'
        });
        setAdjustModalOpen(false);
        loadCapacity(selectedYear, selectedMonth); // 데이터 새로고침
      } catch (err: any) {
        const result = await showError(err, {
          title: '조정 실패',
          showRetry: true
        });
        
        // 재시도 선택 시 다시 실행
        if (result.action === 'retry') {
          await handleAdjust();
        }
      } finally {
        setAdjustLoading(false);
      }
    };

    if (!adjustModalOpen || !capacity) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
          <h3 className="text-lg font-bold mb-4">
            {selectedYear}년 {selectedMonth}월 생산량 조정
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                최대 주문 수
                <span className="text-xs text-gray-500 ml-2">
                  (현재: {capacity.maxOrders}개)
                </span>
              </label>
              <input
                type="number"
                min="1"
                max="2000"
                value={adjustData.maxOrders}
                onChange={(e) => setAdjustData(prev => ({
                  ...prev, 
                  maxOrders: parseInt(e.target.value) || 0
                }))}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="1-2000개"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">조정 사유 (필수)</label>
              <textarea
                value={adjustData.reason}
                onChange={(e) => setAdjustData(prev => ({...prev, reason: e.target.value}))}
                className="w-full border rounded-lg px-3 py-2"
                rows={3}
                placeholder="예: 할로윈 시즌 특별 주문 대비"
                maxLength={200}
              />
              <div className="text-xs text-gray-500 mt-1">
                {adjustData.reason.length}/200자
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setAdjustModalOpen(false)}
              disabled={adjustLoading}
              className="flex-1 border border-gray-300 rounded-lg py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              취소
            </button>
            <button
              onClick={handleAdjust}
              disabled={adjustLoading || !adjustData.reason.trim() || adjustData.maxOrders === capacity.maxOrders}
              className="flex-1 bg-blue-500 text-white rounded-lg py-2 hover:bg-blue-600 disabled:opacity-50"
            >
              {adjustLoading ? '조정 중...' : '조정 적용'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 추가 생산량 모달
  const ExtraModal = () => {
    const [extraData, setExtraData] = useState({
      extraCapacity: 50,
      reason: '',
      expiresAt: ''
    });
    const [extraLoading, setExtraLoading] = useState(false);

    const handleExtra = async () => {
      if (!extraData.reason.trim()) {
        await alert('추가 사유를 입력해주세요.', { variant: 'warning' });
        return;
      }

      try {
        setExtraLoading(true);
        const requestData: AddExtraCapacityRequest = {
          extraCapacity: extraData.extraCapacity,
          reason: extraData.reason
        };
        
        if (extraData.expiresAt) {
          requestData.expiresAt = new Date(extraData.expiresAt).toISOString();
        }

        await webApiService.production.addExtraCapacity(
          selectedYear, 
          selectedMonth, 
          requestData
        );
        
        // 성공 시 재시도 카운터 리셋
        resetRetryCounter('추가 생산량');
        
        await alert('추가 생산량이 적용되었습니다!', { 
          variant: 'success',
          title: '추가 적용 완료'
        });
        setExtraModalOpen(false);
        loadCapacity(selectedYear, selectedMonth); // 데이터 새로고침
      } catch (err: any) {
        const result = await showError(err, {
          title: '추가 적용 실패',
          showRetry: true
        });
        
        // 재시도 선택 시 다시 실행
        if (result.action === 'retry') {
          await handleExtra();
        }
      } finally {
        setExtraLoading(false);
      }
    };

    if (!extraModalOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
          <h3 className="text-lg font-bold mb-4">
            {selectedYear}년 {selectedMonth}월 추가 생산량
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">추가 생산량</label>
              <input
                type="number"
                min="1"
                max="1000"
                value={extraData.extraCapacity}
                onChange={(e) => setExtraData(prev => ({
                  ...prev, 
                  extraCapacity: parseInt(e.target.value) || 0
                }))}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="1-1000개"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">만료일 (선택사항)</label>
              <input
                type="datetime-local"
                value={extraData.expiresAt}
                onChange={(e) => setExtraData(prev => ({...prev, expiresAt: e.target.value}))}
                className="w-full border rounded-lg px-3 py-2"
                min={new Date().toISOString().slice(0, -8)} // 현재 시간 이후만 선택 가능
              />
              <p className="text-xs text-gray-500 mt-1">
                설정하지 않으면 영구적으로 적용됩니다
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">추가 사유 (필수)</label>
              <textarea
                value={extraData.reason}
                onChange={(e) => setExtraData(prev => ({...prev, reason: e.target.value}))}
                className="w-full border rounded-lg px-3 py-2"
                rows={3}
                placeholder="예: 할로윈 시즌 특별 주문 대비"
                maxLength={200}
              />
              <div className="text-xs text-gray-500 mt-1">
                {extraData.reason.length}/200자
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setExtraModalOpen(false)}
              disabled={extraLoading}
              className="flex-1 border border-gray-300 rounded-lg py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              취소
            </button>
            <button
              onClick={handleExtra}
              disabled={extraLoading || !extraData.reason.trim()}
              className="flex-1 bg-green-500 text-white rounded-lg py-2 hover:bg-green-600 disabled:opacity-50"
            >
              {extraLoading ? '적용 중...' : '추가 적용'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onGo('/seller/production')}
            className="text-gray-400 hover:text-gray-600"
          >
            ← 뒤로
          </button>
          <h1 className="text-2xl font-bold">생산량 관리</h1>
        </div>
      </div>

      {/* 년월 선택 */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center gap-4 mb-4">
          <h2 className="text-lg font-semibold">조회 기간 선택</h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">년도</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full border rounded-lg px-3 py-2"
            >
              {yearOptions.map(year => (
                <option key={year} value={year}>{year}년</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">월</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="w-full border rounded-lg px-3 py-2"
            >
              {monthOptions.map(month => (
                <option key={month} value={month}>{month}월</option>
              ))}
            </select>
          </div>
          
          <div className="md:col-span-2 flex items-end gap-2">
            <button
              onClick={() => setAdjustModalOpen(true)}
              disabled={!capacity || loading}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              용량 조정
            </button>
            <button
              onClick={() => setExtraModalOpen(true)}
              disabled={!capacity || loading}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              추가 생산량
            </button>
          </div>
        </div>
      </div>

      {/* 로딩 상태 */}
      {loading && (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* 에러 상태 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* 생산량 현황 카드 */}
      {capacity && (
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">
              {selectedYear}년 {selectedMonth}월 생산 현황
            </h2>
            <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(capacity.utilizationRate)}`}>
              {getStatusText(capacity.utilizationRate)}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {capacity.maxOrders}
              </div>
              <div className="text-sm text-gray-600">최대 주문수</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {capacity.currentOrders}
              </div>
              <div className="text-sm text-gray-600">현재 주문수</div>
            </div>
            
            <div className="text-center">
              <div className={`text-2xl font-bold ${capacity.remainingOrders <= 10 ? 'text-red-600' : 'text-green-600'}`}>
                {capacity.remainingOrders}
              </div>
              <div className="text-sm text-gray-600">남은 주문수</div>
            </div>
            
            <div className="text-center">
              <div className={`text-2xl font-bold ${getStatusColor(capacity.utilizationRate).includes('red') ? 'text-red-600' : 
                                                      getStatusColor(capacity.utilizationRate).includes('yellow') ? 'text-yellow-600' : 'text-green-600'}`}>
                {capacity.utilizationRate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">가동률</div>
            </div>
          </div>

          {/* 용량 구성 세부사항 */}
          {(capacity.baseCapacity || capacity.extraCapacity || capacity.boostAmount) && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-medium text-gray-700 mb-3">용량 구성</h3>
              <div className="space-y-2">
                {capacity.baseCapacity && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">기본 용량</span>
                    <span>{capacity.baseCapacity}개</span>
                  </div>
                )}
                {capacity.extraCapacity && (
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-600">추가 용량</span>
                    <span className="text-blue-600">+{capacity.extraCapacity}개</span>
                  </div>
                )}
                {capacity.boostAmount && (
                  <div className="flex justify-between text-sm">
                    <span className="text-red-600">부스트 용량</span>
                    <span className="text-red-600">+{capacity.boostAmount}개</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 추가 생산량 이력 */}
          {capacity.extraCapacityHistory && capacity.extraCapacityHistory.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-medium text-gray-700 mb-3">추가 생산량 이력</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {capacity.extraCapacityHistory.map((history, index) => (
                  <div key={index} className="bg-blue-50 rounded-lg p-3 text-sm">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-blue-800">+{history.amount}개</span>
                      <span className="text-gray-500">
                        {new Date(history.addedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-blue-700">{history.reason}</p>
                    {history.expiresAt && (
                      <p className="text-blue-600 text-xs mt-1">
                        만료: {new Date(history.expiresAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 모달들 */}
      <AdjustModal />
      <ExtraModal />
    </div>
  );
}