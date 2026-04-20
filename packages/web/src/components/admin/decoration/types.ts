export type ActiveTab = 'assets' | 'categories';

export interface AssetFilters {
  assetType: string;
  category: string;
  accessTier: string;
  status: string;
  search: string;
  sort: string;
}

export interface ColorEntry {
  color: [number, number, number];
}

export interface AssetFormData {
  nameEn: string;
  nameKo: string;
  descriptionEn: string;
  descriptionKo: string;
  assetType: 'part' | 'sticker';
  category: string;
  accessTier: 'free' | 'paid' | 'pro_only';
  tags: { themes: string[] };
  // part assets
  modelUrl: string;
  previewUrl: string;
  // sticker assets
  svgPath: string;
  viewBox: string;
  defaultColor: string;
  // colors & materials (part only)
  allowedColors: ColorEntry[];
  allowedMaterials: string[];
}

export interface CategoryFormData {
  slug: string;
  nameEn: string;
  nameKo: string;
  assetType: 'part' | 'sticker' | 'all';
  icon: string;
  isActive: boolean;
}
