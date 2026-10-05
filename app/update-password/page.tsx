'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(''); setMsg('');
    if (password.length < 6) { setError('Password minimal 6 karakter.'); setBusy(false); return; }
    if (password !== confirm) { setError('Konfirmasi password tidak sama.'); setBusy(false); return; }
    const { error: updateError } = await createClient().auth.updateUser({ password });
    if (updateError) setError(updateError.message);
    else { setMsg('Password berhasil diperbarui.'); setTimeout(() => router.push('/dashboard'), 800); }
    setBusy(false);
  }

  return <main className="mx-auto grid min-h-[70vh] max-w-xl place-items-center px-5 py-12"><section className="w-full rounded-[32px] bg-white p-8 card-shadow"><h1 className="display text-4xl font-bold text-emerald-950">Buat password baru</h1><p className="mt-2 text-slate-500">Gunakan password baru yang sulit ditebak.</p><form onSubmit={submit} className="mt-7 space-y-4"><input className="input" type="password" minLength={6} required value={password} onChange={e => setPassword(e.target.value)} placeholder="Password baru"/><input className="input" type="password" minLength={6} required value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Ulangi password"/>{error && <div className="alert alert-danger">{error}</div>}{msg && <div className="alert alert-success">{msg}</div>}<button disabled={busy} className="btn btn-primary w-full">{busy ? 'Menyimpan…' : 'Simpan password'}</button></form></section></main>;
}
