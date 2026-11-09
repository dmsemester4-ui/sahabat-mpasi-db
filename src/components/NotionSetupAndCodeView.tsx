import React, { useState, useEffect } from 'react';
import {
  Check,
  Copy,
  Database,
  FileCode,
  Rocket,
  Terminal,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { MPASI_TOPICS } from '../lib/notion';

interface NotionSetupAndCodeViewProps {
  notionSource: 'notion' | 'fallback';
  notionError?: string;
  customToken: string;
  customDbId: string;
  onSaveCredentials: (token: string, dbId: string) => void;
  onNavigateBlog: () => void;
}

const NOTION_SCHEMA_ROWS = [
  {
    property: 'Title',
    type: 'Title',
    example: 'Resep MPASI Bayi 6 Bulan Pertama: Puree Salmon & Labu Kabocha',
    note: 'Ubah nama kolom pertama bawaan Notion ("Name") menjadi "Title"',
  },
  {
    property: 'Slug',
    type: 'Text',
    example: 'resep-mpasi-bayi-6-bulan-puree-salmon-labu-kabocha',
    note: 'URL bersih huruf kecil tanpa spasi (otomatis diformat oleh fungsi slugify)',
  },
  {
    property: 'Status',
    type: 'Select',
    example: 'Published / Draft',
    note: 'Hanya artikel dengan pilihan "Published" yang akan tampil di website',
  },
  {
    property: 'Date',
    type: 'Date',
    example: '2026-10-18',
    note: 'Tanggal rilis artikel (digunakan untuk pengurutan artikel terbaru & JSON-LD)',
  },
  {
    property: 'Tags',
    type: 'Multi-select',
    example: 'Resep MPASI Bayi 6 Bulan, Menu MPASI Bergizi',
    note: 'Digunakan untuk kategori dan fitur 3 Artikel Terkait otomatis di bawah post',
  },
  {
    property: 'Excerpt',
    type: 'Text',
    example: 'Panduan langkah demi langkah membuat puree salmon Norwegia...',
    note: 'Maksimal 160 karakter — diambil otomatis sebagai Meta Description SEO Google',
  },
  {
    property: 'Cover',
    type: 'Files & media',
    example: 'salmon-kabocha.jpg',
    note: 'Gambar utama artikel (otomatis diberi alt="{Judul Artikel} - Sahabat MPASI")',
  },
];

export default function NotionSetupAndCodeView({
  notionSource,
  notionError,
  customToken,
  customDbId,
  onSaveCredentials,
  onNavigateBlog,
}: NotionSetupAndCodeViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<
    'schema' | 'credentials' | 'deploy' | 'codebase'
  >('schema');
  const [tokenInput, setTokenInput] = useState(customToken);
  const [dbIdInput, setDbIdInput] = useState(customDbId);
  const [astroFiles, setAstroFiles] = useState<Record<string, string>>({});
  const [selectedFile, setSelectedFile] = useState<string>('src/lib/notion.ts');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/astro-files')
      .then((res) => res.json())
      .then((data) => {
        if (data.files) {
          setAstroFiles(data.files);
        }
      })
      .catch(() => {
        // fallback silent
      });
  }, []);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleTestConnection = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveCredentials(tokenInput.trim(), dbIdInput.trim());
  };

  return (
    <section className="py-12">
      <div className="mx-auto max-w-7xl px-6 space-y-10">
        {/* Header Section */}
        <div className="max-w-3xl space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#5B5147]/75 dark:text-[#FFF8ED]/75">
            <span>Dokumentasi Non-IT</span>
            <span aria-hidden="true">·</span>
            <span>Astro v4 + Tailwind CSS + Notion API</span>
            <span aria-hidden="true">·</span>
            <span>Siap Deploy GitHub &amp; Vercel</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#5B5147] dark:text-[#FFF8ED]">
            Panduan Setup Notion CMS, Kode Astro &amp; Deploy Vercel
          </h1>
          <p className="text-base leading-relaxed text-[#5B5147]/80 dark:text-[#FFF8ED]/75">
            Halaman ini memandu Anda langkah demi langkah (tanpa perlu latar belakang IT) untuk menyiapkan tabel Notion, menghubungkan API, melihat seluruh file kode Astro, hingga menayangkan website ke internet.
          </p>
        </div>

        {/* Sub-navigation Segmented Controls (Interactive functional buttons) */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-[#5B5147]/15 bg-[#F5ECE0] dark:bg-[#25211D] dark:border-[#FFF8ED]/15 p-1.5 w-fit">
          <button
            type="button"
            onClick={() => setActiveSubTab('schema')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              activeSubTab === 'schema'
                ? 'bg-[#5B5147] text-[#FFF8ED]'
                : 'text-[#5B5147] dark:text-[#FFF8ED] hover:bg-[#5B5147]/10'
            }`}
          >
            <Database className="h-3.5 w-3.5" />
            <span>1. Tabel Database Notion</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('credentials')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              activeSubTab === 'credentials'
                ? 'bg-[#5B5147] text-[#FFF8ED]'
                : 'text-[#5B5147] dark:text-[#FFF8ED] hover:bg-[#5B5147]/10'
            }`}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>2. Token &amp; Tes Koneksi Notion</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('deploy')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              activeSubTab === 'deploy'
                ? 'bg-[#5B5147] text-[#FFF8ED]'
                : 'text-[#5B5147] dark:text-[#FFF8ED] hover:bg-[#5B5147]/10'
            }`}
          >
            <Rocket className="h-3.5 w-3.5" />
            <span>3. Panduan GitHub &amp; Vercel</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('codebase')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              activeSubTab === 'codebase'
                ? 'bg-[#5B5147] text-[#FFF8ED]'
                : 'text-[#5B5147] dark:text-[#FFF8ED] hover:bg-[#5B5147]/10'
            }`}
          >
            <FileCode className="h-3.5 w-3.5" />
            <span>4. Lihat File Project Astro (17 File)</span>
          </button>
        </div>

        {/* TAB 1: NOTION DATABASE SCHEMA */}
        {activeSubTab === 'schema' && (
          <div className="space-y-8">
            <div className="rounded-2xl border border-[#5B5147]/15 bg-white dark:bg-[#25211D] dark:border-[#FFF8ED]/15 p-6 sm:p-8 space-y-6">
              <div className="space-y-2">
                <h2 className="font-display text-2xl font-bold text-[#5B5147] dark:text-[#FFF8ED]">
                  Skema 7 Kolom (Properties) Wajib di Database Notion Anda
                </h2>
                <p className="text-sm text-[#5B5147]/80 dark:text-[#FFF8ED]/75">
                  Buat halaman baru di Notion, ketik <code className="font-mono bg-[#F5ECE0] dark:bg-[#1E1B18] px-1.5 py-0.5 rounded">/database</code> lalu pilih <strong>Database - Full page</strong>. Samakan nama dan tipe kolom seperti tabel di bawah ini:
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[#5B5147]/15 dark:border-[#FFF8ED]/15 text-xs font-semibold text-[#5B5147]/70 dark:text-[#FFF8ED]/70">
                      <th className="py-3 pr-4">Nama Properti (Persis)</th>
                      <th className="py-3 px-4">Tipe di Notion</th>
                      <th className="py-3 px-4">Contoh Isi</th>
                      <th className="py-3 pl-4">Fungsi pada Website &amp; SEO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#5B5147]/10 dark:divide-[#FFF8ED]/10">
                    {NOTION_SCHEMA_ROWS.map((row) => (
                      <tr key={row.property}>
                        <td className="py-3.5 pr-4 font-mono font-semibold text-[#5B5147] dark:text-[#F2C6A0] whitespace-nowrap">
                          {row.property}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs whitespace-nowrap">
                          {row.type}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-[#5B5147]/80 dark:text-[#FFF8ED]/80">
                          {row.example}
                        </td>
                        <td className="py-3.5 pl-4 text-xs text-[#5B5147]/75 dark:text-[#FFF8ED]/75">
                          {row.note}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Daftar 8 Pilihan Tags Multi-select */}
            <div className="rounded-2xl border border-[#5B5147]/15 bg-white dark:bg-[#25211D] dark:border-[#FFF8ED]/15 p-6 sm:p-8 space-y-4">
              <h3 className="font-display text-xl font-bold text-[#5B5147] dark:text-[#FFF8ED]">
                Daftar 8 Pilihan Kolom &ldquo;Tags&rdquo; (Multi-select) Sesuai Topik Blog
              </h3>
              <p className="text-sm text-[#5B5147]/80 dark:text-[#FFF8ED]/75">
                Klik tombol salin di samping setiap topik untuk menempelkannya ke opsi <strong>Multi-select</strong> kolom <code className="font-mono">Tags</code> di Notion:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {MPASI_TOPICS.map((topic) => (
                  <div
                    key={topic}
                    className="flex items-center justify-between gap-2 rounded-xl border border-[#5B5147]/12 bg-[#FFF8ED] dark:bg-[#1E1B18] dark:border-[#FFF8ED]/12 px-4 py-3 text-xs font-medium"
                  >
                    <span className="truncate">{topic}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(topic, topic)}
                      className="text-[#5B5147]/70 dark:text-[#FFF8ED]/70 hover:text-[#5B5147] shrink-0"
                      title="Salin nama topik"
                    >
                      {copiedKey === topic ? (
                        <Check className="h-4 w-4 text-[#647A54]" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CARA MENDAPATKAN NOTION_TOKEN & DATABASE_ID + LIVE TESTER */}
        {activeSubTab === 'credentials' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-6">
              <div className="rounded-2xl border border-[#5B5147]/15 bg-white dark:bg-[#25211D] dark:border-[#FFF8ED]/15 p-6 sm:p-8 space-y-5">
                <h2 className="font-display text-2xl font-bold text-[#5B5147] dark:text-[#FFF8ED]">
                  Cara Mendapatkan NOTION_TOKEN &amp; NOTION_DATABASE_ID
                </h2>

                <div className="space-y-4 text-sm leading-relaxed text-[#5B5147]/85 dark:text-[#FFF8ED]/80">
                  <div className="space-y-1.5">
                    <h3 className="font-semibold text-[#5B5147] dark:text-[#F2C6A0]">
                      Langkah 1: Buat Integration Token (NOTION_TOKEN)
                    </h3>
                    <ol className="list-decimal pl-5 space-y-1.5">
                      <li>
                        Buka{' '}
                        <a
                          href="https://www.notion.so/my-integrations"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline font-medium inline-flex items-center gap-1"
                        >
                          notion.so/my-integrations
                          <ExternalLink className="h-3 w-3" />
                        </a>{' '}
                        lalu klik <strong>&ldquo;+ New integration&rdquo;</strong>.
                      </li>
                      <li>
                        Beri nama <strong>Sahabat MPASI CMS</strong>, pilih workspace Notion Anda, lalu klik <strong>Save</strong>.
                      </li>
                      <li>
                        Salin kode <strong>Internal Integration Secret</strong> (diawali <code className="font-mono">ntn_...</code> atau <code className="font-mono">secret_...</code>). Ini adalah <strong>NOTION_TOKEN</strong> Anda.
                      </li>
                    </ol>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <h3 className="font-semibold text-[#5B5147] dark:text-[#F2C6A0]">
                      Langkah 2: Sambungkan ke Tabel &amp; Ambil NOTION_DATABASE_ID
                    </h3>
                    <ol className="list-decimal pl-5 space-y-1.5">
                      <li>
                        Buka halaman tabel database Notion Anda, klik tombol titik tiga (<strong>...</strong>) di pojok kanan atas.
                      </li>
                      <li>
                        Pilih menu <strong>Connections</strong> &rarr; <strong>Connect to</strong> &rarr; pilih <strong>Sahabat MPASI CMS</strong>.
                      </li>
                      <li>
                        Salin link URL database di browser Anda. Ambil <strong>32 karakter</strong> sebelum tanda <code className="font-mono">?v=</code>:
                        <pre className="mt-2 overflow-x-auto rounded-xl bg-[#2A2521] p-3 font-mono text-xs text-[#FFF8ED]">
                          https://www.notion.so/workspace/a8b89a1234567890abcdef1234567890?v=...
                        </pre>
                      </li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Live Notion Connection Form */}
            <div className="lg:col-span-5">
              <form
                onSubmit={handleTestConnection}
                className="rounded-2xl border border-[#5B5147]/15 bg-white dark:bg-[#25211D] dark:border-[#FFF8ED]/15 p-6 sm:p-8 space-y-5"
              >
                <div className="space-y-1.5">
                  <h3 className="font-display text-xl font-bold text-[#5B5147] dark:text-[#FFF8ED]">
                    Uji Koneksi Database Notion Anda Sekarang
                  </h3>
                  <p className="text-xs text-[#5B5147]/75 dark:text-[#FFF8ED]/75">
                    Status saat ini:{' '}
                    <strong className="font-semibold text-[#5B5147] dark:text-[#F2C6A0]">
                      {notionSource === 'notion'
                        ? 'Terhubung langsung ke Notion API Anda'
                        : 'Menggunakan 6 Artikel Edukasi Bawaan (Siap Pakai)'}
                    </strong>
                  </p>
                </div>

                {notionError && (
                  <div className="rounded-xl border border-[#5B5147]/20 bg-[#F2C6A0]/25 p-3.5 text-xs text-[#5B5147] dark:text-[#FFF8ED]">
                    {notionError}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="block text-xs font-semibold">
                    NOTION_TOKEN (Opsional untuk uji langsung)
                  </label>
                  <input
                    type="password"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="ntn_... atau secret_..."
                    className="w-full rounded-xl border border-[#5B5147]/20 bg-[#FFF8ED] dark:bg-[#1E1B18] px-3.5 py-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#A8B89A]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold">
                    NOTION_DATABASE_ID (32 Karakter)
                  </label>
                  <input
                    type="text"
                    value={dbIdInput}
                    onChange={(e) => setDbIdInput(e.target.value)}
                    placeholder="Contoh: a8b89a1234567890abcdef1234567890"
                    className="w-full rounded-xl border border-[#5B5147]/20 bg-[#FFF8ED] dark:bg-[#1E1B18] px-3.5 py-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#A8B89A]"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="submit"
                    className="rounded-xl bg-[#5B5147] px-5 py-2.5 text-xs font-semibold text-[#FFF8ED] hover:bg-[#463E36] transition-colors whitespace-nowrap"
                  >
                    Simpan &amp; Muat Ulang Artikel Notion
                  </button>
                  <button
                    type="button"
                    onClick={onNavigateBlog}
                    className="rounded-xl border border-[#5B5147]/20 px-4 py-2.5 text-xs font-semibold hover:bg-[#5B5147]/5 transition-colors whitespace-nowrap"
                  >
                    Lihat Halaman Blog
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 3: PANDUAN TERMINAL, GITHUB & VERCEL */}
        {activeSubTab === 'deploy' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-[#5B5147]/15 bg-white dark:bg-[#25211D] p-6 space-y-4">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[#5B5147]/70 dark:text-[#F2C6A0]">
                <Terminal className="h-4 w-4" />
                <span>TAHAP 01 · LOKAL KOMPUTER</span>
              </div>
              <h3 className="font-display text-lg font-bold">
                Inisialisasi &amp; Jalankan di Localhost
              </h3>
              <p className="text-xs leading-relaxed text-[#5B5147]/80 dark:text-[#FFF8ED]/75">
                Buka Terminal di folder project Anda lalu jalankan perintah berikut untuk menjalankan server lokal:
              </p>
              <pre className="overflow-x-auto rounded-xl bg-[#2A2521] p-4 font-mono text-xs text-[#FFF8ED]">
{`# 1. Install seluruh paket
npm install

# 2. Salin file .env
cp .env.example .env

# 3. Jalankan server dev
npm run dev`}
              </pre>
            </div>

            <div className="rounded-2xl border border-[#5B5147]/15 bg-white dark:bg-[#25211D] p-6 space-y-4">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[#5B5147]/70 dark:text-[#F2C6A0]">
                <FileCode className="h-4 w-4" />
                <span>TAHAP 02 · UPLOAD KE GITHUB</span>
              </div>
              <h3 className="font-display text-lg font-bold">
                Push Kode Project ke GitHub
              </h3>
              <p className="text-xs leading-relaxed text-[#5B5147]/80 dark:text-[#FFF8ED]/75">
                Buat repository baru bernama <code className="font-mono">teman-mpasi</code> di GitHub.com, lalu jalankan perintah ini:
              </p>
              <pre className="overflow-x-auto rounded-xl bg-[#2A2521] p-4 font-mono text-xs text-[#FFF8ED]">
{`git init
git add .
git commit -m "Deploy Sahabat MPASI"
git branch -M main
git remote add origin https://github.com/USERNAME/teman-mpasi.git
git push -u origin main`}
              </pre>
            </div>

            <div className="rounded-2xl border border-[#5B5147]/15 bg-white dark:bg-[#25211D] p-6 space-y-4">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[#5B5147]/70 dark:text-[#F2C6A0]">
                <Rocket className="h-4 w-4" />
                <span>TAHAP 03 · DEPLOY KE VERCEL</span>
              </div>
              <h3 className="font-display text-lg font-bold">
                Setting Environment Variables di Vercel
              </h3>
              <ol className="list-decimal pl-5 space-y-2 text-xs leading-relaxed text-[#5B5147]/80 dark:text-[#FFF8ED]/75">
                <li>Login ke <strong>Vercel.com</strong> menggunakan akun GitHub Anda.</li>
                <li>Klik <strong>Add New Project</strong> &rarr; Import <strong>teman-mpasi</strong>.</li>
                <li>
                  Buka bagian <strong>Environment Variables</strong> dan isi:
                  <ul className="list-disc pl-4 mt-1 font-mono text-[11px]">
                    <li>NOTION_TOKEN = ntn_...</li>
                    <li>NOTION_DATABASE_ID = 32_karakter_id</li>
                  </ul>
                </li>
                <li>Klik <strong>Deploy</strong>. Website langsung aktif di <code className="font-mono">teman-mpasi.vercel.app</code>!</li>
              </ol>
            </div>
          </div>
        )}

        {/* TAB 4: ASTRO PROJECT CODEBASE EXPLORER */}
        {activeSubTab === 'codebase' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 rounded-2xl border border-[#5B5147]/15 bg-white dark:bg-[#25211D] p-4 space-y-2">
              <p className="px-2 py-1 text-xs font-semibold text-[#5B5147]/70 dark:text-[#FFF8ED]/70">
                Struktur File Astro &amp; Konfigurasi SEO
              </p>
              <div className="space-y-1 max-h-[520px] overflow-y-auto pr-1">
                {Object.keys(astroFiles).map((filePath) => (
                  <button
                    key={filePath}
                    type="button"
                    onClick={() => setSelectedFile(filePath)}
                    className={`w-full text-left rounded-lg px-3 py-2 font-mono text-xs transition-colors flex items-center justify-between gap-2 ${
                      selectedFile === filePath
                        ? 'bg-[#5B5147] text-[#FFF8ED] font-semibold'
                        : 'text-[#5B5147] dark:text-[#FFF8ED] hover:bg-[#5B5147]/10'
                    }`}
                  >
                    <span className="truncate">{filePath}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-8 rounded-2xl border border-[#5B5147]/15 bg-[#24201C] text-[#FFF8ED] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-3.5">
                <span className="font-mono text-xs font-semibold text-[#F2C6A0]">
                  /{selectedFile}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(astroFiles[selectedFile] || '', selectedFile)
                  }
                  className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-[#FFF8ED] hover:bg-white/20 transition-colors whitespace-nowrap"
                >
                  {copiedKey === selectedFile ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-[#A8B89A]" />
                      <span>Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Salin Kode File</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-5 font-mono text-xs leading-relaxed overflow-x-auto max-h-[500px] overflow-y-auto">
                <code>{astroFiles[selectedFile] || 'Memuat isi file...'}</code>
              </pre>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
