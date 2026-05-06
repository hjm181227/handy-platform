import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@handy-platform/shared';

const STORE_LINKS = {
  appStore: '#app-store',
  googlePlay: '#google-play',
};

const BASE_URL = 'https://h-andy.com';
const PAGE_PATH = '/handy-studio';
const OG_IMAGE = `${BASE_URL}/images/handy-studio-og.png`;

const SEO_DATA: Record<string, { title: string; description: string; keywords: string }> = {
  ko: {
    title: 'HandyStudio: 네일아트 디자인 툴 | 3D 네일 시뮬레이터',
    description: '네일 아티스트의 작업 효율과 수익을 높이는 스마트한 파트너. PBR 엔진 기반의 전문 네일 디자인 툴로 실제 젤의 광택과 특수 질감을 사실적으로 재현합니다.',
    keywords: '이달의아트,아트판,네일샵,젤네일,수제네일팁,시안제작,재료절약,매니큐어,살롱,뷰티,네일도안,스케치,고객상담,네일연습,셀프네일',
  },
  en: {
    title: 'HandyStudio: Nail Art Design Tool | 3D Nail Simulator',
    description: 'Maximize Efficiency and Profit for Professional Nail Artists. A pro-grade nail design tool powered by a PBR engine that recreates real gel textures with stunning accuracy.',
    keywords: 'nailtech,presson,salon,manicure,gelnail,sketch,mockup,practice,portfolio,business,beauty,pro',
  },
  ja: {
    title: 'HandyStudio: ネイルアートデザインツール | 3Dネイルシミュレーター',
    description: 'ネイルアーティストの作業効率と収益を高めるスマートパートナー。PBRエンジン搭載の本格ネイルデザインツールです。',
    keywords: 'ネイルテック,ジェルネイル,サロン,マニキュア,スケッチ,練習,カウンセリング,ポートフォリオ,セルフネイル',
  },
};

const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'HandyStudio',
  operatingSystem: 'iOS, Android',
  applicationCategory: 'LifestyleApplication',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'KRW',
    description: 'Free with in-app purchases',
  },
};

interface HandyStudioPageProps {
  onGo: (to: string) => void;
}

