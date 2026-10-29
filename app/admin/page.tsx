
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatDate, formatMoney } from '@/lib/format';
import {
  archiveListing,
  moderateListing,
  moderateUsedProduct,
  setListingFeatured,
  setListingVerified,
} from '@/app/actions';
import {
  Check,
  Eye,
  Flag,
  LockKeyhole,
  Package,
  ShieldAlert,
  ShieldCheck,
  Star,
  X,
} from 'lucide-react';
import type { Listing, UserRole } from '@/lib/types';
import type { UsedProduct } from '@/lib/used-product-types';

export const dynamic = 'force-dynamic';

const categoryLabels: Record<string, string> = {
  buku: 'Buku',
  elektronik: 'Elektronik',
  perlengkapan_kos: 'Perlengkapan kos',
  pakaian: 'Pakaian',
  olahraga_hobi: 'Olahraga & hobi',
  lainnya: 'Lainnya',
};

const conditionLabels: Record<string, string> = {
  seperti_baru: 'Seperti baru',
  sangat_baik: 'Sangat baik',
  baik: 'Baik',
  layak_pakai: 'Layak pakai',
};

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'moderator'].includes(profile.role as UserRole)) {
    redirect('/');
  }

  const admin = createAdminClient();

  const [
    { data: pending },
    { data: active },
    { data: reports },
    { data: pendingProducts, error: productError },
  ] = await Promise.all([
    admin
      .from('listings')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true }),

    admin
      .from('listings')
      .select('*')
      .in('status', ['approved', 'rejected'])
      .order('updated_at', { ascending: false })
      .limit(40),

    admin
      .from('listing_reports')
      .select('*')
      .in('status', ['open', 'reviewing'])
      .order('created_at', { ascending: false })
      .limit(30),

    admin
      .from('used_products')
      .select(
        'id, seller_id, title, description, category, item_condition, price, image_urls, city, area, status, sale_status, rejection_reason, created_at, updated_at',
      )
      .eq('status', 'pending')
      .order('created_at', { ascending: true }),
  ]);

  const productQueue = (pendingProducts ?? []) as UsedProduct[];

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-[.2em] text-emerald-700">
            Staff only
          </div>
          <h1 className="display mt-2 text-4xl font-bold text-emerald-950">
            Pusat Moderasi
          </h1>
          <p className="mt-2 text-slate-500">
            Masuk sebagai <b>{profile.role}</b>. Perubahan sensitif diproses
            dari server.
          </p>
        </div>

        <span className="badge gap-1 bg-emerald-900 text-white">
          <LockKeyhole size={13} />
          Akses terbatas
        </span>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        <Metric title="Hunian menunggu" value={pending?.length ?? 0} dark />
        <Metric
          title="Hunian tayang"
          value={
            active?.filter((x: Listing) => x.status === 'approved').length ?? 0
          }
        />
        <Metric
          title="Hunian ditolak"
          value={
            active?.filter((x: Listing) => x.status === 'rejected').length ?? 0
          }
        />
        <Metric title="Produk menunggu" value={productQueue.length} />
        <Metric title="Laporan terbuka" value={reports?.length ?? 0} />
      </div>

      {/* MODERASI HUNIAN */}

      <section className="mt-8 rounded-3xl bg-white p-6 card-shadow">
        <div className="flex items-start gap-3">
          <ShieldAlert className="text-emerald-800" />
          <div>
            <h2 className="text-lg font-bold">Antrean moderasi Hunian</h2>
            <p className="text-sm text-slate-500">
              Periksa informasi properti sebelum menyetujui publikasi.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {(pending as Listing[] | null)?.map((listing) => (
            <div
              key={listing.id}
              className="rounded-2xl border border-stone-200 p-5"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h3 className="text-lg font-bold">{listing.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {listing.property_type} · {listing.area}, {listing.city} ·{' '}
                    {formatMoney(listing.price)}/
                    {listing.period.replace('an', '')}
                  </p>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                    {listing.description}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {listing.facilities?.slice(0, 6).map((facility) => (
                      <span
                        key={facility}
                        className="badge bg-stone-100 text-slate-600"
                      >
                        {facility}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <Link
                    href={`/listings/${listing.id}`}
                    className="btn btn-secondary"
                  >
                    <Eye size={15} />
                    Lihat
                  </Link>

                  <form action={moderateListing}>
                    <input type="hidden" name="id" value={listing.id} />
                    <input
                      type="hidden"
                      name="decision"
                      value="approved"
                    />
                    <button className="btn btn-primary">
                      <Check size={15} />
                      Setujui
                    </button>
                  </form>

                  <form action={moderateListing}>
                    <input type="hidden" name="id" value={listing.id} />
                    <input
                      type="hidden"
                      name="decision"
                      value="rejected"
                    />
                    <input
                      type="hidden"
                      name="reason"
                      value="Periksa kembali kelengkapan, foto, dan keakuratan informasi listing."
                    />
                    <button className="btn bg-red-50 text-red-700">
                      <X size={15} />
                      Tolak
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}

          {!pending?.length && (
            <div className="rounded-2xl bg-stone-50 p-10 text-center text-slate-500">
              Tidak ada antrean moderasi Hunian.
            </div>
          )}
        </div>
      </section>

      {/* MODERASI PRODUK MAHASISWA */}

      <section className="mt-8 rounded-3xl bg-white p-6 card-shadow">
        <div className="flex items-start gap-3">
          <Package className="text-emerald-800" />
          <div>
            <h2 className="text-lg font-bold">
              Antrean moderasi Produk Mahasiswa
            </h2>
            <p className="text-sm text-slate-500">
              Periksa barang bekas, harga, kondisi, deskripsi, dan foto sebelum
              produk ditayangkan.
            </p>
          </div>
        </div>

        {productError && (
          <div className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            Gagal memuat antrean Produk Mahasiswa. Periksa tabel
            used_products dan konfigurasi Supabase.
          </div>
        )}

        <div className="mt-6 space-y-4">
          {productQueue.map((product) => (
            <div
              key={product.id}
              className="rounded-2xl border border-stone-200 p-5"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap gap-2">
                    <span className="badge bg-emerald-50 text-emerald-800">
                      {categoryLabels[product.category] ?? product.category}
                    </span>
                    <span className="badge bg-stone-100 text-slate-600">
                      {conditionLabels[product.item_condition] ??
                        product.item_condition}
                    </span>
                    <span className="badge bg-amber-50 text-amber-800">
                      Menunggu moderasi
                    </span>
                  </div>

                  <h3 className="mt-3 text-lg font-bold">{product.title}</h3>

                  <p className="mt-1 text-sm font-semibold text-emerald-800">
                    {formatMoney(product.price)}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {product.area ? `${product.area}, ` : ''}
                    {product.city}
                  </p>

                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {product.description}
                  </p>

                  {product.image_urls?.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-3">
                      {product.image_urls.slice(0, 6).map((url, index) => (
                        <a
                          key={`${product.id}-image-${index}`}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-semibold text-emerald-800 underline"
                        >
                          Lihat foto {index + 1}
                        </a>
                      ))}
                    </div>
                  )}

                  <p className="mt-4 text-xs text-slate-400">
                    Diajukan {formatDate(product.created_at)}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <form action={moderateUsedProduct}>
                    <input type="hidden" name="id" value={product.id} />
                    <input
                      type="hidden"
                      name="decision"
                      value="approved"
                    />
                    <button className="btn btn-primary">
                      <Check size={15} />
                      Setujui
                    </button>
                  </form>

                  <form action={moderateUsedProduct}>
                    <input type="hidden" name="id" value={product.id} />
                    <input
                      type="hidden"
                      name="decision"
                      value="rejected"
                    />
                    <input
                      type="hidden"
                      name="reason"
                      value="Produk belum memenuhi ketentuan. Periksa kembali foto, deskripsi, kondisi, dan keakuratan informasi."
                    />
                    <button className="btn bg-red-50 text-red-700">
                      <X size={15} />
                      Tolak
                    </button>
                  </form>

                  <form action={moderateUsedProduct}>
                    <input type="hidden" name="id" value={product.id} />
                    <input
                      type="hidden"
                      name="decision"
                      value="archived"
                    />
                    <button className="btn btn-secondary">
                      Arsipkan
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}

          {!productError && productQueue.length === 0 && (
            <div className="rounded-2xl bg-stone-50 p-10 text-center text-slate-500">
              Tidak ada antrean moderasi Produk Mahasiswa.
            </div>
          )}
        </div>
      </section>

      {/* KONTROL HUNIAN */}

      <section className="mt-8 rounded-3xl bg-white p-6 card-shadow">
        <h2 className="text-lg font-bold">Listing aktif & kontrol staf</h2>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-slate-500">
                <th className="py-3">Properti</th>
                <th>Status</th>
                <th>Verifikasi</th>
                <th>Featured</th>
                <th>Diubah</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {(active as Listing[] | null)?.map((listing) => (
                <tr className="border-b border-stone-100" key={listing.id}>
                  <td className="py-4">
                    <div className="font-semibold">{listing.title}</div>
                    <div className="text-xs text-slate-500">
                      {listing.city} · {listing.owner_display_name}
                    </div>
                  </td>

                  <td>
                    <span className="badge bg-stone-100 text-slate-700">
                      {listing.status}
                    </span>
                  </td>

                  <td>
                    {listing.is_verified ? (
                      <span className="badge gap-1 bg-emerald-50 text-emerald-800">
                        <ShieldCheck size={13} /> Ya
                      </span>
                    ) : (
                      <span className="badge bg-stone-100 text-slate-500">
                        Tidak
                      </span>
                    )}
                  </td>

                  <td>
                    {listing.featured ? (
                      <span className="badge gap-1 bg-amber-50 text-amber-800">
                        <Star size={13} /> Ya
                      </span>
                    ) : (
                      'Tidak'
                    )}
                  </td>

                  <td>{formatDate(listing.updated_at)}</td>

                  <td>
                    <div className="flex flex-wrap gap-2">
                      <form action={setListingVerified}>
                        <input
                          type="hidden"
                          name="id"
                          value={listing.id}
                        />
                        <input
                          type="hidden"
                          name="verified"
                          value={listing.is_verified ? 'false' : 'true'}
                        />
                        <button className="btn btn-secondary">
                          {listing.is_verified
                            ? 'Cabut verifikasi'
                            : 'Verifikasi'}
                        </button>
                      </form>

                      {profile.role === 'admin' && (
                        <form action={setListingFeatured}>
                          <input
                            type="hidden"
                            name="id"
                            value={listing.id}
                          />
                          <input
                            type="hidden"
                            name="featured"
                            value={listing.featured ? 'false' : 'true'}
                          />
                          <button className="btn btn-secondary">
                            {listing.featured
                              ? 'Cabut pilihan'
                              : 'Jadikan pilihan'}
                          </button>
                        </form>
                      )}

                      {listing.status === 'approved' && (
                        <form action={archiveListing}>
                          <input
                            type="hidden"
                            name="id"
                            value={listing.id}
                          />
                          <button className="btn bg-red-50 text-red-700">
                            Arsipkan
                          </button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* LAPORAN HUNIAN */}

      <section className="mt-8 rounded-3xl bg-white p-6 card-shadow">
        <div className="flex items-center gap-3">
          <Flag className="text-red-700" />
          <div>
            <h2 className="text-lg font-bold">Laporan listing</h2>
            <p className="text-sm text-slate-500">
              Periksa laporan penipuan, data tidak akurat, atau konten
              bermasalah.
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {(reports ?? []).map(
            (report: {
              id: number;
              listing_id: string;
              category: string;
              note: string;
              created_at: string;
            }) => (
              <div key={report.id} className="rounded-2xl bg-stone-50 p-4">
                <div className="font-semibold">{report.category}</div>
                <div className="mt-1 text-sm text-slate-600">
                  {report.note || 'Tanpa catatan.'}
                </div>
                <div className="mt-2 text-xs text-slate-400">
                  Listing: {report.listing_id} ·{' '}
                  {formatDate(report.created_at)}
                </div>
              </div>
            ),
          )}

          {!reports?.length && (
            <p className="text-sm text-slate-400">
              Belum ada laporan terbuka.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}

function Metric({
  title,
  value,
  dark = false,
}: {
  title: string;
  value: number;
  dark?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl p-6 ${
        dark ? 'bg-emerald-950 text-white' : 'bg-white card-shadow'
      }`}
    >
      <div className={`text-sm ${dark ? 'text-emerald-200' : 'text-slate-500'}`}>
        {title}
      </div>
      <div className="mt-2 text-4xl font-bold">{value}</div>
    </div>
  );
}
