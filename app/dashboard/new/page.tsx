import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ListingForm } from '@/components/listing-form';

export default async function NewListingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
  return <main className="mx-auto max-w-5xl px-5 py-10 lg:px-8"><div className="mb-8"><div className="text-xs font-bold uppercase tracking-[.2em] text-emerald-700">Kontributor</div><h1 className="display mt-2 text-4xl font-bold text-emerald-950">Pasang properti</h1><p className="mt-2 max-w-2xl text-slate-500">Isi data selengkap mungkin. Setelah dikirim, listing masuk antrian moderasi.</p></div><section className="rounded-[32px] bg-white p-6 card-shadow lg:p-9"><ListingForm userId={user.id} ownerName={(profile?.full_name as string | null) || user.email || 'Pemilik'} /></section></main>;
}