export function HandyStudioPage({ onGo }: HandyStudioPageProps) {
  const { t, i18n } = useTranslation('common');

  // ?lang= 쿼리 파라미터로 언어 전환 지원
  useEffect(() => {
    const langParam = new URLSearchParams(window.location.search).get('lang');
    if (langParam && (SUPPORTED_LANGUAGES as readonly string[]).includes(langParam)) {
      i18n.changeLanguage(langParam as SupportedLanguage);
    }
  }, [i18n]);

  const lang = i18n.language?.substring(0, 2) || 'ko';
  const seo = SEO_DATA[lang] || SEO_DATA.ko;
  const pageUrl = `${BASE_URL}${PAGE_PATH}`;

  return (
    <div className="min-h-screen bg-white">
        <Helmet>
          <html lang={lang} />
          <title>{seo.title}</title>
          <meta name="description" content={seo.description} />
          <meta name="keywords" content={seo.keywords} />
          <link rel="canonical" href={pageUrl} />

          {/* Open Graph */}
          <meta property="og:title" content={seo.title} />
          <meta property="og:description" content={seo.description} />
          <meta property="og:image" content={OG_IMAGE} />
          <meta property="og:url" content={pageUrl} />
          <meta property="og:type" content="website" />
          <meta property="og:site_name" content="HandyStudio" />

          {/* Twitter Card */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={seo.title} />
          <meta name="twitter:description" content={seo.description} />
          <meta name="twitter:image" content={OG_IMAGE} />

          {/* hreflang */}
          <link rel="alternate" hrefLang="ko" href={`${pageUrl}?lang=ko`} />
          <link rel="alternate" hrefLang="en" href={`${pageUrl}?lang=en`} />
          <link rel="alternate" hrefLang="ja" href={`${pageUrl}?lang=ja`} />
          <link rel="alternate" hrefLang="x-default" href={pageUrl} />

          {/* JSON-LD */}
          <script type="application/ld+json">{JSON.stringify(JSON_LD)}</script>
        </Helmet>

        {/* ─── Hero Section ─── */}
        <section className="relative overflow-hidden bg-gradient-to-b from-pink-50 via-white to-white">
          <div className="max-w-7xl mx-auto px-4 pt-16 pb-20 md:pt-24 md:pb-28">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 tracking-tight">
                HandyStudio
              </h1>
              <p className="mt-4 text-lg md:text-xl text-gray-600 leading-relaxed">
                {t('handyStudio.heroSubtitle')}
              </p>

              {/* CTA 버튼 */}
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href={STORE_LINKS.appStore}
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors w-full sm:w-auto justify-center"
                >
                  <AppleIcon />
                  App Store
                </a>
                <a
                  href={STORE_LINKS.googlePlay}
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-white text-gray-900 border-2 border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors w-full sm:w-auto justify-center"
                >
                  <GooglePlayIcon />
                  Google Play
                </a>
              </div>

              {/* 앱 스크린샷 영역 */}
              <div className="mt-12 relative">
                <div className="bg-gradient-to-b from-gray-100 to-gray-50 rounded-3xl p-6 md:p-10">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 max-w-4xl mx-auto">
                    <img
                      src="/images/handy-studio/screenshot-1.png"
                      alt={t('handyStudio.screenshotPlaceholder')}
                      className="w-full h-auto rounded-2xl shadow-lg"
                      loading="lazy"
                    />
                    <img
                      src="/images/handy-studio/screenshot-2.png"
                      alt={t('handyStudio.screenshotPlaceholder')}
                      className="w-full h-auto rounded-2xl shadow-lg"
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Features Section ─── */}
        <section className="py-16 md:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                {t('handyStudio.featuresTitle')}
              </h2>
              <p className="mt-3 text-gray-500 text-lg max-w-2xl mx-auto">
                {t('handyStudio.featuresSubtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureCard
                icon={<SparklesIcon />}
                title={t('handyStudio.feature1Title')}
                description={t('handyStudio.feature1Desc')}
              />
              <FeatureCard
                icon={<CubeIcon />}
                title={t('handyStudio.feature2Title')}
                description={t('handyStudio.feature2Desc')}
              />
              <FeatureCard
                icon={<LayersIcon />}
                title={t('handyStudio.feature3Title')}
                description={t('handyStudio.feature3Desc')}
              />
              <FeatureCard
                icon={<DecoIcon />}
                title={t('handyStudio.feature4Title')}
                description={t('handyStudio.feature4Desc')}
              />
              <FeatureCard
                icon={<FingerPrintIcon />}
                title={t('handyStudio.feature5Title')}
                description={t('handyStudio.feature5Desc')}
              />
              <FeatureCard
                icon={<FolderIcon />}
                title={t('handyStudio.feature6Title')}
                description={t('handyStudio.feature6Desc')}
              />
            </div>
          </div>
        </section>

        {/* ─── Plans Section ─── */}
        <section className="py-16 md:py-24 bg-gray-50">
          <div className="max-w-3xl mx-auto px-4">
            {/* Step 1: 무료 체험 */}
            <div className="text-center mb-12">
              <span className="inline-block bg-green-100 text-green-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
                {t('handyStudio.planFreeTag')}
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                {t('handyStudio.planFreeHeading')}
              </h2>
              <p className="mt-3 text-gray-500 text-lg max-w-2xl mx-auto">
                {t('handyStudio.planFreeDesc')}
              </p>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 my-12">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-sm text-gray-400 font-medium">{t('handyStudio.planDivider')}</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Step 2: Pro 업그레이드 */}
            <div className="bg-white rounded-2xl p-8 md:p-10 border-2 border-pink-200">
              <div className="text-center">
                <span className="inline-block bg-pink-500 text-white text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
                  Pro
                </span>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900">
                  {t('handyStudio.planProHeading')}
                </h3>
                <p className="mt-2 text-gray-500">
                  {t('handyStudio.planProDesc')}
                </p>
              </div>

              <ul className="mt-8 space-y-3 max-w-md mx-auto">
                {[1, 2, 3].map((i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-900">
                    <CheckIcon className="w-5 h-5 text-pink-500 shrink-0 mt-0.5" />
                    <span className="text-sm font-medium">{t(`handyStudio.planProFeature${i}`)}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 text-center">
                <p className="text-3xl font-bold text-pink-600">{t('handyStudio.planProPrice')}</p>
                <button
                  onClick={() => onGo('/design-tool/subscription')}
                  className="mt-4 inline-flex items-center gap-2 px-8 py-3.5 bg-pink-500 text-white rounded-xl font-medium hover:bg-pink-600 transition-colors"
                >
                  {t('handyStudio.planProButton')}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ─── CTA Section ─── */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-white to-pink-50">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              {t('handyStudio.ctaTitle')}
            </h2>
            <p className="mt-3 text-gray-600 text-lg">
              {t('handyStudio.ctaSubtitle')}
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href={STORE_LINKS.appStore}
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors w-full sm:w-auto justify-center"
              >
                <AppleIcon />
                App Store
              </a>
              <a
                href={STORE_LINKS.googlePlay}
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-white text-gray-900 border-2 border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors w-full sm:w-auto justify-center"
              >
                <GooglePlayIcon />
                Google Play
              </a>
            </div>
          </div>
        </section>

        {/* ─── Footer Links ─── */}
        <section className="py-8 border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-center gap-4 text-sm text-gray-400">
            <button onClick={() => onGo('/policy/terms')} className="hover:text-gray-600 transition-colors">
              {t('handyStudio.terms')}
            </button>
            <span className="text-gray-200">|</span>
            <button onClick={() => onGo('/policy/privacy')} className="hover:text-gray-600 transition-colors">
              {t('handyStudio.privacy')}
            </button>
          </div>
        </section>
    </div>
  );
}

// ─── Sub-components ───

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-gray-50 rounded-2xl p-6 hover:bg-gray-100 transition-colors">
      <div className="w-12 h-12 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

// ─── Icons ───

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
      <path d="M16.36 12.2c0-2.3 1.88-3.35 1.96-3.4-1.08-1.58-2.75-1.8-3.35-1.82-1.42-.14-2.8.83-3.53.83-.74 0-1.86-.81-3.05-.79-1.57.02-3 .91-3.8 2.31-1.63 2.83-.42 7.02 1.17 9.32.78 1.12 1.71 2.38 2.93 2.34 1.18-.05 1.63-.76 3.06-.76s1.83.76 3.06.73c1.27-.02 2.07-1.14 2.84-2.26.89-1.29 1.26-2.54 1.27-2.6-.03-.01-2.43-.93-2.56-3.9zM14.9 4.9c.64-.77 1.08-1.85.96-2.93-.92.04-2.03.61-2.69 1.38-.59.69-1.11 1.78-.97 2.83 1.02.08 2.06-.52 2.7-1.28z" />
    </svg>
  );
}

function GooglePlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
      <path d="M3.61 1.814L13.793 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.61-.92zm10.895 9.476l2.56-2.56 3.59 2.07c.69.4.69 1.01 0 1.41l-3.59 2.07-2.56-2.56-.43-.43.43-.43v.43-.43zm-1.12 1.12L4.2 21.596l9.07-5.24 .115-.115v-.001zm0-2.82L4.2 2.404l9.185 5.306-.115-.115.115.115z" />
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  );
}

function CubeIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L12 12.75 6.429 9.75m11.142 0l4.179 2.25L12 17.25 2.25 12l4.179-2.25m11.142 0l4.179 2.25L12 22.5 2.25 17.25l4.179-2.25" />
    </svg>
  );
}

function DecoIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  );
}

function FingerPrintIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a48.667 48.667 0 00-1.488 8.01M4.935 16.178A7.465 7.465 0 017.5 14.25c1.987 0 3.82.585 5.365 1.592M12 10.5c0 3.738-1.07 7.225-2.922 10.166M15.78 8.605c.619 1.58 1.005 3.27 1.125 5.02M8.5 10.5a2.5 2.5 0 115 0 2.5 2.5 0 01-5 0z" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

export default HandyStudioPage;
