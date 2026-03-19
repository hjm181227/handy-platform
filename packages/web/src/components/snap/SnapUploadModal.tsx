import React, { useState, useRef, useCallback } from 'react';
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
  { value: 'new', label: '신상' },
  { value: 'simple', label: '심플' },
  { value: 'luxury', label: '화려' },
  { value: 'art', label: '아트' },
  { value: 'trendy', label: '트렌디' },
  { value: 'classic', label: '클래식' },
  { value: 'season', label: '시즌' },
  { value: 'theme', label: '테마' },
  { value: 'kitsch', label: '키치' },
  { value: 'natural', label: '네츄럴' },
];

export const NAIL_COLORS = [
  { value: 'red', label: '레드' },
  { value: 'pink', label: '핑크' },
  { value: 'blue', label: '블루' },
  { value: 'green', label: '그린' },
  { value: 'neutral', label: '뉴트럴' },
  { value: 'black-white', label: '블랙/화이트' },
];

export const NAIL_TEXTURES = [
  { value: 'glitter', label: '글리터' },
  { value: 'chrome-metal', label: '크롬/메탈' },
  { value: 'matte', label: '매트' },
  { value: 'velvet', label: '벨벳' },
  { value: 'gel', label: '젤' },
  { value: 'magnetic', label: '자석' },
];

export const NAIL_TPOS = [
  { value: 'daily', label: '데일리' },
  { value: 'party', label: '파티' },
  { value: 'wedding', label: '웨딩' },
  { value: 'performance', label: '공연' },
  { value: 'special-day', label: 'Special Day' },
];

export const NAIL_NATIONS = [
  { value: 'kr', label: 'K네일' },
  { value: 'jp', label: 'J네일' },
  { value: 'us', label: 'A네일' },
];

export const NAIL_SHAPES = [
  { value: 'ROUND', label: '라운드' },
  { value: 'ALMOND', label: '아몬드' },
  { value: 'OVAL', label: '오벌' },
  { value: 'STILETTO', label: '스틸레토' },
  { value: 'SQUARE', label: '스퀘어' },
  { value: 'COFFIN', label: '코핀' },
];

export const NAIL_LENGTHS = [
  { value: 'SHORT', label: '숏' },
  { value: 'MEDIUM', label: '미디움' },
  { value: 'LONG', label: '롱' },
];

const SnapUploadModal: React.FC<SnapUploadModalProps> = ({ isOpen, onClose, onSuccess }) => {
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
        updatedImages[i] = { ...updatedImages[i], uploading: false, error: '업로드 실패' };
        setImages([...updatedImages]);
        allSuccess = false;
      }
    }

    return allSuccess;
  };

  const handleNextStep = async () => {
    if (images.length === 0) {
      setError('이미지를 1장 이상 추가해주세요.');
      return;
    }
    setError('');

    const success = await uploadAllImages();
    if (!success) {
      setError('일부 이미지 업로드에 실패했습니다. 실패한 이미지를 삭제하고 다시 시도해주세요.');
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
      setError(err.message || '스냅 등록에 실패했습니다.');
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
              {step === 1 ? '사진 선택' : '스냅 정보'}
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
                최대 10장까지 업로드할 수 있어요. 첫 번째 사진이 대표 이미지로 사용됩니다.
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
                        <span className="text-white text-xs font-medium bg-red-500 px-2 py-1 rounded">실패</span>
                      </div>
                    )}

                    {/* First image badge */}
                    {idx === 0 && (
                      <div className="absolute top-1.5 right-1.5 bg-[#E85A6B] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                        대표
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
                {images.some(i => i.uploading) ? '업로드 중...' : '다음'}
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">제목 (선택)</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  maxLength={100}
                  placeholder="네일 아트 이름이나 설명"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#E85A6B] focus:border-[#E85A6B]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">설명 (선택)</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  maxLength={500}
                  rows={3}
                  placeholder="네일 아트에 대한 설명을 적어주세요"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#E85A6B] focus:border-[#E85A6B] resize-none"
                />
                <p className="text-xs text-gray-400 mt-1 text-right">{description.length}/500</p>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">태그 (최대 10개)</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder="#태그 입력 후 엔터"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#E85A6B] focus:border-[#E85A6B]"
                  />
                  <button
                    onClick={addTag}
                    disabled={!tagInput.trim() || tags.length >= 10}
                    className="px-3 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200 disabled:opacity-50"
                  >
                    추가
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
                <h3 className="text-sm font-semibold text-gray-800">네일 카테고리 (선택)</h3>

                {/* Style */}
                <CategoryChipGroup
                  label="스타일"
                  options={NAIL_STYLES}
                  selected={selectedStyles}
                  onToggle={v => toggleMultiSelect(v, selectedStyles, setSelectedStyles)}
                  max={3}
                />

                {/* Color */}
                <CategoryChipGroup
                  label="컬러"
                  options={NAIL_COLORS}
                  selected={selectedColors}
                  onToggle={v => toggleMultiSelect(v, selectedColors, setSelectedColors)}
                  max={3}
                />

                {/* Texture */}
                <CategoryChipGroup
                  label="텍스처"
                  options={NAIL_TEXTURES}
                  selected={selectedTextures}
                  onToggle={v => toggleMultiSelect(v, selectedTextures, setSelectedTextures)}
                  max={3}
                />

                {/* TPO */}
                <CategoryChipGroup
                  label="TPO"
                  options={NAIL_TPOS}
                  selected={selectedTpos}
                  onToggle={v => toggleMultiSelect(v, selectedTpos, setSelectedTpos)}
                  max={3}
                />

                {/* Nation */}
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1.5">네일 스타일</p>
                  <div className="flex flex-wrap gap-1.5">
                    {NAIL_NATIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setSelectedNation(selectedNation === opt.value ? '' : opt.value)}
                        className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                          selectedNation === opt.value
                            ? 'bg-[#E85A6B] text-white border-[#E85A6B]'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-[#E85A6B]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Shape */}
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1.5">네일 모양</p>
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
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Length */}
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1.5">네일 길이</p>
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
                        {opt.label}
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
                    등록 중...
                  </span>
                ) : (
                  '스냅 등록'
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
}

const CategoryChipGroup: React.FC<CategoryChipGroupProps> = ({ label, options, selected, onToggle, max }) => (
  <div>
    <p className="text-xs font-medium text-gray-600 mb-1.5">
      {label} <span className="text-gray-400">(최대 {max}개)</span>
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
