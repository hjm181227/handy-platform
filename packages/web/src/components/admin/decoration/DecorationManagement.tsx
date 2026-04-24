import { useState, useEffect, useCallback } from 'react';
import { webApiService } from '../../../services/apiService';
import type { DecorationAsset, DecorationCategory } from '@handy-platform/shared';
import { FiEdit2, FiTrash2, FiPlus, FiSearch } from 'react-icons/fi';
import type { ActiveTab, AssetFilters } from './types';
import { AccessTierBadge, StatusBadge, AssetTypeBadge } from './badges';
import { DecorationFormModal } from './DecorationFormModal';
import { CategoryFormModal } from './CategoryFormModal';

export default function DecorationManagement() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('assets');

  // --- Asset state ---
  const [decorations, setDecorations] = useState<DecorationAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState<AssetFilters>({
    assetType: '',
    category: '',
    accessTier: '',
    status: '',
    search: '',
    sort: 'newest',
  });

  // Asset modals
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [assetModalMode, setAssetModalMode] = useState<'create' | 'edit'>('create');
  const [selectedDecoration, setSelectedDecoration] = useState<DecorationAsset | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DecorationAsset | null>(null);

  // --- Category state ---
  const [categories, setCategories] = useState<DecorationCategory[]>([]);
  const [catLoading, setCatLoading] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [catModalMode, setCatModalMode] = useState<'create' | 'edit'>('create');
  const [selectedCategory, setSelectedCategory] = useState<DecorationCategory | null>(null);
  const [showCatDeleteModal, setShowCatDeleteModal] = useState(false);
  const [catDeleteTarget, setCatDeleteTarget] = useState<DecorationCategory | null>(null);

  // ---- Load Data ----
  const loadDecorations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await webApiService.decoration.getDecorations({
        assetType: (filters.assetType as any) || undefined,
        category: filters.category || undefined,
        accessTier: (filters.accessTier as any) || undefined,
        status: (filters.status as any) || undefined,
        search: filters.search || undefined,
        sort: filters.sort || undefined,
        page,
        limit: 20,
      });
      if (response.success) {
        setDecorations(response.data.items);
        setTotalPages(response.data.pagination.totalPages);
        setTotalItems(response.data.pagination.totalItems);
      }
    } catch (error) {
      console.error('Failed to load decorations:', error);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  const loadCategories = useCallback(async () => {
    try {
      setCatLoading(true);
      const res = await webApiService.decoration.getDecorationCategories();
      const cats = res.data?.categories ?? res.data;
      setCategories(res.success && Array.isArray(cats) ? cats : []);
    } catch (error) {
      console.error('Failed to load decoration categories:', error);
    } finally {
      setCatLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDecorations();
  }, [loadDecorations]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // ---- Asset Handlers ----
  const handleCreateAsset = () => {
    setAssetModalMode('create');
    setSelectedDecoration(null);
    setShowAssetModal(true);
  };

  const handleEditAsset = (asset: DecorationAsset) => {
    setAssetModalMode('edit');
    setSelectedDecoration(asset);
    setShowAssetModal(true);
  };

  const handleAssetSubmit = async (data: Partial<DecorationAsset>) => {
    if (assetModalMode === 'create') {
      await webApiService.decoration.createDecoration(data);
      alert('에셋이 생성되었습니다.');
    } else if (selectedDecoration) {
      await webApiService.decoration.updateDecoration(selectedDecoration.decorationAssetUuid, data);
      alert('에셋이 수정되었습니다.');
    }
    setShowAssetModal(false);
    loadDecorations();
  };

  const handleToggleStatus = async (asset: DecorationAsset) => {
    try {
      const newStatus = asset.status === 'active' ? 'inactive' : 'active';
      await webApiService.decoration.toggleDecorationStatus(asset.decorationAssetUuid, newStatus);
      loadDecorations();
    } catch (error: any) {
      alert(`상태 변경 실패: ${error.message || '알 수 없는 오류'}`);
    }
  };

  const handleDeleteAsset = async () => {
    if (!deleteTarget) return;
    try {
      await webApiService.decoration.deleteDecoration(deleteTarget.decorationAssetUuid);
      setShowDeleteModal(false);
      setDeleteTarget(null);
      loadDecorations();
      alert('에셋이 삭제되었습니다.');
    } catch (error: any) {
      alert(`삭제 실패: ${error.message || '알 수 없는 오류'}`);
    }
  };

  // ---- Category Handlers ----
  const handleCreateCategory = () => {
    setCatModalMode('create');
    setSelectedCategory(null);
    setShowCatModal(true);
  };

  const handleEditCategory = (cat: DecorationCategory) => {
    setCatModalMode('edit');
    setSelectedCategory(cat);
    setShowCatModal(true);
  };

  const handleCategorySubmit = async (data: Partial<DecorationCategory>) => {
    if (catModalMode === 'create') {
      await webApiService.decoration.createDecorationCategory(data);
      alert('카테고리가 생성되었습니다.');
    } else if (selectedCategory) {
      await webApiService.decoration.updateDecorationCategory(selectedCategory.decorationCategoryUuid, data);
      alert('카테고리가 수정되었습니다.');
    }
    setShowCatModal(false);
    loadCategories();
  };

  const handleDeleteCategory = async () => {
    if (!catDeleteTarget) return;
    try {
      await webApiService.decoration.deleteDecorationCategory(catDeleteTarget.decorationCategoryUuid);
      setShowCatDeleteModal(false);
      setCatDeleteTarget(null);
      loadCategories();
      alert('카테고리가 삭제되었습니다.');
    } catch (error: any) {
      alert(`삭제 실패: ${error.message || '알 수 없는 오류'}`);
    }
  };

  const handleToggleCategoryStatus = async (cat: DecorationCategory) => {
    try {
      await webApiService.decoration.updateDecorationCategory(cat.decorationCategoryUuid, {
        isActive: !cat.isActive,
      });
      loadCategories();
    } catch (error: any) {
      alert(`상태 변경 실패: ${error.message || '알 수 없는 오류'}`);
    }
  };

  // ---- Filter handlers ----
  const updateFilter = (key: keyof AssetFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const getCategoryName = (slug: string) => {
    const cat = categories.find((c) => c.slug === slug);
    return cat ? (cat.name?.ko || cat.name?.en || slug) : slug;
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">데코레이션 관리</h1>
        <p className="mt-1 text-sm text-gray-600">데코레이션 에셋 및 카테고리를 관리합니다.</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'assets' as ActiveTab, label: '에셋 관리' },
            { id: 'categories' as ActiveTab, label: '카테고리 관리' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ========== ASSETS TAB ========== */}
      {activeTab === 'assets' && (
        <>
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-gray-600">총 {totalItems}개의 에셋</p>
            <button
              onClick={handleCreateAsset}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FiPlus className="mr-2" />
              새 에셋 추가
            </button>
          </div>

          {/* Filters */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">에셋 타입</label>
              <select
                value={filters.assetType}
                onChange={(e) => updateFilter('assetType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">전체</option>
                <option value="part">Part</option>
                <option value="sticker">Sticker</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
              <select
                value={filters.category}
                onChange={(e) => updateFilter('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">전체</option>
                {categories.map((c) => (
                  <option key={c.decorationCategoryUuid} value={c.slug}>
                    {c.name?.ko || c.name?.en}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Access Tier</label>
              <select
                value={filters.accessTier}
                onChange={(e) => updateFilter('accessTier', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">전체</option>
                <option value="free">Free</option>
                <option value="paid">Paid</option>
                <option value="pro_only">Pro Only</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
              <select
                value={filters.status}
                onChange={(e) => updateFilter('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">전체</option>
                <option value="active">활성</option>
                <option value="inactive">비활성</option>
                <option value="pending_review">검토 대기</option>
                <option value="rejected">거절됨</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">검색</label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  placeholder="이름 검색..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">정렬</label>
              <select
                value={filters.sort}
                onChange={(e) => updateFilter('sort', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="newest">최신순</option>
                <option value="name">이름순</option>
                <option value="order">수동정렬</option>
              </select>
            </div>
          </div>

          {/* Asset Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">미리보기</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">타입</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">카테고리</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Access</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">생성일</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">액션</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                        <div className="flex justify-center">
                          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                        </div>
                      </td>
                    </tr>
                  ) : decorations.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                        에셋이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    decorations.map((asset) => (
                      <tr key={asset.decorationAssetUuid} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {asset.assets?.previewUrl ? (
                            <img
                              src={asset.assets.previewUrl}
                              alt={asset.name?.ko || asset.name?.en}
                              className="w-10 h-10 object-contain rounded"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">N/A</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {asset.name?.ko || asset.name?.en}
                          <span className="block text-xs text-gray-400">{asset.name?.en}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <AssetTypeBadge type={asset.assetType} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {getCategoryName(asset.category)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <AccessTierBadge tier={asset.accessTier} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button onClick={() => handleToggleStatus(asset)}>
                            <StatusBadge status={asset.status} />
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(asset.createdAt).toLocaleDateString('ko-KR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEditAsset(asset)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                            title="수정"
                          >
                            <FiEdit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => {
                              setDeleteTarget(asset);
                              setShowDeleteModal(true);
                            }}
                            className="text-red-600 hover:text-red-900"
                            title="삭제"
                          >
                            <FiTrash2 className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  이전
                </button>
                <span className="text-sm text-gray-700">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  다음
                </button>
              </div>
            )}
          </div>

          {/* Asset Form Modal */}
          <DecorationFormModal
            isOpen={showAssetModal}
            mode={assetModalMode}
            initialData={selectedDecoration}
            categories={categories}
            onClose={() => setShowAssetModal(false)}
            onSubmit={handleAssetSubmit}
          />

          {/* Delete Confirmation */}
          {showDeleteModal && deleteTarget && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-md w-full p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-2">에셋 삭제</h2>
                <p className="text-sm text-gray-600 mb-4">
                  <strong>{deleteTarget.name?.ko || deleteTarget.name?.en}</strong> 에셋을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeleteTarget(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleDeleteAsset}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ========== CATEGORIES TAB ========== */}
      {activeTab === 'categories' && (
        <>
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-gray-600">총 {categories.length}개의 카테고리</p>
            <button
              onClick={handleCreateCategory}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FiPlus className="mr-2" />
              새 카테고리 추가
            </button>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름(KO)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">에셋 타입</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">정렬</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">액션</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {catLoading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        <div className="flex justify-center">
                          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                        </div>
                      </td>
                    </tr>
                  ) : categories.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        카테고리가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    categories.map((cat) => (
                      <tr key={cat.decorationCategoryUuid} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-700">
                          {cat.slug}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{cat.name?.en}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{cat.name?.ko}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                            {cat.assetType}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cat.sortOrder}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button onClick={() => handleToggleCategoryStatus(cat)}>
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                cat.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {cat.isActive ? '활성' : '비활성'}
                            </span>
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEditCategory(cat)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                            title="수정"
                          >
                            <FiEdit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => {
                              setCatDeleteTarget(cat);
                              setShowCatDeleteModal(true);
                            }}
                            className="text-red-600 hover:text-red-900"
                            title="삭제"
                          >
                            <FiTrash2 className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Category Form Modal */}
          <CategoryFormModal
            isOpen={showCatModal}
            mode={catModalMode}
            initialData={selectedCategory}
            onClose={() => setShowCatModal(false)}
            onSubmit={handleCategorySubmit}
          />

          {/* Category Delete Confirmation */}
          {showCatDeleteModal && catDeleteTarget && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-md w-full p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-2">카테고리 삭제</h2>
                <p className="text-sm text-gray-600 mb-4">
                  <strong>{catDeleteTarget.name?.ko || catDeleteTarget.name?.en}</strong> 카테고리를 삭제하시겠습니까?
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowCatDeleteModal(false);
                      setCatDeleteTarget(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleDeleteCategory}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
