import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { webApiService } from '../../../services/apiService';
import { SellerLayout } from '../../layout/SellerLayout';
import { useAlert } from '../../common';
import { 
  ProductionSettings as ProductionSettingsType, 
  UpdateProductionSettingsRequest 
} from '@handy-platform/shared';

interface ProductionSettingsProps {
  onGo: (path: string) => void;
}

export function ProductionSettings({ onGo }: ProductionSettingsProps) {
  const { t } = useTranslation('seller');
  const { alert, error: showError } = useAlert();
  const [settings, setSettings] = useState<ProductionSettingsType>({
    orderCapacity: 10,
    averageProcessingDays: 3,
    isAvailableForOrders: true,
    specialNotice: ''
  });
  
  const [originalSettings, setOriginalSettings] = useState<ProductionSettingsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // 설정 로드
  const loadSettings = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('생산 설정 로드 시작...');
      const response = await webApiService.production.getProductionSettings();
      console.log('생산 설정 응답:', response);
      
      // ProductionService.getProductionSettings 가 이미 언랩해서 내려준다
      const loadedSettings = response.productionSettings;
      console.log('로드된 설정:', loadedSettings);
      
      // 로드된 설정이 유효한지 확인하고 기본값과 병합
      if (loadedSettings && typeof loadedSettings === 'object') {
        const mergedSettings = {
          orderCapacity: loadedSettings.orderCapacity ?? 10,
          averageProcessingDays: loadedSettings.averageProcessingDays ?? 3,
          isAvailableForOrders: loadedSettings.isAvailableForOrders ?? true,
          specialNotice: loadedSettings.specialNotice ?? ''
        };

        console.log('병합된 설정:', mergedSettings);
        setSettings(mergedSettings);
        setOriginalSettings(mergedSettings);
      } else {
        console.warn('유효하지 않은 생산 설정 데이터:', loadedSettings);
        // 기본값을 유지하되 originalSettings는 현재 settings로 설정
        const defaultSettings = {
          orderCapacity: 10,
          averageProcessingDays: 3,
          isAvailableForOrders: true,
          specialNotice: ''
        };
        setSettings(defaultSettings);
        setOriginalSettings(defaultSettings);
      }
    } catch (err: any) {
      console.error('생산 설정 로드 실패:', err);
      setError(t('productionSettings.settingsLoadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // 설정 변경 핸들러
  const handleSettingsChange = (field: keyof ProductionSettingsType, value: any) => {
    setSettings(prev => {
      // prev가 undefined인 경우를 대비해 기본값 사용
      const currentSettings = prev || {
        orderCapacity: 10,
        averageProcessingDays: 3,
        isAvailableForOrders: true,
        specialNotice: ''
      };

      const newSettings = {
        ...currentSettings,
        [field]: value
      };

      // 실시간 유효성 검사 (새로운 settings 값 사용)
      const errors = webApiService.production.validateProductionSettings(newSettings);
      setValidationErrors(errors);

      return newSettings;
    });
  };

  // 변경사항이 있는지 확인
  const hasChanges = originalSettings ? 
    JSON.stringify(settings) !== JSON.stringify(originalSettings) : false;

  // 저장 핸들러
  const handleSave = async () => {
    // 최종 유효성 검사
    const errors = webApiService.production.validateProductionSettings(settings);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      setSaving(true);
      setError('');

      await webApiService.production.updateProductionSettings(settings as UpdateProductionSettingsRequest);
      
      setOriginalSettings(settings);
      setValidationErrors([]);
      
      await alert(t('productionSettings.saveSuccess'), {
        variant: 'success',
        title: t('productionSettings.saveCompleteTitle')
      });
    } catch (err: any) {
      console.error('생산 설정 저장 실패:', err);
      setError(t('productionSettings.saveFailed', { error: err.message || '' }));
    } finally {
      setSaving(false);
    }
  };

  // 초기화
  const handleReset = () => {
    if (originalSettings) {
      setSettings(originalSettings);
      setValidationErrors([]);
    }
  };




  return (
    <SellerLayout title={t('productionSettings.title')} onGo={onGo}>
      {loading ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">{t('productionSettings.loadingSettings')}</p>
          </div>
        </div>
      ) : !settings ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center max-w-md w-full">
            <div className="text-red-500 text-xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('productionSettings.cannotLoadData')}</h3>
            <p className="text-gray-600 mb-6">{t('productionSettings.loadError')}</p>
            <button
              onClick={loadSettings}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium shadow-sm"
            >
              {t('common:retry')}
            </button>
          </div>
        </div>
      ) : error && !originalSettings ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center max-w-md w-full">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('productionSettings.loadFailed')}</h3>
            <p className="text-red-600 mb-6 leading-relaxed">{error}</p>
            <button
              onClick={loadSettings}
              className="bg-red-600 text-white px-6 py-2.5 rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium shadow-sm"
            >
              {t('common:retry')}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 변경사항이 있는지 확인 및 알림 */}
          {hasChanges && (
            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">{t('productionSettings.unsavedChanges')}</span>
            </div>
          )}

          {/* 에러/경고 메시지 */}
          {validationErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <h3 className="font-semibold text-red-800 mb-2">{t('productionSettings.validationError')}</h3>
                  <ul className="text-red-700 text-sm space-y-1.5">
                    {validationErrors.map((error, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="block w-1 h-1 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                        <span>{error}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* 액션 버튼들 */}
          <div className="sticky top-0 z-10 p-4 flex justify-end gap-3">
            <button
              onClick={handleReset}
              disabled={!hasChanges || saving}
              className="bg-white border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {t('common:reset')}
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || saving || validationErrors.length > 0}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
            >
              {saving ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {t('productForm.saving')}
                </div>
              ) : (
                t('common:save')
              )}
            </button>
          </div>

          {/* 생산 능력 설정 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">{t('productionSettings.capacitySettings')}</h2>
            <p className="text-sm text-gray-600 mt-1">{t('productionSettings.capacitySettingsDesc')}</p>
          </div>

          <div className="p-6 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* 적정 생산량 */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900">
                      {t('productionSettings.optimalCapacity')}
                    </label>
                    <p className="text-xs text-gray-500">{t('productionSettings.optimalCapacityDesc')}</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={settings?.orderCapacity ?? 10}
                      onChange={(e) => handleSettingsChange('orderCapacity', parseInt(e.target.value) || 1)}
                      className="flex-1 border-2 border-gray-200 rounded-lg px-4 py-3 text-center text-lg font-semibold focus:border-blue-500 focus:ring-0 transition-colors duration-200"
                      placeholder="10"
                    />
                    <div className="text-sm text-gray-600 font-medium">{t('dashboard.itemUnit')}</div>
                  </div>
                </div>

                {/* 작업량 경고 시스템 안내 */}
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <p className="text-xs text-amber-700">
                      {t('productionSettings.capacityWarning')}
                    </p>
                  </div>
                </div>
              </div>

              {/* 평균 제작 소요일 */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900">
                      {t('productionSettings.avgProcessingDays')}
                    </label>
                    <p className="text-xs text-gray-500">{t('productionSettings.avgProcessingDaysDesc')}</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-center gap-3">
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={settings?.averageProcessingDays ?? 3}
                      onChange={(e) => handleSettingsChange('averageProcessingDays', parseInt(e.target.value) || 1)}
                      className="w-32 border-2 border-gray-200 rounded-lg px-4 py-3 text-center text-lg font-semibold focus:border-orange-500 focus:ring-0 transition-colors duration-200"
                      placeholder="3"
                    />
                    <div className="text-sm text-gray-600 font-medium">{t('productionSettings.dayUnit')}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 주문 접수 설정 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">{t('productionSettings.orderSettings')}</h2>
            <p className="text-sm text-gray-600 mt-1">{t('productionSettings.orderSettingsDesc')}</p>
          </div>
          
          <div className="p-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  settings?.isAvailableForOrders 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{t('productionSettings.orderAcceptEnabled')}</h3>
                  <p className="text-sm text-gray-600">
                    {settings?.isAvailableForOrders
                      ? t('productionSettings.acceptingOrders')
                      : t('productionSettings.notAcceptingOrders')
                    }
                  </p>
                </div>
              </div>
              
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings?.isAvailableForOrders ?? true}
                  onChange={(e) => handleSettingsChange('isAvailableForOrders', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-600 shadow-sm"></div>
              </label>
            </div>
            
            {!settings?.isAvailableForOrders && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-amber-800 font-medium">{t('productionSettings.orderDisableWarningTitle')}</p>
                    <p className="text-amber-700 text-sm mt-1">
                      {t('productionSettings.orderDisableWarning')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 특별 안내사항 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">{t('productionSettings.specialNotice')}</h2>
            <p className="text-sm text-gray-600 mt-1">{t('productionSettings.specialNoticeDesc')}</p>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              <div className="relative">
                <textarea
                  value={settings?.specialNotice ?? ''}
                  onChange={(e) => handleSettingsChange('specialNotice', e.target.value)}
                  placeholder={t('productionSettings.specialNoticePlaceholder')}
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-4 h-32 resize-none focus:border-blue-500 focus:ring-0 transition-colors duration-200 placeholder-gray-400"
                  maxLength={500}
                />
                <svg className="absolute top-4 right-4 w-5 h-5 text-gray-300 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span>{t('productionSettings.displayedOnOrderPage')}</span>
                </div>
                <span className={`text-sm font-medium ${
                  (settings?.specialNotice ?? '').length > 400 
                    ? 'text-red-500' 
                    : (settings?.specialNotice ?? '').length > 300 
                      ? 'text-amber-500' 
                      : 'text-gray-500'
                }`}>
                  {t('productionSettings.charCount', { count: (settings?.specialNotice ?? '').length })}
                </span>
              </div>
              
              {(settings?.specialNotice ?? '').length > 400 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">
                    {t('productionSettings.tooLongWarning')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        </div>
      )}
    </SellerLayout>
  );
}