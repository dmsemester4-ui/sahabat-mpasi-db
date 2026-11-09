import fs from 'fs';
import path from 'path';
import syncedCatalogJson from '../data/etalase-synced.json';
import {
  fetchProductsFromSupabase,
  upsertProductsToSupabase,
  getSupabaseConfig,
} from './supabase';

export interface EtalaseProduct {
  id: string;
  slug: string;
  title: string;
  category:
    | 'Kremesan Protein Darat'
    | 'Kremesan Ikan & Laut'
    | 'Abon Lauk MPASI';
  recommendedAge: string;
  weightLabel: string;
  priceIdr: number;
  priceText: string;
  originalPriceIdr: number;
  originalPriceText: string;
  discountPercent: number;
  promoText: string;
  promoBadges: string[];
  soldText: string;
  rating: number;
  reviewCount: number;
  image: string;
  gallery: string[];
  description: string;
  tokopediaUrl: string;
  tiktokShopUrl: string;
  storeName: string;
  storeLocation: string;
  inStock: boolean;
  syncedAt: string;
}

const SYNC_FILE_PATH = path.resolve(
  process.cwd(),
  'src/data/etalase-synced.json'
);

const WHATSAPP_BOT_HEADERS = {
  'User-Agent': 'WhatsApp/2.23.20.0',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};

export const OFFICIAL_STORE_METADATA = {
  storeName: 'Sahabat MPASI',
  storeLocation: 'Kab. Boyolali',
  tokopediaStoreUrl: 'https://www.tokopedia.com/sahabat-mpasi',
  tiktokShopUrl: 'https://www.tiktok.com/@rtk.ruangtumbuh',
  storeAvatarUrl:
    'https://images.tokopedia.net/img/cache/215-square/aphluv/1997/1/1/05b6af0ef10b47a5869d569a0a295b9d~.image',
};

export function categorizeTitle(
  title: string
): 'Kremesan Protein Darat' | 'Kremesan Ikan & Laut' | 'Abon Lauk MPASI' {
  const lower = title.toLowerCase();
  if (lower.includes('abon')) return 'Abon Lauk MPASI';
  if (
    lower.includes('ikan') ||
    lower.includes('teri') ||
    lower.includes('kembung') ||
    lower.includes('lele') ||
    lower.includes('gabus') ||
    lower.includes('tenggiri') ||
    lower.includes('salmon') ||
    lower.includes('udang')
  ) {
    return 'Kremesan Ikan & Laut';
  }
  return 'Kremesan Protein Darat';
}

