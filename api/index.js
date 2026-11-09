/**
 * api/index.js
 * -----------------------------------------------------------------------------
 * Native Vercel Serverless Function Handler (Pure JavaScript ESM - Zero TS Build Crash)
 * Menangani seluruh route:
 *   - GET /api/notion/posts
 *   - GET /api/notion/posts/:slug
 *   - GET /api/etalase
 */

import fs from 'fs';
import path from 'path';

const DEFAULT_NOTION_TOKEN =
  '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';
const DEFAULT_NOTION_DATABASE_ID = '3ffe76e0-8675-8092-92d1-d8bc37d181bc';

function slugify(text) {
  return String(text || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function extractPlainText(richTextArray) {
  if (!Array.isArray(richTextArray)) return '';
  return richTextArray.map((item) => item?.plain_text || '').join('');
}

function parseNotionBlocks(rawBlocks) {
  const parsed = [];
  for (const block of rawBlocks || []) {
    const type = block.type;
    const id = block.id;
    if (type === 'heading_1' || type === 'heading_2' || type === 'heading_3') {
      const text = extractPlainText(block[type]?.rich_text);
      if (text) parsed.push({ id, type, text });
    } else if (type === 'paragraph') {
      const text = extractPlainText(block.paragraph?.rich_text);
      if (text) parsed.push({ id, type: 'paragraph', text });
    } else if (type === 'quote' || type === 'callout') {
      const text = extractPlainText(block[type]?.rich_text);
      if (text) parsed.push({ id, type: 'quote', text });
    } else if (type === 'code') {
      const text = extractPlainText(block.code?.rich_text);
      const language = block.code?.language || 'text';
      if (text) parsed.push({ id, type: 'code', text, language });
    } else if (type === 'image') {
      const imageUrl =
        block.image?.type === 'external'
          ? block.image?.external?.url
          : block.image?.file?.url || '/images/hero-mpasi.svg';
      const caption =
        extractPlainText(block.image?.caption) ||
        'Ilustrasi panduan nutrisi Sahabat MPASI';
      parsed.push({ id, type: 'image', imageUrl, caption });
    } else if (
      type === 'bulleted_list_item' ||
      type === 'numbered_list_item'
    ) {
      const listType =
        type === 'bulleted_list_item' ? 'bulleted_list' : 'numbered_list';
      const itemText = extractPlainText(block[type]?.rich_text);
      if (!itemText) continue;
      const lastBlock = parsed[parsed.length - 1];
      if (lastBlock && lastBlock.type === listType && lastBlock.items) {
        lastBlock.items.push(itemText);
      } else {
        parsed.push({ id, type: listType, items: [itemText] });
      }
    }
  }
  return parsed;
}

function calculateReadingTime(blocks) {
  const totalWords = (blocks || []).reduce((acc, block) => {
    const textWords = block.text ? block.text.trim().split(/\s+/).length : 0;
    const listWords = block.items
      ? block.items.join(' ').trim().split(/\s+/).length
      : 0;
    return acc + textWords + listWords;
  }, 0);
  return Math.max(2, Math.ceil(totalWords / 180));
}

async function fetchNotionPosts(customToken, customDatabaseId) {
  const token = (
    customToken ||
    process.env.NOTION_TOKEN ||
    DEFAULT_NOTION_TOKEN
  ).trim();
  const databaseId = (
    customDatabaseId ||
    process.env.NOTION_DATABASE_ID ||
    DEFAULT_NOTION_DATABASE_ID
  ).trim();

  if (!token || !databaseId) {
    return { posts: [], source: 'notion' };
  }

  try {
    const cleanDbId = databaseId.replace(/-/g, '');
    let results = [];

    const queryRes = await fetch(
      `https://api.notion.com/v1/databases/${cleanDbId}/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filter: {
            property: 'Status',
            select: {
              equals: 'Published',
            },
          },
          sorts: [{ property: 'Date', direction: 'descending' }],
        }),
      }
    );

    if (queryRes.ok) {
      const data = await queryRes.json();
      results = data.results || [];
    } else {
      const fallbackRes = await fetch(
        `https://api.notion.com/v1/databases/${cleanDbId}/query`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        }
      );
      if (fallbackRes.ok) {
        const fallbackData = await fallbackRes.json();
        results = fallbackData.results || [];
      }
    }

    if (!results || results.length === 0) {
      return { posts: [], source: 'notion' };
    }

    const posts = await Promise.all(
      results.map(async (page) => {
        const props = page.properties || {};
        const title =
          extractPlainText(props.Title?.title) || 'Artikel MPASI Bergizi';
        const rawSlug = extractPlainText(props.Slug?.rich_text) || title;
        const slug = slugify(rawSlug);
        const status =
          props.Status?.select?.name === 'Draft' ? 'Draft' : 'Published';
        const date =
          props.Date?.date?.start ||
          page.created_time?.slice(0, 10) ||
          '2026-10-20';
        const updatedAt = page.last_edited_time?.slice(0, 10) || date;
        const tags = Array.isArray(props.Tags?.multi_select)
          ? props.Tags.multi_select.map((t) => t.name)
          : ['Panduan MPASI Bayi'];
        const rawExcerpt =
          extractPlainText(props.Excerpt?.rich_text) ||
          `${title} — Panduan nutrisi dan menu MPASI bergizi terpercaya dari Sahabat MPASI.`;
        const excerpt =
          rawExcerpt.length > 160
            ? `${rawExcerpt.slice(0, 157)}...`
            : rawExcerpt;

        let cover = '/images/hero-mpasi.svg';
        const coverFiles = props.Cover?.files;
        if (Array.isArray(coverFiles) && coverFiles.length > 0) {
          cover =
            coverFiles[0]?.external?.url ||
            coverFiles[0]?.file?.url ||
            cover;
        } else if (page.cover) {
          cover =
            page.cover?.external?.url || page.cover?.file?.url || cover;
        }

        let blocks = [];
        try {
          const blocksRes = await fetch(
            `https://api.notion.com/v1/blocks/${page.id}/children?page_size=100`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Notion-Version': '2022-06-28',
              },
            }
          );
          if (blocksRes.ok) {
            const blocksData = await blocksRes.json();
            blocks = parseNotionBlocks(blocksData.results || []);
          }
        } catch {
          // ignore
        }

        if (blocks.length === 0) {
          blocks = [
            {
              id: `${page.id}-fallback`,
              type: 'paragraph',
              text: excerpt,
            },
          ];
        }

        return {
          id: page.id,
          title,
          slug,
          status,
          date,
          updatedAt,
          author: 'Tim Nutrisi Sahabat MPASI',
          tags,
          excerpt,
          cover,
          readingTimeMinutes: calculateReadingTime(blocks),
          blocks,
          isFromNotion: true,
        };
      })
    );

    return { posts, source: 'notion' };
  } catch (err) {
    return {
      posts: [],
      source: 'notion',
      error: err?.message || 'Gagal menghubungi Notion API',
    };
  }
}

