# BURPI POS untuk Android

Aplikasi kasir offline untuk BURPI (Burger & Kopi). Fiturnya: kasir, member dengan stempel dan referral, menu dengan resep dan HPP, stok, batch dan daftar belanja, serta laporan dengan ekspor ke Excel.
Semua data tersimpan di **database SQLite di HP atau tablet**, jadi aplikasi tetap bisa dipakai tanpa internet.

---

## 1. Membuat file APK (sekali saja, gratis)

APK dibuat otomatis oleh **GitHub Actions**. Kamu tidak perlu menginstal Android Studio.

1. Buat akun di <https://github.com> kalau belum punya.
2. Klik **New repository**, lalu beri nama `burpi-pos`. Repo boleh publik atau private. Kunci tanda tangan aplikasi sudah terenkripsi, dan kata sandinya disimpan sebagai secret.
3. Ekstrak file zip proyek ini. Di halaman repo, klik **uploading an existing file**, lalu seret **semua isi folder** ke situ dan klik **Commit changes**.
   - Pastikan folder `.github` ikut terunggah. Folder ini tersembunyi di Mac dan Windows.
   - Kalau tidak ikut, buat manual: **Add file → Create new file**, isi nama `.github/workflows/build-apk.yml`, lalu tempel isi file tersebut.
4. Buka tab **Actions**. Proses **Build APK BURPI POS** akan berjalan sekitar 5–10 menit.
5. Setelah selesai (tanda centang hijau), klik nama prosesnya, lalu di bagian **Artifacts** unduh `BURPI-POS-v1.0.x`. Ekstrak, dan di dalamnya ada file `.apk`.

## 2. Memasang di Android

1. Kirim file `.apk` ke HP atau tablet, misalnya lewat Google Drive atau WhatsApp ke diri sendiri.
2. Buka file tersebut. Android akan meminta izin **Instal aplikasi tidak dikenal**. Izinkan untuk aplikasi yang kamu pakai membuka file itu, misalnya Files atau Drive.
3. Aplikasi **BURPI POS** muncul di layar utama.

Minimal Android 7.0. Tampilan paling nyaman di tablet, tapi juga bisa dipakai di HP.

## 3. Memperbarui aplikasi

Unggah file yang berubah ke repo. GitHub otomatis membuat APK baru dengan nomor versi lebih tinggi. Pasang APK baru **di atas** aplikasi lama, dan data tetap aman.

> ⚠️ Kunci tanda tangan aplikasi tersimpan terenkripsi di `android/app/burpi-pos.jks.enc`. Kata sandinya ada di secret repo `BURPI_KEYSTORE_PASSWORD` (Settings → Secrets and variables → Actions). Jangan hapus atau mengganti keduanya. Kalau kuncinya berubah, APK baru tidak bisa dipasang sebagai update. Aplikasi lama harus dihapus dulu, dan **datanya ikut hilang**.
> Sebelum memperbarui, biasakan **Ekspor database** dulu.

---

## 4. Database

| | |
|---|---|
| Mesin | SQLite (plugin `@capacitor-community/sqlite`), tersimpan di memori internal aplikasi |
| Online? | Tidak perlu. Satu perangkat, satu toko |
| Cadangan | **Pengaturan → Ekspor database (.zip)**, lalu simpan ke Google Drive |
| Pulihkan | **Pengaturan → Impor dari file** → pilih file `.zip` hasil ekspor |

> Data hilang kalau aplikasi dihapus atau HP direset. Lakukan ekspor rutin, minimal seminggu sekali. Aplikasi akan menampilkan pengingat "Cadangkan data" di layar kasir.

### Isi file ekspor (.zip)

- `burpi.sqlite`: salinan database. Bisa dibuka dengan DB Browser for SQLite atau DBeaver.
- `data.json`: semua tabel dalam satu file. Dipakai juga untuk impor kembali.
- `csv/*.csv`: satu file per tabel (UTF-8, pemisah koma, waktu ISO 8601).
- `schema-postgres.sql` dan `schema-sqlite.sql`: struktur tabel.
- `BACA-SAYA.txt`: penjelasan isi dan hubungan antar tabel.

### Tabel

| Tabel | Isi |
|---|---|
| `settings` | pengaturan toko, aturan stempel & referral, biaya tetap |
| `ingredients` | bahan baku (`type = raw`) & setengah jadi (`type = prep`) |
| `prep_inputs` | bahan baku per batch bahan setengah jadi |
| `batches` | batch setengah jadi beserta sisa & tanggal kedaluwarsa |
| `menu_items`, `menu_variants`, `recipe_lines` | menu → ukuran → resep |
| `modifiers`, `modifier_lines` | less sugar, + keju, dll. beserta perubahan resepnya |
| `bundle_components` | isi paket |
| `members` | member, stempel, kode referral |
| `transactions`, `transaction_items`, `transaction_discounts` | penjualan |
| `stock_movements` | buku besar stok: `sale`, `purchase`, `batch_output`, `batch_input`, `waste`, `adjust` |

Setiap tabel punya `id` teks unik dan `updated_at`. Dengan begitu, data siap dipindah ke sistem online:

- **PostgreSQL / Supabase**: jalankan `schema-postgres.sql`, lalu impor tiap CSV.
- **Firestore**: satu tabel menjadi satu collection, dan `id` menjadi document id.

---

## 5. Untuk pengembang

```bash
npm install
npm run build        # menyiapkan www/ (native.js, library, font)
npx cap sync android
npx cap open android # buka di Android Studio (opsional)
```

- Kode aplikasi: `www/index.html`
- Jembatan ke Android (SQLite, file, share, tombol Back): `src/native.js`
- Versi web untuk uji coba: jalankan server lokal di folder `www` (misalnya `npx serve www`). Di browser, database memakai sql.js dan tersimpan di IndexedDB.
