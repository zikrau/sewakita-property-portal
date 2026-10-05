'use client';

import Link from 'next/link';
import { Building2, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data }) => setSignedIn(Boolean(data.user)));
  });

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/70 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
        <Link href="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-900 text-white"><Building2 size={20} /></span>
          <span><span className="block display text-xl font-bold text-emerald-950">SewaKita</span><span className="block text-[10px] uppercase tracking-[.2em] text-slate-500">Hunian Lokal</span></span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          <Link className="nav-link" href="/">Beranda</Link>
          <Link className="nav-link" href="/?type=kost">Kost</Link>
          <Link className="nav-link" href="/?type=rumah">Rumah</Link>
          <Link className="nav-link" href="/?type=kontrakan">Kontrakan</Link>
          <Link className="nav-link" href="/dashboard/new">Pasang Iklan</Link>
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {signedIn ? (
            <>
              <Link className="btn btn-secondary" href="/dashboard">Dashboard</Link>
              <button className="btn btn-primary" onClick={signOut}>Keluar</button>
            </>
          ) : (
            <Link className="btn btn-primary" href="/login">Masuk / Daftar</Link>
          )}
        </div>
        <button className="md:hidden" onClick={() => setOpen(v => !v)} aria-label="Menu">{open ? <X /> : <Menu />}</button>
      </div>

      {open && (
        <div className="border-t border-stone-200 bg-white px-5 py-4 md:hidden">
          <div className="flex flex-col gap-4 text-sm font-semibold">
            <Link href="/" onClick={() => setOpen(false)}>Beranda</Link>
            <Link href="/?type=kost" onClick={() => setOpen(false)}>Kost</Link>
            <Link href="/?type=rumah" onClick={() => setOpen(false)}>Rumah</Link>
            <Link href="/?type=kontrakan" onClick={() => setOpen(false)}>Kontrakan</Link>
            <Link href="/dashboard/new" onClick={() => setOpen(false)}>Pasang Iklan</Link>
            {signedIn ? <Link href="/dashboard" onClick={() => setOpen(false)}>Dashboard</Link> : <Link href="/login" onClick={() => setOpen(false)}>Masuk / Daftar</Link>}
            {signedIn && <button className="text-left text-red-700" onClick={signOut}>Keluar</button>}
          </div>
        </div>
      )}
    </header>
  );
}
