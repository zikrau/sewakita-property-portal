
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, PackagePlus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { UsedProductForm } from '@/components/used-product-form';

export default async function NewUsedProductPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-10 lg:px-8">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 hover:text-emerald-950"
      >
        <ArrowLeft size={17} />
        Kembali ke dashboard
      </Link>

      <div className="mt-6 rounded-3xl bg-white p-6 card-shadow sm:p-8">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-800">
            <PackagePlus size={25} />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-700">
              SYUZISHIM
            </p>
            <h1 className="display mt-1 text-3xl font-bold text-emerald-950">
              Jual Produk Mahasiswa
            </h1>
          </div>
        </div>

        <p className="mt-4 text-sm leading-6 text-slate-600">
          Jual barang bekas layak pakai kepada sesama mahasiswa.
          Isi informasi dengan jujur dan gunakan foto asli produk.
          Produk yang dikirim untuk moderasi akan diperiksa sebelum ditayangkan.
        </p>

        <div className="mt-7">
          <UsedProductForm userId={user.id} />
        </div>
      </div>
    </main>
  );
}
