import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ListingForm } from '@/components/listing-form';
import type { Listing } from '@/lib/types';

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data } = await supabase.from('listings').select('*').eq('id', id).eq('owner_id', user.id).maybeSingle();
  if (!data) notFound();
  return <main className="mx-auto max-w-5xl px-5 py-10 lg:px-8"><div className="mb-8"><div className="text-xs font-bold uppercase tracking-[.2em] text-emerald-700">Edit properti</div><h1 className="display mt-2 text-4xl font-bold text-emerald-950">{data.title}</h1><p className="mt-2 text-slate-500">Setelah perubahan disimpan, listing akan kembali ke antrian moderasi.</p></div><section className="rounded-[32px] bg-white p-6 card-shadow lg:p-9"><ListingForm userId={user.id} ownerName={(data as Listing).owner_display_name} initial={data as Listing} /></section></main>;
}
