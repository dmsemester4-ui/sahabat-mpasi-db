/**
 * api/index.ts
 * -----------------------------------------------------------------------------
 * Vercel Serverless Function Handler untuk Website "Sahabat MPASI"
 * Menangani seluruh route backend (/api/notion/*, /api/etalase/*, /sitemap.xml, /robots.txt)
 * secara otomatis saat di-publish ke Vercel (Free Tier).
 */

import express from 'express';
import { getPublishedPosts, getPostBySlug } from '../src/lib/notion';
import {
  readSyncedEtalaseAsync,
  writeSyncedEtalaseAsync,
  syncLiveStoreEtalase,
  fetchSingleMarketplaceProduct,
} from '../src/lib/etalaseSync';
import { getSupabaseConfig } from '../src/lib/supabase';

const app = express();
app.use(express.json());

const DEFAULT_SITE_URL =
  process.env.PUBLIC_SITE_URL || 'https://sahabat-mpasi.vercel.app';

function getBaseUrl(req: express.Request): string {
  if (process.env.PUBLIC_SITE_URL) {
    return process.env.PUBLIC_SITE_URL.replace(/\/$/, '');
  }
  const proto =
    (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
  const host = req.headers['x-forwarded-host'] || req.get('host');
  return host ? `${proto}://${host}` : DEFAULT_SITE_URL;
}

// 1. Dynamic robots.txt endpoint
app.get('/robots.txt', (req, res) => {
  const siteUrl = getBaseUrl(req);
  res.type('text/plain');
  res.send(
    `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${siteUrl}/sitemap.xml\n`
  );
});

// 2. Dynamic sitemap.xml endpoint (All static pages + all Notion blog posts)
app.get('/sitemap.xml', async (req, res) => {
  try {
    const siteUrl = getBaseUrl(req);
    const { posts } = await getPublishedPosts();
    const staticPages = [
      { url: '/', priority: '1.0', changefreq: 'daily' },
      { url: '/blog', priority: '0.9', changefreq: 'daily' },
      { url: '/about', priority: '0.8', changefreq: 'monthly' },
      { url: '/panduan-tekstur', priority: '0.8', changefreq: 'monthly' },
      { url: '/produk', priority: '0.9', changefreq: 'weekly' },
    ];

    const today = new Date().toISOString().slice(0, 10);

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages
  .map(
    (page) => `  <url>
    <loc>${siteUrl}${page.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join('\n')}
${posts
  .map(
    (post) => `  <url>
    <loc>${siteUrl}/blog/${post.slug}</loc>
    <lastmod>${post.updatedAt || post.date}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch {
    res.status(500).send('Error generating sitemap');
  }
});

// 3. Notion API Route: Get all published blog posts
app.get('/api/notion/posts', async (req, res) => {
  const customToken = req.header('x-notion-token') || undefined;
  const customDbId = req.header('x-notion-database-id') || undefined;
  const result = await getPublishedPosts(customToken, customDbId);
  res.json({
    ...result,
    envConfigured: Boolean(
      process.env.NOTION_TOKEN && process.env.NOTION_DATABASE_ID
    ),
  });
});

// 4. Notion API Route: Get single post by slug + 3 related posts by shared Tags
app.get('/api/notion/posts/:slug', async (req, res) => {
  const customToken = req.header('x-notion-token') || undefined;
  const customDbId = req.header('x-notion-database-id') || undefined;
  const result = await getPostBySlug(
    req.params.slug,
    customToken,
    customDbId
  );
  if (!result.post) {
    res.status(404).json({ error: 'Artikel tidak ditemukan', ...result });
    return;
  }
  res.json(result);
});

// 5. Marketplace Etalase API: Get products from Supabase PostgreSQL or bundled catalog
app.get('/api/etalase', async (_req, res) => {
  const { products, storageProvider } = await readSyncedEtalaseAsync();
  res.json({
    products,
    storageProvider,
    supabaseConfigured: getSupabaseConfig().isConfigured,
    storeName: 'Sahabat MPASI',
    storeLocation: 'Kab. Boyolali',
    tokopediaStoreUrl: 'https://www.tokopedia.com/sahabat-mpasi',
    tiktokShopUrl: 'https://www.tiktok.com/@rtk.ruangtumbuh',
    syncedAt: products[0]?.syncedAt || new Date().toISOString(),
  });
});

// 6. Marketplace Etalase API: Trigger live re-sync with Tokopedia / TikTok Shop OEC
app.post('/api/etalase/sync', async (_req, res) => {
  try {
    const result = await syncLiveStoreEtalase();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({
      error: err?.message || 'Gagal menyinkronkan etalase marketplace',
    });
  }
});

// 7. Marketplace Etalase API: Import/sync a specific product URL
app.post('/api/etalase/import-url', async (req, res) => {
  const url = String(req.body?.url || '').trim();
  if (!url || (!url.includes('tokopedia.com') && !url.includes('tiktok.com'))) {
    res.status(400).json({
      error: 'Masukkan tautan produk valid dari Tokopedia atau TikTok Shop.',
    });
    return;
  }
  try {
    const product = await fetchSingleMarketplaceProduct(url);
    if (!product) {
      res.status(422).json({
        error:
          'Tidak dapat mengambil metadata produk dari tautan tersebut. Pastikan tautan produk publik.',
      });
      return;
    }
    const { products: existing } = await readSyncedEtalaseAsync();
    const filtered = existing.filter(
      (p) => p.slug !== product.slug && p.image !== product.image
    );
    const updated = [product, ...filtered];
    await writeSyncedEtalaseAsync(updated);
    res.json({ product, products: updated });
  } catch (err: any) {
    res.status(500).json({
      error: err?.message || 'Gagal mengimpor tautan produk marketplace',
    });
  }
});

export default app;
