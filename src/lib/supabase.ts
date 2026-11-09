/**
 * src/lib/supabase.ts
 * -----------------------------------------------------------------------------
 * Modul Koneksi Database Gratis Non-Google: SUPABASE (PostgreSQL Cloud)
 * Menggunakan REST API resmi Supabase (PostgREST) tanpa ketergantungan Google Cloud.
 *
 * Jika SUPABASE_URL dan SUPABASE_ANON_KEY (atau SUPABASE_SERVICE_ROLE_KEY)
 * diatur di Environment Variables (misal di Vercel), maka data Etalase Produk
 * akan dibaca dan disimpan secara persisten di database PostgreSQL Supabase.
 * Jika belum diatur, aplikasi otomatis menggunakan data lokal & Notion CMS.
 */

import type { EtalaseProduct } from './etalaseSync';

export interface SupabaseConfig {
  url: string;
  apiKey: string;
  isConfigured: boolean;
}

export function getSupabaseConfig(): SupabaseConfig {
  const url = (
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    ''
  )
    .trim()
    .replace(/\/$/, '');

  const apiKey = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    ''
  ).trim();

  return {
    url,
    apiKey,
    isConfigured: Boolean(url && apiKey),
  };
}

/**
 * Mengambil daftar produk etalase dari tabel `etalase_products` di Supabase PostgreSQL
 */
export async function fetchProductsFromSupabase(): Promise<EtalaseProduct[] | null> {
  const { url, apiKey, isConfigured } = getSupabaseConfig();
  if (!isConfigured) return null;

  try {
    const res = await fetch(
      `${url}/rest/v1/etalase_products?select=*&order=updated_at.desc`,
      {
        method: 'GET',
        headers: {
          apikey: apiKey,
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(8000),
      }
    );

    if (!res.ok) return null;
    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) return null;

    return rows.map((row: any) => ({
      id: row.id || row.slug,
      slug: row.slug,
      title: row.title,
      category: row.category || 'Kremesan Protein Darat',
      recommendedAge: row.recommended_age || 'Balita 11+ Bulan',
      weightLabel: row.weight_label || '80gr & 125gr',
      priceIdr: Number(row.price_idr) || 46900,
      priceText:
        row.price_text ||
        `Rp${(Number(row.price_idr) || 46900).toLocaleString('id-ID')}`,
      originalPriceIdr: Number(row.original_price_idr) || 87000,
      originalPriceText:
        row.original_price_text ||
        `Rp${(Number(row.original_price_idr) || 87000).toLocaleString('id-ID')}`,
      discountPercent: Number(row.discount_percent) || 46,
      promoText: row.promo_text || 'Gajian Sale · Bisa COD',
      promoBadges: Array.isArray(row.promo_badges)
        ? row.promo_badges
        : ['Gajian Sale', 'Bisa COD', 'Gratis Ongkir Xtra'],
      soldText: row.sold_text || 'Terlaris',
      rating: Number(row.rating) || 5.0,
      reviewCount: Number(row.review_count) || 12,
      image: row.image,
      gallery: Array.isArray(row.gallery) ? row.gallery : [row.image],
      description: row.description || row.title,
      tokopediaUrl:
        row.tokopedia_url || 'https://www.tokopedia.com/sahabat-mpasi',
      tiktokShopUrl:
        row.tiktok_shop_url || 'https://www.tiktok.com/@rtk.ruangtumbuh',
      storeName: row.store_name || 'Sahabat MPASI',
      storeLocation: row.store_location || 'Kab. Boyolali',
      inStock: row.in_stock !== false,
      syncedAt: row.synced_at || row.updated_at || new Date().toISOString(),
    }));
  } catch {
    return null;
  }
}

/**
 * Menyimpan / memperbarui (Upsert) daftar produk etalase ke tabel `etalase_products` di Supabase
 */
export async function upsertProductsToSupabase(
  products: EtalaseProduct[]
): Promise<boolean> {
  const { url, apiKey, isConfigured } = getSupabaseConfig();
  if (!isConfigured || products.length === 0) return false;

  try {
    const payload = products.map((p) => ({
      slug: p.slug,
      title: p.title,
      category: p.category,
      recommended_age: p.recommendedAge,
      weight_label: p.weightLabel,
      price_idr: p.priceIdr,
      price_text: p.priceText,
      original_price_idr: p.originalPriceIdr,
      original_price_text: p.originalPriceText,
      discount_percent: p.discountPercent,
      promo_text: p.promoText,
      promo_badges: p.promoBadges,
      sold_text: p.soldText,
      rating: p.rating,
      review_count: p.reviewCount,
      image: p.image,
      gallery: p.gallery,
      description: p.description,
      tokopedia_url: p.tokopediaUrl,
      tiktok_shop_url: p.tiktokShopUrl,
      store_name: p.storeName,
      store_location: p.storeLocation,
      in_stock: p.inStock,
      synced_at: p.syncedAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const res = await fetch(`${url}/rest/v1/etalase_products?on_conflict=slug`, {
      method: 'POST',
      headers: {
        apikey: apiKey,
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });

    return res.ok;
  } catch {
    return false;
  }
}
