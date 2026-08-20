import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { webApiService } from '../../../services/apiService';
import { SellerLayout } from '../../layout/SellerLayout';
import { ProductionHistory } from '@handy-platform/shared';
import { FaChartBar, FaTable, FaArrowLeft } from 'react-icons/fa';

interface ProductionStatusProps {
  onGo: (path: string) => void;
}

export function ProductionStatus({ onGo }: ProductionStatusProps) {
  const { t } = useTranslation('seller');
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
      setHistoryData(response.data.history || []);
    } catch (err: any) {
      console.error('생산 히스토리 로드 실패:', err);
      setError(t('production.loadFailed'));
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

      const totalOrders = monthData.reduce((sum, item) => sum + (item.currentOrders || 0), 0);
      const totalCapacity = monthData.reduce((sum, item) => sum + (item.maxOrders || 0), 0);
      const utilizationRate = monthData[0]?.utilizationRate || 0;

      return {
        month,
        totalOrders,
        totalCapacity,
        utilizationRate,
      };
    });

    return monthlyStats;
  };

  // 연간 요약 통계
  const getYearlySummary = () => {
    const totalOrders = historyData.reduce((sum, item) => sum + (item.currentOrders || 0), 0);
    const totalCapacity = historyData.reduce((sum, item) => sum + (item.maxOrders || 0), 0);
    const avgUtilization = totalCapacity > 0 ? (totalOrders / totalCapacity) * 100 : 0;

    const peakMonth = historyData.reduce(
      (peak, current) =>
        (current.currentOrders || 0) > (peak.currentOrders || 0) ? current : peak,
      historyData[0] || { currentOrders: 0, month: 1 }
    );

    return {
      totalOrders,
      totalCapacity,
      avgUtilization,
      peakMonth: peakMonth.month || 1,
      peakOrders: peakMonth.currentOrders || 0
    };
  };

  const monthlyStats = getMonthlyStats();
  const yearlySummary = getYearlySummary();
  const currentYear = new Date().getFullYear();
  const availableYears = Array.from({ length: 3 }, (_, i) => currentYear - i);

  // 가동률에 따른 색상
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

  const getUtilizationBarColor = (rate: number) => {
    if (rate >= 90) return 'bg-red-500';
    if (rate >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <SellerLayout title={t('production.title')} onGo={onGo}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-50 rounded-full mb-6">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand border-t-transparent"></div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('production.loading')}</h3>
            <p className="text-gray-600">{t('common:pleaseWait')}</p>
          </div>
        </div>
      </SellerLayout>
    );
  }

  if (error) {
    return (
      <SellerLayout title={t('production.title')} onGo={onGo}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="bg-white rounded-xl shadow-sm border border-line p-8 text-center max-w-md w-full">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('production.errorOccurred')}</h3>
            <p className="text-red-600 mb-6">{error}</p>
            <button
              onClick={() => loadProductionHistory(selectedYear)}
              className="bg-red-600 text-white px-6 py-2.5 rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              {t('common:retry')}
            </button>
          </div>
        </div>
      </SellerLayout>
    );
  }

  return (
    <SellerLayout title={t('production.title')} onGo={onGo}>
      <div className="space-y-6">
        {/* 페이지 헤더 */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => onGo('/seller/production')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <FaArrowLeft className="w-4 h-4" />
            <span className="font-medium">{t('production.backToProduction')}</span>
          </button>

          <div className="flex items-center gap-3">
            {/* 연도 선택 */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="border border-line-strong rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{t('production.yearLabel', { year })}</option>
              ))}
            </select>

            {/* 뷰 모드 전환 */}
            <div className="flex border border-line-strong rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('chart')}
                className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
                  viewMode === 'chart'
                    ? 'bg-brand text-white'
                    : 'bg-white text-gray-700 hover:bg-surface'
                }`}
              >
                <FaChartBar className="w-4 h-4" />
                {t('production.chart')}
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 border-l border-line-strong ${
                  viewMode === 'table'
                    ? 'bg-brand text-white'
                    : 'bg-white text-gray-700 hover:bg-surface'
                }`}
              >
                <FaTable className="w-4 h-4" />
                {t('production.table')}
              </button>
            </div>
          </div>
        </div>

        {/* 연간 요약 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-line p-6 hover:shadow-md transition-shadow">
            <div className="text-sm text-gray-600 mb-2">{t('production.totalOrders')}</div>
            <div className="text-3xl font-bold text-brand [font-variant-numeric:tabular-nums]">{yearlySummary.totalOrders.toLocaleString()}</div>
            <div className="text-sm text-muted mt-1">{t('production.itemUnit')}</div>
          </div>

          <div className="bg-white rounded-xl border border-line p-6 hover:shadow-md transition-shadow">
            <div className="text-sm text-gray-600 mb-2">{t('production.totalCapacity')}</div>
            <div className="text-3xl font-bold text-green-600 [font-variant-numeric:tabular-nums]">{yearlySummary.totalCapacity.toLocaleString()}</div>
            <div className="text-sm text-muted mt-1">{t('production.itemUnit')}</div>
          </div>

          <div className="bg-white rounded-xl border border-line p-6 hover:shadow-md transition-shadow">
            <div className="text-sm text-gray-600 mb-2">{t('production.avgUtilization')}</div>
            <div className={`text-3xl font-bold ${getUtilizationColor(yearlySummary.avgUtilization)}`}>
              {yearlySummary.avgUtilization.toFixed(1)}%
            </div>
            <div className="text-sm text-muted mt-1">
              {yearlySummary.avgUtilization >= 90 ? t('production.veryHigh') : yearlySummary.avgUtilization >= 70 ? t('production.high') : t('production.normal')}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-line p-6 hover:shadow-md transition-shadow">
            <div className="text-sm text-gray-600 mb-2">{t('production.peakMonth')}</div>
            <div className="text-3xl font-bold text-brand [font-variant-numeric:tabular-nums]">{t('production.monthLabel', { month: yearlySummary.peakMonth })}</div>
            <div className="text-sm text-muted mt-1">
              {t('production.ordersUnit', { count: yearlySummary.peakOrders.toLocaleString() })}
            </div>
          </div>
        </div>

        {/* 차트/표 뷰 */}
        <div className="bg-white rounded-xl border border-line p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">{t('production.monthlyStatus', { year: selectedYear })}</h2>
            <p className="text-gray-600">{t('production.monthlyStatusDesc')}</p>
          </div>

          {viewMode === 'chart' ? (
            // 차트 뷰
            <div className="space-y-4">
              {monthlyStats.map((stat) => (
                <div key={stat.month} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-900">{t('production.monthLabel', { month: stat.month })}</span>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">{stat.totalOrders.toLocaleString()}</span>
                      <span className="text-gray-400"> / </span>
                      <span>{stat.totalCapacity.toLocaleString()}{t('production.itemUnit')}</span>
                      <span className={`ml-2 font-semibold ${getUtilizationColor(stat.utilizationRate)}`}>
                        ({stat.utilizationRate.toFixed(1)}%)
                      </span>
                    </div>
                  </div>

                  <div className="relative bg-surface-strong rounded-full h-8 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${getUtilizationBarColor(stat.utilizationRate)}`}
                      style={{ width: `${Math.min(stat.utilizationRate, 100)}%` }}
                    ></div>
                    {stat.utilizationRate > 0 && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold text-white drop-shadow">
                          {stat.utilizationRate.toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // 표 뷰
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-line">
                    <th className="text-left p-4 font-semibold text-gray-900">{t('production.monthHeader')}</th>
                    <th className="text-right p-4 font-semibold text-gray-900">{t('production.ordersHeader')}</th>
                    <th className="text-right p-4 font-semibold text-gray-900">{t('production.capacityHeader')}</th>
                    <th className="text-right p-4 font-semibold text-gray-900">{t('production.utilizationHeader')}</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyStats.map((stat, index) => (
                    <tr
                      key={stat.month}
                      className={`border-b border-gray-100 hover:bg-surface transition-colors ${
                        index % 2 === 0 ? 'bg-white' : 'bg-surface'
                      }`}
                    >
                      <td className="p-4 font-medium text-gray-900">{t('production.monthLabel', { month: stat.month })}</td>
                      <td className="text-right p-4 text-gray-700">{stat.totalOrders.toLocaleString()}{t('production.itemUnit')}</td>
                      <td className="text-right p-4 text-gray-700">{stat.totalCapacity.toLocaleString()}{t('production.itemUnit')}</td>
                      <td className="text-right p-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getUtilizationColor(stat.utilizationRate)} ${getUtilizationBgColor(stat.utilizationRate)}`}>
                          {stat.utilizationRate.toFixed(1)}%
                        </span>
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
          <div className="bg-surface border border-line rounded-xl p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('production.noData')}</h3>
            <p className="text-gray-600 mb-6">
              {t('production.noDataDesc', { year: selectedYear })}
            </p>
            <button
              onClick={() => onGo('/seller/production')}
              className="bg-brand text-white px-6 py-3 rounded-full hover:bg-brand-600 transition-colors font-medium"
            >
              {t('production.configureProduction')}
            </button>
          </div>
        )}

        {/* 가동률 범례 */}
        <div className="bg-white rounded-xl border border-line p-6">
          <h3 className="font-semibold text-gray-900 mb-4">{t('production.utilizationLegend')}</h3>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-green-500 rounded"></div>
              <span className="text-sm text-gray-700">{t('production.under70')} <span className="font-medium">{t('production.normal')}</span></span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-yellow-500 rounded"></div>
              <span className="text-sm text-gray-700">{t('production.range70to90')} <span className="font-medium">{t('production.high')}</span></span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-red-500 rounded"></div>
              <span className="text-sm text-gray-700">{t('production.over90')} <span className="font-medium">{t('production.veryHigh')}</span></span>
            </div>
          </div>
        </div>
      </div>
    </SellerLayout>
  );
}
