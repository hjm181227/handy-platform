import { useState, useEffect } from 'react';
import { webApiService } from '../../../services/apiService';
import { SellerLayout } from '../../layout/SellerLayout';
import { useAlert } from '../../common';
import { 
  ProductionCapacity, 
  ProductionSettings,
  ProductionBoostRequest 
} from '@handy-platform/shared';

interface ProductionDashboardProps {
  onGo: (path: string) => void;
}

export function ProductionDashboard({ onGo }: ProductionDashboardProps) {
  const { alert, error: showError, resetRetryCounter } = useAlert();
  const [currentCapacity, setCurrentCapacity] = useState<ProductionCapacity | null>(null);
  const [settings, setSettings] = useState<ProductionSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // 부스트 모달 상태
  const [boostModalOpen, setBoostModalOpen] = useState(false);
  const [boostLoading, setBoostLoading] = useState(false);
  const [boostData, setBoostData] = useState({
    boostAmount: 100,
    duration: 7,
    reason: ''
  });

  // 현재 생산 현황 로드
  const loadProductionData = async () => {
    try {
      setLoading(true);
      setError('');

      const [capacityResponse, settingsResponse] = await Promise.all([
        webApiService.production.getCurrentCapacity(),
        webApiService.production.getProductionSettings()
      ]);

      setCurrentCapacity(capacityResponse.data);
      setSettings(settingsResponse.productionSettings);
    } catch (err: any) {
      console.error('생산 데이터 로드 실패:', err);
      setError('생산 현황을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProductionData();
  }, []);

  // 가동률에 따른 색상 결정
  const getUtilizationColor = (rate: number) => {
    if (rate >= 90) return 'text-red-600';
    if (rate >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getUtilizationBgColor = (rate: number) => {
    if (rate >= 90) return 'bg-red-100';
    if (rate >= 70) return 'bg-yellow-100';
    return 'bg-green-100';
  };

  // 긴급 생산량 부스트 모달
  const BoostModal = () => {
    const [boostData, setBoostData] = useState({
      boostAmount: 30,
      reason: '',
      duration: 7
    });
    const [boostLoading, setBoostLoading] = useState(false);

    const handleBoost = async (disableAutoRetry: boolean = false) => {
      if (!boostData.reason.trim()) {
        await alert('부스트 사유를 입력해주세요.', { variant: 'warning' });
        return;
      }

      try {
        setBoostLoading(true);
        
        // API 호출 (재시도 시 자동 재시도는 AlertService에서 관리)
        await webApiService.production.applyProductionBoost(boostData as ProductionBoostRequest);
        
        // 성공 시 재시도 카운터 리셋
        resetRetryCounter('부스트 적용');
        
        await alert('생산량 부스트가 적용되었습니다!', { 
          variant: 'success',
          title: '부스트 적용 완료'
        });
        
        setBoostModalOpen(false);
        loadProductionData(); // 데이터 새로고침
      } catch (err: any) {
        const result = await showError(err, {
          title: '부스트 적용 실패',
          showRetry: true
        });
        
        // 재시도 선택 시 자동 재시도 비활성화하고 다시 실행
        if (result.action === 'retry') {
          await handleBoost(true);
        }
      } finally {
        setBoostLoading(false);
      }
    };

    if (!boostModalOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-auto max-h-[90vh] overflow-y-auto">
          {/* 모달 헤더 */}
          <div className="bg-red-50 px-6 py-4 border-b border-red-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-red-900">긴급 생산량 부스트</h3>
                  <p className="text-sm text-red-700">임시적으로 생산량을 증가시킵니다</p>
                </div>
              </div>
              <button
                onClick={() => setBoostModalOpen(false)}
                disabled={boostLoading}
                className="text-red-400 hover:text-red-600 transition-colors duration-200 disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* 모달 본문 */}
          <div className="p-6 space-y-6">
            {/* 부스트량 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
                <label className="block text-sm font-semibold text-gray-900">부스트량</label>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={boostData.boostAmount}
                  onChange={(e) => setBoostData(prev => ({...prev, boostAmount: parseInt(e.target.value) || 0}))}
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-right font-semibold focus:border-red-500 focus:ring-0 transition-colors duration-200"
                  placeholder="30"
                />
                <div className="absolute right-12 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">개</div>
              </div>
              <p className="text-xs text-gray-500">기존 생산량에 추가로 더할 수량 (1-500개)</p>
            </div>
            
            {/* 지속 기간 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <label className="block text-sm font-semibold text-gray-900">지속 기간</label>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={boostData.duration}
                  onChange={(e) => setBoostData(prev => ({...prev, duration: parseInt(e.target.value) || 0}))}
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-right font-semibold focus:border-red-500 focus:ring-0 transition-colors duration-200"
                  placeholder="7"
                />
                <div className="absolute right-12 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">일</div>
              </div>
              <p className="text-xs text-gray-500">부스트가 적용될 기간 (1-30일)</p>
            </div>
            
            {/* 부스트 사유 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <label className="block text-sm font-semibold text-gray-900">
                  부스트 사유 <span className="text-red-500">*</span>
                </label>
              </div>
              <textarea
                value={boostData.reason}
                onChange={(e) => setBoostData(prev => ({...prev, reason: e.target.value}))}
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 resize-none focus:border-red-500 focus:ring-0 transition-colors duration-200"
                rows={3}
                placeholder="예: 예상치 못한 주문 폭주로 인한 긴급 대응"
                maxLength={200}
              />
              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-500">관리자 승인을 위한 상세한 사유를 작성해주세요</p>
                <span className={`text-xs font-medium ${
                  boostData.reason.length > 180 
                    ? 'text-red-500' 
                    : boostData.reason.length > 150 
                      ? 'text-amber-500' 
                      : 'text-gray-500'
                }`}>
                  {boostData.reason.length}/200자
                </span>
              </div>
            </div>

            {/* 예상 효과 안내 */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-amber-800 font-medium">예상 효과</p>
                  <p className="text-amber-700 text-sm mt-1">
                    {boostData.duration}일 동안 월간 생산량이 <span className="font-semibold">+{boostData.boostAmount}개</span> 증가합니다. 
                    이는 임시 조치이며 기간 종료 후 자동으로 해제됩니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* 모달 푸터 */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-xl">
            <div className="flex gap-3">
              <button
                onClick={() => setBoostModalOpen(false)}
                disabled={boostLoading}
                className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2.5 font-medium hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                취소
              </button>
              <button
                onClick={handleBoost}
                disabled={boostLoading || !boostData.reason.trim()}
                className="flex-1 bg-red-600 text-white rounded-lg py-2.5 font-medium hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {boostLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    적용 중...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                    </svg>
                    부스트 적용
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };



  const utilizationRate = currentCapacity?.utilizationRate || 0;

  return (
    <SellerLayout title="생산 관리" onGo={onGo}>
      {loading ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">생산 현황 로딩 중</h3>
            <p className="text-gray-600">잠시만 기다려주세요...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center max-w-md w-full">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">오류 발생</h3>
            <p className="text-red-600 mb-6 leading-relaxed">{error}</p>
            <button
              onClick={loadProductionData}
              className="bg-red-600 text-white px-6 py-2.5 rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium shadow-sm"
            >
              다시 시도
            </button>
          </div>
        </div>
      ) : (
      <div className="space-y-6">
        {/* 상단 액션 버튼들 */}
        <div className="flex justify-end gap-3">
          <button
            onClick={async () => {
              const reason = await prompt('긴급 생산량 부스트 사유를 입력해주세요', {
                title: '긴급 생산량 부스트',
                placeholder: '부스트가 필요한 이유를 상세히 입력해주세요...',
                multiline: true,
                maxLength: 500,
                required: true,
                confirmLabel: '부스트 적용',
                cancelLabel: '취소'
              });
              
              if (reason) {
                try {
                  setBoostLoading(true);
                  await webApiService.production.applyProductionBoost({
                    reason,
                    requestedBy: 'seller',
                    urgency: 'high',
                    duration: 7
                  } as ProductionBoostRequest);
                  
                  await alert('생산량 부스트가 적용되었습니다!', { 
                    variant: 'success',
                    title: '부스트 적용 완료'
                  });
                  loadProductionData(); // 데이터 새로고침
                } catch (err: any) {
                  await showError(err, {
                    title: '부스트 적용 실패',
                    showRetry: true
                  });
                } finally {
                  setBoostLoading(false);
                }
              }
            }}
            disabled={boostLoading}
            className="bg-red-600 text-white px-4 py-2.5 rounded-lg hover:bg-red-700 transition-colors duration-200 text-sm font-medium shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
            </svg>
            긴급 부스트
          </button>
          <button
            onClick={() => onGo('/seller/production/settings')}
            className="bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium shadow-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            설정
          </button>
        </div>
      
      {/* 메인 콘텐츠 */}

        {/* 현재 월 생산 현황 카드 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {new Date().getFullYear()}년 {new Date().getMonth() + 1}월 생산 현황
                </h2>
                <p className="text-sm text-gray-600 mt-1">현재 월 생산 용량 및 가동률</p>
              </div>
              {settings?.vacationMode && (
                <div className="bg-orange-100 text-orange-800 px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  휴가 모드
                </div>
              )}
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* 가동률 원형 차트 */}
              <div className="lg:col-span-1">
                <div className="flex flex-col items-center">
                  <div className="relative w-36 h-36 mb-4">
                    {/* 원형 진행률 표시 */}
                    <svg className="w-full h-full" viewBox="0 0 42 42">
                      <circle
                        cx="21"
                        cy="21"
                        r="15.915"
                        fill="transparent"
                        stroke="#e5e7eb"
                        strokeWidth="2"
                      />
                      <circle
                        cx="21"
                        cy="21"
                        r="15.915"
                        fill="transparent"
                        stroke={utilizationRate >= 90 ? '#dc2626' : utilizationRate >= 70 ? '#d97706' : '#059669'}
                        strokeWidth="2"
                        strokeDasharray={`${utilizationRate} ${100 - utilizationRate}`}
                        strokeDashoffset="25"
                        strokeLinecap="round"
                        className="transition-all duration-300"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className={`text-3xl font-bold ${getUtilizationColor(utilizationRate)}`}>
                        {utilizationRate.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-500 font-medium">가동률</div>
                    </div>
                  </div>
                  
                  <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                    utilizationRate >= 90 ? 'bg-red-100 text-red-800' :
                    utilizationRate >= 70 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {utilizationRate >= 90 ? '🔴 높음' :
                     utilizationRate >= 70 ? '🟡 보통' :
                     '🟢 여유'}
                  </div>
                </div>
              </div>

              {/* 상세 통계 */}
              <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* 최대 주문수 */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-900">최대 주문수</p>
                        <p className="text-xs text-blue-700">월간 처리 가능량</p>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-blue-900">
                      {currentCapacity?.maxOrders || 0}
                      <span className="text-sm font-medium ml-1">개</span>
                    </p>
                  </div>

                  {/* 현재 주문수 */}
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-purple-900">현재 주문수</p>
                        <p className="text-xs text-purple-700">진행 중인 주문</p>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-purple-900">
                      {currentCapacity?.currentOrders || 0}
                      <span className="text-sm font-medium ml-1">개</span>
                    </p>
                  </div>

                  {/* 남은 주문수 */}
                  <div className={`${currentCapacity && currentCapacity.remainingOrders <= 10 ? 'bg-red-50' : 'bg-green-50'} rounded-lg p-4 sm:col-span-2`}>
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-8 h-8 ${currentCapacity && currentCapacity.remainingOrders <= 10 ? 'bg-red-100' : 'bg-green-100'} rounded-lg flex items-center justify-center`}>
                        <svg className={`w-4 h-4 ${currentCapacity && currentCapacity.remainingOrders <= 10 ? 'text-red-600' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${currentCapacity && currentCapacity.remainingOrders <= 10 ? 'text-red-900' : 'text-green-900'}`}>
                          남은 주문 가능수
                        </p>
                        <p className={`text-xs ${currentCapacity && currentCapacity.remainingOrders <= 10 ? 'text-red-700' : 'text-green-700'}`}>
                          {currentCapacity && currentCapacity.remainingOrders <= 10 ? '주의: 용량 부족' : '여유 있음'}
                        </p>
                      </div>
                    </div>
                    <p className={`text-2xl font-bold ${currentCapacity && currentCapacity.remainingOrders <= 10 ? 'text-red-900' : 'text-green-900'}`}>
                      {currentCapacity?.remainingOrders || 0}
                      <span className="text-sm font-medium ml-1">개</span>
                    </p>
                  </div>
                </div>

                {/* 용량 상세 분석 */}
                {currentCapacity?.baseCapacity && currentCapacity.baseCapacity !== currentCapacity.maxOrders && (
                  <div className="border-t border-gray-100 pt-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">용량 상세 분석</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600 flex items-center gap-2">
                          <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                          기본 용량
                        </span>
                        <span className="font-semibold text-gray-900">{currentCapacity.baseCapacity}개</span>
                      </div>
                      
                      {currentCapacity.extraCapacity && (
                        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                          <span className="text-sm text-blue-700 flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            추가 용량
                          </span>
                          <span className="font-semibold text-blue-700">+{currentCapacity.extraCapacity}개</span>
                        </div>
                      )}
                      
                      {currentCapacity.boostAmount && (
                        <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                          <span className="text-sm text-red-700 flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            부스트 용량
                          </span>
                          <span className="font-semibold text-red-700">+{currentCapacity.boostAmount}개</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 빠른 액션 카드들 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">빠른 작업</h2>
            <p className="text-sm text-gray-600 mt-1">자주 사용하는 생산 관리 기능들</p>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => onGo('/seller/production/settings')}
                className="group bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 rounded-xl p-4 transition-all duration-200 text-left"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-100 group-hover:bg-blue-200 rounded-lg flex items-center justify-center transition-colors duration-200">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-900">생산 설정</h3>
                    <p className="text-xs text-gray-600 group-hover:text-blue-700">주간/월간 생산량 설정</p>
                  </div>
                </div>
                <div className="flex items-center text-xs text-gray-500 group-hover:text-blue-600">
                  <span>설정 바로가기</span>
                  <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>

              <button
                onClick={() => onGo('/seller/production/manage')}
                className="group bg-gray-50 hover:bg-green-50 border border-gray-200 hover:border-green-200 rounded-xl p-4 transition-all duration-200 text-left"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-100 group-hover:bg-green-200 rounded-lg flex items-center justify-center transition-colors duration-200">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 group-hover:text-green-900">생산량 관리</h3>
                    <p className="text-xs text-gray-600 group-hover:text-green-700">월별 용량 조정</p>
                  </div>
                </div>
                <div className="flex items-center text-xs text-gray-500 group-hover:text-green-600">
                  <span>관리 바로가기</span>
                  <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>

              <button
                onClick={() => onGo('/seller/production/status')}
                className="group bg-gray-50 hover:bg-purple-50 border border-gray-200 hover:border-purple-200 rounded-xl p-4 transition-all duration-200 text-left"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-purple-100 group-hover:bg-purple-200 rounded-lg flex items-center justify-center transition-colors duration-200">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 group-hover:text-purple-900">생산 현황</h3>
                    <p className="text-xs text-gray-600 group-hover:text-purple-700">히스토리 및 통계</p>
                  </div>
                </div>
                <div className="flex items-center text-xs text-gray-500 group-hover:text-purple-600">
                  <span>현황 보기</span>
                  <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>

              <button
                onClick={async () => {
                  const reason = await prompt('긴급 생산량 부스트 사유를 입력해주세요', {
                    title: '긴급 생산량 부스트',
                    placeholder: '부스트가 필요한 이유를 상세히 입력해주세요...',
                    multiline: true,
                    maxLength: 500,
                    required: true,
                    confirmLabel: '부스트 적용',
                    cancelLabel: '취소'
                  });
                  
                  if (reason) {
                    try {
                      setBoostLoading(true);
                      await webApiService.production.applyProductionBoost({
                        reason,
                        requestedBy: 'seller',
                        urgency: 'high',
                        duration: 7
                      } as ProductionBoostRequest);
                      
                      await alert('생산량 부스트가 적용되었습니다!', { 
                        variant: 'success',
                        title: '부스트 적용 완료'
                      });
                      loadProductionData(); // 데이터 새로고침
                    } catch (err: any) {
                      await showError(err, {
                        title: '부스트 적용 실패',
                        showRetry: true
                      });
                    } finally {
                      setBoostLoading(false);
                    }
                  }
                }}
                disabled={boostLoading}
                className="group bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-300 rounded-xl p-4 transition-all duration-200 text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-red-100 group-hover:bg-red-200 rounded-lg flex items-center justify-center transition-colors duration-200">
                    <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-900 group-hover:text-red-800">긴급 부스트</h3>
                    <p className="text-xs text-red-700 group-hover:text-red-600">임시 생산량 증가</p>
                  </div>
                </div>
                <div className="flex items-center text-xs text-red-600 group-hover:text-red-700">
                  <span>부스트 적용</span>
                  <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* 특별 안내사항 */}
        {settings?.specialNotice && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-blue-50 px-6 py-4 border-b border-blue-200">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <h3 className="font-semibold text-blue-900">특별 안내사항</h3>
              </div>
              <p className="text-sm text-blue-800 mt-1">고객에게 전달되는 중요 공지사항</p>
            </div>
            <div className="p-6">
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                <p className="text-blue-800 leading-relaxed">{settings.specialNotice}</p>
              </div>
            </div>
          </div>
        )}

        {/* 부스트 모달 */}
        <BoostModal />
      </div>
      )}
    </SellerLayout>
  );
}