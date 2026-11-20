
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/app-config';
import { getUsedProductById } from '@/lib/supabase/used-products';

const categoryLabels: Record<string, string> = {
  buku: 'Buku dan Alat Tulis',
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

function getWhatsAppNumber(phone: string | null | undefined) {
  if (!phone) return null;

  let number = phone.replace(/\D/g, '');

  if (number.startsWith('0')) {
    number = '62' + number.slice(1);
  } else if (number.startsWith('8')) {
    number = '62' + number;
  }

  if (!number.startsWith('62') || number.length < 10) {
    return null;
  }

  return number;
}

export default async function DetailProdukPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    notFound();
  }

  const supabase = await createClient();

  let product;

  try {
    product = await getUsedProductById(supabase, id);
  } catch (error) {
    console.error('Gagal mengambil detail produk:', error);
    notFound();
  }

  if (!product) notFound();

  const { data: seller, error: sellerError } = await supabase
    .from('profiles')
    .select('full_name, phone')
    .eq('id', product.seller_id)
    .maybeSingle();

  if (sellerError) {
    console.error('Gagal mengambil profil penjual:', sellerError);
  }

  const whatsappNumber = getWhatsAppNumber(seller?.phone);

  const whatsappMessage = encodeURIComponent(
    `Halo, saya tertarik dengan produk "${product.title}" yang ditampilkan di SYUZISHIM. Apakah produk ini masih tersedia?`
  );

  const whatsappLink = whatsappNumber
  ? `https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${whatsappMessage}`
  : null;

  const images = product.image_urls ?? [];

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href="/produk-mahasiswa"
        className="text-sm font-semibold text-emerald-700 hover:underline"
      >
        &larr; Kembali ke daftar produk
      </Link>

      <div className="mt-7 grid gap-10 md:grid-cols-2">
        {/* GALERI FOTO */}
        <section>
          {images.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {images.map((url, index) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className={`overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 ${
                    index === 0 ? 'col-span-2' : ''
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`${product.title} - foto ${index + 1}`}
                    className={`w-full object-cover transition hover:scale-105 ${
                      index === 0 ? 'max-h-[480px]' : 'h-40'
                    }`}
                  />
                </a>
              ))}
            </div>
          ) : (
            <div className="flex h-80 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              Foto belum tersedia
            </div>
          )}

          <p className="mt-2 text-xs text-slate-400">
            Klik foto untuk melihat ukuran penuh.
          </p>
        </section>

        {/* INFORMASI PRODUK */}
        <section>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
              {categoryLabels[product.category] ?? product.category}
            </span>

            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">
              {conditionLabels[product.item_condition] ??
                product.item_condition}
            </span>

            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-800">
              Tersedia
            </span>
          </div>

          <h1 className="mt-5 text-3xl font-bold text-slate-900">
            {product.title}
          </h1>

          <p className="mt-4 text-3xl font-bold text-emerald-700">
            {formatPrice(product.price)}
          </p>

          <div className="mt-6 rounded-2xl border border-slate-200 p-5">
            <h2 className="font-bold text-slate-900">
              Informasi Produk
            </h2>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Kategori</span>
                <span className="font-medium text-right">
                  {categoryLabels[product.category] ?? product.category}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Kondisi</span>
                <span className="font-medium text-right">
                  {conditionLabels[product.item_condition] ??
                    product.item_condition}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Lokasi</span>
                <span className="font-medium text-right">
                  {[product.area, product.city].filter(Boolean).join(', ') || '-'}
                </span>
              </div>
            </div>
          </div>

          {/* DESKRIPSI */}
          <div className="mt-7">
            <h2 className="text-xl font-bold text-slate-900">
              Deskripsi Produk
            </h2>

            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">
              {product.description || 'Belum ada deskripsi produk.'}
            </p>
          </div>

          {/* INFORMASI PENJUAL */}
          <div className="mt-7 rounded-2xl bg-slate-50 p-5">
            <h2 className="font-bold text-slate-900">
              Informasi Penjual
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              {seller?.full_name || 'Penjual SYUZISHIM'}
            </p>

            {whatsappLink ? (
              <a
  href={whatsappLink}
  target="_blank"
  rel="noopener noreferrer"
  className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700"
>
  Hubungi Penjual melalui WhatsApp
</a>
            ) : (
              <p className="mt-4 text-sm text-slate-500">
                Nomor WhatsApp penjual belum tersedia.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