export function readSyncedEtalase(): EtalaseProduct[] {
  try {
    if (fs.existsSync(SYNC_FILE_PATH)) {
      const raw = fs.readFileSync(SYNC_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // ignore read error on serverless read-only filesystem
  }
  return (syncedCatalogJson as EtalaseProduct[]) || [];
}

let lastLiveSyncTime = 0;
const LIVE_SYNC_TTL_MS = 60 * 1000; // Sinkronisasi otomatis setiap 60 detik

export async function readSyncedEtalaseAsync(
  forceLive = false
): Promise<{
  products: EtalaseProduct[];
  storageProvider: 'supabase' | 'local-json';
}> {
  const now = Date.now();
  if (forceLive || now - lastLiveSyncTime > LIVE_SYNC_TTL_MS) {
    lastLiveSyncTime = now;
    try {
      const synced = await syncLiveStoreEtalase();
      if (synced.products.length > 0) {
        return {
          products: synced.products,
          storageProvider: getSupabaseConfig().isConfigured
            ? 'supabase'
            : 'local-json',
        };
      }
    } catch {
      // Lanjut ke cache jika gagal jaringan
    }
  }

  const supabaseProducts = await fetchProductsFromSupabase();
  if (supabaseProducts && supabaseProducts.length > 0) {
    return { products: supabaseProducts, storageProvider: 'supabase' };
  }

  const localProducts = readSyncedEtalase();
  if (getSupabaseConfig().isConfigured && localProducts.length > 0) {
    await upsertProductsToSupabase(localProducts);
    return { products: localProducts, storageProvider: 'supabase' };
  }

  return { products: localProducts, storageProvider: 'local-json' };
}

export function writeSyncedEtalase(products: EtalaseProduct[]): void {
  try {
    fs.writeFileSync(SYNC_FILE_PATH, JSON.stringify(products, null, 2), 'utf-8');
  } catch {
    // ignore write error in read-only serverless environments (e.g. Vercel)
  }
}

export async function writeSyncedEtalaseAsync(
  products: EtalaseProduct[]
): Promise<void> {
  writeSyncedEtalase(products);
  await upsertProductsToSupabase(products);
}

/**
 * Mengambil detail produk langsung dari URL halaman produk Tokopedia / TikTok Shop (Toko Sahabat MPASI)
 */
export async function fetchSingleMarketplaceProduct(
  productUrl: string,
  fallbackMeta?: Partial<EtalaseProduct>
): Promise<EtalaseProduct | null> {
  try {
    const cleanUrl = productUrl.trim();
    const res = await fetch(cleanUrl, {
      headers: WHATSAPP_BOT_HEADERS,
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;

    const finalUrl = res.url || cleanUrl;
    const html = await res.text();

    // 1. Parse JSON-LD Product / ProductGroup schema
    const scripts = [
      ...html.matchAll(
        /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi
      ),
    ].map((m) => m[1]);

    let ldProduct: any = null;
    for (const s of scripts) {
      try {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) {
          const variants = parsed.filter((x) => x && x['@type'] === 'Product');
          if (variants.length > 0) {
            variants.sort(
              (a, b) =>
                (Number(a?.offers?.price) || 999999) -
                (Number(b?.offers?.price) || 999999)
            );
            ldProduct = variants[0];
            break;
          }
        } else if (parsed && parsed['@type'] === 'Product') {
          ldProduct = parsed;
          break;
        }
      } catch {
        // ignore
      }
    }

    // 2. Parse OpenGraph fallbacks
    const ogTitle = html
      .match(/property="og:title"\s+content="([^"]+)"/i)?.[1]
      ?.replace(/\s*\|\s*Tokopedia.*$/i, '')
      ?.replace(/^Jual\s+/i, '')
      ?.trim();
    const ogImage = html.match(
      /property="og:image"\s+content="([^"]+)"/i
    )?.[1];
    const ogDesc = html.match(
      /property="og:description"\s+content="([^"]+)"/i
    )?.[1];

    // 3. Parse full product description from PDP
    const descRaw =
      html.match(
        /data-testid="lblPDPDescriptionProduk"[^>]*>([\s\S]*?)<\/div>/i
      )?.[1] || '';
    const cleanDescription = descRaw
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    // 4. Extract all TikTok Shop / Tokopedia OEC CDN images (p16-oec-sg.ibyteimg.com)
    const oecImages = [
      ...new Set(
        [
          ...html.matchAll(
            /https:\/\/p16-oec-sg\.ibyteimg\.com\/tos-alisg-i-aphluv4xwc-sg\/(?:img\/VqbcmM\/\d+\/\d+\/\d+\/[a-z0-9-]+\.jpg|[a-z0-9]+)~tplv-aphluv4xwc-resize-jpeg:\d+:0\.(?:jpeg|jpg)/gi
          ),
        ].map((m) =>
          m[0].replace(/resize-jpeg:\d+:0/i, 'resize-jpeg:700:0')
        )
      ),
    ];

    const rawTitle =
      fallbackMeta?.title ||
      ogTitle ||
      ldProduct?.name?.replace(/\s*-\s*(?:50gr|80gr|100gr|125gr)$/i, '') ||
      'Produk Sahabat MPASI';

    const title = rawTitle.replace(/&amp;/g, '&').trim();

    const primaryImage =
      oecImages[0] ||
      fallbackMeta?.image ||
      ogImage ||
      ldProduct?.image ||
      '';

    if (!primaryImage) return null;

    const gallery =
      oecImages.length > 0
        ? oecImages
        : [primaryImage, ...(fallbackMeta?.gallery || [])].filter(Boolean);

    const priceIdr =
      fallbackMeta?.priceIdr ||
      Number(ldProduct?.offers?.price) ||
      40900;

    const originalPriceIdr =
      fallbackMeta?.originalPriceIdr ||
      (title.toLowerCase().includes('abon') ? 92000 : 87000);

    const discountPercent =
      fallbackMeta?.discountPercent ||
      Math.max(
        1,
        Math.round(((originalPriceIdr - priceIdr) / originalPriceIdr) * 100)
      );

    const slugFromUrl =
      finalUrl
        .split('?')[0]
        .split('/')
        .filter(Boolean)
        .pop() || `item-${Date.now()}`;

    const isAbon = title.toLowerCase().includes('abon');
    const weightLabel =
      fallbackMeta?.weightLabel || (isAbon ? '50gr & 100gr' : '80gr & 125gr');

    const promoText =
      fallbackMeta?.promoText || 'Diskon Spesial · Bisa COD';

    return {
      id: slugFromUrl,
      slug: slugFromUrl,
      title,
      category: categorizeTitle(title),
      recommendedAge: 'Balita 11+ Bulan',
      weightLabel,
      priceIdr,
      priceText: `Rp${priceIdr.toLocaleString('id-ID')}`,
      originalPriceIdr,
      originalPriceText: `Rp${originalPriceIdr.toLocaleString('id-ID')}`,
      discountPercent,
      promoText,
      promoBadges: ['Promo Spesial', 'Bisa COD', 'Gratis Ongkir Xtra'],
      soldText: fallbackMeta?.soldText || 'Terlaris',
      rating: Number(ldProduct?.aggregateRating?.ratingValue) || 5.0,
      reviewCount: Number(ldProduct?.aggregateRating?.reviewCount) || 12,
      image: primaryImage,
      gallery,
      description:
        cleanDescription ||
        ldProduct?.description ||
        ogDesc ||
        fallbackMeta?.description ||
        title,
      tokopediaUrl: finalUrl.includes('tokopedia.com')
        ? finalUrl.split('?')[0]
        : fallbackMeta?.tokopediaUrl ||
          OFFICIAL_STORE_METADATA.tokopediaStoreUrl,
      tiktokShopUrl: finalUrl.includes('tiktok.com')
        ? finalUrl
        : fallbackMeta?.tiktokShopUrl || OFFICIAL_STORE_METADATA.tiktokShopUrl,
      storeName: OFFICIAL_STORE_METADATA.storeName,
      storeLocation: OFFICIAL_STORE_METADATA.storeLocation,
      inStock: ldProduct?.offers?.availability
        ? String(ldProduct.offers.availability).includes('InStock')
        : true,
      syncedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

/**
 * Ekstraksi kartu produk tahan-perubahan CSS dari HTML halaman toko Tokopedia / TikTok Shop
 */
export function parseStorePageCards(html: string): Array<{
  slug: string;
  url: string;
  title: string;
  priceIdr: number;
  originalPriceIdr: number;
  discountPercent: number;
  promoText: string;
  soldText: string;
  cardImage?: string;
}> {
  const discoveredCards: Array<{
    slug: string;
    url: string;
    title: string;
    priceIdr: number;
    originalPriceIdr: number;
    discountPercent: number;
    promoText: string;
    soldText: string;
    cardImage?: string;
  }> = [];

  const seenSlugs = new Set<string>();
  const anchorRegex =
    /<a[^>]+href="(https:\/\/www\.tokopedia\.com\/sahabat-mpasi\/([^"?/]+))[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;

  while ((m = anchorRegex.exec(html)) !== null) {
    const fullUrl = m[1];
    const slug = m[2];
    if (slug === 'page' || slug.startsWith('page/') || seenSlugs.has(slug)) {
      continue;
    }
    const body = m[3];

    // Ambil semua teks di dalam kartu produk tanpa tergantung nama class CSS
    const texts = [...body.matchAll(/>([^<]+)</g)]
      .map((x) => x[1].replace(/&amp;/g, '&').trim())
      .filter(Boolean);

    if (texts.length === 0) continue;

    const discountMatch = texts.find((t) => /^\d+%$/.test(t));
    const rpPrices = texts.filter((t) => /^Rp[\d.]+$/i.test(t));
    const soldMatch = texts.find((t) => /terjual/i.test(t));
    const codMatch = texts.find((t) => /COD|Hemat|Bonus|Diskon/i.test(t));

    // Title adalah teks panjang yang bukan harga Rp, bukan %, bukan Bisa COD, bukan terjual
    const titleCandidate = texts.find(
      (t) =>
        t.length > 10 &&
        !/^Rp[\d.]+$/i.test(t) &&
        !/^\d+%$/.test(t) &&
        !/terjual/i.test(t) &&
        !/^Bisa COD$/i.test(t)
    );

    if (!titleCandidate) continue;

    const priceIdr =
      parseInt((rpPrices[0] || '40900').replace(/[^0-9]/g, ''), 10) || 40900;
    const originalPriceIdr =
      parseInt(
        (
          rpPrices[1] ||
          (titleCandidate.toLowerCase().includes('abon') ? '92000' : '87000')
        ).replace(/[^0-9]/g, ''),
        10
      ) || 87000;
    const discountPercent = discountMatch
      ? parseInt(discountMatch.replace(/[^0-9]/g, ''), 10)
      : Math.max(
          1,
          Math.round(((originalPriceIdr - priceIdr) / originalPriceIdr) * 100)
        );

    const imgMatch = body.match(
      /https:\/\/p16-oec-sg\.ibyteimg\.com\/[^"'\s>]+/i
    )?.[0];

    seenSlugs.add(slug);
    discoveredCards.push({
      slug,
      url: fullUrl,
      title: titleCandidate,
      priceIdr,
      originalPriceIdr,
      discountPercent,
      promoText: codMatch ? `Diskon ${discountPercent}% · ${codMatch}` : `Diskon ${discountPercent}% · Bisa COD`,
      soldText: soldMatch || 'Terlaris',
      cardImage: imgMatch
        ? imgMatch.replace(/resize-jpeg:\d+:0/i, 'resize-jpeg:700:0')
        : undefined,
    });
  }

  return discoveredCards;
}

/**
 * Sinkronisasi otomatis etalase toko dari Tokopedia / TikTok Shop OEC (https://www.tokopedia.com/sahabat-mpasi)
 */
export async function syncLiveStoreEtalase(): Promise<{
  products: EtalaseProduct[];
  syncedCount: number;
  syncedAt: string;
}> {
  const existing = readSyncedEtalase();
  const existingBySlug = new Map(existing.map((p) => [p.slug, p]));

  const storePages = ['https://www.tokopedia.com/sahabat-mpasi'];
  let discoveredCards: ReturnType<typeof parseStorePageCards> = [];

  for (const pageUrl of storePages) {
    try {
      const res = await fetch(pageUrl, {
        headers: WHATSAPP_BOT_HEADERS,
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) continue;
      const html = await res.text();
      discoveredCards = parseStorePageCards(html);
    } catch {
      // ignore network error and keep existing cache
    }
  }

  if (discoveredCards.length === 0) {
    return {
      products: existing,
      syncedCount: existing.length,
      syncedAt: new Date().toISOString(),
    };
  }

  const nowIso = new Date().toISOString();
  const syncedProducts: EtalaseProduct[] = [];

  for (const card of discoveredCards) {
    const prev = existingBySlug.get(card.slug);
    if (prev) {
      syncedProducts.push({
        ...prev,
        title: card.title || prev.title,
        category: categorizeTitle(card.title || prev.title),
        priceIdr: card.priceIdr,
        priceText: `Rp${card.priceIdr.toLocaleString('id-ID')}`,
        originalPriceIdr: card.originalPriceIdr,
        originalPriceText: `Rp${card.originalPriceIdr.toLocaleString('id-ID')}`,
        discountPercent: card.discountPercent,
        promoText: card.promoText,
        promoBadges: ['Promo Spesial', 'Bisa COD', 'Gratis Ongkir Xtra'],
        soldText: card.soldText || prev.soldText,
        image: card.cardImage || prev.image,
        storeName: OFFICIAL_STORE_METADATA.storeName,
        storeLocation: OFFICIAL_STORE_METADATA.storeLocation,
        tokopediaUrl: card.url,
        tiktokShopUrl: OFFICIAL_STORE_METADATA.tiktokShopUrl,
        syncedAt: nowIso,
      });
    } else {
      const fetched = await fetchSingleMarketplaceProduct(card.url, {
        title: card.title,
        priceIdr: card.priceIdr,
        originalPriceIdr: card.originalPriceIdr,
        discountPercent: card.discountPercent,
        promoText: card.promoText,
        soldText: card.soldText,
        image: card.cardImage,
      });
      if (fetched) {
        syncedProducts.push(fetched);
      }
    }
  }

  if (syncedProducts.length > 0) {
    await writeSyncedEtalaseAsync(syncedProducts);
    return {
      products: syncedProducts,
      syncedCount: syncedProducts.length,
      syncedAt: nowIso,
    };
  }

  return {
    products: existing,
    syncedCount: existing.length,
    syncedAt: nowIso,
  };
}
