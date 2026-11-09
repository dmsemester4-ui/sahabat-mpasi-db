# Panduan Lengkap: Publish Gratis di Vercel + Database Gratis Non-Google (Supabase & Notion)

Seluruh kode konfigurasi untuk **Vercel** (`vercel.json` & `api/index.ts`) serta **Database Gratis Non-Google** (`src/lib/supabase.ts`, `supabase-schema.sql`, & `src/lib/notion.ts`) **sudah disiapkan langsung di dalam project ini**.

Berikut adalah tahapan lengkap dari awal sampai website **Sahabat MPASI** online secara gratis:

---

## TAHAP 1: Siapkan Database Gratis Non-Google (Supabase PostgreSQL)
*Digunakan untuk menyimpan data katalog produk secara permanen di cloud (100% Gratis & di luar Google).*

1. Buka **[https://supabase.com](https://supabase.com)** lalu klik **Start your project** (bisa daftar gratis menggunakan akun GitHub atau Email).
2. Klik tombol **New Project**:
   - **Name**: `sahabat-mpasi-db`
   - **Database Password**: Buat password bebas (simpan baik-baik).
   - **Region**: Pilih **Southeast Asia (Singapore)** agar akses dari Indonesia sangat cepat.
   - Klik **Create new project** (tunggu sekitar 1 menit hingga statusnya aktif).
3. **Buat Tabel Produk Otomatis**:
   - Di menu sebelah kiri dashboard Supabase, klik ikon **SQL Editor** -> klik **+ New query**.
   - Buka file **`supabase-schema.sql`** yang sudah ada di project ini, *copy* seluruh isinya, lalu *paste* ke layar SQL Editor Supabase.
   - Klik tombol **Run** (di kanan bawah). Akan muncul pesan `Success. No rows returned`.
4. **Ambil Kunci Koneksi (URL & API Key)**:
   - Klik menu **Project Settings** (ikon gerigi di kiri bawah) -> pilih menu **API**.
   - Salin 2 data berikut untuk dimasukkan ke Vercel nanti:
     1. **Project URL** (contoh: `https://xxxx.supabase.co`) -> ini untuk `SUPABASE_URL`
     2. **Project API Keys (`anon` `public`)** -> ini untuk `SUPABASE_ANON_KEY`

*(Catatan: Begitu website pertama kali dibuka setelah terhubung ke Supabase, 12 produk asli Sahabat MPASI dari Tokopedia/TikTok Shop akan **otomatis ter-input/ter-seed** ke tabel `etalase_products` di Supabase Anda!)*

---

## TAHAP 2: Siapkan Database Artikel Blog Gratis (Notion CMS - Non-Google)
*Digunakan untuk menulis dan mengelola artikel edukasi MPASI kapan saja dari HP atau laptop tanpa koding.*

1. Website ini sudah terhubung dengan struktur **Notion Database**.
2. Jika ingin menggunakan Notion milik Anda sendiri:
   - Buka **[https://www.notion.so/my-integrations](https://www.notion.so/my-integrations)** -> klik **New integration** -> beri nama `Sahabat MPASI CMS` -> salin **Internal Integration Secret** (`ntn_...`) sebagai `NOTION_TOKEN`.
   - Buka halaman Database tabel artikel di Notion Anda -> klik titik tiga (`...`) di pojok kanan atas -> pilih **Connections** -> sambungkan ke `Sahabat MPASI CMS`.
   - Salin **Database ID** dari link Notion Anda sebagai `NOTION_DATABASE_ID`.

---

## TAHAP 3: Simpan Kode ke GitHub (Gratis)

1. Buat akun gratis di **[https://github.com](https://github.com)** (jika belum punya).
2. Dari Google AI Studio, klik tombol **Export to GitHub** atau **Download ZIP** di pojok kanan atas:
   - Jika menggunakan **Download ZIP**: ekstrak folder ZIP di komputer Anda, lalu upload ke repository baru di GitHub dengan nama misalnya `sahabat-mpasi`.

---

## TAHAP 4: Publish Gratis ke Vercel (1 Klik Online)

1. Buka **[https://vercel.com](https://vercel.com)** lalu klik **Sign Up / Log In** dan pilih **Continue with GitHub**.
2. Di halaman utama dashboard Vercel, klik tombol **Add New...** -> pilih **Project**.
3. Pada daftar repository GitHub Anda, cari **`sahabat-mpasi`** lalu klik tombol **Import**.
4. Pada halaman **Configure Project**:
   - **Project Name**: ketik `sahabatmpasi` (nanti alamat gratis Anda otomatis menjadi **`https://sahabatmpasi.vercel.app`**).
   - **Framework Preset**: Biarkan otomatis terdeteksi sebagai **Vite** (karena file `vercel.json` sudah mengatur semuanya secara otomatis).
5. Buka bagian **Environment Variables** (klik panahnya), lalu tambahkan variabel berikut satu per satu:
   - `SUPABASE_URL` = *(isi dengan Project URL dari Supabase Tahap 1)*
   - `SUPABASE_ANON_KEY` = *(isi dengan key `anon public` dari Supabase Tahap 1)*
   - `NOTION_TOKEN` = *(isi dengan token Notion Anda)*
   - `NOTION_DATABASE_ID` = *(isi dengan Database ID Notion Anda)*
   - `PUBLIC_SITE_URL` = `https://sahabatmpasi.vercel.app`
6. Klik tombol **Deploy**!
7. Tunggu sekitar **45–60 detik** hingga muncul layar konfeti **Congratulations!**. Website Anda langsung online di **`https://sahabatmpasi.vercel.app`** (atau domain custom Anda sendiri jika suatu saat ingin menyambungkan `.com` / `.id`).
