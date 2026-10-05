# Cara Mengoperasikan SewaKita di Windows

## 1. Instal yang dibutuhkan

Instal Node.js 20.9+ (lebih aman memakai Node 22 LTS).

Cek setelah instal:

```powershell
node -v
npm -v
```

## 2. Ekstrak proyek

Ekstrak ZIP ke lokasi sederhana, misalnya:

`C:\sewakita\sewakita`

Jangan menaruh proyek di folder yang membutuhkan hak Administrator.

## 3. Instal dependency

Buka PowerShell/CMD pada folder proyek:

```powershell
cd C:\sewakita\sewakita
npm install
```

## 4. Siapkan Supabase

Buat project Supabase.

Buka:

`SQL Editor → New query`

Salin seluruh isi:

`supabase/schema.sql`

Lalu tekan `Run`.

## 5. Buat file environment

Salin:

`.env.example` → `.env.local`

Isi:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_ADMIN_WHATSAPP=628xxxxxxxxxx
```

JANGAN membagikan `SUPABASE_SERVICE_ROLE_KEY`.

## 6. Jalankan

```powershell
npm run dev
```

Buka:

`http://localhost:3000`

## 7. Buat akun pengguna

Klik `Masuk / Daftar` → isi nama, WhatsApp, email, dan password.

Jika email confirmation aktif, buka email konfirmasi terlebih dahulu.

## 8. Jadikan akun Anda sebagai admin

Buka Supabase SQL Editor dan jalankan:

```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'EMAIL_ANDA');
```

Ganti `EMAIL_ANDA`, lalu login ulang.

Buka:

`http://localhost:3000/admin`

## 9. Alur operasional harian

Pemilik:

`Dashboard → Tambah properti → Upload foto → Simpan & kirim moderasi`

Admin/moderator:

`Admin → Pusat Moderasi → Lihat → Setujui/Tolak`

Setelah disetujui, properti muncul di halaman publik.

## 10. Bila admin ingin mengangkat moderator

Gunakan SQL, bukan formulir user:

```sql
update public.profiles
set role = 'moderator'
where id = (select id from auth.users where email = 'EMAIL_MODERATOR');
```

## 11. Bila ingin menarik listing dari publik

Admin/moderator dapat memilih `Arsipkan`. Data tidak dihapus permanen dari browser.

## 12. Bila ingin mengedit listing yang sudah tayang

Pemilik membuka `Dashboard → Edit`.

Setelah perubahan disimpan, listing kembali ke `pending` agar diperiksa lagi sebelum tayang.

## 13. Tes keamanan minimum

Buat akun user biasa. Pastikan:

- User tidak dapat membuka `/admin`.
- User tidak dapat mengubah role sendiri.
- User tidak dapat mengatur verified.
- User tidak dapat mengatur featured.
- User tidak dapat menghapus listing secara permanen.
- Listing pending tidak muncul di publik.
- Listing approved muncul di publik.
- Edit listing approved membuat status kembali pending.

## 14. Menjalankan setelah komputer direstart

Masuk lagi ke folder proyek dan cukup jalankan:

```powershell
npm run dev
```

## 15. Menghentikan server

Tekan:

`Ctrl + C`

## 16. Jika muncul `npm` timeout

Pastikan koneksi internet stabil dan coba lagi:

```powershell
npm install
```

Proyek tetap tersimpan; yang gagal hanyalah proses mengunduh dependency.
