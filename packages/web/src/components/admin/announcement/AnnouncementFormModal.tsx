import { useState, useEffect, useRef } from 'react';
import { webApiService } from '../../../services/apiService';
import type { Announcement, AnnouncementCategory, AnnouncementTarget, AnnouncementStatus, LocalizedField } from '@handy-platform/shared';
import { ImageUploadManager, API_BASE_URL } from '@handy-platform/shared';
import { FiCheck, FiX } from 'react-icons/fi';

const emptyLocalized = (): LocalizedField => ({ ko: '', en: '', ja: '' });

interface AnnouncementFormData {
  title: LocalizedField;
  summary: LocalizedField;
  content: LocalizedField;
  category: AnnouncementCategory;
  target: AnnouncementTarget;
  status: AnnouncementStatus;
  isPinned: boolean;
  isPopup: boolean;
  isBanner: boolean;
  bannerOrder: number;
  thumbnailUrl: string;
  publishedAt: string;
  expiresAt: string;
}

const defaultFormData = (): AnnouncementFormData => ({
  title: emptyLocalized(),
  summary: emptyLocalized(),
  content: emptyLocalized(),
  category: 'notice',
  target: 'all',
  status: 'draft',
  isPinned: false,
  isPopup: false,
  isBanner: false,
  bannerOrder: 0,
  thumbnailUrl: '',
  publishedAt: '',
  expiresAt: '',
});

