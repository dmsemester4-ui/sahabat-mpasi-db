/**
 * src/lib/notion.ts
 * -----------------------------------------------------------------------------
 * Modul Koneksi Headless CMS Notion untuk Website "Sahabat MPASI"
 * Menggunakan SDK resmi @notionhq/client dengan fallback artikel edukasi MPASI
 * otomatis apabila NOTION_TOKEN dan NOTION_DATABASE_ID belum diisi.
 */

import { Client } from '@notionhq/client';

/**
 * Daftar topik resmi Blog Sahabat MPASI sesuai [TOPIK_BLOG]
 */
export const MPASI_TOPICS = [
  'Panduan MPASI Bayi',
  'Menu MPASI Bergizi',
  'Resep MPASI Bayi 6 Bulan',
  'Menu MPASI 6-12 Bulan',
  'Tips Menyiapkan MPASI',
  'Tekstur MPASI Sesuai Usia',
  'Bahan Makanan Bayi',
  'Tips Penyimpanan MPASI',
] as const;

export type MpasiTopic = (typeof MPASI_TOPICS)[number];

/**
 * Struktur blok konten Notion yang didukung di halaman detail /blog/[slug]
 * Meliputi: heading_1, heading_2, heading_3, paragraph, image, list, quote, code
 */
export interface NotionBlock {
  id: string;
  type:
    | 'heading_1'
    | 'heading_2'
    | 'heading_3'
    | 'paragraph'
    | 'image'
    | 'bulleted_list'
    | 'numbered_list'
    | 'quote'
    | 'code';
  text?: string;
  items?: string[];
  imageUrl?: string;
  caption?: string;
  language?: string;
}

/**
 * Struktur artikel blog dari Database Notion
 */
export interface NotionPost {
  id: string;
  title: string;
  slug: string;
  status: 'Draft' | 'Published';
  date: string;
  updatedAt: string;
  author: string;
  tags: string[];
  excerpt: string;
  cover: string;
  readingTimeMinutes: number;
  blocks: NotionBlock[];
  isFromNotion?: boolean;
}

/**
 * Fungsi slugify() wajib untuk Technical SEO:
 * Mengubah judul menjadi URL bersih, huruf kecil (lowercase), tanpa spasi & simbol.
 * Contoh: "Resep MPASI Bayi 6 Bulan: Puree Salmon!" -> "resep-mpasi-bayi-6-bulan-puree-salmon"
 */
export function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Menghitung estimasi waktu baca (Reading Time) dalam satuan menit
 * Berdasarkan rata-rata kecepatan membaca 190 kata per menit.
 */
export function calculateReadingTime(blocks: NotionBlock[]): number {
  const totalWords = blocks.reduce((acc, block) => {
    const textWords = block.text ? block.text.trim().split(/\s+/).length : 0;
    const listWords = block.items
      ? block.items.join(' ').trim().split(/\s+/).length
      : 0;
    return acc + textWords + listWords;
  }, 0);
  return Math.max(2, Math.ceil(totalWords / 180));
}

/**
 * Tidak menggunakan artikel bawaan/contoh — hanya menampilkan artikel asli dari Notion
 */
export const FALLBACK_MPASI_POSTS: NotionPost[] = [];

const DEFAULT_NOTION_TOKEN = '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';
const DEFAULT_NOTION_DATABASE_ID = '3ffe76e0-8675-8092-92d1-d8bc37d181bc';

/**
 * Helper untuk mengekstrak plain text dari Rich Text Notion API
 */
function extractPlainText(richTextArray: any[] | undefined): string {
  if (!Array.isArray(richTextArray)) return '';
  return richTextArray.map((item) => item?.plain_text || '').join('');
}

/**
 * Mengubah daftar block mentah dari Notion API (`blocks.children.list`)
 * menjadi array `NotionBlock` yang rapi (menggabungkan list items yang berurutan).
 */
