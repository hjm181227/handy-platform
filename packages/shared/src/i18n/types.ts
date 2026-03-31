import type { Resource } from 'i18next';

export const SUPPORTED_LANGUAGES = ['ko', 'en', 'ja'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

export const NAMESPACES = ['common', 'auth', 'product', 'order', 'mypage', 'nav', 'error', 'nail'] as const;
export type Namespace = typeof NAMESPACES[number];

export const DEFAULT_LANGUAGE: SupportedLanguage = 'ko';
export const FALLBACK_LANGUAGE: SupportedLanguage = 'ko';
