import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@handy-platform/shared';

const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  ko: '한국어',
  en: 'English',
  ja: '日本語',
};

interface LanguageSelectorProps {
  variant?: 'dropdown' | 'buttons';
  className?: string;
}

export function LanguageSelector({ variant = 'buttons', className = '' }: LanguageSelectorProps) {
  const { i18n } = useTranslation('mypage');
  const currentLang = i18n.language as SupportedLanguage;

  const handleChange = (lang: SupportedLanguage) => {
    i18n.changeLanguage(lang);
    // Notify mobile WebView if in WebView context
    if ((window as any).ReactNativeWebView) {
      (window as any).ReactNativeWebView.postMessage(JSON.stringify({
        type: 'LANGUAGE_CHANGED',
        data: { language: lang },
      }));
    }
  };

  if (variant === 'dropdown') {
    return (
      <select
        value={currentLang}
        onChange={(e) => handleChange(e.target.value as SupportedLanguage)}
        className={`rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand ${className}`}
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang} value={lang}>
            {LANGUAGE_LABELS[lang]}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div className={`flex gap-2 ${className}`}>
      {SUPPORTED_LANGUAGES.map((lang) => (
        <button
          key={lang}
          onClick={() => handleChange(lang)}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            currentLang === lang
              ? 'bg-brand text-white'
              : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          {LANGUAGE_LABELS[lang]}
        </button>
      ))}
    </div>
  );
}
