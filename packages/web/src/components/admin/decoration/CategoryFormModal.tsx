import { useState, useEffect } from 'react';
import type { DecorationCategory } from '@handy-platform/shared';
import { FiCheck, FiX } from 'react-icons/fi';
import type { CategoryFormData } from './types';

const defaultCategoryForm = (): CategoryFormData => ({
  slug: '',
  nameEn: '',
  nameKo: '',
  assetType: 'all',
  sortOrder: 0,
  icon: '',
  isActive: true,
});

export function CategoryFormModal({
  isOpen,
  mode,
  initialData,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialData?: DecorationCategory | null;
  onClose: () => void;
  onSubmit: (data: Partial<DecorationCategory>) => Promise<void>;
}) {
  const [form, setForm] = useState<CategoryFormData>(defaultCategoryForm());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (mode === 'edit' && initialData) {
      setForm({
        slug: initialData.slug,
        nameEn: initialData.name?.en || '',
        nameKo: initialData.name?.ko || '',
        assetType: initialData.assetType,
        sortOrder: initialData.sortOrder,
        icon: initialData.icon || '',
        isActive: initialData.isActive,
      });
    } else {
      setForm(defaultCategoryForm());
    }
  }, [isOpen, mode, initialData]);

  const handleSubmit = async () => {
    if (!form.slug || !form.nameEn || !form.nameKo) {
      alert('slug, name(EN), name(KO)는 필수입니다.');
      return;
    }
    try {
      setSubmitting(true);
      await onSubmit({
        slug: form.slug,
        name: { en: form.nameEn, ko: form.nameKo },
        assetType: form.assetType,
        sortOrder: form.sortOrder,
        icon: form.icon || undefined,
        isActive: form.isActive,
      });
    } catch (err: any) {
      alert(`저장 실패: ${err.message || '알 수 없는 오류'}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {mode === 'create' ? '새 카테고리 추가' : '카테고리 수정'}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slug <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') })}
                placeholder="예: flower-charm"
                disabled={mode === 'edit'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이름 (EN) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.nameEn}
                  onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이름 (KO) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.nameKo}
                  onChange={(e) => setForm({ ...form, nameKo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">에셋 타입</label>
                <select
                  value={form.assetType}
                  onChange={(e) => setForm({ ...form, assetType: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All</option>
                  <option value="part">Part</option>
                  <option value="sticker">Sticker</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">정렬 순서</label>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">아이콘 (이모지 또는 URL)</label>
              <input
                type="text"
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="catActive"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="rounded border-gray-300"
              />
              <label htmlFor="catActive" className="text-sm text-gray-700">활성</label>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <FiX className="inline mr-1" />
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={!form.slug || !form.nameEn || !form.nameKo || submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiCheck className="inline mr-1" />
              {submitting ? '저장 중...' : mode === 'create' ? '생성' : '수정'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
