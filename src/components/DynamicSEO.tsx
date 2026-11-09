import { useEffect } from 'react';

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface DynamicSEOProps {
  title: string;
  description: string;
  canonicalPath: string;
  image?: string;
  type?: 'website' | 'article';
  author?: string;
  publishedDate?: string;
  modifiedDate?: string;
  breadcrumbs?: BreadcrumbItem[];
}

const SITE_URL = 'https://sahabatmpasi.ai.studio';

export function buildSeoSchemas({
  title,
  description,
  canonicalPath,
  image = '/images/hero-mpasi.svg',
  type = 'website',
  author = 'Tim Nutrisi Sahabat MPASI',
  publishedDate,
  modifiedDate,
  breadcrumbs = [],
}: DynamicSEOProps) {
  const cleanDescription =
    description.length > 160 ? `${description.slice(0, 157)}...` : description;

  const fullCanonical = canonicalPath.startsWith('http')
    ? canonicalPath
    : `${SITE_URL}${canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`}`;

  const fullImage = image.startsWith('http')
    ? image
    : `${SITE_URL}${image.startsWith('/') ? image : `/${image}`}`;

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Sahabat MPASI',
    url: SITE_URL,
    logo: `${SITE_URL}/images/hero-mpasi.svg`,
    description:
      'Penyedia Produk Makanan Pendamping ASI (MPASI) untuk Bayi dan panduan menu MPASI bergizi usia 6 bulan sampai 4 tahun di Indonesia.',
  };

  const breadcrumbSchema =
    breadcrumbs.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: breadcrumbs.map((crumb, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            name: crumb.name,
            item: crumb.url.startsWith('http')
              ? crumb.url
              : `${SITE_URL}${crumb.url}`,
          })),
        }
      : null;

  const articleSchema =
    type === 'article'
      ? {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: title.replace(' | Sahabat MPASI', ''),
          description: cleanDescription,
          image: [fullImage],
          datePublished: publishedDate || '2026-10-18',
          dateModified: modifiedDate || publishedDate || '2026-10-19',
          author: {
            '@type': 'Person',
            name: author,
          },
          publisher: {
            '@type': 'Organization',
            name: 'Sahabat MPASI',
            logo: {
              '@type': 'ImageObject',
              url: `${SITE_URL}/images/hero-mpasi.svg`,
            },
          },
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': fullCanonical,
          },
        }
      : null;

  return {
    cleanDescription,
    fullCanonical,
    fullImage,
    organizationSchema,
    breadcrumbSchema,
    articleSchema,
  };
}

export default function DynamicSEO(props: DynamicSEOProps) {
  const {
    cleanDescription,
    fullCanonical,
    fullImage,
    organizationSchema,
    breadcrumbSchema,
    articleSchema,
  } = buildSeoSchemas(props);

  useEffect(() => {
    document.title = props.title;

    const setMeta = (selector: string, attr: string, value: string) => {
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        if (selector.includes('property=')) {
          const propMatch = selector.match(/property="([^"]+)"/);
          if (propMatch) el.setAttribute('property', propMatch[1]);
        } else if (selector.includes('name=')) {
          const nameMatch = selector.match(/name="([^"]+)"/);
          if (nameMatch) el.setAttribute('name', nameMatch[1]);
        }
        document.head.appendChild(el);
      }
      el.setAttribute(attr, value);
    };

    setMeta('meta[name="description"]', 'content', cleanDescription);
    setMeta(
      'meta[name="author"]',
      'content',
      props.author || 'Tim Nutrisi Sahabat MPASI'
    );
    setMeta('meta[property="og:title"]', 'content', props.title);
    setMeta('meta[property="og:description"]', 'content', cleanDescription);
    setMeta('meta[property="og:image"]', 'content', fullImage);
    setMeta('meta[property="og:url"]', 'content', fullCanonical);
    setMeta('meta[property="og:type"]', 'content', props.type || 'website');
    setMeta('meta[name="twitter:title"]', 'content', props.title);
    setMeta('meta[name="twitter:description"]', 'content', cleanDescription);
    setMeta('meta[name="twitter:image"]', 'content', fullImage);

    let canonicalLink = document.querySelector(
      'link[rel="canonical"]'
    ) as HTMLLinkElement | null;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = fullCanonical;

    // Inject Schema.org JSON-LD script tags into <head>
    const existingLd = document.querySelectorAll('script[data-teman-mpasi-ld]');
    existingLd.forEach((node) => node.remove());

    const schemas = [
      organizationSchema,
      breadcrumbSchema,
      articleSchema,
    ].filter(Boolean);

    schemas.forEach((schemaObj) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-teman-mpasi-ld', 'true');
      script.text = JSON.stringify(schemaObj);
      document.head.appendChild(script);
    });
  }, [
    props.title,
    cleanDescription,
    fullCanonical,
    fullImage,
    props.type,
    props.author,
    organizationSchema,
    breadcrumbSchema,
    articleSchema,
  ]);

  return null;
}