async function fetchEtalaseProducts() {
  const supabaseUrl = (
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    ''
  )
    .trim()
    .replace(/\/$/, '');
  const supabaseKey = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    ''
  ).trim();

  if (supabaseUrl && supabaseKey) {
    try {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/etalase_products?select=*&order=updated_at.desc`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0) {
          return {
            products: rows.map((row) => ({
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
              syncedAt: row.synced_at || new Date().toISOString(),
            })),
            storageProvider: 'supabase',
          };
        }
      }
    } catch {
      // fallback
    }
  }

  try {
    const syncPath = path.resolve(process.cwd(), 'src/data/etalase-synced.json');
    if (fs.existsSync(syncPath)) {
      const parsed = JSON.parse(fs.readFileSync(syncPath, 'utf-8'));
      if (Array.isArray(parsed)) {
        return { products: parsed, storageProvider: 'local-json' };
      }
    }
  } catch {
    // ignore
  }
  return { products: [], storageProvider: 'local-json' };
}

export default async function handler(req, res) {
  const urlPath = (req.url || '/').split('?')[0];

  if (urlPath === '/api/notion/posts') {
    const customToken = req.headers?.['x-notion-token'] || undefined;
    const customDbId = req.headers?.['x-notion-database-id'] || undefined;
    const result = await fetchNotionPosts(customToken, customDbId);
    res.status(200).json({
      ...result,
      envConfigured: Boolean(
        process.env.NOTION_TOKEN && process.env.NOTION_DATABASE_ID
      ),
    });
    return;
  }

  if (urlPath.startsWith('/api/notion/posts/')) {
    const slug = slugify(urlPath.replace('/api/notion/posts/', ''));
    const customToken = req.headers?.['x-notion-token'] || undefined;
    const customDbId = req.headers?.['x-notion-database-id'] || undefined;
    const { posts, source } = await fetchNotionPosts(customToken, customDbId);
    const post = posts.find((p) => p.slug === slug) || null;
    if (!post) {
      res.status(404).json({
        error: 'Artikel tidak ditemukan',
        post: null,
        relatedPosts: posts.slice(0, 3),
        source,
      });
      return;
    }
    res.status(200).json({
      post,
      relatedPosts: posts.filter((p) => p.slug !== post.slug).slice(0, 3),
      source,
    });
    return;
  }

  if (urlPath === '/api/etalase') {
    const { products, storageProvider } = await fetchEtalaseProducts();
    res.status(200).json({
      products,
      storageProvider,
      storeName: 'Sahabat MPASI',
      storeLocation: 'Kab. Boyolali',
      tokopediaStoreUrl: 'https://www.tokopedia.com/sahabat-mpasi',
      tiktokShopUrl: 'https://www.tiktok.com/@rtk.ruangtumbuh',
      syncedAt: products[0]?.syncedAt || new Date().toISOString(),
    });
    return;
  }

  res.status(200).json({ status: 'ok', service: 'Sahabat MPASI API' });
}
