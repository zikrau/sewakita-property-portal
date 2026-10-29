import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/navbar';
import { siteConfig } from '@/lib/app-config';
import Link from 'next/link';

const siteDescription =
  'SYUZISHIM adalah platform untuk mencari hunian dan menemukan produk bekas layak pakai antarmahasiswa dengan informasi yang terstruktur.';

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.appUrl),
  title: {
    default: 'SYUZISHIM — Hunian & Produk Mahasiswa',
    template: '%s — SYUZISHIM',
  },
  description: siteDescription,
  applicationName: 'SYUZISHIM',
  keywords: [
    'SYUZISHIM',
    'kost',
    'rumah',
    'kontrakan',
    'sewa rumah',
    'apartemen',
    'produk mahasiswa',
    'barang bekas mahasiswa',
  ],
  openGraph: {
    title: 'SYUZISHIM — Hunian & Produk Mahasiswa',
    description: siteDescription,
    type: 'website',
    locale: 'id_ID',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-stone-50 text-slate-900 antialiased">
        <Navbar />

        {children}

        <footer className="border-t border-stone-200 bg-white">
          <div className="mx-auto grid max-w-7xl gap-6 px-5 py-10 text-sm text-slate-500 lg:grid-cols-2 lg:px-8">
            <div>
              <div className="display text-2xl font-bold text-emerald-950">
                SYUZISHIM
              </div>
              <p className="mt-2 max-w-md leading-6">
                SYUZISHIM membantu mempertemukan pencari hunian dengan informasi
                properti serta mahasiswa yang ingin membeli atau menjual barang
                bekas layak pakai.
              </p>
            </div>

            <div className="flex gap-5 lg:justify-end">
              <Link href="/">Beranda</Link>
              <Link href="/login">Masuk</Link>
              <Link href="/dashboard/new">Pasang Iklan</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}