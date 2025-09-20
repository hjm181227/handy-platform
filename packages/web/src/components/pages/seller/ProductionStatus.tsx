import { useState, useEffect } from 'react';
import { webApiService } from '../../../services/apiService';
import { ProductionHistory } from '@handy-platform/shared';

interface ProductionStatusProps {
  onGo: (path: string) => void;
}

export function ProductionStatus({ onGo }: ProductionStatusProps) {
  const [historyData, setHistoryData] = useState<ProductionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');

  // 생산 히스토리 로드
  const loadProductionHistory = async (year: number) => {
    try {
      setLoading(true);
      setError('');

      const response = await webApiService.production.getProductionHistory(year);
      setHistoryData(response.data);
    } catch (err: any) {
      console.error('생산 히스토리 로드 실패:', err);
      setError('생산 현황을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProductionHistory(selectedYear);
  }, [selectedYear]);

  // 월별 데이터 집계
  const getMonthlyStats = () => {
    const monthlyStats = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const monthData = historyData.filter(item => item.month === month);
      
      const totalOrders = monthData.reduce((sum, item) => sum + item.totalOrders, 0);
      const totalCapacity = monthData.reduce((sum, item) => sum + item.totalCapacity, 0);
      const utilizationRate = totalCapacity > 0 ? (totalOrders / totalCapacity) * 100 : 0;
      
      return {
        month,
        totalOrders,
        totalCapacity,
        utilizationRate,
        baseCapacity: monthData.reduce((sum, item) => sum + item.baseCapacity, 0),
        extraCapacity: monthData.reduce((sum, item) => sum + item.extraCapacity, 0),
        boostCapacity: monthData.reduce((sum, item) => sum + item.boostCapacity, 0),
      };
    });

    return monthlyStats;
  };

  // 연간 요약 통계
  const getYearlySummary = () => {
    const totalOrders = historyData.reduce((sum, item) => sum + item.totalOrders, 0);
    const totalCapacity = historyData.reduce((sum, item) => sum + item.totalCapacity, 0);
    const avgUtilization = totalCapacity > 0 ? (totalOrders / totalCapacity) * 100 : 0;
    
    const peakMonth = historyData.reduce((peak, current) => 
      current.totalOrders > peak.totalOrders ? current : peak, 
      historyData[0] || { totalOrders: 0, month: 1 }
    );

    return {
      totalOrders,
      totalCapacity,
      avgUtilization,
      peakMonth: peakMonth.month,
      peakOrders: peakMonth.totalOrders
    };
  };

  const monthlyStats = getMonthlyStats();
  const yearlySummary = getYearlySummary();
  const currentYear = new Date().getFullYear();
  const availableYears = Array.from({ length: 3 }, (_, i) => currentYear - i);

  // 가동률에 따른 색상
  const getUtilizationColor = (rate: number) => {
    if (rate >= 90) return 'text-red-600 bg-red-100';
    if (rate >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getUtilizationBarColor = (rate: number) => {
    if (rate >= 90) return 'bg-red-500';
    if (rate >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">생산 현황을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => loadProductionHistory(selectedYear)}
          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
        >
          다시 시도
        </button>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold">생산 현황</h1>
        </div>
        
        <div className="flex gap-3">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="border rounded-lg px-3 py-2"
          >
            {availableYears.map(year => (
              <option key={year} value={year}>{year}년</option>
            ))}
          </select>
          
          <div className="flex border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('chart')}
              className={`px-3 py-2 text-sm ${
                viewMode === 'chart' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              차트
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-2 text-sm ${
                viewMode === 'table' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              표
            </button>
          </div>
        </div>
      </div>

      {/* 연간 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="text-gray-600 text-sm mb-1">총 주문수</div>
          <div className="text-2xl font-bold text-blue-600">{yearlySummary.totalOrders.toLocaleString()}개</div>
        </div>
        
        <div className="bg-white rounded-lg border p-4">
          <div className="text-gray-600 text-sm mb-1">총 생산량</div>
          <div className="text-2xl font-bold text-green-600">{yearlySummary.totalCapacity.toLocaleString()}개</div>
        </div>
        
        <div className="bg-white rounded-lg border p-4">
          <div className="text-gray-600 text-sm mb-1">평균 가동률</div>
          <div className={`text-2xl font-bold ${yearlySummary.avgUtilization >= 70 ? 'text-red-600' : 'text-green-600'}`}>
            {yearlySummary.avgUtilization.toFixed(1)}%
          </div>
        </div>
        
        <div className="bg-white rounded-lg border p-4">
          <div className="text-gray-600 text-sm mb-1">최고 주문 월</div>
          <div className="text-2xl font-bold text-purple-600">
            {yearlySummary.peakMonth}월
            <div className="text-sm font-normal text-gray-600">
              {yearlySummary.peakOrders.toLocaleString()}개
            </div>
          </div>
        </div>
      </div>

      {/* 차트/표 뷰 */}
      <div className="bg-white rounded-lg border p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">{selectedYear}년 월별 생산 현황</h2>
          <p className="text-gray-600 text-sm">월별 주문량과 생산량을 비교하여 가동률을 확인하세요</p>
        </div>

        {viewMode === 'chart' ? (
          // 차트 뷰
          <div className="space-y-4">
            {monthlyStats.map((stat, index) => (
              <div key={stat.month} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{stat.month}월</span>
                  <div className="text-sm text-gray-600">
                    {stat.totalOrders}/{stat.totalCapacity}개 ({stat.utilizationRate.toFixed(1)}%)
                  </div>
                </div>
                
                <div className="relative bg-gray-200 rounded-full h-6">
                  <div
                    className={`absolute left-0 top-0 h-6 rounded-full transition-all duration-300 ${getUtilizationBarColor(stat.utilizationRate)}`}
                    style={{ width: `${Math.min(stat.utilizationRate, 100)}%` }}
                  ></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-medium text-white">
                      {stat.utilizationRate.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* 용량 구성 상세 */}
                {(stat.extraCapacity > 0 || stat.boostCapacity > 0) && (
                  <div className="text-xs text-gray-500 ml-2">
                    기본: {stat.baseCapacity}개
                    {stat.extraCapacity > 0 && ` + 추가: ${stat.extraCapacity}개`}
                    {stat.boostCapacity > 0 && ` + 부스트: ${stat.boostCapacity}개`}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          // 표 뷰
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 font-medium">월</th>
                  <th className="text-right p-3 font-medium">주문수</th>
                  <th className="text-right p-3 font-medium">생산량</th>
                  <th className="text-right p-3 font-medium">가동률</th>
                  <th className="text-right p-3 font-medium">기본</th>
                  <th className="text-right p-3 font-medium">추가</th>
                  <th className="text-right p-3 font-medium">부스트</th>
                </tr>
              </thead>
              <tbody>
                {monthlyStats.map((stat, index) => (
                  <tr key={stat.month} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="p-3 font-medium">{stat.month}월</td>
                    <td className="text-right p-3">{stat.totalOrders.toLocaleString()}</td>
                    <td className="text-right p-3">{stat.totalCapacity.toLocaleString()}</td>
                    <td className="text-right p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUtilizationColor(stat.utilizationRate)}`}>
                        {stat.utilizationRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="text-right p-3 text-gray-600">{stat.baseCapacity.toLocaleString()}</td>
                    <td className="text-right p-3 text-blue-600">
                      {stat.extraCapacity > 0 ? stat.extraCapacity.toLocaleString() : '-'}
                    </td>
                    <td className="text-right p-3 text-red-600">
                      {stat.boostCapacity > 0 ? stat.boostCapacity.toLocaleString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 데이터 없음 상태 */}
      {historyData.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <div className="text-gray-400 text-5xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">생산 데이터가 없습니다</h3>
          <p className="text-gray-500 mb-4">
            {selectedYear}년에 대한 생산 히스토리가 없습니다.
          </p>
          <button
            onClick={() => onGo('/seller/production/settings')}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            생산 설정하기
          </button>
        </div>
      )}

      {/* 가동률 범례 */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="font-medium mb-3">가동률 기준</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>양호 (70% 미만)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span>주의 (70% ~ 90%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>과부하 (90% 이상)</span>
          </div>
        </div>
      </div>
    </div>
  );
}