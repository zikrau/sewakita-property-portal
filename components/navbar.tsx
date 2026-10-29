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

    let active = true;

    async function checkUser() {
      const { data, error } = await supabase.auth.getUser();

      if (active && !error) {
        setSignedIn(Boolean(data.user));
      }
    }

    void checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;

      setSignedIn(Boolean(session?.user));

      if (event === 'SIGNED_OUT') {
        setOpen(false);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert('Gagal keluar. Silakan coba lagi.');
      return;
    }

    setSignedIn(false);
    setOpen(false);
    window.location.href = '/';
  }

  const authLoading = signedIn === null;

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/70 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-3"
          onClick={() => setOpen(false)}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-900 text-white">
            <Building2 size={20} />
          </span>

          <span>
            <span className="block display text-xl font-bold text-emerald-950">
              SYUZISHIM
            </span>
            <span className="block text-[10px] uppercase tracking-[.2em] text-slate-500">
              Hunian & Produk Mahasiswa
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          <Link className="nav-link" href="/">Beranda</Link>
          <Link className="nav-link" href="/?type=kost">Kost</Link>
          <Link className="nav-link" href="/?type=rumah">Rumah</Link>
          <Link className="nav-link" href="/?type=kontrakan">Kontrakan</Link>
          <Link className="nav-link" href="/produk-mahasiswa">
            Produk Mahasiswa
          </Link>
          <Link className="nav-link" href="/dashboard/new">Pasang Iklan</Link>
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {authLoading ? (
            <span className="text-sm text-slate-500">Memuat...</span>
          ) : signedIn ? (
            <>
              <Link className="btn btn-secondary" href="/dashboard">
                Dashboard
              </Link>
              <button className="btn btn-primary" onClick={signOut}>
                Keluar
              </button>
            </>
          ) : (
            <Link className="btn btn-primary" href="/login">
              Masuk / Daftar
            </Link>
          )}
        </div>

        <button
          className="md:hidden"
          onClick={() => setOpen(v => !v)}
          aria-label="Menu"
          aria-expanded={open}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="border-t border-stone-200 bg-white px-5 py-4 md:hidden">
          <div className="flex flex-col gap-4 text-sm font-semibold">
            <Link href="/" onClick={() => setOpen(false)}>Beranda</Link>
            <Link href="/?type=kost" onClick={() => setOpen(false)}>Kost</Link>
            <Link href="/?type=rumah" onClick={() => setOpen(false)}>Rumah</Link>
            <Link href="/?type=kontrakan" onClick={() => setOpen(false)}>Kontrakan</Link>
            <Link href="/produk-mahasiswa" onClick={() => setOpen(false)}>
              Produk Mahasiswa
            </Link>
            <Link href="/dashboard/new" onClick={() => setOpen(false)}>
              Pasang Iklan
            </Link>

            {!authLoading && (
              signedIn ? (
                <>
                  <Link href="/dashboard" onClick={() => setOpen(false)}>
                    Dashboard
                  </Link>
                  <button className="text-left text-red-700" onClick={signOut}>
                    Keluar
                  </button>
                </>
              ) : (
                <Link href="/login" onClick={() => setOpen(false)}>
                  Masuk / Daftar
                </Link>
              )
            )}
          </div>
        </div>
      )}
    </header>
  );
}