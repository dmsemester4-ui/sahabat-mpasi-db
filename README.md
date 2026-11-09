# Sahabat MPASI — Website Produk & Blog Edukasi MPASI (Astro + Tailwind CSS + Notion CMS)

Selamat datang di dokumentasi **Sahabat MPASI**. Panduan ini ditulis khusus dengan bahasa yang mudah dipahami oleh **pemula / non-IT** agar Anda dapat mengelola artikel blog langsung dari aplikasi **Notion** dan menayangkan website secara gratis di **Vercel**.

---

## 1. Identitas Brand & Warna
- **Nama Media**: Sahabat MPASI
- **Produk Utama**: Produk Makanan Pendamping ASI (MPASI) untuk Bayi (Usia 6 Bulan – 4 Tahun)
- **Palet Warna**:
  - Sage Green: `#A8B89A`
  - Warm Cream: `#FFF8ED`
  - Soft Peach: `#F2C6A0`
  - Deep Warm Brown: `#5B5147`
- **CTA Utama**: `Pesan MPASI Sekarang`

---

## 2. Panduan Setup Database Notion (Langkah demi Langkah untuk Pemula)

### Langkah A: Buat Tabel Database di Notion
1. Buka aplikasi **Notion** atau akses [https://www.notion.so](https://www.notion.so) di browser.
2. Klik tombol **New Page** (Halaman Baru) di menu sebelah kiri.
3. Beri judul halaman misalnya: **Database Blog Sahabat MPASI**.
4. Ketik `/database` lalu pilih **Database - Full page** (Tabel Halaman Penuh).
5. Atur kolom (Properties) tabel Anda agar **persis sama** (perhatikan huruf besar/kecil) dengan 7 properti berikut:

| Nama Kolom (Property) | Tipe Property di Notion | Penjelasan & Isi Pilihan |
| :--- | :--- | :--- |
| **`Title`** | `Title` (Bawaan kolom pertama) | Judul artikel blog Anda (Ubah nama kolom pertama dari `Name` menjadi `Title`). |
| **`Slug`** | `Text` | Alamat URL artikel tanpa spasi, misalnya: `resep-mpasi-salmon-6-bulan`. |
| **`Status`** | `Select` | Buat 2 pilihan: **`Draft`** dan **`Published`**. Hanya artikel berstatus **`Published`** yang tampil di website. |
| **`Date`** | `Date` | Tanggal terbit artikel. |
| **`Tags`** | `Multi-select` | Masukkan 8 pilihan topik resmi:<br>1. `Panduan MPASI Bayi`<br>2. `Menu MPASI Bergizi`<br>3. `Resep MPASI Bayi 6 Bulan`<br>4. `Menu MPASI 6-12 Bulan`<br>5. `Tips Menyiapkan MPASI`<br>6. `Tekstur MPASI Sesuai Usia`<br>7. `Bahan Makanan Bayi`<br>8. `Tips Penyimpanan MPASI` |
| **`Excerpt`** | `Text` | Ringkasan singkat artikel (maksimal 150–160 karakter) untuk ditampilkan di Google (Meta Description SEO). |
| **`Cover`** | `Files & media` | Gambar sampul artikel (bisa upload gambar atau paste link gambar). |

---

### Langkah B: Cara Mendapatkan `NOTION_TOKEN`
1. Buka halaman resmi integrasi Notion: [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Klik tombol **"+ New integration"** (Integrasi Baru).
3. Isi bagian berikut:
   - **Name**: `Sahabat MPASI Website`
   - **Associated workspace**: Pilih workspace Notion Anda.
   - **Capabilities**: Centang **Read content** (Baca konten).
4. Klik **Save / Submit**.
5. Anda akan melihat **Internal Integration Secret** (diawali dengan `ntn_...` atau `secret_...`).
6. Klik **Show** lalu **Copy**. Simpan kode ini sebagai **`NOTION_TOKEN`**.

---

### Langkah C: Hubungkan Integrasi ke Database & Ambil `NOTION_DATABASE_ID`
1. Kembali ke halaman **Database Blog Sahabat MPASI** di Notion Anda.
2. Klik ikon **titik tiga (`...`)** di pojok kanan atas halaman Notion.
3. Scroll ke bawah, pilih **Connections** -> klik **Connect to** -> pilih **`Sahabat MPASI Website`** yang baru Anda buat. *(Langkah ini wajib agar website diizinkan membaca tabel Anda!)*
4. Sekarang lihat alamat URL database Notion Anda di browser:
   ```text
   https://www.notion.so/workspaceanda/a8b89a1234567890abcdef1234567890?v=...
                                       ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                       32 karakter ini adalah NOTION_DATABASE_ID
   ```
5. Salin 32 karakter kode di antara garis miring terakhir (`/`) dan tanda tanya (`?`). Simpan sebagai **`NOTION_DATABASE_ID`**.

---

## 3. Cara Menjalankan Project di Komputer Anda

1. Pastikan komputer Anda sudah terinstal **Node.js** (unduh gratis versi LTS di [https://nodejs.org](https://nodejs.org)).
2. Buka Terminal (Mac/Linux) atau Command Prompt / PowerShell (Windows) di dalam folder project ini.
3. Duplikat file `.env.example` menjadi `.env` dan isi nilai token Anda:
   ```env
   NOTION_TOKEN="ntn_paste_token_notion_anda_disini"
   NOTION_DATABASE_ID="paste_32_karakter_database_id_disini"
   PUBLIC_SITE_URL="https://teman-mpasi.vercel.app"
   ```
4. Instal seluruh paket pendukung dengan perintah:
   ```bash
   npm install
   ```
5. Jalankan server pengembangan:
   ```bash
   npm run dev
   ```
   - Untuk mode Astro murni: jalankan `npx astro dev` (berjalan di `http://localhost:4321`).
   - Untuk mode Preview AI Studio Full-Stack: berjalan di `http://localhost:3000`.

---

## 4. Cara Push Project ke GitHub

1. Buat akun gratis di [https://github.com](https://github.com) lalu klik tombol **"New repository"**.
2. Beri nama repository: `teman-mpasi-web` lalu klik **Create repository**.
3. Jalankan perintah berikut secara berurutan di Terminal folder project Anda:
   ```bash
   git init
   git add .
   git commit -m "Initial commit website Sahabat MPASI"
   git branch -M main
   git remote add origin https://github.com/USERNAME_ANDA/teman-mpasi-web.git
   git push -u origin main
   ```

---

## 5. Cara Deploy ke Vercel & Setting Environment Variables

1. Buka [https://vercel.com](https://vercel.com) dan masuk menggunakan akun **GitHub** Anda.
2. Klik tombol **"Add New..."** -> **"Project"**.
3. Pilih repository **`teman-mpasi-web`** lalu klik **Import**.
4. Sebelum klik Deploy, buka menu **Environment Variables** dan tambahkan 2 variabel berikut:
   - Key: `NOTION_TOKEN` | Value: *(isi dengan secret token Notion Anda)*
   - Key: `NOTION_DATABASE_ID` | Value: *(isi dengan 32 karakter ID database Notion Anda)*
5. Klik tombol **Deploy**.
6. Tunggu sekitar 1 menit—website **Sahabat MPASI** Anda sudah online di `https://teman-mpasi.vercel.app` dengan sertifikat HTTPS otomatis!
