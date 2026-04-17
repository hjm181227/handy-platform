export type ActiveTab = 'assets' | 'categories';

export interface AssetFilters {
  assetType: string;
  category: string;
  accessTier: string;
  status: string;
  search: string;
}

export interface VariantFormData {
  id: string;
  nameEn: string;
  nameKo: string;
  swatchColor: string;
  color: [number, number, number];
  metalness: number;
  roughness: number;
  clearcoat: number;
}

export interface AssetFormData {
  nameEn: string;
  nameKo: string;
  descriptionEn: string;
  descriptionKo: string;
  assetType: 'part' | 'sticker';
  category: string;
  accessTier: 'free' | 'paid' | 'pro_only';
  sortOrder: number;
  baseSize: number;
  tags: { themes: string; appearances: string };
  // part assets
  modelUrl: string;
  previewUrl: string;
  // sticker assets
  svgPath: string;
  viewBox: string;
  defaultColor: string;
  // variants (part only)
  variants: VariantFormData[];
}

export interface CategoryFormData {
  slug: string;
  nameEn: string;
  nameKo: string;
  assetType: 'part' | 'sticker' | 'all';
  sortOrder: number;
  icon: string;
  isActive: boolean;
}