function parseNotionBlocks(rawBlocks: any[]): NotionBlock[] {
  const parsed: NotionBlock[] = [];

  for (const block of rawBlocks) {
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
    } else if (type === 'bulleted_list_item' || type === 'numbered_list_item') {
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

/**
 * Mengambil seluruh artikel berstatus "Published" dari Database Notion.
 * Hanya mengembalikan artikel yang berasal dari Notion pengguna.
 */
export async function getPublishedPosts(
  customToken?: string,
  customDatabaseId?: string
): Promise<{
  posts: NotionPost[];
  source: 'notion' | 'fallback';
  error?: string;
}> {
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
    return {
      posts: [],
      source: 'notion',
    };
  }

  try {
    const cleanDbId = databaseId.replace(/-/g, '');
    let results: any[] = [];

    // Query database via direct Notion REST endpoint (compatible with all Node versions)
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
      // Coba tanpa filter Status jika belum di-set
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
      return {
        posts: [],
        source: 'notion',
      };
    }

    const posts: NotionPost[] = await Promise.all(
      results.map(async (page: any) => {
        const props = page.properties || {};

        // 1. Title (Title)
        const title =
          extractPlainText(props.Title?.title) || 'Artikel MPASI Bergizi';

        // 2. Slug (Text) - gunakan slugify() untuk memastikan URL bersih lowercase tanpa spasi
        const rawSlug = extractPlainText(props.Slug?.rich_text) || title;
        const slug = slugify(rawSlug);

        // 3. Status (Select: Draft, Published)
        const status =
          props.Status?.select?.name === 'Draft' ? 'Draft' : 'Published';

        // 4. Date (Date)
        const date =
          props.Date?.date?.start ||
          page.created_time?.slice(0, 10) ||
          '2026-10-20';
        const updatedAt = page.last_edited_time?.slice(0, 10) || date;

        // 5. Tags (Multi-select)
        const tags: string[] = Array.isArray(props.Tags?.multi_select)
          ? props.Tags.multi_select.map((t: any) => t.name)
          : ['Panduan MPASI Bayi'];

        // 6. Excerpt (Text) - dibatasi maksimal 160 karakter untuk Meta Description SEO
        const rawExcerpt =
          extractPlainText(props.Excerpt?.rich_text) ||
          `${title} — Panduan nutrisi dan menu MPASI bergizi terpercaya dari Sahabat MPASI.`;
        const excerpt =
          rawExcerpt.length > 160
            ? `${rawExcerpt.slice(0, 157)}...`
            : rawExcerpt;

        // 7. Cover (Files & media) atau Page Cover
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

        // Ambil blok konten halaman Notion via REST API
        let blocks: NotionBlock[] = [];
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

    return {
      posts,
      source: 'notion',
    };
  } catch (err: any) {
    return {
      posts: [],
      source: 'notion',
      error:
        err?.message ||
        'Gagal menghubungi Notion API. Pastikan NOTION_TOKEN dan NOTION_DATABASE_ID benar serta Integration sudah di-invite ke Database.',
    };
  }
}

/**
 * Mengambil 1 artikel berdasarkan slug beserta 3 "Artikel Terkait"
 * berdasarkan Tags yang sama dari Notion (Internal Linking SEO).
 */
export async function getPostBySlug(
  slug: string,
  customToken?: string,
  customDatabaseId?: string
): Promise<{
  post: NotionPost | null;
  relatedPosts: NotionPost[];
  source: 'notion' | 'fallback';
}> {
  const cleanSlug = slugify(slug);
  const { posts, source } = await getPublishedPosts(
    customToken,
    customDatabaseId
  );

  const post = posts.find((p) => p.slug === cleanSlug) || null;
  if (!post) {
    return { post: null, relatedPosts: posts.slice(0, 3), source };
  }

  // Internal Linking SEO: Cari 3 artikel lain dengan kecocokan Tags terbanyak
  const relatedPosts = posts
    .filter((candidate) => candidate.slug !== post.slug)
    .map((candidate) => {
      const sharedTagCount = candidate.tags.filter((tag) =>
        post.tags.includes(tag)
      ).length;
      return { candidate, sharedTagCount };
    })
    .sort((a, b) => b.sharedTagCount - a.sharedTagCount)
    .slice(0, 3)
    .map((item) => item.candidate);

  return { post, relatedPosts, source };
}
