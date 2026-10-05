# SewaKita — Portal Sewa Properti

SewaKita adalah portal informasi sewa untuk kost, rumah, kontrakan, apartemen, ruko, villa, dan properti sejenis.

## Yang sudah aktif di paket ini

- Landing page responsif dan pencarian/filter.
- Mode demo ketika Supabase belum diisi.
- Supabase Auth untuk login/daftar.
- Dashboard pemilik.
- Form listing dengan upload sampai 8 foto (JPG/PNG/WebP, maksimum 5 MB/foto).
- Alur listing: draft → pending → approved/rejected/archived.
- Edit listing milik sendiri. Saat listing yang sudah tayang diedit, status kembali ke pending agar dimoderasi lagi.
- Panel moderator/admin.
- Approval/rejection.
- Verifikasi listing.
- Featured listing (admin only).
- Archive tanpa hard delete dari browser.
- Laporan listing.
- Audit log untuk aksi staf.
- Row Level Security (RLS) dan hak kolom terbatas.
- Sitemap dan robots untuk SEO.

## Struktur hak akses

### Pengunjung
Melihat listing yang statusnya `approved`.

### Pemilik / user
Dapat membuat dan mengubah listing miliknya. Tidak dapat mengubah role akun, status verified, featured, atau melakukan hard delete.

### Moderator
Dapat meninjau, approve/reject, memverifikasi, dan mengarsipkan listing.

### Admin
Semua hak moderator + mengatur featured listing.

Role admin/moderator tidak boleh dibuat lewat form user. Bootstrap admin dilakukan sekali melalui SQL setelah akun admin dibuat.

## Menjalankan lokal

1. Install Node.js 20.9+ (disarankan Node 22 LTS).
2. Ekstrak proyek.
3. Buka terminal di folder `sewakita`.
4. Jalankan `npm install`.
5. Salin `.env.example` menjadi `.env.local`.
6. Isi `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, dan `SUPABASE_SERVICE_ROLE_KEY`.
7. Buat project Supabase.
8. Buka Supabase → SQL Editor → jalankan seluruh `supabase/schema.sql`.
9. Jalankan `npm run dev`.
10. Buka `http://localhost:3000`.

Jika `.env.local` belum diisi, halaman publik akan tetap menampilkan mode demo. Login/database tidak akan bekerja sebelum Supabase dikonfigurasi.

## Membuat admin pertama kali

1. Daftar satu akun di `/login`.
2. Pastikan akun tersebut ada di `Authentication → Users` di Supabase.
3. Di Supabase SQL Editor jalankan:

```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'EMAIL_ADMIN_ANDA');
```

Ganti `EMAIL_ADMIN_ANDA` dengan email admin Anda.

4. Login ulang lalu buka `/admin`.

## Supabase Auth

Untuk tahap awal gunakan Email + Password. Jika project Supabase mewajibkan email confirmation, pengguna harus membuka email konfirmasi sebelum login penuh.

## Upload foto

Bucket yang dibuat oleh `schema.sql` adalah `listing-images` dan bersifat public-read agar foto listing dapat dilihat pengunjung. Upload/update/delete file dibatasi ke folder milik user sendiri menggunakan Storage Policy.

Struktur path foto:

`USER_ID/LISTING_ID/RANDOM_FILE.webp`

Jangan memberi permission luas pada `storage.objects`.

## Deploy gratis

Pilihan awal:

- GitHub untuk source code.
- Vercel Hobby untuk hosting aplikasi.
- Supabase Free untuk database/Auth/Storage.

Alur:

`Laptop → GitHub → Vercel → Supabase`

Di Vercel masukkan environment variables yang sama dengan `.env.local`.

## Deploy berbayar

Saat traffic dan kebutuhan meningkat, naikkan paket hosting/database sesuai penggunaan. Tambahkan domain resmi, backup, monitoring, rate limiting, dan analytics.

## Hal yang harus diganti

Cari nilai berikut dan isi sendiri:

- `.env.local` → URL, publishable key, service role key.
- `NEXT_PUBLIC_SITE_URL` → domain final, misalnya `https://sewakita.id`.
- `NEXT_PUBLIC_ADMIN_WHATSAPP` → nomor WhatsApp admin jika ingin dipakai pada fitur dukungan.
- `ADMIN_EMAIL_HERE` pada komentar schema hanya contoh.

## Keamanan produksi

- Jangan pernah commit `.env.local`.
- Jangan menaruh `SUPABASE_SERVICE_ROLE_KEY` di kode client.
- Pertahankan RLS pada tabel publik.
- Jangan memberi browser role hak DELETE pada `listings`.
- Gunakan archive untuk penghapusan operasional.
- Gunakan rate limiting untuk login, listing, upload, dan report.
- Tambahkan CAPTCHA/anti-spam bila listing mulai ramai.
- Tinjau laporan dan audit log secara rutin.
- Untuk kebutuhan hukum dan operasional, siapkan Terms, Privacy Policy, serta prosedur penanganan laporan.

## Cek cepat sebelum go-live

- [ ] Supabase project dibuat.
- [ ] `schema.sql` berhasil dijalankan tanpa error.
- [ ] Auth email/password aktif.
- [ ] Akun admin dibuat dan role diubah menjadi admin via SQL.
- [ ] Upload foto berhasil.
- [ ] User biasa tidak dapat membuka `/admin`.
- [ ] Listing pending tidak muncul di halaman publik.
- [ ] Approve membuat listing tampil.
- [ ] Edit listing tampil kembali sebagai pending.
- [ ] Service role key tidak ada di source GitHub.
- [ ] `NEXT_PUBLIC_SITE_URL` sudah domain final.
- [ ] HTTPS aktif di domain.
