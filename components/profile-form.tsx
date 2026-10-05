'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveProfile } from '@/app/actions';
import type { Profile } from '@/lib/types';

export function ProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter(); const [name, setName] = useState(profile.full_name ?? ''); const [phone, setPhone] = useState(profile.phone ?? ''); const [busy, setBusy] = useState(false); const [msg, setMsg] = useState(''); const [error, setError] = useState('');
  return <form action={async (fd) => { setBusy(true); setMsg(''); setError(''); try { await saveProfile(fd); setMsg('Profil tersimpan.'); router.refresh(); } catch (e) { setError(e instanceof Error ? e.message : 'Gagal menyimpan profil.'); } finally { setBusy(false); } }} className="space-y-4"><label><span className="field-label">Nama</span><input className="input" name="full_name" value={name} onChange={e => setName(e.target.value)} required /></label><label><span className="field-label">WhatsApp</span><input className="input" name="phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="08xxxxxxxxxx" /></label><div className="rounded-2xl bg-stone-50 p-3 text-xs text-slate-500">Role akun: <b className="text-slate-700">{profile.role}</b>. Role tidak dapat diubah dari formulir.</div><button disabled={busy} className="btn btn-secondary w-full">{busy ? 'Menyimpan…' : 'Simpan profil'}</button>{msg && <p className="text-sm text-emerald-700">{msg}</p>}{error && <p className="text-sm text-red-700">{error}</p>}</form>;
}
