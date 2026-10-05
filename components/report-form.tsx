'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Flag } from 'lucide-react';

export function ReportForm({ listingId }: { listingId: string }) {
  const router = useRouter();
  const [category, setCategory] = useState('penipuan');
  const [note, setNote] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg(''); setError('');
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    const { error: insertError } = await supabase.from('listing_reports').insert({ reporter_id: user.id, listing_id: listingId, category, note: note.trim() });
    if (insertError) setError(insertError.message); else { setMsg('Laporan dikirim ke tim moderasi.'); setNote(''); }
    setBusy(false);
  }
  return <details className="rounded-3xl border border-stone-200 bg-white p-5"><summary className="cursor-pointer font-bold text-slate-800">Laporkan listing</summary><form className="mt-5 space-y-4" onSubmit={submit}><select className="input" value={category} onChange={e => setCategory(e.target.value)}><option value="penipuan">Dugaan penipuan</option><option value="informasi_salah">Informasi tidak sesuai</option><option value="sudah_disewa">Sudah disewa / tidak tersedia</option><option value="konten_tidak_pantas">Konten tidak pantas</option><option value="lainnya">Lainnya</option></select><textarea className="input min-h-28" value={note} onChange={e => setNote(e.target.value)} placeholder="Jelaskan masalahnya secara singkat." /><button disabled={busy} className="btn btn-secondary"><Flag size={16} /> {busy ? 'Mengirim…' : 'Kirim laporan'}</button>{msg && <p className="text-sm font-semibold text-emerald-700">{msg}</p>}{error && <p className="text-sm text-red-700">{error}</p>}</form></details>;
}
