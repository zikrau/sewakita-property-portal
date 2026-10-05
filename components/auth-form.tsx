'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ArrowRight, LockKeyhole, Mail, UserRound } from 'lucide-react';

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(''); setMessage('');
    const supabase = createClient();
    try {
      if (mode === 'reset') {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/update-password` });
        if (resetError) throw resetError;
        setMessage('Link reset password dikirim ke email bila alamat tersebut terdaftar.');
        return;
      }
      if (mode === 'login') {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        router.push('/dashboard'); router.refresh(); return;
      }
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name, phone } },
      });
      if (signUpError) throw signUpError;
      if (data.session) router.push('/dashboard');
      else setMessage('Akun berhasil dibuat. Periksa email untuk konfirmasi akun sebelum login.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
    } finally { setBusy(false); }
  }

  return (
    <div className="w-full rounded-[32px] bg-white p-8 card-shadow">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-900 text-white"><LockKeyhole /></div>
      <h1 className="display mt-5 text-center text-4xl font-bold text-emerald-950">{mode === 'login' ? 'Masuk ke SewaKita' : mode === 'signup' ? 'Buat akun SewaKita' : 'Reset password'}</h1>
      <p className="mt-2 text-center text-slate-500">Akun pengguna tidak bisa menaikkan dirinya menjadi moderator/admin.</p>
      <form className="mt-8 space-y-4" onSubmit={submit}>
        {mode === 'signup' && <><label className="block"><span className="mb-2 block text-sm font-bold">Nama</span><div className="relative"><UserRound className="absolute left-3 top-3.5 text-slate-400" size={18} /><input required value={name} onChange={e => setName(e.target.value)} className="input pl-10" placeholder="Nama lengkap" /></div></label><label className="block"><span className="mb-2 block text-sm font-bold">WhatsApp</span><input value={phone} onChange={e => setPhone(e.target.value)} className="input" placeholder="08xxxxxxxxxx" /></label></>}
        <label className="block"><span className="mb-2 block text-sm font-bold">Email</span><div className="relative"><Mail className="absolute left-3 top-3.5 text-slate-400" size={18} /><input required value={email} onChange={e => setEmail(e.target.value)} className="input pl-10" placeholder="email@contoh.com" type="email" autoComplete="email" /></div></label>
        <label className="block"><span className="mb-2 block text-sm font-bold">Kata sandi</span><input required minLength={6} value={password} onChange={e => setPassword(e.target.value)} className="input" placeholder="Minimal 6 karakter" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></label>
        {error && <div className="alert alert-danger">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}
        <button disabled={busy} className="btn btn-primary w-full disabled:opacity-50">{busy ? 'Memproses…' : mode === 'login' ? 'Masuk' : mode === 'signup' ? 'Daftar' : 'Kirim link reset'} <ArrowRight size={17} /></button>
      </form>
      {mode === 'login' && <button className="mt-4 w-full text-sm font-bold text-slate-500" onClick={() => { setMode('reset'); setError(''); setMessage(''); }}>Lupa password?</button>}
      <button className="mt-3 w-full text-sm font-bold text-emerald-800" onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setError(''); setMessage(''); }}>
        {mode === 'signup' ? 'Sudah punya akun? Masuk' : mode === 'reset' ? 'Kembali ke masuk' : 'Belum punya akun? Daftar'}
      </button>
    </div>
  );
}
