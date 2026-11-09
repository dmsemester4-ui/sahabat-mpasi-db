import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { getPublishedPosts, getPostBySlug } from './src/lib/notion';
import {
  readSyncedEtalaseAsync,
  writeSyncedEtalaseAsync,
  syncLiveStoreEtalase,
  fetchSingleMarketplaceProduct,
} from './src/lib/etalaseSync';
import { getSupabaseConfig } from './src/lib/supabase';

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;
const DEFAULT_SITE_URL = process.env.PUBLIC_SITE_URL || 'https://sahabatmpasi.ai.studio';

function getBaseUrl(req: express.Request): string {
  if (process.env.PUBLIC_SITE_URL) {
    return process.env.PUBLIC_SITE_URL.replace(/\/$/, '');
  }
  const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
  const host = req.headers['x-forwarded-host'] || req.get('host');
  return host ? `${proto}://${host}` : DEFAULT_SITE_URL;
}

async function startServer() {
  const app = express();
  app.use(express.json());

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
    } catch (err) {
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
    const result = await getPostBySlug(req.params.slug, customToken, customDbId);
    if (!result.post) {
      res.status(404).json({ error: 'Artikel tidak ditemukan', ...result });
      return;
    }
    res.json(result);
  });

  // 4b. Marketplace Etalase API: Get synced products from Supabase PostgreSQL or Tokopedia & TikTok Shop cache
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

  // 4c. Marketplace Etalase API: Trigger live re-sync with Tokopedia / TikTok Shop OEC
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

  // 4d. Marketplace Etalase API: Import/sync a specific product URL from Tokopedia or TikTok Shop
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

  // 5. Endpoint to read real Astro project files on disk for non-IT user inspection
  app.get('/api/astro-files', (_req, res) => {
    const filePaths = [
      'astro.config.mjs',
      '.env.example',
      'public/robots.txt',
      'src/lib/notion.ts',
      'src/components/SEO.astro',
      'src/components/Breadcrumbs.astro',
      'src/components/Navbar.astro',
      'src/components/Footer.astro',
      'src/components/BlogCard.astro',
      'src/components/Hero.astro',
      'src/layouts/Layout.astro',
      'src/pages/index.astro',
      'src/pages/about.astro',
      'src/pages/blog/index.astro',
      'src/pages/blog/[slug].astro',
      'src/styles/global.css',
      'README.md',
    ];

    const files: Record<string, string> = {};
    for (const relPath of filePaths) {
      try {
        const fullPath = path.resolve(process.cwd(), relPath);
        if (fs.existsSync(fullPath)) {
          files[relPath] = fs.readFileSync(fullPath, 'utf-8');
        }
      } catch {
        // ignore
      }
    }
    res.json({ files });
  });

  // Vite middleware for development or static dist in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sahabat MPASI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
