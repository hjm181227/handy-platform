import React, { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { webApiService, imageService } from '../../services/apiService';
import type { SnapCreateRequest, SnapNailCategories } from '@handy-platform/shared';

interface SnapUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface UploadingImage {
  file: File;
  preview: string;
  uploading: boolean;
  uploaded: boolean;
  imageUrl?: string;
  error?: string;
}

// Nail category options (matching backend constants)
export const NAIL_STYLES = [
  { value: 'new', labelKey: 'product:categoryFilter.style_new' },
  { value: 'simple', labelKey: 'product:categoryFilter.style_simple' },
  { value: 'luxury', labelKey: 'product:categoryFilter.style_fancy' },
  { value: 'art', labelKey: 'product:categoryFilter.style_art' },
  { value: 'trendy', labelKey: 'product:categoryFilter.style_trendy' },
  { value: 'classic', labelKey: 'product:categoryFilter.style_classic' },
  { value: 'season', labelKey: 'product:categoryFilter.style_season' },
  { value: 'theme', labelKey: 'product:categoryFilter.style_theme' },
  { value: 'kitsch', labelKey: 'product:categoryFilter.style_kitsch' },
  { value: 'natural', labelKey: 'product:categoryFilter.style_natural' },
];

export const NAIL_COLORS = [
  { value: 'red', labelKey: 'product:categoryFilter.color_red' },
  { value: 'pink', labelKey: 'product:categoryFilter.color_pink' },
  { value: 'blue', labelKey: 'product:categoryFilter.color_blue' },
  { value: 'green', labelKey: 'product:categoryFilter.color_green' },
  { value: 'neutral', labelKey: 'product:categoryFilter.color_neutral' },
  { value: 'black-white', labelKey: 'product:categoryFilter.color_blackWhite' },
];

export const NAIL_TEXTURES = [
  { value: 'glitter', labelKey: 'product:categoryFilter.texture_glitter' },
  { value: 'chrome-metal', labelKey: 'product:categoryFilter.texture_chrome' },
  { value: 'matte', labelKey: 'product:categoryFilter.texture_matte' },
  { value: 'velvet', labelKey: 'product:categoryFilter.texture_velvet' },
  { value: 'gel', labelKey: 'product:categoryFilter.texture_gel' },
  { value: 'magnetic', labelKey: 'product:categoryFilter.texture_magnet' },
];

export const NAIL_TPOS = [
  { value: 'daily', labelKey: 'product:categoryFilter.tpo_daily' },
  { value: 'party', labelKey: 'product:categoryFilter.tpo_party' },
  { value: 'wedding', labelKey: 'product:categoryFilter.tpo_wedding' },
  { value: 'performance', labelKey: 'product:categoryFilter.tpo_performance' },
  { value: 'special-day', labelKey: 'product:categoryFilter.tpo_special' },
];

export const NAIL_NATIONS = [
  { value: 'kr', labelKey: 'nail:design.solid' }, // K네일 - using a fallback, these are brand-specific
  { value: 'jp', labelKey: 'nail:design.solid' },
  { value: 'us', labelKey: 'nail:design.solid' },
];

// Keep nation labels as-is since they are special brand terms
const NAIL_NATION_LABELS: Record<string, string> = {
  kr: 'K네일',
  jp: 'J네일',
  us: 'A네일',
};

export const NAIL_SHAPES = [
  { value: 'ROUND', labelKey: 'nail:shape.ROUND' },
  { value: 'ALMOND', labelKey: 'nail:shape.ALMOND' },
  { value: 'OVAL', labelKey: 'nail:shape.OVAL' },
  { value: 'STILETTO', labelKey: 'nail:shape.STILETTO' },
  { value: 'SQUARE', labelKey: 'nail:shape.SQUARE' },
  { value: 'COFFIN', labelKey: 'nail:shape.COFFIN' },
];

export const NAIL_LENGTHS = [
  { value: 'SHORT', labelKey: 'nail:length.SHORT' },
  { value: 'MEDIUM', labelKey: 'nail:length.MEDIUM' },
  { value: 'LONG', labelKey: 'nail:length.LONG' },
];

const SnapUploadModal: React.FC<SnapUploadModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { t } = useTranslation(['common', 'product', 'nail']);
  const [step, setStep] = useState<1 | 2>(1); // 1: images, 2: details
  const [images, setImages] = useState<UploadingImage[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedTextures, setSelectedTextures] = useState<string[]>([]);
  const [selectedTpos, setSelectedTpos] = useState<string[]>([]);
  const [selectedNation, setSelectedNation] = useState('');
  const [selectedShape, setSelectedShape] = useState('');
  const [selectedLength, setSelectedLength] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = useCallback(() => {
    images.forEach(img => URL.revokeObjectURL(img.preview));
    setStep(1);
    setImages([]);
    setTitle('');
    setDescription('');
    setTagInput('');
    setTags([]);
    setSelectedStyles([]);
    setSelectedColors([]);
    setSelectedTextures([]);
    setSelectedTpos([]);
    setSelectedNation('');
    setSelectedShape('');
    setSelectedLength('');
    setSubmitting(false);
    setError('');
  }, [images]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remaining = 10 - images.length;
    const selected = files.slice(0, remaining);

    const newImages: UploadingImage[] = selected.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      uploading: false,
      uploaded: false,
    }));

    setImages(prev => [...prev, ...newImages]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setImages(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const reorderImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= images.length) return;
    setImages(prev => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
  };

  const uploadImage = async (file: File): Promise<string> => {
    const presignedResponse = await imageService.getPresignedUrl({
      filename: file.name,
      contentType: file.type,
      uploadType: 'snap',
    });

    const uploadHeaders: Record<string, string> = {
      'Content-Type': file.type,
    };
    if ((presignedResponse as any).uploadHeaders) {
      Object.assign(uploadHeaders, (presignedResponse as any).uploadHeaders);
    }

    await fetch(presignedResponse.presignedUrl, {
      method: 'PUT',
      body: file,
      headers: uploadHeaders,
    });

    return presignedResponse.imageUrl;
  };

  const uploadAllImages = async (): Promise<boolean> => {
    let allSuccess = true;
    const updatedImages = [...images];

    for (let i = 0; i < updatedImages.length; i++) {
      if (updatedImages[i].uploaded && updatedImages[i].imageUrl) continue;

      updatedImages[i] = { ...updatedImages[i], uploading: true, error: undefined };
      setImages([...updatedImages]);

      try {
        const imageUrl = await uploadImage(updatedImages[i].file);
        updatedImages[i] = { ...updatedImages[i], uploading: false, uploaded: true, imageUrl };
        setImages([...updatedImages]);
      } catch (err) {
        updatedImages[i] = { ...updatedImages[i], uploading: false, error: t('common:snap.uploadFailed') };
        setImages([...updatedImages]);
        allSuccess = false;
      }
    }

    return allSuccess;
  };

  const handleNextStep = async () => {
    if (images.length === 0) {
      setError(t('common:snap.addImageMin'));
      return;
    }
    setError('');

    const success = await uploadAllImages();
    if (!success) {
      setError(t('common:snap.partialUploadFailed'));
      return;
    }

    setStep(2);
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (!tag || tags.length >= 10 || tags.includes(tag)) return;
    setTags(prev => [...prev, tag]);
    setTagInput('');
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const removeTag = (index: number) => {
    setTags(prev => prev.filter((_, i) => i !== index));
  };

  const toggleMultiSelect = (
    value: string,
    selected: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    max = 3
  ) => {
    if (selected.includes(value)) {
      setter(prev => prev.filter(v => v !== value));
    } else if (selected.length < max) {
      setter(prev => [...prev, value]);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');

    try {
      const nailCategories: SnapNailCategories = {};
      if (selectedStyles.length > 0) nailCategories.style = selectedStyles;
      if (selectedColors.length > 0) nailCategories.color = selectedColors;
      if (selectedTextures.length > 0) nailCategories.texture = selectedTextures;
      if (selectedTpos.length > 0) nailCategories.tpo = selectedTpos;
      if (selectedNation) nailCategories.nation = selectedNation;

      const requestData: SnapCreateRequest = {
        images: images.map((img, idx) => ({
          imageUrl: img.imageUrl!,
          sortOrder: idx,
        })),
        tags: tags.length > 0 ? tags : undefined,
        nailCategories: Object.keys(nailCategories).length > 0 ? nailCategories : undefined,
        nailShape: selectedShape || undefined,
        nailLength: selectedLength || undefined,
      };
      if (title.trim()) requestData.title = title.trim();
      if (description.trim()) requestData.description = description.trim();

      await webApiService.snap.createSnap(requestData);
      handleClose();
      onSuccess();
    } catch (err: any) {
      setError(err.message || t('common:snap.snapSubmitFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-2xl border-b px-5 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            {step === 2 && (
              <button onClick={() => setStep(1)} className="text-gray-500 hover:text-gray-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <h2 className="text-lg font-bold text-gray-900">
              {step === 1 ? t('common:snap.selectPhotos') : t('common:snap.snapInfo')}
            </h2>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>
          )}

          {/* Step 1: Image Selection */}
          {step === 1 && (
            <div>
              <p className="text-sm text-gray-500 mb-4">
                {t('common:snap.uploadHint')}
              </p>

              {/* Image Grid */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {images.map((img, idx) => (
                  <div key={idx} className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 group">
                    <img src={img.preview} alt="" className="w-full h-full object-cover" />

                    {/* Upload status overlay */}
                    {img.uploading && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                    {img.uploaded && (
                      <div className="absolute top-1.5 left-1.5">
                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}
                    {img.error && (
                      <div className="absolute inset-0 bg-red-500/30 flex items-center justify-center">
                        <span className="text-white text-xs font-medium bg-red-500 px-2 py-1 rounded">{t('common:snap.failed')}</span>
                      </div>
                    )}

                    {/* First image badge */}
                    {idx === 0 && (
                      <div className="absolute top-1.5 right-1.5 bg-[#E85A6B] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                        {t('common:snap.representative')}
                      </div>
                    )}

                    {/* Actions overlay */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex justify-between items-center">
                        <div className="flex gap-1">
                          {idx > 0 && (
                            <button
                              onClick={() => reorderImage(idx, idx - 1)}
                              className="w-6 h-6 bg-white/80 rounded-full flex items-center justify-center text-gray-700 hover:bg-white"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                              </svg>
                            </button>
                          )}
                          {idx < images.length - 1 && (
                            <button
                              onClick={() => reorderImage(idx, idx + 1)}
                              className="w-6 h-6 bg-white/80 rounded-full flex items-center justify-center text-gray-700 hover:bg-white"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          )}
                        </div>
                        <button
                          onClick={() => removeImage(idx)}
                          className="w-6 h-6 bg-red-500/80 rounded-full flex items-center justify-center text-white hover:bg-red-600"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add button */}
                {images.length < 10 && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-[3/4] rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-[#E85A6B] hover:text-[#E85A6B] transition-colors"
                  >
                    <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-xs">{images.length}/10</span>
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />

              <button
                onClick={handleNextStep}
                disabled={images.length === 0 || images.some(i => i.uploading)}
                className="w-full py-3 bg-[#E85A6B] text-white font-medium rounded-xl hover:bg-[#D14A5B] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {images.some(i => i.uploading) ? t('common:snap.uploading') : t('common:next')}
              </button>
            </div>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <div className="space-y-5">
              {/* Preview thumbnails */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <div key={idx} className="flex-shrink-0 w-14 h-18 rounded-lg overflow-hidden">
                    <img src={img.preview} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('common:snap.titleOptional')}</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  maxLength={100}
                  placeholder={t('common:snap.titlePlaceholder')}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#E85A6B] focus:border-[#E85A6B]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('common:snap.descriptionOptional')}</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  maxLength={500}
                  rows={3}
                  placeholder={t('common:snap.descriptionPlaceholder')}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#E85A6B] focus:border-[#E85A6B] resize-none"
                />
                <p className="text-xs text-gray-400 mt-1 text-right">{description.length}/500</p>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('common:snap.tagsLabel')}</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder={t('common:snap.tagPlaceholder')}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#E85A6B] focus:border-[#E85A6B]"
                  />
                  <button
                    onClick={addTag}
                    disabled={!tagInput.trim() || tags.length >= 10}
                    className="px-3 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200 disabled:opacity-50"
                  >
                    {t('product:review.addImage')}
                  </button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#FFF1F2] text-[#E85A6B] text-xs rounded-full">
                        #{tag}
                        <button onClick={() => removeTag(idx)} className="hover:text-blue-900">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Nail Categories */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-800">{t('common:snap.nailCategories')}</h3>

                {/* Style */}
                <CategoryChipGroup
                  label={t('product:categoryType.style')}
                  options={NAIL_STYLES.map(o => ({ value: o.value, label: t(o.labelKey) }))}
                  selected={selectedStyles}
                  onToggle={v => toggleMultiSelect(v, selectedStyles, setSelectedStyles)}
                  max={3}
                  maxLabel={t('common:snap.maxItems', { max: 3 })}
                />

                {/* Color */}
                <CategoryChipGroup
                  label={t('product:categoryType.color')}
                  options={NAIL_COLORS.map(o => ({ value: o.value, label: t(o.labelKey) }))}
                  selected={selectedColors}
                  onToggle={v => toggleMultiSelect(v, selectedColors, setSelectedColors)}
                  max={3}
                  maxLabel={t('common:snap.maxItems', { max: 3 })}
                />

                {/* Texture */}
                <CategoryChipGroup
                  label={t('product:categoryType.texture')}
                  options={NAIL_TEXTURES.map(o => ({ value: o.value, label: t(o.labelKey) }))}
                  selected={selectedTextures}
                  onToggle={v => toggleMultiSelect(v, selectedTextures, setSelectedTextures)}
                  max={3}
                  maxLabel={t('common:snap.maxItems', { max: 3 })}
                />

                {/* TPO */}
                <CategoryChipGroup
                  label="TPO"
                  options={NAIL_TPOS.map(o => ({ value: o.value, label: t(o.labelKey) }))}
                  selected={selectedTpos}
                  onToggle={v => toggleMultiSelect(v, selectedTpos, setSelectedTpos)}
                  max={3}
                  maxLabel={t('common:snap.maxItems', { max: 3 })}
                />

                {/* Nation */}
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1.5">{t('common:snap.nailStyle')}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(NAIL_NATION_LABELS).map(([value, label]) => (
                      <button
                        key={value}
                        onClick={() => setSelectedNation(selectedNation === value ? '' : value)}
                        className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                          selectedNation === value
                            ? 'bg-[#E85A6B] text-white border-[#E85A6B]'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-[#E85A6B]'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Shape */}
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1.5">{t('common:snap.nailShape')}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {NAIL_SHAPES.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setSelectedShape(selectedShape === opt.value ? '' : opt.value)}
                        className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                          selectedShape === opt.value
                            ? 'bg-[#E85A6B] text-white border-[#E85A6B]'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-[#E85A6B]'
                        }`}
                      >
                        {t(opt.labelKey)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Length */}
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1.5">{t('common:snap.nailLength')}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {NAIL_LENGTHS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setSelectedLength(selectedLength === opt.value ? '' : opt.value)}
                        className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                          selectedLength === opt.value
                            ? 'bg-[#E85A6B] text-white border-[#E85A6B]'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-[#E85A6B]'
                        }`}
                      >
                        {t(opt.labelKey)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full py-3 bg-[#E85A6B] text-white font-medium rounded-xl hover:bg-[#D14A5B] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t('common:snap.snapSubmitting')}
                  </span>
                ) : (
                  t('common:snap.snapSubmit')
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Reusable chip group for multi-select categories
interface CategoryChipGroupProps {
  label: string;
  options: Array<{ value: string; label: string }>;
  selected: string[];
  onToggle: (value: string) => void;
  max: number;
  maxLabel: string;
}

const CategoryChipGroup: React.FC<CategoryChipGroupProps> = ({ label, options, selected, onToggle, max, maxLabel }) => (
  <div>
    <p className="text-xs font-medium text-gray-600 mb-1.5">
      {label} <span className="text-gray-400">({maxLabel})</span>
    </p>
    <div className="flex flex-wrap gap-1.5">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onToggle(opt.value)}
          className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
            selected.includes(opt.value)
              ? 'bg-[#E85A6B] text-white border-[#E85A6B]'
              : 'bg-white text-gray-600 border-gray-200 hover:border-[#E85A6B]'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  </div>
);

export default SnapUploadModal;
