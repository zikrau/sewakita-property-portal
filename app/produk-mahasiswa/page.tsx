
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

function formatRupiah(value: number | null | undefined) {
  if (value == null) return '-';

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function ProdukMahasiswaPage() {
  const supabase = await createClient();

  const { data: products, error } = await supabase
    .from('used_products')
    .select(
      'id, title, description, price, image_urls, category, item_condition, city, area, status, sale_status, created_at'
    )
    .eq('status', 'approved')
    .eq('sale_status', 'available')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('GAGAL MEMUAT PRODUK MAHASISWA:', error);

    return (
      <main className="mx-auto max-w-6xl px-4 py-16">
        <h1 className="text-3xl font-bold text-emerald-950">
          Produk Mahasiswa
        </h1>
        <p className="mt-4 rounded-xl bg-red-50 p-4 text-red-700">
          Gagal memuat produk: {error.message}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <div>
        <h1 className="text-3xl font-bold text-emerald-950">
          Produk Mahasiswa
        </h1>

        <p className="mt-2 text-gray-600">
          Temukan produk bekas layak pakai antarmahasiswa
          dengan harga terjangkau.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {(products ?? []).map((product) => (
          <Link
            key={product.id}
            href={`/produk-mahasiswa/${product.id}`}
            className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
          >
            <div className="aspect-video w-full overflow-hidden bg-gray-100">
              {product.image_urls?.[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.image_urls[0]}
                  alt={product.title}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-400">
                  Tanpa gambar
                </div>
              )}
            </div>

            <div className="p-4">
              <div className="mb-2 flex flex-wrap gap-2">
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                  {product.category?.replaceAll('_', ' ') || 'Lainnya'}
                </span>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                  {product.item_condition?.replaceAll('_', ' ') || '-'}
                </span>
              </div>

              <h2 className="font-semibold text-gray-900 group-hover:text-emerald-700">
                {product.title}
              </h2>

              <p className="mt-2 text-lg font-bold text-emerald-700">
                {formatRupiah(product.price)}
              </p>

              {(product.city || product.area) && (
                <p className="mt-1 text-sm text-gray-500">
                  {[product.area, product.city].filter(Boolean).join(', ')}
                </p>
              )}

              {product.description && (
                <p className="mt-2 line-clamp-2 text-sm text-gray-500">
                  {product.description}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {products?.length === 0 && (
        <div className="mt-10 rounded-2xl bg-gray-50 px-5 py-12 text-center">
          <h2 className="text-lg font-semibold text-gray-700">
            Belum ada produk yang tersedia.
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Produk akan ditampilkan setelah disetujui oleh moderator.
          </p>
        </div>
      )}
    </main>
  );
}
