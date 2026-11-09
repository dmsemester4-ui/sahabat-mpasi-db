/**
 * src/data/products.ts
 * Katalog Etalase Resmi yang Tersinkronisasi langsung dari Tokopedia & TikTok Shop
 * (Toko Resmi: Sahabat MPASI)
 * Seluruh gambar produk, judul, deskripsi, harga, promo diskon, rating,
 * dan lokasi toko diambil langsung dari etalase marketplace Sahabat MPASI.
 */

import syncedCatalog from './etalase-synced.json';

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

export const MPASI_PRODUCTS: EtalaseProduct[] =
  syncedCatalog as EtalaseProduct[];
