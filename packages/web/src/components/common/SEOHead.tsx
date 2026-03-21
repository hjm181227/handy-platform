import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  path?: string;
  type?: string;
  image?: string;
}

const SITE_NAME = 'Handy';
const BASE_URL = 'https://www.h-andy.com';
const DEFAULT_DESCRIPTION = '다양한 네일 디자인과 제품을 만나보세요. 젤네일, 네일스티커, 네일케어 용품까지.';

export function SEOHead({
  title,
  description = DEFAULT_DESCRIPTION,
  path = '',
  type = 'website',
  image
}: SEOHeadProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} - 네일아트 쇼핑몰`;
  const url = `${BASE_URL}${path}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      {image && <meta property="og:image" content={image} />}
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}
    </Helmet>
  );
}
