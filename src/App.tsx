/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Sun,
  Moon,
  Search,
  ArrowRight,
  ExternalLink,
  Star,
  MapPin,
  ShieldCheck,
  Tag,
  X,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import {
  MPASI_TOPICS,
  type NotionPost,
} from './lib/notion';
import { MPASI_PRODUCTS, type EtalaseProduct } from './data/products';
import DynamicSEO, {
  type BreadcrumbItem,
} from './components/DynamicSEO';

type PageRoute =
  | { name: 'home' }
  | { name: 'produk' }
  | { name: 'blog' }
  | { name: 'blog-detail'; slug: string }
  | { name: 'panduan-tekstur' }
  | { name: 'about' };

const TEXTURE_STAGES = [
  {
    id: '6-8',
    label: 'Usia 6–8 Bulan',
    textureName: 'Puree Saring & Lumatan Halus',
    frequency: '2–3x makan utama + 1–2x selingan per hari',
    portion: 'Mulai 2–3 sdm bertahap naik ke 125 ml (½ mangkuk 250 ml)',
    consistency:
      'Lumat halus dan kental (tidak langsung tumpah menetes saat sendok dimiringkan).',
    keyFocus:
      'Prioritaskan protein hewani tinggi zat besi heme (hati ayam, daging sapi, salmon) sejak hari pertama MPASI.',
    image: '/images/salmon-kabocha.svg',
  },
  {
    id: '9-11',
    label: 'Usia 9–11 Bulan',
    textureName: 'Bubur Kasar / Tim Cincang Halus (Minced & Chopped)',
    frequency: '3–4x makan utama + 1–2x selingan sehat per hari',
    portion: '125 ml hingga 175 ml (½ sampai ¾ mangkuk ukuran 250 ml)',
    consistency:
      'Bubur tim tidak disaring lagi dan mulai perkenalkan finger food seukuran jari orang dewasa.',
    keyFocus:
      'Melatih gerakan mengunyah gusi serta koordinasi tangan-mulut (pincer grasp).',
    image: '/images/beef-broth-porridge.svg',
  },
  {
    id: '12-23',
    label: 'Usia 12–23 Bulan',
    textureName: 'Makanan Keluarga & Lauk Tabur MPASI (11+ Bulan)',
    frequency: '3–4x makan utama + 1–2x selingan bergizi per hari',
    portion: '175 ml hingga 250 ml (¾ sampai 1 mangkuk penuh 250 ml)',
    consistency:
      'Nasi tim atau nasi keluarga dengan lauk protein hewani, Kremesan Double Prohe, atau Abon Kids Friendly.',
    keyFocus:
      'Transisi ke meja makan keluarga untuk balita usia 11 bulan ke atas dengan bahan alami tanpa MSG & tanpa pengawet.',
    image: '/images/menu-4-bintang.svg',
  },
  {
    id: '24-48',
    label: 'Usia 2–4 Tahun',
    textureName: 'Menu Keluarga Utuh Padat Gizi',
    frequency: '3x makan utama keluarga + 2x kudapan tinggi protein',
    portion: '250 ml atau sesuai sinyal lapar dan kenyang anak',
    consistency:
      'Tekstur utuh bervariasi untuk memperkuat struktur rahang dan variasi sensorik.',
    keyFocus:
      'Menjaga variasi sumber protein hewani darat dan laut serta jadwal makan teratur.',
    image: '/images/storage-jars.svg',
  },
];

function TikTokIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-.88-.06A6.34 6.34 0 0 0 3 15.68a6.34 6.34 0 0 0 10.82 4.49 6.27 6.27 0 0 0 1.87-4.5V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-.88-.07z" />
    </svg>
  );
}

function TokopediaIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2a4 4 0 0 0-3.87 3H5a2 2 0 0 0-2 2v12a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V7a2 2 0 0 0-2-2h-3.13A4 4 0 0 0 12 2zm0 2a2 2 0 0 1 1.93 1.5h-3.86A2 2 0 0 1 12 4zm-3.5 6a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm7 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm-3.5 4.5c2.07 0 3.75 1.12 3.75 2.5h-7.5c0-1.38 1.68-2.5 3.75-2.5z" />
    </svg>
  );
}

