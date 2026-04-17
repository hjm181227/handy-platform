import { useState, useEffect, useRef } from 'react';
import { webApiService } from '../../../services/apiService';
import type { DecorationAsset, DecorationCategory } from '@handy-platform/shared';
import { FiCheck, FiX, FiPlus, FiTrash2, FiUpload } from 'react-icons/fi';
import type { AssetFormData } from './types';
import { GLBPreview } from './GLBPreview';
import { SVGPreview } from './SVGPreview';

const defaultAssetForm = (): AssetFormData => ({
  name: '',
  nameKo: '',
  description: '',
  descriptionKo: '',
  assetType: 'part',
  category: '',
  accessTier: 'free',
  sortOrder: 0,
  baseSize: 1,
  tags: { themes: '', appearances: '' },
  modelUrl: '',
  previewUrl: '',
  svgPath: '',
  viewBox: '0 0 100 100',
  defaultColor: '#FF0000',
  variants: [],
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (mode === 'edit' && initialData) {
      setForm({
        name: initialData.name,
        nameKo: initialData.nameKo,
        description: initialData.description || '',
        descriptionKo: initialData.descriptionKo || '',
        assetType: initialData.assetType,
        category: initialData.category,
        accessTier: initialData.accessTier,
        sortOrder: initialData.sortOrder,
        baseSize: initialData.baseSize || 1,
        tags: {
          themes: (initialData.tags?.themes || []).join(', '),
          appearances: (initialData.tags?.appearances || []).join(', '),
        },
        modelUrl: initialData.assets?.modelUrl || '',
        previewUrl: initialData.assets?.previewUrl || '',
        svgPath: initialData.assets?.svgPath || '',
        viewBox: initialData.assets?.viewBox || '0 0 100 100',
        defaultColor: initialData.defaultColor || '#FF0000',
        variants: (initialData.variants || []).map((v) => ({ ...v })),
      });
    } else {
      setForm(defaultAssetForm());
    }
    setGlbFile(null);
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
    const presigned = await webApiService.decoration.getDecorationPresignedUrl({
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
      xhr.open('PUT', presigned.presignedUrl);
      xhr.setRequestHeader('Content-Type', contentType);
      xhr.send(file);
    });

    setIsUploading(false);
    setUploadProgress(0);
    return presigned.fileUrl;
  };

  const handleGlbSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.glb') && !file.name.endsWith('.gltf')) {
      alert('GLB 또는 GLTF 파일만 지원합니다.');
      return;
    }
    setGlbFile(file);
    // Create a local object URL for preview
    const url = URL.createObjectURL(file);
    setForm((prev) => ({ ...prev, modelUrl: url }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePreviewCapture = async (blob: Blob) => {
    try {
      const fileUrl = await uploadFileToS3(blob, 'decoration-preview', `preview_${Date.now()}.png`, 'image/png');
      setForm((prev) => ({ ...prev, previewUrl: fileUrl }));
      alert('미리보기 이미지가 업로드되었습니다.');
    } catch (err: any) {
      alert(`미리보기 업로드 실패: ${err.message}`);
    }
  };

  // --- Variant helpers ---
  const addVariant = () => {
    setForm((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          id: `var_${Date.now()}`,
          name: '',
          nameKo: '',
          swatchColor: '#CCCCCC',
          color: [0.8, 0.8, 0.8] as [number, number, number],
          metalness: 0,
          roughness: 0.5,
          clearcoat: 0,
        },
      ],
    }));
  };

  const removeVariant = (idx: number) => {
    setForm((prev) => ({ ...prev, variants: prev.variants.filter((_, i) => i !== idx) }));
  };

  const updateVariant = (idx: number, field: string, value: any) => {
    setForm((prev) => {
      const variants = [...prev.variants];
      (variants[idx] as any)[field] = value;
      return { ...prev, variants };
    });
  };

  // --- Submit ---
  const handleSubmit = async () => {
    if (!form.name || !form.nameKo) {
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

      const parseTags = (str: string) =>
        str
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);

      const payload: Partial<DecorationAsset> = {
        name: form.name,
        nameKo: form.nameKo,
        description: form.description || undefined,
        descriptionKo: form.descriptionKo || undefined,
        assetType: form.assetType,
        category: form.category,
        accessTier: form.accessTier,
        sortOrder: form.sortOrder,
        tags: {
          themes: parseTags(form.tags.themes),
          appearances: parseTags(form.tags.appearances),
        },
        assets: {
          modelUrl: form.assetType === 'part' ? modelUrl : undefined,
          previewUrl: form.previewUrl,
          svgPath: form.assetType === 'sticker' ? form.svgPath : undefined,
          viewBox: form.assetType === 'sticker' ? form.viewBox : undefined,
        },
      };

      if (form.assetType === 'part') {
        payload.baseSize = form.baseSize;
        payload.variants = form.variants;
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
            {/* Row: name / nameKo */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name (EN) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
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

            {/* Row: description / descriptionKo */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (EN)</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
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
                        {c.nameKo} ({c.slug})
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

            {/* Row: sortOrder / baseSize */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">정렬 순서</label>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {form.assetType === 'part' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">기본 크기 (baseSize)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.baseSize}
                    onChange={(e) => setForm({ ...form, baseSize: parseFloat(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>

            {/* Tags */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Themes (콤마 구분)</label>
                <input
                  type="text"
                  value={form.tags.themes}
                  onChange={(e) => setForm({ ...form, tags: { ...form.tags, themes: e.target.value } })}
                  placeholder="wedding, party, daily"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Appearances (콤마 구분)</label>
                <input
                  type="text"
                  value={form.tags.appearances}
                  onChange={(e) => setForm({ ...form, tags: { ...form.tags, appearances: e.target.value } })}
                  placeholder="gold, silver, matte"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

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
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <FiUpload className="mr-2" />
                  GLB 파일 선택
                </button>
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

                {/* Three.js preview */}
                {form.modelUrl && (
                  <GLBPreview modelUrl={form.modelUrl} onCapture={handlePreviewCapture} />
                )}

                {form.previewUrl && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1">저장된 미리보기:</p>
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

            {/* === Part-specific: Variants === */}
            {form.assetType === 'part' && (
              <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-800">Variants ({form.variants.length})</h3>
                  <button
                    type="button"
                    onClick={addVariant}
                    className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100"
                  >
                    <FiPlus className="mr-1" /> 추가
                  </button>
                </div>

                {form.variants.map((v, idx) => (
                  <div key={idx} className="border border-gray-100 rounded-lg p-3 bg-gray-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-500">Variant #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeVariant(idx)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs text-gray-600">ID</label>
                        <input
                          type="text"
                          value={v.id}
                          onChange={(e) => updateVariant(idx, 'id', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600">Name</label>
                        <input
                          type="text"
                          value={v.name}
                          onChange={(e) => updateVariant(idx, 'name', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600">이름(KO)</label>
                        <input
                          type="text"
                          value={v.nameKo}
                          onChange={(e) => updateVariant(idx, 'nameKo', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="block text-xs text-gray-600">Swatch Color</label>
                        <input
                          type="color"
                          value={v.swatchColor}
                          onChange={(e) => updateVariant(idx, 'swatchColor', e.target.value)}
                          className="w-full h-8 border border-gray-300 rounded cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600">R (0-1)</label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={v.color[0]}
                          onChange={(e) => {
                            const c: [number, number, number] = [...v.color];
                            c[0] = parseFloat(e.target.value);
                            updateVariant(idx, 'color', c);
                          }}
                          className="w-full"
                        />
                        <span className="text-xs text-gray-500">{v.color[0].toFixed(2)}</span>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600">G (0-1)</label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={v.color[1]}
                          onChange={(e) => {
                            const c: [number, number, number] = [...v.color];
                            c[1] = parseFloat(e.target.value);
                            updateVariant(idx, 'color', c);
                          }}
                          className="w-full"
                        />
                        <span className="text-xs text-gray-500">{v.color[1].toFixed(2)}</span>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600">B (0-1)</label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={v.color[2]}
                          onChange={(e) => {
                            const c: [number, number, number] = [...v.color];
                            c[2] = parseFloat(e.target.value);
                            updateVariant(idx, 'color', c);
                          }}
                          className="w-full"
                        />
                        <span className="text-xs text-gray-500">{v.color[2].toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs text-gray-600">Metalness (0-1)</label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={v.metalness}
                          onChange={(e) => updateVariant(idx, 'metalness', parseFloat(e.target.value))}
                          className="w-full"
                        />
                        <span className="text-xs text-gray-500">{v.metalness.toFixed(2)}</span>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600">Roughness (0-1)</label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={v.roughness}
                          onChange={(e) => updateVariant(idx, 'roughness', parseFloat(e.target.value))}
                          className="w-full"
                        />
                        <span className="text-xs text-gray-500">{v.roughness.toFixed(2)}</span>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600">Clearcoat (0-1)</label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={v.clearcoat}
                          onChange={(e) => updateVariant(idx, 'clearcoat', parseFloat(e.target.value))}
                          className="w-full"
                        />
                        <span className="text-xs text-gray-500">{v.clearcoat.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
              disabled={!form.name || !form.nameKo || submitting}
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