export function AnnouncementFormModal({
  isOpen,
  mode,
  initialData,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialData?: Announcement | null;
  onClose: () => void;
  onSubmit: (data: Partial<Announcement>) => Promise<void>;
}) {
  const [form, setForm] = useState<AnnouncementFormData>(defaultFormData());
  const [activeLang, setActiveLang] = useState<'ko' | 'en' | 'ja'>('ko');
  const langs = [
    { code: 'ko' as const, label: '한국어' },
    { code: 'en' as const, label: 'English' },
    { code: 'ja' as const, label: '日本語' },
  ];
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const imageUploadManager = new ImageUploadManager(
    (import.meta as any).env?.VITE_API_BASE_URL || API_BASE_URL,
    async () => {
      const token = localStorage.getItem('accessToken');
      return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
    }
  );

  useEffect(() => {
    if (!isOpen) return;
    if (mode === 'edit' && initialData) {
      setForm({
        title: initialData.title || emptyLocalized(),
        summary: initialData.summary || emptyLocalized(),
        content: initialData.content || emptyLocalized(),
        category: initialData.category || 'notice',
        target: initialData.target || 'all',
        status: initialData.status || 'draft',
        isPinned: initialData.isPinned || false,
        isPopup: initialData.isPopup || false,
        isBanner: initialData.isBanner || false,
        bannerOrder: initialData.bannerOrder || 0,
        thumbnailUrl: initialData.thumbnailUrl || '',
        publishedAt: initialData.publishedAt ? initialData.publishedAt.slice(0, 16) : '',
        expiresAt: initialData.expiresAt ? initialData.expiresAt.slice(0, 16) : '',
      });
      if (initialData.thumbnailUrl) {
        setImagePreview(initialData.thumbnailUrl);
      }
    } else {
      setForm(defaultFormData());
      setImagePreview(null);
    }
    setImageFile(null);
    setIsUploading(false);
    setUploadProgress(0);
  }, [isOpen, mode, initialData]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('파일 크기는 10MB를 초과할 수 없습니다.');
      return;
    }
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleImageRemove = () => {
    setImageFile(null);
    setImagePreview(null);
    setForm((prev) => ({ ...prev, thumbnailUrl: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImageUpload = async (): Promise<string | null> => {
    if (!imageFile) return null;
    try {
      setIsUploading(true);
      setUploadProgress(0);
      const result = await imageUploadManager.uploadImage({
        file: imageFile,
        uploadType: 'announcement' as any,
        onProgress: (progress) => setUploadProgress(progress),
      });
      if (result.success && result.imageUrl) {
        return result.imageUrl;
      }
      throw new Error(result.error || '이미지 업로드 실패');
    } catch (error: any) {
      alert(`이미지 업로드 실패: ${error.message}`);
      return null;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSubmit = async () => {
    if (!form.title.ko.trim() && !form.title.en.trim() && !form.title.ja.trim()) {
      alert('제목은 최소 1개 언어로 입력해야 합니다.');
      return;
    }

    try {
      setSubmitting(true);

      let thumbnailUrl = form.thumbnailUrl;
      if (imageFile) {
        const uploaded = await handleImageUpload();
        if (uploaded) {
          thumbnailUrl = uploaded;
        }
      }

      const payload: Partial<Announcement> = {
        title: form.title,
        summary: form.summary,
        content: form.content,
        category: form.category,
        target: form.target,
        status: form.status,
        isPinned: form.isPinned,
        isPopup: form.isPopup,
        isBanner: form.isBanner,
        bannerOrder: form.bannerOrder,
        thumbnailUrl: thumbnailUrl || undefined,
        publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : undefined,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
      };

      await onSubmit(payload);
    } catch (err: any) {
      alert(`저장 실패: ${err.message || '알 수 없는 오류'}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {mode === 'create' ? '새 공지사항 작성' : '공지사항 수정'}
          </h2>

          <div className="space-y-4">
            {/* 언어 탭 */}
            <div className="flex gap-1 mb-3 border-b border-gray-200">
              {langs.map(l => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setActiveLang(l.code)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-t ${
                    activeLang === l.code
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>

            {/* 제목 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                제목 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title[activeLang]}
                onChange={(e) => setForm({ ...form, title: { ...form.title, [activeLang]: e.target.value } })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={`공지사항 제목을 입력하세요 (${activeLang})`}
              />
            </div>

            {/* 요약 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">요약</label>
              <input
                type="text"
                value={form.summary[activeLang]}
                onChange={(e) => setForm({ ...form, summary: { ...form.summary, [activeLang]: e.target.value } })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={`공지사항 요약 (${activeLang})`}
              />
            </div>

            {/* 카테고리 / 대상앱 / 상태 */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as AnnouncementCategory })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="notice">공지</option>
                  <option value="event">이벤트</option>
                  <option value="update">업데이트</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">대상 앱</label>
                <select
                  value={form.target}
                  onChange={(e) => setForm({ ...form, target: e.target.value as AnnouncementTarget })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">전체</option>
                  <option value="design-tool">디자인 툴</option>
                  <option value="platform">플랫폼</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as AnnouncementStatus })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="draft">초안</option>
                  <option value="published">발행됨</option>
                  <option value="archived">보관됨</option>
                </select>
              </div>
            </div>

            {/* 본문 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">본문</label>
              <textarea
                value={form.content[activeLang]}
                onChange={(e) => setForm({ ...form, content: { ...form.content, [activeLang]: e.target.value } })}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={`공지사항 본문을 입력하세요 (${activeLang})`}
              />
            </div>

            {/* 썸네일 이미지 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">썸네일 이미지</label>
              <div className="flex items-start gap-4">
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    이미지 선택
                  </button>
                  {imagePreview && (
                    <button
                      type="button"
                      onClick={handleImageRemove}
                      className="ml-2 px-3 py-2 text-sm text-red-600 hover:text-red-800"
                    >
                      제거
                    </button>
                  )}
                </div>
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="썸네일 미리보기"
                    className="w-24 h-24 object-cover border rounded"
                  />
                )}
              </div>
              {isUploading && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-1">업로드 중... {Math.round(uploadProgress)}%</p>
                </div>
              )}
            </div>

            {/* 토글 옵션 */}
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isPopup}
                  onChange={(e) => setForm({ ...form, isPopup: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">팝업 노출</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isPinned}
                  onChange={(e) => setForm({ ...form, isPinned: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">상단 고정</span>
              </label>
            </div>

            {/* 배너 노출 */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isBanner}
                  onChange={(e) => setForm({ ...form, isBanner: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">배너 캐러셀 노출</span>
              </label>
            </div>

            {/* 배너 순서 (isBanner가 true일 때만 표시) */}
            {form.isBanner && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">배너 순서</label>
                <input
                  type="number"
                  min="0"
                  value={form.bannerOrder}
                  onChange={(e) => setForm({ ...form, bannerOrder: parseInt(e.target.value) || 0 })}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            {/* 날짜 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">공개 시작일</label>
                <input
                  type="datetime-local"
                  value={form.publishedAt}
                  onChange={(e) => setForm({ ...form, publishedAt: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">만료일</label>
                <input
                  type="datetime-local"
                  value={form.expiresAt}
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
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
              disabled={(!form.title.ko.trim() && !form.title.en.trim() && !form.title.ja.trim()) || submitting}
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
