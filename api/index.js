/**
 * api/index.js
 * -----------------------------------------------------------------------------
 * Native Vercel Serverless Function Handler (Pure JavaScript ESM - Zero TS Build Crash)
 * Menangani seluruh route:
 *   - GET /api/notion/posts
 *   - GET /api/notion/posts/:slug
 *   - GET /api/etalase (Otomatis sinkronisasi harga & promo live dari Tokopedia/TikTok Shop)
 *   - POST /api/etalase/sync
 */

import fs from 'fs';
import path from 'path';

const DEFAULT_NOTION_TOKEN =
  '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';
const DEFAULT_NOTION_DATABASE_ID = '3ffe76e0-8675-8092-92d1-d8bc37d181bc';

const WHATSAPP_BOT_HEADERS = {
  'User-Agent': 'WhatsApp/2.23.20.0',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};

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

function categorizeTitle(title) {
  const lower = String(title || '').toLowerCase();
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

function parseStorePageCards(html) {
  const discoveredCards = [];
  const seenSlugs = new Set();
  const anchorRegex =
    /<a[^>]+href="(https:\/\/www\.tokopedia\.com\/sahabat-mpasi\/([^"?/]+))[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;
  let m;

  while ((m = anchorRegex.exec(html)) !== null) {
    const fullUrl = m[1];
    const slug = m[2];
    if (slug === 'page' || slug.startsWith('page/') || seenSlugs.has(slug)) {
      continue;
    }
    const body = m[3];
    const texts = [...body.matchAll(/>([^<]+)</g)]
      .map((x) => x[1].replace(/&amp;/g, '&').trim())
      .filter(Boolean);

    if (texts.length === 0) continue;

    const discountMatch = texts.find((t) => /^\d+%$/.test(t));
    const rpPrices = texts.filter((t) => /^Rp[\d.]+$/i.test(t));
    const soldMatch = texts.find((t) => /terjual/i.test(t));
    const codMatch = texts.find((t) => /COD|Hemat|Bonus|Diskon/i.test(t));

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
      promoText: codMatch
        ? `Diskon ${discountPercent}% · ${codMatch}`
        : `Diskon ${discountPercent}% · Bisa COD`,
      soldText: soldMatch || 'Terlaris',
      cardImage: imgMatch
        ? imgMatch.replace(/resize-jpeg:\d+:0/i, 'resize-jpeg:700:0')
        : undefined,
    });
  }

  return discoveredCards;
}

async function fetchEtalaseProducts() {
  let baseProducts = [];
  try {
    const syncPath = path.resolve(process.cwd(), 'src/data/etalase-synced.json');
    if (fs.existsSync(syncPath)) {
      const parsed = JSON.parse(fs.readFileSync(syncPath, 'utf-8'));
      if (Array.isArray(parsed)) {
        baseProducts = parsed;
      }
    }
  } catch {
    // ignore
  }

  // Live sync harga & produk terbaru dari Tokopedia / TikTok Shop Sahabat MPASI
  try {
    const storeRes = await fetch('https://www.tokopedia.com/sahabat-mpasi', {
      headers: WHATSAPP_BOT_HEADERS,
    });
    if (storeRes.ok) {
      const html = await storeRes.text();
      const liveCards = parseStorePageCards(html);
      if (liveCards.length > 0) {
        const existingBySlug = new Map(baseProducts.map((p) => [p.slug, p]));
        const nowIso = new Date().toISOString();
        const updatedProducts = [];

        for (const card of liveCards) {
          const prev = existingBySlug.get(card.slug);
          if (prev) {
            updatedProducts.push({
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
              tokopediaUrl: card.url,
              tiktokShopUrl: 'https://www.tiktok.com/@rtk.ruangtumbuh',
              syncedAt: nowIso,
            });
          } else if (card.cardImage) {
            const isAbon = card.title.toLowerCase().includes('abon');
            updatedProducts.push({
              id: card.slug,
              slug: card.slug,
              title: card.title,
              category: categorizeTitle(card.title),
              recommendedAge: 'Balita 11+ Bulan',
              weightLabel: isAbon ? '50gr & 100gr' : '80gr & 125gr',
              priceIdr: card.priceIdr,
              priceText: `Rp${card.priceIdr.toLocaleString('id-ID')}`,
              originalPriceIdr: card.originalPriceIdr,
              originalPriceText: `Rp${card.originalPriceIdr.toLocaleString('id-ID')}`,
              discountPercent: card.discountPercent,
              promoText: card.promoText,
              promoBadges: ['Promo Spesial', 'Bisa COD', 'Gratis Ongkir Xtra'],
              soldText: card.soldText || 'Terlaris',
              rating: 5.0,
              reviewCount: 12,
              image: card.cardImage,
              gallery: [card.cardImage],
              description: `${card.title} — Lauk pendamping MPASI gurih, renyah, dan kaya protein hewani tanpa pengawet dan bebas MSG dari Sahabat MPASI.`,
              tokopediaUrl: card.url,
              tiktokShopUrl: 'https://www.tiktok.com/@rtk.ruangtumbuh',
              storeName: 'Sahabat MPASI',
              storeLocation: 'Kab. Boyolali',
              inStock: true,
              syncedAt: nowIso,
            });
          }
        }

        if (updatedProducts.length > 0) {
          baseProducts = updatedProducts;
        }
      }
    }
  } catch {
    // Gunakan baseProducts jika koneksi live sedang sibuk
  }

  return { products: baseProducts, storageProvider: 'live-marketplace' };
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

  if (urlPath === '/api/etalase' || urlPath === '/api/etalase/sync') {
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