export default function App() {
  const [route, setRoute] = useState<PageRoute>({ name: 'home' });
  const [darkMode, setDarkMode] = useState(false);

  // Tautan Resmi Marketplace Sahabat MPASI
  const tiktokShopUrl = 'https://www.tiktok.com/@rtk.ruangtumbuh';
  const tokopediaStoreUrl = 'https://www.tokopedia.com/sahabat-mpasi';

  // Daftar Produk Resmi Sahabat MPASI
  const [etalaseProducts, setEtalaseProducts] =
    useState<EtalaseProduct[]>(MPASI_PRODUCTS);

  // Modal Detail Produk Marketplace (Tampilan PDP TikTok Shop / Tokopedia)
  const [activeModalProduct, setActiveModalProduct] =
    useState<EtalaseProduct | null>(null);
  const [activeModalImageIdx, setActiveModalImageIdx] = useState<number>(0);

  // Artikel Blog State
  const [posts, setPosts] = useState<NotionPost[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState<boolean>(true);

  // Blog Filter, Search & Pagination State (9 artikel per halaman)
  const [selectedTopic, setSelectedTopic] = useState<string>('Semua Topik');
  const [searchQuery, setSearchQuery] = useState('');
  const [blogCurrentPage, setBlogCurrentPage] = useState<number>(1);

  // Product Filter, Search, Sort & Pagination (9 produk per halaman)
  const [selectedCategoryFilter, setSelectedCategoryFilter] =
    useState<string>('Semua');
  const [productSearchQuery, setProductSearchQuery] = useState<string>('');
  const [productSortBy, setProductSortBy] = useState<
    'terlaris' | 'termurah' | 'termahal'
  >('terlaris');
  const [productCurrentPage, setProductCurrentPage] = useState<number>(1);
  const [selectedTextureStageId, setSelectedTextureStageId] =
    useState<string>('12-23');

  // Toggle dark class on html element
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  // Fetch Etalase from backend API on load
  useEffect(() => {
    const loadEtalase = async () => {
      try {
        const res = await fetch(`/api/etalase?t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.products) && data.products.length > 0) {
            setEtalaseProducts(data.products);
          }
        }
      } catch {
        // Fallback to bundled catalog
      }
    };
    loadEtalase();
  }, []);

  // Load Notion Blog Posts
  useEffect(() => {
    const loadPosts = async () => {
      setIsLoadingPosts(true);
      try {
        const res = await fetch(`/api/notion/posts?t=${Date.now()}`);
        const data = await res.json();
        if (Array.isArray(data.posts)) {
          setPosts(data.posts);
        }
      } catch {
        setPosts([]);
      } finally {
        setIsLoadingPosts(false);
      }
    };
    loadPosts();
  }, []);

  const navigate = (nextRoute: PageRoute) => {
    setRoute(nextRoute);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openProductDetailModal = (product: EtalaseProduct) => {
    setActiveModalProduct(product);
    setActiveModalImageIdx(0);
  };

  // Active Blog Post & 3 Related Posts
  const currentBlogDetail = useMemo(() => {
    if (route.name !== 'blog-detail') return null;
    const found =
      posts.find((p) => p.slug === route.slug) || posts[0] || null;
    if (!found) return null;

    const related = posts
      .filter((candidate) => candidate.slug !== found.slug)
      .map((candidate) => {
        const sharedCount = candidate.tags.filter((t) =>
          found.tags.includes(t)
        ).length;
        return { candidate, sharedCount };
      })
      .sort((a, b) => b.sharedCount - a.sharedCount)
      .slice(0, 3)
      .map((x) => x.candidate);

    return { post: found, relatedPosts: related };
  }, [route, posts]);

  const primaryShowcaseImage =
    etalaseProducts[0]?.image || '/images/hero-mpasi.svg';

  // Compute Dynamic SEO Props
  const activeSeoProps = useMemo(() => {
    if (route.name === 'home') {
      return {
        title:
          'Sahabat MPASI — Kremesan Probiotik & Abon Lauk Pendamping Anak',
        description:
          'Pilihan Kremesan MPASI Probiotik, Abon Ayam Kampung, dan Abon Ikan Lele praktis kaya protein hewani tanpa pengawet untuk mendampingi tumbuh kembang si Kecil.',
        canonicalPath: '/',
        image: primaryShowcaseImage,
        type: 'website' as const,
        breadcrumbs: [{ name: 'Beranda', url: '/' }],
      };
    }

    if (route.name === 'blog-detail' && currentBlogDetail?.post) {
      const p = currentBlogDetail.post;
      return {
        title: `${p.title} | Sahabat MPASI`,
        description:
          p.excerpt.length > 160 ? `${p.excerpt.slice(0, 157)}...` : p.excerpt,
        canonicalPath: `/blog/${p.slug}`,
        image: p.cover,
        type: 'article' as const,
        author: p.author,
        publishedDate: p.date,
        modifiedDate: p.updatedAt,
        breadcrumbs: [
          { name: 'Beranda', url: '/' },
          { name: 'Blog & Resep MPASI', url: '/blog' },
          { name: p.title, url: `/blog/${p.slug}` },
        ],
      };
    }

    if (route.name === 'blog') {
      return {
        title: 'Blog & Resep MPASI Bergizi | Sahabat MPASI',
        description:
          'Artikel edukasi nutrisi, resep MPASI bergizi, dan panduan tumbuh kembang anak dari Sahabat MPASI.',
        canonicalPath: '/blog',
        image: primaryShowcaseImage,
        type: 'website' as const,
        breadcrumbs: [
          { name: 'Beranda', url: '/' },
          { name: 'Blog & Resep MPASI', url: '/blog' },
        ],
      };
    }

    if (route.name === 'produk') {
      return {
        title:
          'Katalog Produk Resmi Sahabat MPASI — Kremesan & Abon MPASI Anak',
        description:
          'Koleksi lengkap Kremesan Probiotik dan Abon Lauk Praktis MPASI dari Sahabat MPASI. Tersedia di Tokopedia & TikTok Shop dengan pengiriman setiap hari.',
        canonicalPath: '/produk',
        image: primaryShowcaseImage,
        type: 'website' as const,
        breadcrumbs: [
          { name: 'Beranda', url: '/' },
          { name: 'Produk MPASI', url: '/produk' },
        ],
      };
    }

    if (route.name === 'panduan-tekstur') {
      return {
        title:
          'Panduan Tekstur MPASI Sesuai Usia Bayi 6-24 Bulan | Sahabat MPASI',
        description:
          'Tabel interaktif tahapan tekstur MPASI sesuai usia bayi: puree saring 6 bulan, bubur tim cincang 9 bulan, hingga menu keluarga 11+ bulan.',
        canonicalPath: '/panduan-tekstur',
        image: '/images/texture-guide.svg',
        type: 'website' as const,
        breadcrumbs: [
          { name: 'Beranda', url: '/' },
          { name: 'Panduan Tekstur MPASI', url: '/panduan-tekstur' },
        ],
      };
    }

    return {
      title: 'Tentang Kami | Sahabat MPASI',
      description:
        'Sahabat MPASI menghadirkan Kremesan MPASI Probiotik dan Abon Lauk Praktis berbahan alami tanpa pengawet untuk nutrisi harian si Kecil.',
      canonicalPath: '/about',
      image: primaryShowcaseImage,
      type: 'website' as const,
      breadcrumbs: [
        { name: 'Beranda', url: '/' },
        { name: 'Tentang Kami', url: '/about' },
      ],
    };
  }, [route, currentBlogDetail, primaryShowcaseImage]);

  const ITEMS_PER_PAGE = 9;

  // Filtered blog posts on /blog
  const filteredBlogPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesTopic =
        selectedTopic === 'Semua Topik' || post.tags.includes(selectedTopic);
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        post.title.toLowerCase().includes(q) ||
        post.excerpt.toLowerCase().includes(q) ||
        post.tags.some((t) => t.toLowerCase().includes(q));
      return matchesTopic && matchesSearch;
    });
  }, [posts, selectedTopic, searchQuery]);

  const totalBlogPages = Math.max(
    1,
    Math.ceil(filteredBlogPosts.length / ITEMS_PER_PAGE)
  );
  const safeBlogPage = Math.min(blogCurrentPage, totalBlogPages);
  const paginatedBlogPosts = useMemo(() => {
    const start = (safeBlogPage - 1) * ITEMS_PER_PAGE;
    return filteredBlogPosts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredBlogPosts, safeBlogPage]);

  // Filtered & sorted marketplace products on /produk
  const filteredProducts = useMemo(() => {
    const q = productSearchQuery.trim().toLowerCase();
    const list = etalaseProducts.filter((p) => {
      const matchesCat =
        selectedCategoryFilter === 'Semua' ||
        p.category === selectedCategoryFilter;
      const matchesQuery =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });

    if (productSortBy === 'termurah') {
      return [...list].sort((a, b) => a.priceIdr - b.priceIdr);
    }
    if (productSortBy === 'termahal') {
      return [...list].sort((a, b) => b.priceIdr - a.priceIdr);
    }
    return list;
  }, [etalaseProducts, selectedCategoryFilter, productSearchQuery, productSortBy]);

  const totalProductPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / ITEMS_PER_PAGE)
  );
  const safeProductPage = Math.min(productCurrentPage, totalProductPages);
  const paginatedProducts = useMemo(() => {
    const start = (safeProductPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, safeProductPage]);

  // Reusable Pagination Component (Pilihan Halaman di bawah grid 9 item)
  const renderPagination = (
    currentPage: number,
    totalPages: number,
    totalItems: number,
    onPageChange: (page: number) => void,
    itemLabel: string
  ) => {
    const startItem =
      totalItems === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const endItem = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    return (
      <div className="pt-6 border-t border-[#5B5147]/10 dark:border-[#FFF8ED]/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs font-medium text-[#5B5147]/80 dark:text-[#FFF8ED]/80 tabular-nums">
          Menampilkan{' '}
          <strong className="font-bold text-[#5B5147] dark:text-[#FFF8ED]">
            {startItem}–{endItem}
          </strong>{' '}
          dari{' '}
          <strong className="font-bold text-[#5B5147] dark:text-[#FFF8ED]">
            {totalItems}
          </strong>{' '}
          {itemLabel} (Maks. 9 per halaman)
        </p>

        <nav
          aria-label={`Navigasi halaman ${itemLabel}`}
          className="flex flex-wrap items-center gap-1.5"
        >
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => {
              onPageChange(currentPage - 1);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="rounded-lg border border-[#5B5147]/15 dark:border-[#FFF8ED]/15 bg-white dark:bg-[#25211D] px-3.5 py-2 text-xs font-bold text-[#5B5147] dark:text-[#FFF8ED] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F5ECE0] dark:hover:bg-[#1E1B18] transition-colors"
          >
            &larr; Sebelumnya
          </button>

          {pages.map((pageNum) => (
            <button
              key={pageNum}
              type="button"
              onClick={() => {
                onPageChange(pageNum);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              aria-current={currentPage === pageNum ? 'page' : undefined}
              className={`min-w-[36px] rounded-lg px-3 py-2 text-xs font-bold tabular-nums transition-colors ${
                currentPage === pageNum
                  ? 'bg-[#5B5147] text-[#FFF8ED] dark:bg-[#F2C6A0] dark:text-[#1E1B18] shadow-xs'
                  : 'border border-[#5B5147]/15 dark:border-[#FFF8ED]/15 bg-white dark:bg-[#25211D] text-[#5B5147] dark:text-[#FFF8ED] hover:bg-[#F5ECE0] dark:hover:bg-[#1E1B18]'
              }`}
            >
              {pageNum}
            </button>
          ))}

          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => {
              onPageChange(currentPage + 1);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="rounded-lg border border-[#5B5147]/15 dark:border-[#FFF8ED]/15 bg-white dark:bg-[#25211D] px-3.5 py-2 text-xs font-bold text-[#5B5147] dark:text-[#FFF8ED] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F5ECE0] dark:hover:bg-[#1E1B18] transition-colors"
          >
            Berikutnya &rarr;
          </button>
        </nav>
      </div>
    );
  };

  const activeTextureStage =
    TEXTURE_STAGES.find((s) => s.id === selectedTextureStageId) ||
    TEXTURE_STAGES[0];

  // Reusable Breadcrumbs UI Component
  const renderBreadcrumbs = (items: BreadcrumbItem[]) => (
    <nav
      aria-label="Breadcrumb"
      className="mb-6 text-xs font-medium text-[#5B5147]/80 dark:text-[#FFF8ED]/80"
    >
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={item.url + idx} className="flex items-center gap-2">
              {isLast ? (
                <span
                  className="font-bold text-[#5B5147] dark:text-[#FFF8ED]"
                  aria-current="page"
                >
                  {item.name}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (item.url === '/') navigate({ name: 'home' });
                    else if (item.url === '/blog') navigate({ name: 'blog' });
                    else if (item.url === '/produk')
                      navigate({ name: 'produk' });
                  }}
                  className="font-medium hover:text-[#5B5147] dark:hover:text-white underline-offset-4 hover:underline transition-colors"
                >
                  {item.name}
                </button>
              )}
              {!isLast && <span aria-hidden="true">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );

  // Reusable Blog Card Component
  const renderBlogCard = (post: NotionPost) => {
    const primaryTag = post.tags[0] || 'Panduan MPASI Bayi';
    return (
      <article
        key={post.id}
        onClick={() => navigate({ name: 'blog-detail', slug: post.slug })}
        className="group cursor-pointer flex flex-col overflow-hidden rounded-xl sm:rounded-2xl border border-[#5B5147]/12 bg-white dark:bg-[#25211D] dark:border-[#FFF8ED]/12 transition-transform duration-200 hover:-translate-y-0.5"
      >
        <div className="aspect-[4/3] w-full overflow-hidden bg-[#F7EFE1] dark:bg-[#1E1B18]">
          <img
            src={post.cover}
            alt={`${post.title} - Sahabat MPASI`}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/images/hero-mpasi.svg';
            }}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        </div>

        <div className="flex flex-1 flex-col justify-between p-3.5 sm:p-5">
          <div className="space-y-2 sm:space-y-2.5">
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] sm:text-xs font-medium text-[#5B5147]/80 dark:text-[#FFF8ED]/80">
              <span className="font-bold text-[#5B5147] dark:text-[#F2C6A0]">
                {primaryTag}
              </span>
              <span aria-hidden="true">·</span>
              <time dateTime={post.date}>{post.date}</time>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                {post.readingTimeMinutes} mnt
              </span>
            </div>

            <h3 className="font-display text-sm sm:text-base font-bold leading-snug text-[#5B5147] dark:text-[#FFF8ED] group-hover:text-[#6E825E] dark:group-hover:text-[#F2C6A0] transition-colors line-clamp-2">
              {post.title}
            </h3>

            <p className="text-xs sm:text-sm font-normal leading-relaxed text-[#5B5147]/90 dark:text-[#FFF8ED]/85 line-clamp-2 sm:line-clamp-3">
              {post.excerpt}
            </p>
          </div>

          <div className="mt-3.5 pt-2.5 sm:mt-4 sm:pt-3 border-t border-[#5B5147]/10 dark:border-[#FFF8ED]/10 flex items-center justify-between text-[11px] sm:text-xs font-bold text-[#5B5147] dark:text-[#F2C6A0]">
            <span>Baca Selengkapnya</span>
            <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </article>
    );
  };

  /**
   * Cuplikan deskripsi produk yang ringkas & proporsional untuk etalase beranda.
   * Tidak menampilkan seluruh deskripsi yang panjang/penuh, melainkan 1 kalimat sorotan
   * dengan tautan "Selanjutnya" yang membuka popup detail lengkap saat diklik.
   */
  const getProductShortDescription = (product: EtalaseProduct): string => {
    const titleLower = product.title.toLowerCase();
    if (product.category === 'Abon Lauk MPASI') {
      if (titleLower.includes('lele')) {
        return 'Abon ikan lele gurih kaya protein & omega-3 untuk pelengkap makan.';
      }
      return 'Abon ayam kampung praktis bergizi pelengkap nasi & bubur anak.';
    }
    if (product.category === 'Kremesan Ikan & Laut') {
      if (titleLower.includes('salmon')) {
        return 'Kremesan salmon kaya DHA & asam lemak esensial untuk kecerdasan balita.';
      }
      if (titleLower.includes('teri')) {
        return 'Kremesan teri nasi tinggi kalsium alami penunjang tulang & gigi.';
      }
      if (titleLower.includes('udang')) {
        return 'Kremesan udang gurih renyah alami penambah selera makan si Kecil.';
      }
      return 'Kremesan ikan probiotik gurih renyah padat nutrisi harian anak.';
    }
    if (titleLower.includes('otak')) {
      return 'Kremesan otak sapi grass-fed gurih renyah padat gizi untuk anak.';
    }
    if (titleLower.includes('hati')) {
      return 'Kremesan hati ayam probiotik tinggi zat besi alami untuk si Kecil.';
    }
    if (titleLower.includes('bebek')) {
      return 'Kremesan daging & telur bebek free-range gurih renyah alami.';
    }
    if (titleLower.includes('sapi')) {
      return 'Kremesan daging sapi kaya protein hewani untuk pendamping makan balita.';
    }
    return 'Lauk pendamping MPASI gurih renyah alami tanpa pengawet & tanpa MSG.';
  };

  /**
   * KARTU ETALASE MARKETPLACE (Tampilan Proporsional untuk Layar HP & Desktop)
   * Seluruh foto sampul (p16-oec-sg.ibyteimg.com), judul, harga, harga coret,
   * promo ("Hemat s.d 8% Pakai Bonus"), deskripsi produk, rating, dan jumlah terjual
   * diambil langsung dari sinkronisasi Tokopedia & TikTok Shop.
   */
  const renderProductCard = (product: EtalaseProduct) => {
    return (
      <article
        key={product.id}
        className="group flex flex-col overflow-hidden rounded-xl sm:rounded-2xl border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-[#221F1C] shadow-2xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
      >
        {/* 1:1 Square Marketplace Product Thumbnail */}
        <div
          onClick={() => openProductDetailModal(product)}
          className="relative aspect-square w-full cursor-pointer overflow-hidden bg-neutral-100 dark:bg-neutral-900"
        >
          <img
            src={product.image}
            alt={`${product.title} - Sahabat MPASI`}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />

          {/* Top-left Official Marketplace Sync Badge */}
          <div className="absolute top-1.5 left-1.5 sm:top-2.5 sm:left-2.5 flex items-center gap-1 rounded bg-neutral-950/85 backdrop-blur-xs px-1.5 py-0.5 sm:px-2 sm:py-1 text-[8px] sm:text-[10px] font-bold text-white shadow-xs">
            <TikTokIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-[#25F4EE]" />
            <span>TikTok Shop · Tokopedia</span>
          </div>

          {/* Top-right Discount Percent Pill */}
          {product.discountPercent > 0 && (
            <div className="absolute top-1.5 right-1.5 sm:top-2.5 sm:right-2.5 rounded bg-[#FE2C55] px-1.5 py-0.5 text-[9px] sm:text-[11px] font-extrabold text-white tabular-nums shadow-xs">
              -{product.discountPercent}%
            </div>
          )}

          {/* Bottom Marketplace Promo Overlay Strip */}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/45 to-transparent px-2 sm:px-3 pt-4 sm:pt-6 pb-1.5 sm:pb-2 flex items-center justify-between gap-1.5 text-[8px] sm:text-[10px] font-bold text-white">
            <span className="inline-flex items-center gap-1 text-[#FFD166] truncate">
              <Tag className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />
              <span className="truncate">{product.promoText}</span>
            </span>
            <span className="shrink-0 rounded bg-white/20 px-1 py-0.5 text-[8px] sm:text-[10px] text-white backdrop-blur-xs">
              {product.gallery.length} Foto
            </span>
          </div>
        </div>

        {/* Marketplace Card Body (Gaya Proporsional Tokopedia & TikTok Shop Mobile) */}
        <div className="flex flex-1 flex-col justify-between p-2.5 sm:p-4">
          <div
            onClick={() => openProductDetailModal(product)}
            className="cursor-pointer space-y-1.5 sm:space-y-2"
          >
            {/* Kategori & Rekomendasi Usia */}
            <div className="flex items-center justify-between gap-1.5 text-[9px] sm:text-[11px] font-semibold">
              <span className="text-[#00AA5B] dark:text-[#4ADE80] font-bold truncate">
                {product.category}
              </span>
              <span className="text-[#5B5147]/75 dark:text-[#FFF8ED]/70 shrink-0">
                {product.recommendedAge}
              </span>
            </div>

            {/* Judul Produk (2-line clamp yang rapi di layar HP) */}
            <h3 className="text-xs sm:text-sm font-bold leading-snug text-neutral-900 dark:text-[#FFF8ED] line-clamp-2 group-hover:text-[#00AA5B] dark:group-hover:text-[#F2C6A0] transition-colors">
              {product.title}
            </h3>

            {/* Harga Aktif + Harga Coret + Persentase Diskon */}
            <div className="pt-0.5">
              <div className="flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
                <span className="font-display text-sm sm:text-lg font-extrabold tabular-nums text-[#FE2C55] dark:text-[#FF6B8B]">
                  {product.priceText}
                </span>
                {product.originalPriceIdr > product.priceIdr && (
                  <span className="text-[10px] sm:text-xs font-medium text-neutral-400 line-through tabular-nums">
                    {product.originalPriceText}
                  </span>
                )}
              </div>

              {/* Promo / Voucher Tag */}
              <div className="mt-1 flex flex-wrap items-center gap-1 sm:gap-1.5">
                <span className="inline-flex items-center rounded bg-[#FFF0E6] dark:bg-[#FF7F17]/20 px-1.5 py-0.5 text-[8px] sm:text-[10px] font-bold text-[#FF7F17] dark:text-[#FFB366] truncate max-w-[120px] sm:max-w-none">
                  {product.promoText}
                </span>
                <span className="inline-flex items-center rounded bg-[#E8F8F0] dark:bg-[#00AA5B]/20 px-1.5 py-0.5 text-[8px] sm:text-[10px] font-bold text-[#00AA5B] dark:text-[#4ADE80]">
                  Bisa COD
                </span>
                <span className="hidden sm:inline-flex items-center rounded bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-600 dark:text-neutral-300">
                  {product.weightLabel}
                </span>
              </div>
            </div>

            {/* Deskripsi Singkat yang Rapi & Tombol Selanjutnya (Tidak Penuh) */}
            <div className="pt-0.5 text-[10px] sm:text-xs font-normal leading-relaxed text-[#5B5147]/85 dark:text-[#FFF8ED]/75">
              <span>{getProductShortDescription(product)} </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openProductDetailModal(product);
                }}
                className="inline-flex items-center gap-0.5 font-bold text-[#00AA5B] dark:text-[#4ADE80] hover:underline cursor-pointer"
                title="Lihat deskripsi lengkap & detail produk"
              >
                <span>Selanjutnya</span>
                <ArrowRight className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              </button>
            </div>

            {/* Rating Bintang, Jumlah Terjual & Kota Toko */}
            <div className="pt-1 flex items-center justify-between gap-1 text-[9px] sm:text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
              <div className="flex items-center gap-1">
                <span className="inline-flex items-center gap-0.5 font-bold text-neutral-800 dark:text-neutral-200">
                  <Star className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 fill-[#FFC400] text-[#FFC400]" />
                  <span>{product.rating.toFixed(1)}</span>
                </span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums font-semibold text-neutral-700 dark:text-neutral-300 truncate">
                  {product.soldText}
                </span>
              </div>
              <span className="inline-flex items-center gap-0.5 truncate text-[8px] sm:text-[10px]">
                <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0 text-[#00AA5B]" />
                <span className="truncate">{product.storeLocation}</span>
              </span>
            </div>
          </div>

          {/* Tombol Aksi Etalase: Detail + Beli di TikTok Shop / Tokopedia */}
          <div className="mt-2.5 pt-2 sm:mt-3 sm:pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-1.5">
            <button
              type="button"
              onClick={() => openProductDetailModal(product)}
              className="w-full rounded-md sm:rounded-lg border border-[#5B5147]/20 dark:border-[#FFF8ED]/20 bg-[#FFF8ED]/70 dark:bg-[#1E1B18] px-2 py-1.5 text-[10px] sm:text-xs font-bold text-[#5B5147] dark:text-[#FFF8ED] hover:bg-[#F5ECE0] dark:hover:bg-neutral-800 transition-colors"
            >
              Lihat Detail
            </button>

            <div className="grid grid-cols-2 gap-1.5">
              <a
                href={product.tiktokShopUrl || tiktokShopUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1 rounded-md sm:rounded-lg bg-[#111111] hover:bg-black text-white px-1.5 py-1.5 text-[9px] sm:text-[11px] font-bold transition-opacity shadow-2xs"
                title="Beli di TikTok Shop Sahabat MPASI"
              >
                <TikTokIcon className="h-3 w-3 shrink-0 text-[#25F4EE]" />
                <span className="truncate">TikTok Shop</span>
              </a>

              <a
                href={product.tokopediaUrl || tokopediaStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1 rounded-md sm:rounded-lg bg-[#00AA5B] hover:bg-[#00924E] text-white px-1.5 py-1.5 text-[9px] sm:text-[11px] font-bold transition-colors shadow-2xs"
                title={`Beli ${product.title} di Tokopedia Sahabat MPASI`}
              >
                <TokopediaIcon className="h-3 w-3 shrink-0 text-white" />
                <span className="truncate">Tokopedia</span>
              </a>
            </div>
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF8ED] text-[#5B5147] dark:bg-[#1E1B18] dark:text-[#FFF8ED] transition-colors">
      {/* Dynamic Head SEO & Schema.org JSON-LD Updater */}
      <DynamicSEO {...activeSeoProps} />

      {/* =====================================================================
          TOP BAR CONTRACT
         ===================================================================== */}
      <header className="sticky top-0 z-40 border-b border-[#5B5147]/12 bg-[#FFF8ED]/95 dark:bg-[#1E1B18]/95 dark:border-[#FFF8ED]/12 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 sm:gap-6 px-3.5 sm:px-6 py-2.5 sm:py-4">
          {/* Zone 1: Brand Title */}
          <button
            type="button"
            onClick={() => navigate({ name: 'home' })}
            className="font-display text-lg sm:text-2xl font-extrabold tracking-tight text-[#5B5147] dark:text-[#FFF8ED] whitespace-nowrap shrink-0 text-left"
          >
            Sahabat MPASI
          </button>

          {/* Zone 2: 5 Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#5B5147]/85 dark:text-[#FFF8ED]/85">
            <button
              type="button"
              onClick={() => navigate({ name: 'home' })}
              className={`hover:text-[#5B5147] dark:hover:text-white underline-offset-4 hover:underline transition-colors whitespace-nowrap shrink-0 ${
                route.name === 'home'
                  ? 'text-[#5B5147] dark:text-[#F2C6A0] font-bold underline'
                  : 'font-medium'
              }`}
            >
              Beranda
            </button>
            <button
              type="button"
              onClick={() => navigate({ name: 'produk' })}
              className={`hover:text-[#5B5147] dark:hover:text-white underline-offset-4 hover:underline transition-colors whitespace-nowrap shrink-0 ${
                route.name === 'produk'
                  ? 'text-[#5B5147] dark:text-[#F2C6A0] font-bold underline'
                  : 'font-medium'
              }`}
            >
              Produk MPASI
            </button>
            <button
              type="button"
              onClick={() => navigate({ name: 'blog' })}
              className={`hover:text-[#5B5147] dark:hover:text-white underline-offset-4 hover:underline transition-colors whitespace-nowrap shrink-0 ${
                route.name === 'blog' || route.name === 'blog-detail'
                  ? 'text-[#5B5147] dark:text-[#F2C6A0] font-bold underline'
                  : 'font-medium'
              }`}
            >
              Blog &amp; Resep
            </button>
            <button
              type="button"
              onClick={() => navigate({ name: 'panduan-tekstur' })}
              className={`hover:text-[#5B5147] dark:hover:text-white underline-offset-4 hover:underline transition-colors whitespace-nowrap shrink-0 ${
                route.name === 'panduan-tekstur'
                  ? 'text-[#5B5147] dark:text-[#F2C6A0] font-bold underline'
                  : 'font-medium'
              }`}
            >
              Panduan Tekstur
            </button>
            <button
              type="button"
              onClick={() => navigate({ name: 'about' })}
              className={`hover:text-[#5B5147] dark:hover:text-white underline-offset-4 hover:underline transition-colors whitespace-nowrap shrink-0 ${
                route.name === 'about'
                  ? 'text-[#5B5147] dark:text-[#F2C6A0] font-bold underline'
                  : 'font-medium'
              }`}
            >
              Tentang Kami
            </button>
          </nav>

          {/* Zone 3: Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setDarkMode((prev) => !prev)}
              aria-label="Ubah Tema"
              className="rounded-lg p-1.5 sm:p-2 text-[#5B5147]/80 dark:text-[#FFF8ED]/80 hover:bg-[#5B5147]/10 transition-colors"
              title={darkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
            >
              {darkMode ? (
                <Sun className="h-4 w-4 text-[#F2C6A0]" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>

            <a
              href={tiktokShopUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 sm:gap-1.5 rounded-lg sm:rounded-xl bg-[#111111] hover:bg-black text-[#FFF8ED] px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-[11px] sm:text-xs font-bold shadow-2xs hover:opacity-95 transition-opacity whitespace-nowrap shrink-0"
              title="Beli di TikTok Shop Sahabat MPASI"
            >
              <TikTokIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#25F4EE]" />
              <span>TikTok Shop</span>
            </a>

            <a
              href={tokopediaStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-[#00AA5B] hover:bg-[#00924E] text-white px-3.5 py-2 text-xs font-bold shadow-2xs transition-colors whitespace-nowrap shrink-0"
              title="Buka Tokopedia Resmi Sahabat MPASI"
            >
              <TokopediaIcon className="h-3.5 w-3.5 text-white" />
              <span>Tokopedia</span>
            </a>
          </div>
        </div>

        {/* Mobile Submenu Strip - Horizontal scrollable and compact */}
        <div className="flex md:hidden items-center border-t border-[#5B5147]/10 px-3.5 py-2 text-[11px] font-medium overflow-x-auto gap-3.5 scrollbar-none">
          <button
            type="button"
            onClick={() => navigate({ name: 'home' })}
            className={`whitespace-nowrap shrink-0 ${route.name === 'home' ? 'font-bold underline text-[#5B5147] dark:text-[#F2C6A0]' : 'font-medium'}`}
          >
            Beranda
          </button>
          <button
            type="button"
            onClick={() => navigate({ name: 'produk' })}
            className={`whitespace-nowrap shrink-0 ${route.name === 'produk' ? 'font-bold underline text-[#5B5147] dark:text-[#F2C6A0]' : 'font-medium'}`}
          >
            Produk MPASI
          </button>
          <button
            type="button"
            onClick={() => navigate({ name: 'blog' })}
            className={`whitespace-nowrap shrink-0 ${route.name === 'blog' || route.name === 'blog-detail' ? 'font-bold underline text-[#5B5147] dark:text-[#F2C6A0]' : 'font-medium'}`}
          >
            Blog &amp; Resep
          </button>
          <button
            type="button"
            onClick={() => navigate({ name: 'panduan-tekstur' })}
            className={`whitespace-nowrap shrink-0 ${route.name === 'panduan-tekstur' ? 'font-bold underline text-[#5B5147] dark:text-[#F2C6A0]' : 'font-medium'}`}
          >
            Panduan Tekstur
          </button>
          <button
            type="button"
            onClick={() => navigate({ name: 'about' })}
            className={`whitespace-nowrap shrink-0 ${route.name === 'about' ? 'font-bold underline text-[#5B5147] dark:text-[#F2C6A0]' : 'font-medium'}`}
          >
            Tentang Kami
          </button>
        </div>
      </header>

      {/* =====================================================================
          MAIN PAGE CONTENT ROUTER
         ===================================================================== */}
      <main className="flex-1">
        {/* -------------------------------------------------------------------
            1. HOMEPAGE (/)
           ------------------------------------------------------------------- */}
        {route.name === 'home' && (
          <>
            {/* HERO SECTION */}
            <section className="relative overflow-hidden py-6 sm:py-10 lg:py-16">
              <div className="mx-auto max-w-7xl px-3.5 sm:px-6">
                <div className="grid grid-cols-1 items-center gap-6 sm:gap-10 lg:grid-cols-12">
                  <div className="flex flex-col justify-center space-y-3.5 sm:space-y-5 lg:col-span-7">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-bold text-[#00AA5B] dark:text-[#4ADE80]">
                      <span className="inline-flex items-center gap-1 rounded-md bg-[#00AA5B]/10 dark:bg-[#00AA5B]/20 px-2 py-0.5 sm:px-2.5 sm:py-1">
                        <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        <span>100% Alami</span>
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="text-[#5B5147] dark:text-[#F2C6A0]">
                        Toko Resmi Sahabat MPASI
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="text-[#3B5E38] dark:text-[#A8B89A]">
                        Usia 11+ Bulan
                      </span>
                    </div>

                    <h1 className="font-display text-xl sm:text-3xl lg:text-5xl font-extrabold text-[#5B5147] dark:text-[#FFF8ED] leading-snug sm:leading-[1.18]">
                      Sahabat MPASI: Kremesan Probiotik &amp; Abon Lauk Pendamping Anak
                    </h1>

                    <p className="max-w-2xl text-xs sm:text-base lg:text-lg font-normal leading-relaxed text-[#5B5147]/90 dark:text-[#FFF8ED]/85">
                      Lauk pendamping makan praktis yang gurih, renyah, dan kaya nutrisi untuk si Kecil. Dibuat dari protein hewani pilihan, santan kelapa murni, rempah alami, dan garam natural <strong className="font-bold">tanpa pengawet, tanpa pewarna, dan bebas MSG</strong> untuk membantu mengatasi anak GTM (usia 11+ bulan).
                    </p>

                    <div className="flex flex-wrap items-center gap-2.5 sm:gap-3.5 pt-1 sm:pt-2">
                      <a
                        href={tiktokShopUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg sm:rounded-xl bg-[#111111] hover:bg-black text-white px-3.5 py-2.5 sm:px-5 sm:py-3.5 text-xs sm:text-sm font-bold shadow-2xs inline-flex items-center gap-1.5 sm:gap-2 hover:opacity-95 transition-opacity whitespace-nowrap"
                      >
                        <TikTokIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#25F4EE]" />
                        <span>TikTok Shop Sahabat MPASI</span>
                      </a>

                      <a
                        href={tokopediaStoreUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg sm:rounded-xl bg-[#00AA5B] hover:bg-[#00924E] text-white px-3.5 py-2.5 sm:px-5 sm:py-3.5 text-xs sm:text-sm font-bold shadow-2xs inline-flex items-center gap-1.5 sm:gap-2 transition-colors whitespace-nowrap"
                      >
                        <TokopediaIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                        <span>Tokopedia Sahabat MPASI</span>
                      </a>
                    </div>
                  </div>

                  {/* Right Hero Column: Product Mini-Showcase Grid */}
                  <div className="lg:col-span-5">
                    <div className="rounded-2xl sm:rounded-3xl border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-[#25211D] p-3 sm:p-5 shadow-xs space-y-3 sm:space-y-4">
                      <div className="flex items-center justify-between gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-2.5 sm:pb-3">
                        <div className="flex items-center gap-2">
                          <div className="rounded-lg bg-[#111111] p-1.5 text-white">
                            <TikTokIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#25F4EE]" />
                          </div>
                          <div>
                            <p className="text-[11px] sm:text-xs font-extrabold text-neutral-900 dark:text-white">
                              Produk Favorit Ibu &amp; Si Kecil
                            </p>
                            <p className="text-[10px] sm:text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                              Sahabat MPASI · Kab. Boyolali
                            </p>
                          </div>
                        </div>
                        <span className="rounded bg-[#E8F8F0] dark:bg-[#00AA5B]/20 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-[#00AA5B] dark:text-[#4ADE80]">
                          Ready Stock
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        {etalaseProducts.slice(0, 4).map((item) => (
                          <div
                            key={item.id}
                            onClick={() => openProductDetailModal(item)}
                            className="group cursor-pointer rounded-lg sm:rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/60 dark:bg-[#1E1B18] overflow-hidden hover:border-[#00AA5B] transition-colors"
                          >
                            <div className="relative aspect-square w-full overflow-hidden bg-white">
                              <img
                                src={item.image}
                                alt={item.title}
                                loading="eager"
                                referrerPolicy="no-referrer"
                                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <span className="absolute top-1 right-1 rounded bg-[#FE2C55] px-1 py-0.5 text-[8px] sm:text-[9px] font-extrabold text-white">
                                -{item.discountPercent}%
                              </span>
                            </div>
                            <div className="p-2 sm:p-2.5 space-y-0.5 sm:space-y-1">
                              <p className="text-[10px] sm:text-[11px] font-bold text-neutral-900 dark:text-white line-clamp-1">
                                {item.title}
                              </p>
                              <div className="flex items-baseline gap-1">
                                <span className="text-[11px] sm:text-xs font-extrabold text-[#FE2C55] dark:text-[#FF6B8B] tabular-nums">
                                  {item.priceText}
                                </span>
                                <span className="text-[9px] text-neutral-400 line-through tabular-nums">
                                  {item.originalPriceText}
                                </span>
                              </div>
                              <p className="text-[9px] font-semibold text-[#FF7F17] truncate">
                                {item.promoText}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quantitative Marketplace Trust Bar - compact on phone */}
                <div className="mt-6 sm:mt-12 grid grid-cols-2 gap-2.5 sm:gap-4 sm:grid-cols-4 rounded-xl sm:rounded-2xl border border-[#5B5147]/12 dark:border-[#FFF8ED]/12 bg-white/90 dark:bg-[#25211D] p-3 sm:p-6">
                  <div>
                    <p className="font-display text-lg sm:text-2xl lg:text-3xl font-extrabold tabular-nums text-[#5B5147] dark:text-[#F2C6A0]">
                      {etalaseProducts.length} Varian
                    </p>
                    <p className="text-[10px] sm:text-xs font-medium text-[#5B5147]/85 dark:text-[#FFF8ED]/80 mt-0.5 sm:mt-1">
                      Kremesan &amp; Abon MPASI
                    </p>
                  </div>
                  <div>
                    <p className="font-display text-lg sm:text-2xl lg:text-3xl font-extrabold tabular-nums text-[#00AA5B] dark:text-[#4ADE80]">
                      ★ 5.0 / 5.0
                    </p>
                    <p className="text-[10px] sm:text-xs font-medium text-[#5B5147]/85 dark:text-[#FFF8ED]/80 mt-0.5 sm:mt-1">
                      Rating Tokopedia &amp; TikTok Shop
                    </p>
                  </div>
                  <div>
                    <p className="font-display text-lg sm:text-2xl lg:text-3xl font-extrabold tabular-nums text-[#FE2C55] dark:text-[#FF6B8B]">
                      Hemat s.d 47%
                    </p>
                    <p className="text-[10px] sm:text-xs font-medium text-[#5B5147]/85 dark:text-[#FFF8ED]/80 mt-0.5 sm:mt-1">
                      Promo Gajian Sale &amp; COD
                    </p>
                  </div>
                  <div>
                    <p className="font-display text-lg sm:text-2xl lg:text-3xl font-extrabold tabular-nums text-[#5B5147] dark:text-[#F2C6A0]">
                      Usia 11+ Bln
                    </p>
                    <p className="text-[10px] sm:text-xs font-medium text-[#5B5147]/85 dark:text-[#FFF8ED]/80 mt-0.5 sm:mt-1">
                      Alami Tanpa Pengawet
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 2: PRODUK UNGGULAN DI BERANDA (2 Kolom Rapi di Layar HP) */}
            <section className="py-8 sm:py-16 border-t border-[#5B5147]/10 dark:border-[#FFF8ED]/10 bg-[#F7EFE1]/50 dark:bg-[#191614]">
              <div className="mx-auto max-w-7xl px-3.5 sm:px-6">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 mb-6 sm:mb-10">
                  <div className="space-y-1 sm:space-y-2">
                    <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-[#00AA5B] dark:text-[#4ADE80]">
                      <span>PRODUK UNGGULAN SAHABAT MPASI</span>
                    </div>
                    <h2 className="font-display text-lg sm:text-2xl lg:text-3xl font-bold text-[#5B5147] dark:text-[#FFF8ED]">
                      Koleksi Kremesan Probiotik &amp; Abon Lauk Praktis MPASI
                    </h2>
                    <p className="text-xs sm:text-sm font-normal text-[#5B5147]/90 dark:text-[#FFF8ED]/85">
                      Pilihan lauk tabur praktis kaya protein hewani dan zat besi untuk menambah nafsu makan si Kecil setiap hari.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate({ name: 'produk' })}
                    className="text-xs sm:text-sm font-bold text-[#5B5147] dark:text-[#F2C6A0] hover:underline underline-offset-4 whitespace-nowrap inline-flex items-center gap-1"
                  >
                    <span>
                      Lihat Semua Produk ({etalaseProducts.length} Varian)
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </button>
                </div>

                {/* 2 Kolom di Layar Handphone, 3 Kolom di Tablet, 4 Kolom di Desktop */}
                <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {etalaseProducts
                    .slice(0, 4)
                    .map((product) => renderProductCard(product))}
                </div>
              </div>
            </section>

            {/* SECTION 3: EDUKASI NUTRISI, KOMPOSISI & PANDUAN MPASI */}
            <section className="py-8 sm:py-16 border-t border-[#5B5147]/10 dark:border-[#FFF8ED]/10">
              <div className="mx-auto max-w-7xl px-3.5 sm:px-6">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 mb-6 sm:mb-10">
                  <div className="space-y-1 sm:space-y-2">
                    <h2 className="font-display text-lg sm:text-2xl lg:text-3xl font-bold text-[#5B5147] dark:text-[#FFF8ED]">
                      Edukasi Nutrisi, Komposisi &amp; Panduan MPASI
                    </h2>
                    <p className="text-xs sm:text-sm font-normal text-[#5B5147]/90 dark:text-[#FFF8ED]/85">
                      Tips menyiapkan menu bergizi, tahapan tekstur, dan inspirasi resep MPASI harian untuk mendampingi tumbuh kembang si Kecil.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => navigate({ name: 'blog' })}
                      className="text-xs sm:text-sm font-bold text-[#5B5147] dark:text-[#F2C6A0] hover:underline underline-offset-4 whitespace-nowrap inline-flex items-center gap-1"
                    >
                      <span>Eksplor Semua Artikel ({posts.length})</span>
                      <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </button>
                  </div>
                </div>

                {isLoadingPosts ? (
                  <div className="rounded-xl sm:rounded-2xl border border-[#5B5147]/12 bg-white dark:bg-[#25211D] p-6 sm:p-10 text-center text-xs sm:text-sm font-medium text-[#5B5147]/80 dark:text-[#FFF8ED]/80">
                    Memuat artikel panduan MPASI...
                  </div>
                ) : posts.length === 0 ? (
                  <div className="rounded-xl sm:rounded-2xl border border-[#5B5147]/12 bg-white dark:bg-[#25211D] p-6 sm:p-10 text-center text-xs sm:text-sm font-medium text-[#5B5147]/80 dark:text-[#FFF8ED]/80">
                    Belum ada artikel yang dipublikasikan.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3.5 sm:gap-6 sm:grid-cols-2 md:grid-cols-3">
                    {posts.slice(0, 3).map((post) => renderBlogCard(post))}
                  </div>
                )}
              </div>
            </section>

            {/* SECTION 4: KEUNGGULAN PRODUK SAHABAT MPASI */}
            <section className="py-8 sm:py-16 border-t border-[#5B5147]/10 dark:border-[#FFF8ED]/10">
              <div className="mx-auto max-w-7xl px-3.5 sm:px-6">
                <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
                  <div className="rounded-xl sm:rounded-2xl border border-[#5B5147]/12 dark:border-[#FFF8ED]/12 bg-white dark:bg-[#25211D] p-3 sm:p-5 space-y-1">
                    <p className="font-display text-xs sm:text-base font-bold text-[#5B5147] dark:text-[#FFF8ED]">
                      Tanpa MSG &amp; Pengawet
                    </p>
                    <p className="text-[10px] sm:text-xs font-normal leading-relaxed text-[#5B5147]/85 dark:text-[#FFF8ED]/80">
                      Dibuat dari bahan protein hewani pilihan, santan kelapa murni, rempah alami &amp; garam natural.
                    </p>
                  </div>
                  <div className="rounded-xl sm:rounded-2xl border border-[#5B5147]/12 dark:border-[#FFF8ED]/12 bg-white dark:bg-[#25211D] p-3 sm:p-5 space-y-1">
                    <p className="font-display text-xs sm:text-base font-bold text-[#5B5147] dark:text-[#FFF8ED]">
                      Tinggi Protein &amp; Zat Besi
                    </p>
                    <p className="text-[10px] sm:text-xs font-normal leading-relaxed text-[#5B5147]/85 dark:text-[#FFF8ED]/80">
                      Menggunakan telur bebek free-range, ayam kampung, sapi, dan ikan probiotik padat nutrisi.
                    </p>
                  </div>
                  <div className="rounded-xl sm:rounded-2xl border border-[#5B5147]/12 dark:border-[#FFF8ED]/12 bg-white dark:bg-[#25211D] p-3 sm:p-5 space-y-1">
                    <p className="font-display text-xs sm:text-base font-bold text-[#5B5147] dark:text-[#FFF8ED]">
                      Praktis &amp; Disukai Anak
                    </p>
                    <p className="text-[10px] sm:text-xs font-normal leading-relaxed text-[#5B5147]/85 dark:text-[#FFF8ED]/80">
                      Tekstur renyah dan abon halus mudah dikunyah, siap ditaburkan langsung ke bubur atau nasi hangat.
                    </p>
                  </div>
                  <div className="rounded-xl sm:rounded-2xl border border-[#5B5147]/12 dark:border-[#FFF8ED]/12 bg-white dark:bg-[#25211D] p-3 sm:p-5 space-y-1">
                    <p className="font-display text-xs sm:text-base font-bold text-[#5B5147] dark:text-[#FFF8ED]">
                      Pengiriman &amp; COD
                    </p>
                    <p className="text-[10px] sm:text-xs font-normal leading-relaxed text-[#5B5147]/85 dark:text-[#FFF8ED]/80">
                      Dikirim dari Kab. Boyolali (Senin–Sabtu 08.00–15.00 WIB) dengan garansi aman &amp; Bayar di Tempat.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {/* -------------------------------------------------------------------
            2. BLOG LIST PAGE (/blog) — Maks 9 per halaman + Pilihan Halaman
           ------------------------------------------------------------------- */}
        {route.name === 'blog' && (
          <section className="py-6 sm:py-12">
            <div className="mx-auto max-w-7xl px-3.5 sm:px-6 space-y-6 sm:space-y-8">
              {renderBreadcrumbs(activeSeoProps.breadcrumbs || [])}

              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 sm:gap-6">
                <div className="max-w-2xl space-y-1.5 sm:space-y-3">
                  <h1 className="font-display text-xl sm:text-3xl lg:text-4xl font-extrabold text-[#5B5147] dark:text-[#FFF8ED]">
                    Panduan MPASI Bayi, Resep &amp; Menu Bergizi
                  </h1>
                  <p className="text-xs sm:text-base font-normal leading-relaxed text-[#5B5147]/90 dark:text-[#FFF8ED]/85">
                    Kumpulan artikel edukasi nutrisi, tahapan tekstur, dan inspirasi resep MPASI bergizi untuk mendampingi tumbuh kembang si Kecil.
                  </p>
                </div>

                {/* Search Box */}
                <div className="relative w-full lg:w-80">
                  <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#5B5147]/50 dark:text-[#FFF8ED]/50" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setBlogCurrentPage(1);
                    }}
                    placeholder="Cari resep, tekstur, penyimpanan..."
                    className="w-full rounded-lg sm:rounded-xl border border-[#5B5147]/20 dark:border-[#FFF8ED]/20 bg-white dark:bg-[#25211D] pl-8 sm:pl-9 pr-3 py-1.5 sm:py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#A8B89A]"
                  />
                </div>
              </div>

              {/* Interactive Topic Filter Buttons - scrollable horizontally on mobile */}
              <div className="flex items-center gap-1.5 rounded-lg sm:rounded-xl border border-[#5B5147]/12 dark:border-[#FFF8ED]/12 bg-[#F5ECE0] dark:bg-[#25211D] p-1 overflow-x-auto scrollbar-none w-full">
                {['Semua Topik', ...MPASI_TOPICS].map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => {
                      setSelectedTopic(topic);
                      setBlogCurrentPage(1);
                    }}
                    className={`rounded-md sm:rounded-lg px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs transition-colors whitespace-nowrap shrink-0 ${
                      selectedTopic === topic
                        ? 'bg-[#5B5147] text-[#FFF8ED] dark:bg-[#F2C6A0] dark:text-[#1E1B18] font-bold'
                        : 'font-medium text-[#5B5147]/85 dark:text-[#FFF8ED]/85 hover:text-[#5B5147] hover:font-bold'
                    }`}
                  >
                    {topic}
                  </button>
                ))}
              </div>

              {/* Blog Grid (Maks. 9 artikel per halaman + Pilihan Halaman di bawah) */}
              {isLoadingPosts ? (
                <div className="rounded-xl sm:rounded-2xl border border-[#5B5147]/12 bg-white dark:bg-[#25211D] p-8 sm:p-12 text-center space-y-3">
                  <p className="font-display text-base sm:text-lg font-bold">
                    Memuat artikel dari Notion...
                  </p>
                </div>
              ) : filteredBlogPosts.length === 0 ? (
                <div className="rounded-xl sm:rounded-2xl border border-[#5B5147]/12 bg-white dark:bg-[#25211D] p-8 sm:p-12 text-center space-y-3">
                  <p className="font-display text-base sm:text-lg font-bold">
                    {posts.length === 0
                      ? 'Belum ada artikel yang dipublikasikan di Notion.'
                      : 'Belum ada artikel yang cocok dengan pencarian Anda.'}
                  </p>
                  {posts.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTopic('Semua Topik');
                        setSearchQuery('');
                        setBlogCurrentPage(1);
                      }}
                      className="rounded-lg bg-[#5B5147] px-3.5 py-1.5 text-xs font-bold text-[#FFF8ED]"
                    >
                      Reset Filter Artikel
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-6 sm:space-y-8">
                  <div className="grid grid-cols-1 gap-3.5 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {paginatedBlogPosts.map((post) => renderBlogCard(post))}
                  </div>
                  {renderPagination(
                    safeBlogPage,
                    totalBlogPages,
                    filteredBlogPosts.length,
                    setBlogCurrentPage,
                    'artikel & resep'
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {/* -------------------------------------------------------------------
            3. BLOG DETAIL PAGE (/blog/[slug])
           ------------------------------------------------------------------- */}
        {route.name === 'blog-detail' && currentBlogDetail?.post && (
          <article className="py-6 sm:py-12">
            <div className="mx-auto max-w-3xl px-3.5 sm:px-6">
              {renderBreadcrumbs(activeSeoProps.breadcrumbs || [])}

              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-medium text-[#5B5147]/80 dark:text-[#FFF8ED]/80 mb-2.5 sm:mb-4">
                <span className="font-bold text-[#5B5147] dark:text-[#F2C6A0]">
                  {currentBlogDetail.post.tags.join(' · ')}
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  Diperbarui{' '}
                  <time dateTime={currentBlogDetail.post.updatedAt}>
                    {currentBlogDetail.post.updatedAt}
                  </time>
                </span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">
                  {currentBlogDetail.post.readingTimeMinutes} mnt baca
                </span>
              </div>

              <h1 className="font-display text-xl sm:text-3xl lg:text-4xl font-extrabold leading-snug sm:leading-tight text-[#5B5147] dark:text-[#FFF8ED] mb-3 sm:mb-4">
                {currentBlogDetail.post.title}
              </h1>

              <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4 pb-4 sm:pb-6 mb-5 sm:mb-8 border-b border-[#5B5147]/10 dark:border-[#FFF8ED]/10 text-[11px] sm:text-xs font-medium text-[#5B5147]/80 dark:text-[#FFF8ED]/80">
                <span>
                  Ditulis oleh{' '}
                  <strong className="font-bold text-[#5B5147] dark:text-[#FFF8ED]">
                    {currentBlogDetail.post.author}
                  </strong>
                </span>
                <span>
                  Diterbitkan:{' '}
                  <time
                    dateTime={currentBlogDetail.post.date}
                    className="tabular-nums font-bold"
                  >
                    {currentBlogDetail.post.date}
                  </time>
                </span>
              </div>

              <figure className="mb-6 sm:mb-10 overflow-hidden rounded-xl sm:rounded-2xl border border-[#5B5147]/12 dark:border-[#FFF8ED]/12 bg-[#F7EFE1] dark:bg-[#25211D]">
                <img
                  src={currentBlogDetail.post.cover}
                  alt={`${currentBlogDetail.post.title} - Sahabat MPASI`}
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/hero-mpasi.svg';
                  }}
                  className="aspect-[16/9] w-full object-cover"
                />
              </figure>

              <div className="space-y-6 text-base font-normal leading-[1.8] text-[#5B5147]/95 dark:text-[#FFF8ED]/90">
                {currentBlogDetail.post.blocks.map((block) => {
                  if (
                    block.type === 'heading_1' ||
                    block.type === 'heading_2'
                  ) {
                    return (
                      <h2
                        key={block.id}
                        className="font-display text-2xl font-bold text-[#5B5147] dark:text-[#FFF8ED] pt-4"
                      >
                        {block.text}
                      </h2>
                    );
                  }
                  if (block.type === 'heading_3') {
                    return (
                      <h3
                        key={block.id}
                        className="font-display text-xl font-bold text-[#5B5147] dark:text-[#FFF8ED] pt-2"
                      >
                        {block.text}
                      </h3>
                    );
                  }
                  if (block.type === 'paragraph') {
                    return <p key={block.id}>{block.text}</p>;
                  }
                  if (block.type === 'image') {
                    return (
                      <figure key={block.id} className="my-8 space-y-2">
                        <div className="overflow-hidden rounded-2xl border border-[#5B5147]/12 bg-[#F7EFE1] dark:bg-[#25211D]">
                          <img
                            src={block.imageUrl}
                            alt={
                              block.caption ||
                              `${currentBlogDetail.post.title} - Sahabat MPASI`
                            }
                            loading="lazy"
                            decoding="async"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                '/images/hero-mpasi.svg';
                            }}
                            className="w-full object-cover"
                          />
                        </div>
                        {block.caption && (
                          <figcaption className="text-center text-xs font-medium text-[#5B5147]/75 dark:text-[#FFF8ED]/75">
                            {block.caption}
                          </figcaption>
                        )}
                      </figure>
                    );
                  }
                  if (block.type === 'bulleted_list' && block.items) {
                    return (
                      <ul
                        key={block.id}
                        className="list-disc pl-6 space-y-2 marker:text-[#A8B89A]"
                      >
                        {block.items.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    );
                  }
                  if (block.type === 'numbered_list' && block.items) {
                    return (
                      <ol
                        key={block.id}
                        className="list-decimal pl-6 space-y-2 font-normal"
                      >
                        {block.items.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ol>
                    );
                  }
                  if (block.type === 'quote') {
                    return (
                      <blockquote
                        key={block.id}
                        className="rounded-2xl border border-[#5B5147]/15 dark:border-[#FFF8ED]/15 bg-[#F5ECE0] dark:bg-[#25211D] p-6 text-base font-medium italic text-[#5B5147] dark:text-[#FFF8ED]"
                      >
                        &ldquo;{block.text}&rdquo;
                      </blockquote>
                    );
                  }
                  if (block.type === 'code') {
                    return (
                      <pre
                        key={block.id}
                        className="overflow-x-auto rounded-2xl border border-[#5B5147]/15 bg-[#24201C] p-5 text-xs font-medium text-[#FFF8ED]"
                      >
                        <code>{block.text}</code>
                      </pre>
                    );
                  }
                  return null;
                })}
              </div>

              <div className="mt-12 rounded-2xl border border-[#5B5147]/15 dark:border-[#FFF8ED]/15 bg-[#A8B89A]/25 dark:bg-[#25211D] p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="space-y-1.5">
                  <h2 className="font-display text-xl font-bold text-[#5B5147] dark:text-[#FFF8ED]">
                    Lihat Etalase Produk Sahabat MPASI di TikTok Shop &amp; Tokopedia
                  </h2>
                  <p className="text-sm font-normal leading-relaxed text-[#5B5147]/90 dark:text-[#FFF8ED]/85">
                    Cek ketersediaan Kremesan MPASI Probiotik dan Abon Lauk Pendamping Anak langsung di etalase resmi Sahabat MPASI.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate({ name: 'produk' })}
                  className="rounded-xl bg-[#111111] hover:bg-black text-[#FFF8ED] px-5 py-3 text-xs font-bold inline-flex items-center gap-2 whitespace-nowrap shrink-0 shadow-sm transition-opacity"
                >
                  <span>Buka Etalase Produk</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="mx-auto max-w-7xl px-6 mt-16 pt-12 border-t border-[#5B5147]/10 dark:border-[#FFF8ED]/10">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                {currentBlogDetail.relatedPosts.length > 0 && (
                  <div className="space-y-1">
                    <h2 className="font-display text-2xl font-bold text-[#5B5147] dark:text-[#FFF8ED]">
                      Artikel Terkait Berdasarkan Topik ({currentBlogDetail.post.tags[0]})
                    </h2>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => navigate({ name: 'blog' })}
                  className="text-xs font-bold hover:underline"
                >
                  Kembali ke Daftar Blog &rarr;
                </button>
              </div>

              {currentBlogDetail.relatedPosts.length > 0 && (
                <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                  {currentBlogDetail.relatedPosts.map((relPost) =>
                    renderBlogCard(relPost)
                  )}
                </div>
              )}
            </div>
          </article>
        )}

        {/* -------------------------------------------------------------------
            4. ETALASE PRODUK MPASI (/produk) — TERSINKRONISASI DARI TOKOPEDIA & TIKTOK SHOP
               Memuat 9 Produk per Halaman + Pilihan Halaman di Bawah
           ------------------------------------------------------------------- */}
        {route.name === 'produk' && (
          <section className="py-6 sm:py-10">
            <div className="mx-auto max-w-7xl px-3.5 sm:px-6 space-y-6 sm:space-y-8">
              {renderBreadcrumbs(activeSeoProps.breadcrumbs || [])}

              {/* HEADER TOKO MARKETPLACE (Gaya Etalase Resmi TikTok Shop × Tokopedia) */}
              <div className="rounded-xl sm:rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#221F1C] p-3.5 sm:p-6 shadow-2xs space-y-3.5 sm:space-y-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 sm:gap-5">
                  <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                    <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-xl sm:rounded-2xl bg-[#111111] text-white flex items-center justify-center shrink-0 shadow-2xs border border-neutral-800">
                      <TikTokIcon className="h-6 w-6 sm:h-8 sm:w-8 text-[#25F4EE]" />
                    </div>
                    <div className="space-y-0.5 sm:space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <h1 className="font-display text-base sm:text-2xl font-extrabold text-neutral-900 dark:text-white">
                          Sahabat MPASI
                        </h1>
                        <span className="inline-flex items-center gap-1 rounded bg-[#E8F8F0] dark:bg-[#00AA5B]/20 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] font-bold text-[#00AA5B] dark:text-[#4ADE80]">
                          <ShieldCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                          <span>Official Store</span>
                        </span>
                      </div>
                      <p className="text-[11px] sm:text-sm text-neutral-600 dark:text-neutral-300">
                        Pilihan Kremesan MPASI Probiotik dan Abon Lauk Pendamping Anak berbahan alami tanpa pengawet. Tersedia untuk pemesanan langsung melalui{' '}
                        <strong className="font-bold">Tokopedia</strong> &amp;{' '}
                        <strong className="font-bold">TikTok Shop</strong>.
                      </p>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-0.5 text-[10px] sm:text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                        <span className="inline-flex items-center gap-1 text-neutral-800 dark:text-neutral-200">
                          <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-[#FFC400] text-[#FFC400]" />
                          <strong>5.0</strong> Rating Toko
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>
                          <strong>{etalaseProducts.length}</strong> Produk Tersedia
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#00AA5B]" />
                          <span>Kab. Boyolali</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tautan Toko Resmi untuk Calon Pembeli */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0 pt-1 lg:pt-0">
                    <a
                      href={tiktokShopUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg sm:rounded-xl bg-[#111111] hover:bg-black text-white px-3 py-2 sm:px-4 sm:py-2.5 text-[11px] sm:text-xs font-bold shadow-2xs transition-opacity"
                    >
                      <TikTokIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#25F4EE]" />
                      <span>Buka TikTok Shop</span>
                    </a>

                    <a
                      href={tokopediaStoreUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg sm:rounded-xl bg-[#00AA5B] hover:bg-[#00924E] text-white px-3 py-2 sm:px-4 sm:py-2.5 text-[11px] sm:text-xs font-bold shadow-2xs transition-colors"
                    >
                      <TokopediaIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
                      <span>Buka Tokopedia</span>
                    </a>
                  </div>
                </div>

                {/* VOUCHER & PROMO AKTIF DARI MARKETPLACE */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center justify-between rounded-lg sm:rounded-xl border border-dashed border-[#FF7F17]/50 bg-[#FFF0E6]/60 dark:bg-[#FF7F17]/10 px-3 py-2 sm:px-4 sm:py-2.5">
                    <div>
                      <p className="text-[11px] sm:text-xs font-extrabold text-[#FF7F17]">
                        Diskon Promo s.d 47% · Gajian Sale
                      </p>
                      <p className="text-[10px] sm:text-[11px] font-medium text-neutral-600 dark:text-neutral-300">
                        Promo aktif di seluruh etalase Kremesan &amp; Abon Sahabat MPASI
                      </p>
                    </div>
                    <span className="rounded bg-[#FF7F17] px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-white shrink-0 ml-2">
                      Aktif
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-lg sm:rounded-xl border border-dashed border-[#00AA5B]/50 bg-[#E8F8F0]/60 dark:bg-[#00AA5B]/10 px-3 py-2 sm:px-4 sm:py-2.5">
                    <div>
                      <p className="text-[11px] sm:text-xs font-extrabold text-[#00AA5B] dark:text-[#4ADE80]">
                        Gratis Ongkir Xtra &amp; Bisa COD
                      </p>
                      <p className="text-[10px] sm:text-[11px] font-medium text-neutral-600 dark:text-neutral-300">
                        Tersedia di TikTok Shop &amp; Tokopedia Sahabat MPASI
                      </p>
                    </div>
                    <span className="rounded bg-[#00AA5B] px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-white shrink-0 ml-2">
                      Klaim
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-lg sm:rounded-xl border border-dashed border-[#FE2C55]/50 bg-[#FFEBEF]/60 dark:bg-[#FE2C55]/10 px-3 py-2 sm:px-4 sm:py-2.5">
                    <div>
                      <p className="text-[11px] sm:text-xs font-extrabold text-[#FE2C55] dark:text-[#FF6B8B]">
                        Garansi Pengiriman Sahabat MPASI
                      </p>
                      <p className="text-[10px] sm:text-[11px] font-medium text-neutral-600 dark:text-neutral-300">
                        Jam operasional pengiriman Senin–Sabtu 08.00–15.00 WIB
                      </p>
                    </div>
                    <span className="rounded bg-[#FE2C55] px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-white shrink-0 ml-2">
                      Resmi
                    </span>
                  </div>
                </div>
              </div>

              {/* FILTER KATEGORI ETALASE, PENCARIAN & URUTAN HARGA */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-1.5 rounded-lg sm:rounded-xl border border-[#5B5147]/12 dark:border-[#FFF8ED]/12 bg-[#F5ECE0] dark:bg-[#25211D] p-1 overflow-x-auto scrollbar-none w-full lg:w-fit">
                  {[
                    'Semua',
                    'Kremesan Protein Darat',
                    'Kremesan Ikan & Laut',
                    'Abon Lauk MPASI',
                  ].map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => {
                        setSelectedCategoryFilter(category);
                        setProductCurrentPage(1);
                      }}
                      className={`rounded-md sm:rounded-lg px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs transition-colors whitespace-nowrap shrink-0 ${
                        selectedCategoryFilter === category
                          ? 'bg-[#5B5147] text-[#FFF8ED] dark:bg-[#F2C6A0] dark:text-[#1E1B18] font-bold'
                          : 'font-medium text-[#5B5147]/85 dark:text-[#FFF8ED]/85 hover:text-[#5B5147] hover:font-bold'
                      }`}
                    >
                      {category === 'Semua'
                        ? `Semua (${etalaseProducts.length})`
                        : category}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                  {/* Search inside Etalase */}
                  <div className="relative w-full sm:w-60">
                    <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#5B5147]/50 dark:text-[#FFF8ED]/50" />
                    <input
                      type="search"
                      value={productSearchQuery}
                      onChange={(e) => {
                        setProductSearchQuery(e.target.value);
                        setProductCurrentPage(1);
                      }}
                      placeholder="Cari otak sapi, abon..."
                      className="w-full rounded-lg sm:rounded-xl border border-[#5B5147]/20 dark:border-[#FFF8ED]/20 bg-white dark:bg-[#25211D] pl-8 sm:pl-9 pr-3 py-1.5 sm:py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#00AA5B]"
                    />
                  </div>

                  {/* Sort Selector */}
                  <select
                    value={productSortBy}
                    onChange={(e) => {
                      setProductSortBy(
                        e.target.value as 'terlaris' | 'termurah' | 'termahal'
                      );
                      setProductCurrentPage(1);
                    }}
                    aria-label="Urutkan produk etalase"
                    className="rounded-lg sm:rounded-xl border border-[#5B5147]/20 dark:border-[#FFF8ED]/20 bg-white dark:bg-[#25211D] px-3 py-1.5 sm:py-2 text-xs font-bold text-[#5B5147] dark:text-[#FFF8ED]"
                  >
                    <option value="terlaris">Urutkan: Terlaris</option>
                    <option value="termurah">Harga Terendah</option>
                    <option value="termahal">Harga Tertinggi</option>
                  </select>
                </div>
              </div>

              {/* GRID PRODUK: 2 KOLOM DI LAYAR HP, 3 KOLOM DI TABLET/DESKTOP */}
              {filteredProducts.length === 0 ? (
                <div className="rounded-xl sm:rounded-2xl border border-[#5B5147]/12 bg-white dark:bg-[#25211D] p-8 sm:p-12 text-center space-y-3">
                  <p className="font-display text-base sm:text-lg font-bold">
                    Produk tidak ditemukan di etalase.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategoryFilter('Semua');
                      setProductSearchQuery('');
                      setProductCurrentPage(1);
                    }}
                    className="rounded-lg bg-[#5B5147] px-3.5 py-1.5 text-xs font-bold text-[#FFF8ED]"
                  >
                    Tampilkan Semua Etalase
                  </button>
                </div>
              ) : (
                <div className="space-y-6 sm:space-y-8">
                  <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3">
                    {paginatedProducts.map((product) =>
                      renderProductCard(product)
                    )}
                  </div>
                  {renderPagination(
                    safeProductPage,
                    totalProductPages,
                    filteredProducts.length,
                    setProductCurrentPage,
                    'produk etalase marketplace'
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {/* -------------------------------------------------------------------
            5. PANDUAN TEKSTUR MPASI SESUAI USIA (/panduan-tekstur)
           ------------------------------------------------------------------- */}
        {route.name === 'panduan-tekstur' && (
          <section className="py-6 sm:py-12">
            <div className="mx-auto max-w-7xl px-3.5 sm:px-6 space-y-6 sm:space-y-10">
              {renderBreadcrumbs(activeSeoProps.breadcrumbs || [])}

              <div className="max-w-3xl space-y-2 sm:space-y-3">
                <h1 className="font-display text-xl sm:text-3xl lg:text-4xl font-extrabold text-[#5B5147] dark:text-[#FFF8ED]">
                  Panduan Interaktif Tekstur &amp; Takaran Porsi MPASI Sesuai Usia
                </h1>
                <p className="text-xs sm:text-base font-normal leading-relaxed text-[#5B5147]/90 dark:text-[#FFF8ED]/85">
                  Pilih rentang usia si Kecil di bawah ini untuk melihat standar tekstur, frekuensi makan harian, dan takaran porsi per kali makan sesuai pedoman IDAI.
                </p>
              </div>

              <div className="flex items-center gap-1.5 rounded-lg sm:rounded-xl border border-[#5B5147]/15 dark:border-[#FFF8ED]/15 bg-[#F5ECE0] dark:bg-[#25211D] p-1 overflow-x-auto scrollbar-none w-full sm:w-fit">
                {TEXTURE_STAGES.map((stage) => (
                  <button
                    key={stage.id}
                    type="button"
                    onClick={() => setSelectedTextureStageId(stage.id)}
                    className={`rounded-md sm:rounded-lg px-3 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-xs transition-colors whitespace-nowrap shrink-0 ${
                      selectedTextureStageId === stage.id
                        ? 'bg-[#5B5147] text-[#FFF8ED] dark:bg-[#F2C6A0] dark:text-[#1E1B18] font-bold'
                        : 'font-medium text-[#5B5147] dark:text-[#FFF8ED] hover:bg-[#5B5147]/10 hover:font-bold'
                    }`}
                  >
                    {stage.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch rounded-xl sm:rounded-2xl border border-[#5B5147]/15 dark:border-[#FFF8ED]/15 bg-white dark:bg-[#25211D] p-4 sm:p-10">
                <div className="lg:col-span-7 flex flex-col justify-center space-y-4 sm:space-y-6">
                  <div className="space-y-1 sm:space-y-2">
                    <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#5B5147]/75 dark:text-[#F2C6A0]">
                      STANDAR TEKSTUR · {activeTextureStage.label.toUpperCase()}
                    </p>
                    <h2 className="font-display text-lg sm:text-2xl lg:text-3xl font-bold text-[#5B5147] dark:text-[#FFF8ED]">
                      {activeTextureStage.textureName}
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
                    <div className="rounded-lg sm:rounded-xl border border-[#5B5147]/12 dark:border-[#FFF8ED]/12 bg-[#FFF8ED] dark:bg-[#1E1B18] p-3 sm:p-4 space-y-0.5 sm:space-y-1">
                      <p className="text-[10px] sm:text-xs font-semibold text-[#5B5147]/75 dark:text-[#F2C6A0]">
                        Frekuensi Makan Harian
                      </p>
                      <p className="text-xs sm:text-sm font-bold">
                        {activeTextureStage.frequency}
                      </p>
                    </div>
                    <div className="rounded-lg sm:rounded-xl border border-[#5B5147]/12 dark:border-[#FFF8ED]/12 bg-[#FFF8ED] dark:bg-[#1E1B18] p-3 sm:p-4 space-y-0.5 sm:space-y-1">
                      <p className="text-[10px] sm:text-xs font-semibold text-[#5B5147]/75 dark:text-[#F2C6A0]">
                        Takaran Porsi Sekali Makan
                      </p>
                      <p className="text-xs sm:text-sm font-bold tabular-nums">
                        {activeTextureStage.portion}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs sm:text-sm font-normal leading-relaxed text-[#5B5147]/90 dark:text-[#FFF8ED]/85">
                    <p>
                      <strong className="font-bold">Ciri Kekentalan Ideal:</strong>{' '}
                      {activeTextureStage.consistency}
                    </p>
                    <p>
                      <strong className="font-bold">Fokus Nutrisi Utama:</strong>{' '}
                      {activeTextureStage.keyFocus}
                    </p>
                  </div>

                  <div className="pt-1 sm:pt-2 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => navigate({ name: 'produk' })}
                      className="rounded-lg sm:rounded-xl bg-[#5B5147] dark:bg-[#F2C6A0] px-4 py-2.5 sm:px-5 sm:py-3 text-xs font-bold text-[#FFF8ED] dark:text-[#1E1B18] whitespace-nowrap"
                    >
                      Lihat Etalase Produk MPASI
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate({ name: 'blog' })}
                      className="text-xs font-bold underline underline-offset-4"
                    >
                      Lihat Artikel Blog MPASI &rarr;
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-5 flex items-stretch">
                  <div className="w-full overflow-hidden rounded-xl sm:rounded-2xl border border-[#5B5147]/12 bg-[#F7EFE1] dark:bg-[#1E1B18]">
                    <img
                      src={activeTextureStage.image}
                      alt={`Tekstur MPASI ${activeTextureStage.label} - Sahabat MPASI`}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* -------------------------------------------------------------------
            6. TENTANG KAMI (/about)
           ------------------------------------------------------------------- */}
        {route.name === 'about' && (
          <section className="py-6 sm:py-12">
            <div className="mx-auto max-w-5xl px-3.5 sm:px-6 space-y-8 sm:space-y-12">
              {renderBreadcrumbs(activeSeoProps.breadcrumbs || [])}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10 items-center">
                <div className="lg:col-span-7 space-y-3 sm:space-y-4">
                  <h1 className="font-display text-xl sm:text-3xl lg:text-4xl font-extrabold text-[#5B5147] dark:text-[#FFF8ED]">
                    Tentang Sahabat MPASI
                  </h1>
                  <p className="text-xs sm:text-base font-normal leading-relaxed text-[#5B5147]/90 dark:text-[#FFF8ED]/85">
                    <strong className="font-bold">Sahabat MPASI</strong> hadir untuk mendampingi perjalanan nutrisi si Kecil melalui rangkaian produk Kremesan MPASI Probiotik dan Abon Lauk Praktis yang lezat, higienis, dan padat gizi.
                  </p>
                  <p className="text-xs sm:text-sm font-normal leading-relaxed text-[#5B5147]/85 dark:text-[#FFF8ED]/80">
                    Seluruh produk Kremesan MPASI Probiotik dan Abon Lauk Praktis dari Sahabat MPASI dibuat menggunakan bahan protein hewani pilihan, santan kelapa murni, gula aren, rempah-rempah alami, serta garam natural tanpa pewarna dan tanpa pengawet untuk melengkapi variasi menu makan si Kecil.
                  </p>
                </div>

                <div className="lg:col-span-5">
                  <div className="overflow-hidden rounded-xl sm:rounded-2xl border border-[#5B5147]/12 bg-white p-2.5 sm:p-3 shadow-2xs">
                    <img
                      src={primaryShowcaseImage}
                      alt="Sahabat MPASI - Kremesan & Abon Lauk Pendamping MPASI"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="w-full aspect-square object-cover rounded-lg sm:rounded-xl"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-6">
                <div className="rounded-xl sm:rounded-2xl border border-[#5B5147]/12 bg-white dark:bg-[#25211D] p-4 sm:p-6 space-y-1.5">
                  <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#00AA5B] dark:text-[#4ADE80]">
                    KOMPOSISI ALAMI PILIHAN
                  </p>
                  <h2 className="font-display text-sm sm:text-base font-bold">
                    Protein Hewani &amp; Rempah Murni
                  </h2>
                  <p className="text-xs font-normal leading-relaxed text-[#5B5147]/85 dark:text-[#FFF8ED]/80">
                    Menggunakan daging ayam kampung, sapi, bebek, hati ayam, dan ikan probiotik berkualitas tinggi yang dipadukan dengan santan kelapa murni serta telur bebek free-range.
                  </p>
                </div>

                <div className="rounded-xl sm:rounded-2xl border border-[#5B5147]/12 bg-white dark:bg-[#25211D] p-4 sm:p-6 space-y-1.5">
                  <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#A85538] dark:text-[#F2C6A0]">
                    STANDAR KUALITAS MPASI
                  </p>
                  <h2 className="font-display text-sm sm:text-base font-bold">
                    Tanpa Pengawet &amp; Tanpa MSG
                  </h2>
                  <p className="text-xs font-normal leading-relaxed text-[#5B5147]/85 dark:text-[#FFF8ED]/80">
                    Cocok sebagai lauk pendamping maupun camilan sehat untuk anak yang sedang GTM (disarankan untuk balita usia 11 bulan ke atas).
                  </p>
                </div>

                <div className="rounded-xl sm:rounded-2xl border border-[#5B5147]/12 bg-white dark:bg-[#25211D] p-4 sm:p-6 space-y-1.5">
                  <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#3B5E38] dark:text-[#A8B89A]">
                    BELANJA MUDAH &amp; AMAN
                  </p>
                  <h2 className="font-display text-sm sm:text-base font-bold">
                    Tersedia di TikTok Shop &amp; Tokopedia
                  </h2>
                  <p className="text-xs font-normal leading-relaxed text-[#5B5147]/85 dark:text-[#FFF8ED]/80">
                    Nikmati promo Gajian Sale, Gratis Ongkir Xtra, garansi pengiriman, dan layanan Bayar di Tempat (COD) melalui toko resmi Sahabat MPASI.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* =====================================================================
          MODAL DETAIL PRODUK MARKETPLACE (TAMPILAN PDP TOKOPEDIA / TIKTOK SHOP)
         ===================================================================== */}
      {activeModalProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto"
          onClick={() => setActiveModalProduct(null)}
        >
          <div
            className="relative my-2 sm:my-8 w-full max-w-4xl overflow-hidden rounded-2xl sm:rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#221F1C] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Top Header */}
            <div className="flex items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 px-3.5 py-2.5 sm:px-6 sm:py-4 bg-neutral-50 dark:bg-[#1E1B18]">
              <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold text-neutral-700 dark:text-neutral-200 truncate">
                <TikTokIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-black dark:text-[#25F4EE] shrink-0" />
                <span className="truncate">Detail Etalase Resmi · {activeModalProduct.storeName}</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalProduct(null)}
                className="rounded-lg p-1 sm:p-1.5 text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors shrink-0"
                aria-label="Tutup detail produk"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>

            {/* Modal Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 sm:gap-6 p-3.5 sm:p-6 max-h-[85vh] overflow-y-auto">
              {/* Left Column: Synced Marketplace Image Gallery */}
              <div className="md:col-span-5 space-y-2 sm:space-y-3">
                <div className="relative aspect-square w-full overflow-hidden rounded-xl sm:rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100">
                  <img
                    src={
                      activeModalProduct.gallery[activeModalImageIdx] ||
                      activeModalProduct.image
                    }
                    alt={activeModalProduct.title}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute bottom-2 right-2 rounded bg-black/75 px-1.5 py-0.5 text-[10px] sm:text-[11px] font-bold text-white tabular-nums">
                    {activeModalImageIdx + 1} / {activeModalProduct.gallery.length}
                  </span>
                </div>

                {/* Gallery Thumbnails from Tokopedia / TikTok Shop CDN */}
                {activeModalProduct.gallery.length > 1 && (
                  <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {activeModalProduct.gallery.map((imgUrl, idx) => (
                      <button
                        key={imgUrl + idx}
                        type="button"
                        onClick={() => setActiveModalImageIdx(idx)}
                        className={`relative h-11 w-11 sm:h-14 sm:w-14 shrink-0 overflow-hidden rounded-lg sm:rounded-xl border-2 transition-all ${
                          activeModalImageIdx === idx
                            ? 'border-[#00AA5B] scale-105 shadow-xs'
                            : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={imgUrl}
                          alt={`Slide ${idx + 1}`}
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Full Marketplace Product Info, Price, Promo & Description */}
              <div className="md:col-span-7 flex flex-col justify-between space-y-3.5 sm:space-y-5">
                <div className="space-y-2.5 sm:space-y-4">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-bold">
                    <span className="rounded bg-[#E8F8F0] dark:bg-[#00AA5B]/20 px-2 py-0.5 text-[#00AA5B] dark:text-[#4ADE80]">
                      {activeModalProduct.category}
                    </span>
                    <span className="rounded bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 text-neutral-700 dark:text-neutral-300">
                      {activeModalProduct.recommendedAge}
                    </span>
                    <span className="rounded bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 text-neutral-700 dark:text-neutral-300">
                      Kemasan {activeModalProduct.weightLabel}
                    </span>
                  </div>

                  <h2 className="font-display text-base sm:text-2xl font-extrabold text-neutral-900 dark:text-white leading-snug">
                    {activeModalProduct.title}
                  </h2>

                  {/* Rating & Sold Stats */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                    <span className="inline-flex items-center gap-1 font-bold text-neutral-900 dark:text-white">
                      <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-[#FFC400] text-[#FFC400]" />
                      <span>{activeModalProduct.rating.toFixed(1)}</span>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{activeModalProduct.soldText}</span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 text-[#00AA5B] dark:text-[#4ADE80]">
                      <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      <span>Dikirim dari {activeModalProduct.storeLocation}</span>
                    </span>
                  </div>

                  {/* Marketplace Price & Promo Banner */}
                  <div className="rounded-xl sm:rounded-2xl bg-[#FFF5F6] dark:bg-[#2C1D21] border border-[#FE2C55]/20 p-2.5 sm:p-4 space-y-1.5 sm:space-y-2">
                    <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap">
                      <span className="font-display text-lg sm:text-3xl font-extrabold text-[#FE2C55] dark:text-[#FF6B8B] tabular-nums">
                        {activeModalProduct.priceText}
                      </span>
                      {activeModalProduct.originalPriceIdr >
                        activeModalProduct.priceIdr && (
                        <>
                          <span className="text-xs sm:text-sm text-neutral-400 line-through tabular-nums">
                            {activeModalProduct.originalPriceText}
                          </span>
                          <span className="rounded bg-[#FE2C55] px-1.5 py-0.5 text-[10px] sm:text-xs font-extrabold text-white">
                            -{activeModalProduct.discountPercent}%
                          </span>
                        </>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-1 sm:gap-2 pt-0.5">
                      {activeModalProduct.promoBadges.map((badge) => (
                        <span
                          key={badge}
                          className="inline-flex items-center gap-1 rounded bg-white dark:bg-neutral-900 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold text-[#FF7F17] shadow-2xs"
                        >
                          <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          <span>{badge}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Deskripsi & Informasi Nilai Gizi Produk */}
                  <div className="space-y-1.5">
                    <h3 className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      Deskripsi &amp; Informasi Nilai Gizi Produk
                    </h3>
                    <div className="rounded-xl sm:rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-[#1E1B18] p-3 sm:p-4 text-xs sm:text-sm leading-relaxed text-neutral-800 dark:text-neutral-200 whitespace-pre-line max-h-44 sm:max-h-60 overflow-y-auto">
                      {activeModalProduct.description}
                    </div>
                  </div>
                </div>

                {/* Direct Marketplace Checkout Buttons */}
                <div className="pt-3 sm:pt-4 border-t border-neutral-200 dark:border-neutral-800 grid grid-cols-2 gap-2 sm:gap-3">
                  <a
                    href={activeModalProduct.tiktokShopUrl || tiktokShopUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 rounded-lg sm:rounded-xl bg-[#111111] hover:bg-black text-white px-3 py-2.5 sm:px-5 sm:py-3.5 text-[11px] sm:text-sm font-bold shadow-2xs transition-opacity"
                  >
                    <TikTokIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#25F4EE]" />
                    <span>TikTok Shop</span>
                    <ExternalLink className="h-3 w-3 sm:h-3.5 sm:w-3.5 opacity-75 hidden sm:inline" />
                  </a>

                  <a
                    href={activeModalProduct.tokopediaUrl || tokopediaStoreUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 rounded-lg sm:rounded-xl bg-[#00AA5B] hover:bg-[#00924E] text-white px-3 py-2.5 sm:px-5 sm:py-3.5 text-[11px] sm:text-sm font-bold shadow-2xs transition-colors"
                  >
                    <TokopediaIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                    <span>Tokopedia</span>
                    <ExternalLink className="h-3 w-3 sm:h-3.5 sm:w-3.5 opacity-75 hidden sm:inline" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          CLEAN FOOTER
         ===================================================================== */}
      <footer className="border-t border-[#5B5147]/12 bg-[#F5ECE0] dark:bg-[#161311] dark:border-[#FFF8ED]/10 py-8 sm:py-14 text-xs sm:text-sm text-[#5B5147]/85 dark:text-[#FFF8ED]/80">
        <div className="mx-auto max-w-7xl px-3.5 sm:px-6 grid grid-cols-1 gap-6 sm:gap-10 md:grid-cols-4">
          <div className="md:col-span-2 space-y-2.5 sm:space-y-3">
            <p className="font-display text-lg sm:text-xl font-extrabold text-[#5B5147] dark:text-[#FFF8ED]">
              Sahabat MPASI
            </p>
            <p className="max-w-md font-normal leading-relaxed text-xs sm:text-sm">
              Rangkaian produk Kremesan MPASI Probiotik dan Abon Lauk Pendamping Anak berbahan alami tanpa pengawet untuk mendampingi tumbuh kembang si Kecil.
            </p>
            <div className="pt-1.5 flex flex-wrap items-center gap-2">
              <a
                href={tiktokShopUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg sm:rounded-xl bg-[#111111] hover:bg-black text-[#FFF8ED] px-3 py-2 text-[11px] sm:text-xs font-bold shadow-2xs transition-opacity"
              >
                <TikTokIcon className="h-3.5 w-3.5 text-[#25F4EE]" />
                <span>TikTok Shop</span>
              </a>
              <a
                href={tokopediaStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg sm:rounded-xl bg-[#00AA5B] hover:bg-[#00924E] text-white px-3 py-2 text-[11px] sm:text-xs font-bold shadow-2xs transition-colors"
              >
                <TokopediaIcon className="h-3.5 w-3.5 text-white" />
                <span>Tokopedia</span>
              </a>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <p className="font-bold text-[#5B5147] dark:text-[#FFF8ED]">
              Halaman Website
            </p>
            <ul className="space-y-1.5 font-medium">
              <li>
                <button
                  type="button"
                  onClick={() => navigate({ name: 'home' })}
                  className="hover:underline hover:font-bold"
                >
                  Beranda
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate({ name: 'produk' })}
                  className="hover:underline hover:font-bold"
                >
                  Etalase Produk MPASI
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate({ name: 'blog' })}
                  className="hover:underline hover:font-bold"
                >
                  Blog &amp; Resep MPASI
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate({ name: 'panduan-tekstur' })}
                  className="hover:underline hover:font-bold"
                >
                  Panduan Tekstur Sesuai Usia
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate({ name: 'about' })}
                  className="hover:underline hover:font-bold"
                >
                  Tentang Sahabat MPASI
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-2 text-xs">
            <p className="font-bold text-[#5B5147] dark:text-[#FFF8ED]">
              Topik Panduan MPASI
            </p>
            <ul className="space-y-1.5 font-medium">
              {MPASI_TOPICS.slice(0, 5).map((topic) => (
                <li key={topic}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTopic(topic);
                      navigate({ name: 'blog' });
                    }}
                    className="hover:underline hover:font-bold text-left"
                  >
                    {topic}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mx-auto mt-6 sm:mt-10 max-w-7xl border-t border-[#5B5147]/10 dark:border-[#FFF8ED]/10 px-3.5 sm:px-6 pt-4 sm:pt-6 flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4 text-[11px] sm:text-xs font-medium text-center sm:text-left">
          <p>
            &copy; {new Date().getFullYear()}{' '}
            <strong className="font-bold">Sahabat MPASI Indonesia</strong>.
            Seluruh hak cipta dilindungi.
          </p>
          <p className="text-[#5B5147]/80 dark:text-[#FFF8ED]/80">
            Halal Indonesia - 100% Bahan Alami Tanpa Pengawet
          </p>
        </div>
      </footer>
    </div>
  );
}
