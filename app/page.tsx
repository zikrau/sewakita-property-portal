
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  Home,
  Search,
  ShieldCheck,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';
import { ListingCard } from '@/components/listing-card';
import { demoListings } from '@/lib/demo';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/app-config';
import { getApprovedListings } from '@/lib/supabase/queries';
import { propertyTypes } from '@/lib/format';
import type { Listing } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  const get = (key: string) =>
    Array.isArray(params[key]) ? params[key]?.[0] : params[key];

  const filters = {
    q: get('q') ?? '',
    type: get('type') ?? '',
    city: get('city') ?? '',
    min: get('min') ?? '',
    max: get('max') ?? '',
  };

  let listings: Listing[] = [];
  let dataMode: 'live' | 'demo' = 'demo';
  let queryError = '';

  if (isSupabaseConfigured()) {
    try {
      listings = await getApprovedListings(await createClient(), filters);
      dataMode = 'live';
    } catch (error) {
      queryError =
        error instanceof Error ? error.message : 'Database belum siap.';
    }
  }

  if (dataMode === 'demo') {
    listings = demoListings as unknown as Listing[];
  }

  return (
    <main>
      {/* HEADER / PENCARIAN */}
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_right,#dcefe4,transparent_38%),linear-gradient(120deg,#123322,#1d5a43)] text-white">
        <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <span className="badge bg-white/10 text-emerald-50 ring-1 ring-white/20">
              <Sparkles size={14} />
              SYUZISHIM
            </span>

            <h1 className="display mt-5 text-4xl font-bold leading-tight md:text-6xl">
              Temukan hunian dan kebutuhan mahasiswa.
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-emerald-50/85 md:text-lg">
              Cari kost, rumah, kontrakan, dan pilihan hunian lainnya.
              Temukan juga produk bekas layak pakai dari sesama mahasiswa
              dalam satu platform.
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="#listing"
                className="btn bg-white text-emerald-950 hover:bg-emerald-50"
              >
                <Home size={17} />
                Cari Hunian
              </Link>

              <Link
                href="/produk-mahasiswa"
                className="btn bg-emerald-800 text-white ring-1 ring-white/30 hover:bg-emerald-700"
              >
                <ShoppingBag size={17} />
                Produk Mahasiswa
              </Link>
            </div>
          </div>

          {/* SEARCH */}
          <div className="mx-auto mt-8 max-w-5xl rounded-[28px] bg-white p-4 shadow-2xl">
            <form action="/" className="grid gap-3">
              <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr_1fr]">
                <input
                  className="input"
                  name="q"
                  defaultValue={filters.q}
                  placeholder="Cari nama tempat, area, atau kata kunci..."
                />

                <select
                  className="input"
                  name="type"
                  defaultValue={filters.type}
                >
                  <option value="">Semua jenis properti</option>

                  {propertyTypes.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>

                <input
                  className="input"
                  name="city"
                  defaultValue={filters.city}
                  placeholder="Kota / kabupaten"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                <input
                  className="input"
                  name="min"
                  defaultValue={filters.min}
                  placeholder="Harga minimum"
                  type="number"
                  min="0"
                />

                <input
                  className="input"
                  name="max"
                  defaultValue={filters.max}
                  placeholder="Harga maksimum"
                  type="number"
                  min="0"
                />

                <button className="btn btn-primary" type="submit">
                  <Search size={17} />
                  Cari properti
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* LISTING HUNIAN */}
      <section
        className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16"
        id="listing"
      >
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <div className="text-xs font-bold uppercase tracking-[.2em] text-emerald-700">
              Kategori Hunian
            </div>

            <h2 className="display mt-2 text-4xl font-bold text-emerald-950">
              Hunian yang tersedia
            </h2>

            <p className="mt-2 text-slate-500">
              {dataMode === 'live'
                ? `${listings.length} properti ditemukan.`
                : 'Mode demo aktif — hubungkan Supabase untuk data nyata.'}
            </p>
          </div>

          <Link
            href="#listing"
            className="btn bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
          >
            Lihat listing
            <ArrowRight size={17} />
          </Link>
        </div>

        {queryError && (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Database belum tersambung: {queryError}
          </div>
        )}

        {listings.length ? (
          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {listings.map((listing) => (
              <ListingCard listing={listing} key={listing.id} />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-3xl border border-dashed border-stone-300 bg-white p-12 text-center">
            <h3 className="display text-3xl font-bold text-emerald-950">
              Belum ada properti yang cocok
            </h3>

            <p className="mt-2 text-slate-500">
              Coba ubah kata kunci, kota, jenis properti, atau rentang harga.
            </p>
          </div>
        )}
      </section>

      {/* KATEGORI PRODUK MAHASISWA */}
      <section className="bg-emerald-50">
        <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div>
              <div className="text-xs font-bold uppercase tracking-[.2em] text-emerald-700">
                Kategori Produk Mahasiswa
              </div>

              <h2 className="display mt-3 text-3xl font-bold text-emerald-950 md:text-4xl">
                Barang layak pakai, harga bersahabat.
              </h2>

              <p className="mt-4 max-w-xl leading-7 text-slate-600">
                Temukan buku, elektronik, perlengkapan kos, pakaian, dan
                barang bekas layak pakai lainnya dari sesama mahasiswa.
                Punya barang yang tidak terpakai? Kamu juga bisa memasangnya
                untuk dijual.
              </p>

              <Link
                href="/produk-mahasiswa"
                className="btn btn-primary mt-6"
              >
                Jelajahi Produk Mahasiswa
                <ArrowRight size={17} />
              </Link>
            </div>

            <div className="rounded-3xl bg-white p-8 shadow-sm">
              <ShoppingBag size={36} className="text-emerald-800" />

              <h3 className="mt-5 text-xl font-bold text-emerald-950">
                Jual dan temukan barang kebutuhan mahasiswa
              </h3>

              <ul className="mt-4 space-y-3 text-slate-600">
                <li>• Buku dan bahan belajar</li>
                <li>• Elektronik dan aksesori</li>
                <li>• Perlengkapan kos</li>
                <li>• Pakaian, olahraga, dan hobi</li>
              </ul>

              <Link
                href="/dashboard"
                className="mt-6 inline-flex items-center gap-2 font-semibold text-emerald-800 hover:text-emerald-950"
              >
                Mulai jual barang
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* INFORMASI SYUZISHIM */}
      <section className="bg-[#f2ede3]">
        <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
          <div className="mb-10 text-center">
            <div className="text-xs font-bold uppercase tracking-[.2em] text-emerald-700">
              Mengapa SYUZISHIM?
            </div>

            <h2 className="display mt-2 text-3xl font-bold text-emerald-950">
              Satu platform untuk kebutuhan mahasiswa
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-3xl bg-white p-7">
              <ShieldCheck className="text-emerald-800" />

              <h3 className="mt-5 text-xl font-bold">
                Listing melalui moderasi
              </h3>

              <p className="mt-2 leading-7 text-slate-600">
                Listing hunian dan produk yang ditampilkan kepada publik
                melewati proses moderasi sesuai aturan platform.
              </p>
            </div>

            <div className="rounded-3xl bg-white p-7">
              <BadgeCheck className="text-emerald-800" />

              <h3 className="mt-5 text-xl font-bold">
                Informasi lebih jelas
              </h3>

              <p className="mt-2 leading-7 text-slate-600">
                Temukan informasi harga, lokasi, fasilitas hunian, serta
                kondisi dan harga produk dalam satu platform.
              </p>
            </div>

            <div className="rounded-3xl bg-white p-7">
              <Home className="text-emerald-800" />

              <h3 className="mt-5 text-xl font-bold">
                Untuk pemilik dan mahasiswa
              </h3>

              <p className="mt-2 leading-7 text-slate-600">
                Pemilik dapat memasang properti, sedangkan mahasiswa dapat
                mencari hunian dan memperjualbelikan barang bekas layak pakai.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA PEMILIK HUNIAN */}
      <section className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
        <div className="rounded-[32px] bg-emerald-950 p-8 text-white md:p-12">
          <div className="max-w-3xl">
            <div className="text-xs font-bold uppercase tracking-[.2em] text-emerald-300">
              Punya properti?
            </div>

            <h2 className="display mt-3 text-3xl font-bold md:text-4xl">
              Pasang properti Anda di SYUZISHIM
            </h2>

            <p className="mt-4 max-w-2xl leading-7 text-emerald-50/80">
              Tambahkan kost, rumah, kontrakan, apartemen, ruko, villa,
              atau properti sewaan lainnya agar lebih mudah ditemukan.
            </p>

            <Link
              href="/dashboard/new"
              className="btn mt-7 bg-white text-emerald-950 hover:bg-emerald-50"
            >
              Pasang properti
              <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
