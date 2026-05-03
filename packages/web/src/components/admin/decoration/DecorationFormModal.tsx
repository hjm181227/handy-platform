import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { webApiService } from '../../../services/apiService';
import type { DecorationAsset, DecorationCategory } from '@handy-platform/shared';
import { FiCheck, FiX, FiPlus, FiTrash2, FiUpload } from 'react-icons/fi';
import type { AssetFormData } from './types';
const GLBPreview = lazy(() => import('./GLBPreview').then(m => ({ default: m.GLBPreview })));
import { SVGPreview } from './SVGPreview';

const THEME_OPTIONS = ['gothic', 'luxury', 'minimal', 'classic', 'elegant', 'cute', 'celestial'] as const;

const MATERIAL_PRESETS: Record<string, { metalness: number; roughness: number; clearcoat: number }> = {
  glossy: { metalness: 0.3, roughness: 0.15, clearcoat: 0.8 },
  metallic: { metalness: 1.0, roughness: 0.2, clearcoat: 0 },
  matte: { metalness: 0, roughness: 0.9, clearcoat: 0 },
  pearly: { metalness: 0.4, roughness: 0.1, clearcoat: 1.0 },
  transparent: { metalness: 0, roughness: 0.05, clearcoat: 0.5 },
  brushed: { metalness: 0.8, roughness: 0.5, clearcoat: 0 },
  satin: { metalness: 0.2, roughness: 0.4, clearcoat: 0.3 },
};
const MATERIAL_OPTIONS = Object.keys(MATERIAL_PRESETS);

const COLOR_PRESETS: Record<string, { name: string; hex: string }[]> = {
  '크롬/메탈릭': [
    { name: 'Silver', hex: '#C0C0C0' },
    { name: 'Light Silver', hex: '#E8E8E8' },
    { name: 'Gold', hex: '#FFD700' },
    { name: 'Champagne Gold', hex: '#F7E7CE' },
    { name: 'Rose Gold', hex: '#B76E79' },
    { name: 'Copper', hex: '#B87333' },
    { name: 'Gunmetal', hex: '#2C3539' },
    { name: 'Bronze', hex: '#CD7F32' },
    { name: 'Platinum', hex: '#E5E4E2' },
  ],
  '펄/시머': [
    { name: 'White Pearl', hex: '#FDFBF7' },
    { name: 'Pink Pearl', hex: '#F2D4DC' },
    { name: 'Lavender Pearl', hex: '#E6D7F1' },
    { name: 'Blue Pearl', hex: '#D4E6F1' },
    { name: 'Green Pearl', hex: '#D5F0E8' },
    { name: 'Peach Pearl', hex: '#FAE0D4' },
    { name: 'Champagne Pearl', hex: '#F5ECD7' },
  ],
  '솔리드': [
    { name: 'Black', hex: '#000000' },
    { name: 'White', hex: '#FFFFFF' },
    { name: 'Red', hex: '#E03030' },
    { name: 'Deep Red', hex: '#8B0000' },
    { name: 'Hot Pink', hex: '#FF69B4' },
    { name: 'Nude Pink', hex: '#E8C4B8' },
    { name: 'Coral', hex: '#FF7F50' },
    { name: 'Orange', hex: '#FF8C00' },
    { name: 'Yellow', hex: '#FFD600' },
    { name: 'Green', hex: '#2E8B57' },
    { name: 'Navy', hex: '#1B2A4A' },
    { name: 'Royal Blue', hex: '#4169E1' },
    { name: 'Purple', hex: '#6B3FA0' },
    { name: 'Brown', hex: '#6B4423' },
    { name: 'Beige', hex: '#F5E6D3' },
  ],
  '파스텔': [
    { name: 'Baby Pink', hex: '#FFD1DC' },
    { name: 'Lavender', hex: '#C8A2C8' },
    { name: 'Mint', hex: '#AAF0D1' },
    { name: 'Sky Blue', hex: '#A7D8DE' },
    { name: 'Lemon', hex: '#FFFACD' },
    { name: 'Lilac', hex: '#D8B4F8' },
    { name: 'Peach', hex: '#FFDAB9' },
  ],
  '글리터/홀로': [
    { name: 'Holographic Silver', hex: '#D1E8E2' },
    { name: 'Holographic Pink', hex: '#F4C2C2' },
    { name: 'Gold Glitter', hex: '#E6BE8A' },
    { name: 'Red Glitter', hex: '#C41E3A' },
    { name: 'Aurora Green', hex: '#A8E6CF' },
    { name: 'Aurora Purple', hex: '#C3B1E1' },
  ],
  '투명/젤리': [
    { name: 'Clear Pink', hex: '#FFE4E9' },
    { name: 'Clear Nude', hex: '#F8E8DC' },
    { name: 'Milky White', hex: '#FFF8F0' },
    { name: 'Jelly Red', hex: '#FF6B6B' },
    { name: 'Jelly Purple', hex: '#B088F9' },
  ],
};

