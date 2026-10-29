
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/app-config';
import { getApprovedUsedProducts } from '@/lib/supabase/used-products';

const categoryLabels: Record<string, string> = {
  buku: 'Buku',
  elektronik: 'Elektronik',
  perlengkapan_kos: 'Perlengkapan Kos',
  pakaian: 'Pakaian',
  olahraga_hobi: 'Olahraga dan Hobi',
  lainnya: 'Lainnya',
};

const conditionLabels: Record<string, string> = {
  seperti_baru: 'Seperti Baru',
  sangat_baik: 'Sangat Baik',
  baik: 'Baik',
  layak_pakai: 'Layak Pakai',
};

function formatPrice(price: number) {
  if (price === 0) return 'Gratis';

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(price);
}

export default async function ProdukMahasiswaPage() {
  let products: Awaited<
    ReturnType<typeof getApprovedUsedProducts>
  > = [];
  let errorMessage = '';

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      products = await getApprovedUsedProducts(supabase);
    } catch {
      errorMessage = 'Katalog belum dapat dimuat. Coba kembali nanti.';
    }
  } else {
    errorMessage = 'Database belum tersambung.';
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="mb-8 rounded-3xl bg-slate-900 px-6 py-10 text-white sm:px-10">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-emerald-300">
          SYUZISHIM - Produk Mahasiswa
        </p>

        <h1 className="text-3xl font-bold sm:text-4xl">
          Barang layak pakai, harga bersahabat.
        </h1>

        <p className="mt-4 max-w-2xl text-slate-300">
          Temukan buku, elektronik, dan kebutuhan mahasiswa dari sesama
          mahasiswa. Hubungi penjual untuk menanyakan barang yang kamu minati.
        </p>

        <Link
          href="/dashboard"
          className="mt-6 inline-flex rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-slate-950 hover:bg-emerald-300"
        >
          Jual Barang
        </Link>
      </section>

      {errorMessage ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
          {errorMessage}
        </p>
      ) : products.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 p-10 text-center">
          <h2 className="text-xl font-semibold">
            Belum ada produk tayang
          </h2>
          <p className="mt-2 text-slate-600">
            Produk yang lolos moderasi akan muncul di halaman ini.
          </p>
        </section>
      ) : (
        <section>
          <h2 className="mb-5 text-2xl font-bold">Produk tersedia</h2>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <article
                key={product.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                {product.image_urls?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.image_urls[0]}
                    alt={product.title}
                    className="h-52 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-52 items-center justify-center bg-slate-100 text-slate-400">
                    Foto belum tersedia
                  </div>
                )}

                <div className="p-5">
                  <p className="text-sm text-slate-500">
                    {categoryLabels[product.category] ?? product.category}
                    {' - '}
                    {conditionLabels[product.item_condition] ??
                      product.item_condition}
                  </p>

                  <h3 className="mt-2 text-lg font-semibold text-slate-900">
                    {product.title}
                  </h3>

                  <p className="mt-2 text-xl font-bold text-emerald-700">
                    {formatPrice(product.price)}
                  </p>

                  <p className="mt-2 text-sm text-slate-600">
                    {[product.area, product.city]
                      .filter(Boolean)
                      .join(', ')}
                  </p>

                  <p className="mt-3 line-clamp-3 text-sm text-slate-600">
                    {product.description}
                  </p>

                  <p className="mt-4 text-sm font-medium text-slate-500">
                    Hubungi penjual untuk informasi lebih lanjut.
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
