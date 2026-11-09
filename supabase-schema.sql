-- =============================================================================
-- SKEMA DATABASE GRATIS SUPABASE (PostgreSQL) UNTUK WEBSITE SAHABAT MPASI
-- Cara Pakai:
-- 1. Buka https://supabase.com dan buat project gratis baru.
-- 2. Klik menu "SQL Editor" di sidebar kiri -> klik "New Query".
-- 3. Copy-paste seluruh isi file ini lalu klik tombol "Run".
-- =============================================================================

-- 1. Tabel Etalase Produk Marketplace (Tokopedia & TikTok Shop Sahabat MPASI)
CREATE TABLE IF NOT EXISTS public.etalase_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Kremesan Protein Darat',
  recommended_age TEXT NOT NULL DEFAULT 'Balita 11+ Bulan',
  weight_label TEXT NOT NULL DEFAULT '80gr & 125gr',
  price_idr INTEGER NOT NULL DEFAULT 46900,
  price_text TEXT NOT NULL DEFAULT 'Rp46.900',
  original_price_idr INTEGER NOT NULL DEFAULT 87000,
  original_price_text TEXT NOT NULL DEFAULT 'Rp87.000',
  discount_percent INTEGER NOT NULL DEFAULT 46,
  promo_text TEXT NOT NULL DEFAULT 'Gajian Sale · Bisa COD',
  promo_badges JSONB NOT NULL DEFAULT '["Gajian Sale", "Bisa COD", "Gratis Ongkir Xtra"]'::jsonb,
  sold_text TEXT NOT NULL DEFAULT 'Terlaris',
  rating NUMERIC(3,1) NOT NULL DEFAULT 5.0,
  review_count INTEGER NOT NULL DEFAULT 12,
  image TEXT NOT NULL,
  gallery JSONB NOT NULL DEFAULT '[]'::jsonb,
  description TEXT NOT NULL,
  tokopedia_url TEXT NOT NULL DEFAULT 'https://www.tokopedia.com/sahabat-mpasi',
  tiktok_shop_url TEXT NOT NULL DEFAULT 'https://www.tiktok.com/@rtk.ruangtumbuh',
  store_name TEXT NOT NULL DEFAULT 'Sahabat MPASI',
  store_location TEXT NOT NULL DEFAULT 'Kab. Boyolali',
  in_stock BOOLEAN NOT NULL DEFAULT true,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Aktifkan Row Level Security (RLS)
ALTER TABLE public.etalase_products ENABLE ROW LEVEL SECURITY;

-- Izinkan publik membaca katalog produk (SELECT)
DROP POLICY IF EXISTS "Izinkan baca katalog produk publik" ON public.etalase_products;
CREATE POLICY "Izinkan baca katalog produk publik"
  ON public.etalase_products
  FOR SELECT
  USING (true);

-- Izinkan sinkronisasi / update katalog (INSERT & UPDATE)
DROP POLICY IF EXISTS "Izinkan sinkronisasi katalog produk" ON public.etalase_products;
CREATE POLICY "Izinkan sinkronisasi katalog produk"
  ON public.etalase_products
  FOR ALL
  USING (true)
  WITH CHECK (true);