function hexToRgb01(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;
  return [Math.round(r * 100) / 100, Math.round(g * 100) / 100, Math.round(b * 100) / 100];
}

function rgb01ToHex(c: [number, number, number]): string {
  const toHex = (v: number) => Math.round(v * 255).toString(16).padStart(2, '0');
  return `#${toHex(c[0])}${toHex(c[1])}${toHex(c[2])}`;
}

const defaultAssetForm = (): AssetFormData => ({
  nameEn: '',
  nameKo: '',
  descriptionEn: '',
  descriptionKo: '',
  assetType: 'part',
  category: '',
  accessTier: 'free',
  tags: { themes: [] },
  modelUrl: '',
  previewUrl: '',
  svgPath: '',
  viewBox: '0 0 100 100',
  defaultColor: '#FF0000',
  allowedColors: [],
  allowedMaterials: [],
});

export function DecorationFormModal({
  isOpen,
  mode,
  initialData,
  categories,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialData?: DecorationAsset | null;
  categories: DecorationCategory[];
  onClose: () => void;
  onSubmit: (data: Partial<DecorationAsset>) => Promise<void>;
}) {
  const [form, setForm] = useState<AssetFormData>(defaultAssetForm());
  const [glbFile, setGlbFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [glbSizeError, setGlbSizeError] = useState<string | null>(null);
  const [isAutoCapturing, setIsAutoCapturing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_GLB_SIZE = 20 * 1024 * 1024; // 20MB
  const MAX_PREVIEW_SIZE = 5 * 1024 * 1024; // 5MB

  useEffect(() => {
    if (!isOpen) return;
    if (mode === 'edit' && initialData) {
      setForm({
        nameEn: initialData.name?.en || '',
        nameKo: initialData.name?.ko || '',
        descriptionEn: initialData.description?.en || '',
        descriptionKo: initialData.description?.ko || '',
        assetType: initialData.assetType,
        category: initialData.category,
        accessTier: initialData.accessTier,
        tags: {
          themes: initialData.tags?.themes || [],
        },
        modelUrl: initialData.assets?.modelUrl || '',
        previewUrl: initialData.assets?.previewUrl || '',
        svgPath: initialData.assets?.svgPath || '',
        viewBox: initialData.assets?.viewBox || '0 0 100 100',
        defaultColor: initialData.defaultColor || '#FF0000',
        allowedColors: initialData.allowedColors || [],
        allowedMaterials: (initialData.allowedMaterials || []).map((m) => m.id),
      });
    } else {
      setForm(defaultAssetForm());
    }
    setGlbFile(null);
    setGlbSizeError(null);
    setIsAutoCapturing(false);
    setUploadProgress(0);
    setIsUploading(false);
  }, [isOpen, mode, initialData]);

  // --- GLB upload via presigned URL ---
  const uploadFileToS3 = async (
    file: File | Blob,
    uploadType: 'decoration-model' | 'decoration-preview',
    fileName: string,
    contentType: string
  ): Promise<string> => {
    setIsUploading(true);
    setUploadProgress(0);
    const res = await webApiService.decoration.getDecorationPresignedUrl({
      uploadType,
      fileName,
      contentType,
    });

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) setUploadProgress((e.loaded / e.total) * 100);
      });
      xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`S3 upload failed: ${xhr.status}`)));
      xhr.onerror = () => reject(new Error('S3 upload network error'));
      xhr.open('PUT', res.presignedUrl);
      xhr.setRequestHeader('Content-Type', contentType);
      if (res.uploadHeaders) {
        Object.entries(res.uploadHeaders).forEach(([key, value]) => {
          xhr.setRequestHeader(key, value);
        });
      }
      xhr.send(file);
    });

    setIsUploading(false);
    setUploadProgress(0);
    return res.imageUrl;
  };

  const handleGlbSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.glb') && !file.name.endsWith('.gltf')) {
      alert('GLB 또는 GLTF 파일만 지원합니다.');
      return;
    }
    if (file.size > MAX_GLB_SIZE) {
      setGlbSizeError(`파일 크기가 ${(file.size / 1024 / 1024).toFixed(1)}MB입니다. 최대 20MB까지 업로드할 수 있습니다.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setGlbSizeError(null);
    setGlbFile(file);
    // Create a local object URL for preview
    const url = URL.createObjectURL(file);
    setForm((prev) => ({ ...prev, modelUrl: url }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePreviewCapture = async (blob: Blob) => {
    try {
      setIsAutoCapturing(true);
      const fileUrl = await uploadFileToS3(blob, 'decoration-preview', `preview_${Date.now()}.png`, 'image/png');
      setForm((prev) => ({ ...prev, previewUrl: fileUrl }));
    } catch (err: any) {
      alert(`미리보기 업로드 실패: ${err.message}`);
    } finally {
      setIsAutoCapturing(false);
    }
  };

  const [activeColorIndex, setActiveColorIndex] = useState<number>(0);
  const [showPresets, setShowPresets] = useState(false);

  // --- Submit ---
  const handleSubmit = async () => {
    if (!form.nameEn || !form.nameKo) {
      alert('이름과 한국어 이름은 필수입니다.');
      return;
    }

    try {
      setSubmitting(true);

      let modelUrl = form.modelUrl;
      // If a new GLB file was selected, upload it first
      if (glbFile) {
        // Revoke the temp object URL
        if (form.modelUrl.startsWith('blob:')) {
          URL.revokeObjectURL(form.modelUrl);
        }
        modelUrl = await uploadFileToS3(glbFile, 'decoration-model', glbFile.name, 'model/gltf-binary');
      }

      const payload: Partial<DecorationAsset> = {
        name: { en: form.nameEn, ko: form.nameKo },
        description: form.descriptionEn || form.descriptionKo
          ? { en: form.descriptionEn, ko: form.descriptionKo }
          : undefined,
        assetType: form.assetType,
        category: form.category,
        accessTier: form.accessTier,
        tags: {
          themes: form.tags.themes,
        },
        assets: {
          modelUrl: form.assetType === 'part' ? modelUrl : undefined,
          previewUrl: form.previewUrl,
          svgPath: form.assetType === 'sticker' ? form.svgPath : undefined,
          viewBox: form.assetType === 'sticker' ? form.viewBox : undefined,
        },
      };

      if (form.assetType === 'part') {
        payload.allowedColors = form.allowedColors;
        payload.allowedMaterials = form.allowedMaterials.map((id) => ({
          id,
          ...MATERIAL_PRESETS[id],
        }));
      }

      if (form.assetType === 'sticker') {
        payload.defaultColor = form.defaultColor;
      }

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
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {mode === 'create' ? '새 에셋 추가' : '에셋 수정'}
          </h2>

          <div className="space-y-4">
            {/* Row: nameEn / nameKo */}
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

            {/* Row: descriptionEn / descriptionKo */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">설명 (EN)</label>
                <textarea
                  value={form.descriptionEn}
                  onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">설명 (KO)</label>
                <textarea
                  value={form.descriptionKo}
                  onChange={(e) => setForm({ ...form, descriptionKo: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Row: assetType / category / accessTier */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">에셋 타입</label>
                <div className="flex gap-4 mt-1">
                  {(['part', 'sticker'] as const).map((t) => (
                    <label key={t} className="inline-flex items-center">
                      <input
                        type="radio"
                        name="assetType"
                        value={t}
                        checked={form.assetType === t}
                        onChange={() => setForm({ ...form, assetType: t })}
                        className="mr-1"
                      />
                      <span className="text-sm">{t === 'part' ? 'Part' : 'Sticker'}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">선택</option>
                  {categories
                    .filter((c) => c.assetType === 'all' || c.assetType === form.assetType)
                    .map((c) => (
                      <option key={c.decorationCategoryUuid} value={c.slug}>
                        {c.name?.ko || c.name?.en} ({c.slug})
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Access Tier</label>
                <select
                  value={form.accessTier}
                  onChange={(e) => setForm({ ...form, accessTier: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="free">Free</option>
                  <option value="paid">Paid</option>
                  <option value="pro_only">Pro Only</option>
                </select>
              </div>
            </div>


            {/* 허용 색상 */}
            {form.assetType === 'part' && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  허용 색상 ({form.allowedColors.length})
                  <span className="text-xs text-gray-400 ml-2">첫번째 색상이 기본 미리보기에 적용됩니다</span>
                </h4>

                {/* Color Preset Palette */}
                <div className="mb-3">
                  <button
                    type="button"
                    onClick={() => setShowPresets(!showPresets)}
                    className="text-xs font-medium px-2 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    {showPresets ? '▾ 색상 프리셋 닫기' : '▸ 색상 프리셋'}
                  </button>
                  {showPresets && (
                    <div className="mt-2 border border-gray-200 rounded-lg p-3 max-h-60 overflow-y-auto">
                      {Object.entries(COLOR_PRESETS).map(([groupName, colors]) => (
                        <div key={groupName} className="mb-2 last:mb-0">
                          <p className="text-xs font-medium text-gray-500 mb-1">{groupName}</p>
                          <div className="flex flex-wrap gap-1">
                            {colors.map((preset) => {
                              const presetRgb = hexToRgb01(preset.hex);
                              const alreadyAdded = form.allowedColors.some(
                                (c) =>
                                  c.color[0] === presetRgb[0] &&
                                  c.color[1] === presetRgb[1] &&
                                  c.color[2] === presetRgb[2]
                              );
                              return (
                                <button
                                  key={preset.hex}
                                  type="button"
                                  title={`${preset.name} (${preset.hex})`}
                                  onClick={() => {
                                    if (!alreadyAdded) {
                                      setForm((prev) => ({
                                        ...prev,
                                        allowedColors: [...prev.allowedColors, { color: presetRgb }],
                                      }));
                                    }
                                  }}
                                  className={`w-6 h-6 rounded-full border flex-shrink-0 relative transition-opacity ${
                                    alreadyAdded ? 'opacity-40 border-gray-400 cursor-default' : 'border-gray-300 hover:scale-110 hover:border-gray-500'
                                  }`}
                                  style={{ backgroundColor: preset.hex }}
                                >
                                  {alreadyAdded && (
                                    <FiCheck className="absolute inset-0 m-auto text-gray-700" size={12} />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Existing color list */}
                <div className="space-y-2">
                  {form.allowedColors.map((c, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveColorIndex(idx)}
                        className={`w-8 h-8 rounded-full border-2 flex-shrink-0 ${
                          idx === activeColorIndex ? 'border-indigo-500 ring-2 ring-indigo-300' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: rgb01ToHex(c.color as [number, number, number]) }}
                        title="클릭하여 미리보기에 적용"
                      />
                      <input
                        type="color"
                        value={rgb01ToHex(c.color as [number, number, number])}
                        onChange={(e) => {
                          const hex = e.target.value;
                          const rgb = hexToRgb01(hex);
                          setForm((prev) => ({
                            ...prev,
                            allowedColors: prev.allowedColors.map((col, i) =>
                              i === idx ? { color: rgb } : col
                            ),
                          }));
                        }}
                        className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={rgb01ToHex(c.color as [number, number, number])}
                        onChange={(e) => {
                          const hex = e.target.value;
                          if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
                            const rgb = hexToRgb01(hex);
                            setForm((prev) => ({
                              ...prev,
                              allowedColors: prev.allowedColors.map((col, i) =>
                                i === idx ? { color: rgb } : col
                              ),
                            }));
                          }
                        }}
                        className="w-24 px-2 py-1 text-sm border border-gray-300 rounded"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setForm((prev) => ({
                            ...prev,
                            allowedColors: prev.allowedColors.filter((_, i) => i !== idx),
                          }));
                          if (activeColorIndex >= form.allowedColors.length - 1) {
                            setActiveColorIndex(Math.max(0, form.allowedColors.length - 2));
                          }
                        }}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setForm((prev) => ({
                      ...prev,
                      allowedColors: [...prev.allowedColors, { color: hexToRgb01('#CC0000') }],
                    }));
                  }}
                  className="mt-2 inline-flex items-center text-sm text-indigo-600 hover:text-indigo-700"
                >
                  <FiPlus className="mr-1" /> 추가
                </button>
              </div>
            )}

            {/* === Part-specific: GLB Upload + Three.js Preview === */}
            {form.assetType === 'part' && (
              <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-semibold text-gray-800">GLB 모델 업로드</h3>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".glb,.gltf"
                  onChange={handleGlbSelect}
                  className="hidden"
                />
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <FiUpload className="mr-2" />
                    GLB 파일 선택
                  </button>
                  <p className="text-sm text-gray-500">최대 20MB</p>
                </div>
                {glbSizeError && (
                  <p className="text-xs text-red-600 mt-1">{glbSizeError}</p>
                )}
                {glbFile && (
                  <p className="text-xs text-gray-500">
                    선택된 파일: {glbFile.name} ({(glbFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}

                {/* Upload progress */}
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

                {/* Three.js preview (lazy loaded) */}
                {form.modelUrl && (
                  <Suspense fallback={<div className="text-xs text-gray-400 py-2">3D 프리뷰 로딩 중...</div>}>
                    <GLBPreview
                      modelUrl={form.modelUrl}
                      color={form.allowedColors[activeColorIndex]?.color as [number, number, number] | undefined}
                      onCapture={handlePreviewCapture}
                    />
                  </Suspense>
                )}

                {isAutoCapturing && (
                  <p className="text-xs text-indigo-600 mt-1">자동 캡처 및 업로드 중...</p>
                )}

                {form.previewUrl && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1">저장된 미리보기: <span className="text-gray-400">(최대 5MB)</span></p>
                    <img src={form.previewUrl} alt="preview" className="w-24 h-24 object-contain border rounded" />
                  </div>
                )}
              </div>
            )}

            {/* === Sticker-specific: SVG === */}
            {form.assetType === 'sticker' && (
              <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-semibold text-gray-800">SVG 설정</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SVG Path</label>
                  <textarea
                    value={form.svgPath}
                    onChange={(e) => setForm({ ...form, svgPath: e.target.value })}
                    rows={3}
                    placeholder="M10 10 L90 10 L90 90 ..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">viewBox</label>
                    <input
                      type="text"
                      value={form.viewBox}
                      onChange={(e) => setForm({ ...form, viewBox: e.target.value })}
                      placeholder="0 0 100 100"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">기본 색상</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={form.defaultColor}
                        onChange={(e) => setForm({ ...form, defaultColor: e.target.value })}
                        className="w-10 h-10 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={form.defaultColor}
                        onChange={(e) => setForm({ ...form, defaultColor: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
                <SVGPreview svgPath={form.svgPath} viewBox={form.viewBox} color={form.defaultColor} />
              </div>
            )}

            {/* === Part-specific: Allowed Materials === */}
            {form.assetType === 'part' && (
              <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-semibold text-gray-800">허용 재질 ({form.allowedMaterials.length})</h3>
                <div className="flex flex-wrap gap-2">
                  {MATERIAL_OPTIONS.map((mat) => {
                    const selected = form.allowedMaterials.includes(mat);
                    const preset = MATERIAL_PRESETS[mat];
                    return (
                      <button
                        key={mat}
                        type="button"
                        onClick={() =>
                          setForm({
                            ...form,
                            allowedMaterials: selected
                              ? form.allowedMaterials.filter((m) => m !== mat)
                              : [...form.allowedMaterials, mat],
                          })
                        }
                        className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                          selected
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                        }`}
                        title={`metalness: ${preset.metalness}, roughness: ${preset.roughness}, clearcoat: ${preset.clearcoat}`}
                      >
                        {mat}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tags — Chip Select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Themes</label>
              <div className="flex flex-wrap gap-2">
                {THEME_OPTIONS.map((theme) => {
                  const selected = form.tags.themes.includes(theme);
                  return (
                    <button
                      key={theme}
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          tags: {
                            ...form.tags,
                            themes: selected
                              ? form.tags.themes.filter((t) => t !== theme)
                              : [...form.tags.themes, theme],
                          },
                        })
                      }
                      className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                        selected
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {theme}
                    </button>
                  );
                })}
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
              disabled={!form.nameEn || !form.nameKo || submitting}
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
