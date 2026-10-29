import Link from 'next/link';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { formatDate, formatMoney } from '@/lib/format';
import { Plus, ShieldCheck, Archive } from 'lucide-react';
import { ProfileForm } from '@/components/profile-form';
import type { Listing, Profile } from '@/lib/types';

const statusLabel: Record<string, string> = {
  draft: 'Draft',
  pending: 'Menunggu moderasi',
  approved: 'Tayang',
  rejected: 'Perlu diperbaiki',
  archived: 'Diarsipkan',
};

async function archiveListing(formData: FormData) {
  'use server';

  const listingId = String(formData.get('listing_id') || '');

  if (!listingId) return;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data, error } = await supabase
    .from('listings')
    .update({
      status: 'archived',
      updated_at: new Date().toISOString(),
    })
    .eq('id', listingId)
    .eq('owner_id', user.id)
    .select('id, status')
    .single();

  if (error) {
    console.error('GAGAL ARSIP:', error);
    throw new Error(`Gagal mengarsipkan: ${error.message}`);
  }

  console.log('ARSIP BERHASIL:', data);

  revalidatePath('/dashboard');
  revalidatePath('/');
}

async function restoreListing(formData: FormData) {
  'use server';

  const listingId = String(formData.get('listing_id') || '');

  if (!listingId) return;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { error } = await supabase
    .from('listings')
    .update({
      status: 'draft',
      updated_at: new Date().toISOString(),
    })
    .eq('id', listingId)
    .eq('owner_id', user.id)
    .eq('status', 'archived');

  if (error) {
    console.error('Gagal memulihkan listing:', error);
    throw new Error(`Gagal memulihkan: ${error.message}`);
  }

  revalidatePath('/dashboard');
  revalidatePath('/');
}
export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const [{ data: profile }, { data: listings }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('listings')
      .select('*')
      .eq('owner_id', user.id)
      .order('updated_at', { ascending: false }),
  ]);

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-[.2em] text-emerald-700">
            Dashboard
          </div>

          <h1 className="display mt-2 text-4xl font-bold text-emerald-950">
            Halo, {(profile as Profile | null)?.full_name || 'Pemilik'}
          </h1>

          <p className="mt-2 text-slate-500">
            Kelola listing dan profil Anda dari satu tempat.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link className="btn btn-primary" href="/dashboard/new">
            <Plus size={17} />
            Tambah properti
          </Link>

          <Link
            className="btn btn-primary"
            href="/dashboard/produk-baru"
          >
            <Plus size={17} />
            Jual Produk Mahasiswa
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        <div className="rounded-3xl bg-emerald-950 p-6 text-white">
          <div className="text-sm text-emerald-200">Total listing</div>
          <div className="mt-2 text-4xl font-bold">
            {listings?.length ?? 0}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 card-shadow">
          <div className="text-sm text-slate-500">Menunggu</div>
          <div className="mt-2 text-4xl font-bold">
            {listings?.filter((x: Listing) => x.status === 'pending').length ?? 0}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 card-shadow">
          <div className="text-sm text-slate-500">Tayang</div>
          <div className="mt-2 text-4xl font-bold">
            {listings?.filter((x: Listing) => x.status === 'approved').length ?? 0}
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_.38fr]">
        <section className="rounded-3xl bg-white p-6 card-shadow">
          <div className="flex gap-3 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-950">
            <ShieldCheck size={18} className="mt-0.5" />

            <span>
              Keamanan: akun Anda tidak memiliki hak untuk mengubah role,
              verifikasi, featured, atau menghapus data secara permanen.
            </span>
          </div>

          <div className="mt-7 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-slate-500">
                  <th className="py-3">Properti</th>
                  <th>Status</th>
                  <th>Harga</th>
                  <th>Diubah</th>
                  <th>Aksi</th>
                </tr>
              </thead>

              <tbody>
                {(listings ?? []).map((listing: Listing) => (
                  <tr
                    key={listing.id}
                    className="border-b border-stone-100"
                  >
                    <td className="py-4 font-semibold">
                      {listing.title}
                    </td>

                    <td>
                      <span
                        className={`badge ${
                          listing.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-800'
                            : listing.status === 'rejected'
                              ? 'bg-red-50 text-red-800'
                              : listing.status === 'archived'
                                ? 'bg-slate-100 text-slate-700'
                                : 'bg-amber-50 text-amber-800'
                        }`}
                      >
                        {statusLabel[listing.status]}
                      </span>

                      {listing.rejection_reason && (
                        <div className="mt-1 max-w-xs text-xs text-red-600">
                          {listing.rejection_reason}
                        </div>
                      )}
                    </td>

                    <td>
                      {formatMoney(listing.price)}/
                      {listing.period.replace('an', '')}
                    </td>

                    <td>{formatDate(listing.updated_at)}</td>

                    <td>
  <div className="flex items-center gap-3">
    {listing.status !== 'archived' && (
      <>
        <Link
          href={`/dashboard/edit/${listing.id}`}
          className="font-bold text-emerald-800"
        >
          Edit
        </Link>

        <form action={archiveListing}>
          <input
            type="hidden"
            name="listing_id"
            value={listing.id}
          />

          <button
            type="submit"
            className="inline-flex items-center gap-1 font-bold text-slate-600 hover:text-red-700"
          >
            <Archive size={15} />
            Arsipkan
          </button>
        </form>
      </>
    )}

    {listing.status === 'archived' && (
      <form action={restoreListing}>
        <input
          type="hidden"
          name="listing_id"
          value={listing.id}
        />

        <button
          type="submit"
          className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-900"
        >
          Pulihkan
        </button>
      </form>
    )}
  </div>
</td>
                  </tr>
                ))}

                {!(listings?.length) && (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-12 text-center text-slate-400"
                    >
                      Belum ada listing.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="rounded-3xl bg-white p-6 card-shadow">
          <h2 className="display text-2xl font-bold text-emerald-950">
            Profil
          </h2>

          <div className="mt-5">
            <ProfileForm profile={profile as Profile} />
          </div>
        </aside>
      </div>
    </main>
  );
}