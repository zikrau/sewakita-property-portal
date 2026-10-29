
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Bath,
  BedDouble,
  Check,
  MapPin,
  Maximize2,
  MessageCircle,
  ShieldCheck,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/app-config';
import { getListing } from '@/lib/supabase/queries';
import { demoListings } from '@/lib/demo';
import { formatMoney, normalizeWhatsapp } from '@/lib/format';
import { ReportForm } from '@/components/report-form';
import type { Listing } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    const demo = demoListings.find((x) => x.id === id);

    return {
      title: demo?.title
        ? `${demo.title} — SYUZISHIM`
        : 'Detail Properti — SYUZISHIM',
    };
  }

  try {
    const listing = await getListing(await createClient(), id);

    return {
      title: listing?.title
        ? `${listing.title} — SYUZISHIM`
        : 'Properti — SYUZISHIM',
      description: listing?.description?.slice(0, 160),
    };
  } catch {
    return { title: 'Properti — SYUZISHIM' };
  }
}

export default async function ListingDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let listing: Listing | null = null;

  if (!isSupabaseConfigured()) {
    listing = demoListings.find((x) => x.id === id) ?? null;
  } else {
    listing = await getListing(await createClient(), id);
  }

  if (!listing || listing.status !== 'approved') notFound();

  const images = listing.image_urls?.length
    ? listing.image_urls
    : [
        'https://images.unsplash.com/photo-1560185008-b033106af5c3?auto=format&fit=crop&w=1400&q=80',
      ];

  const wa = normalizeWhatsapp(listing.whatsapp);

  return (
    <main className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-emerald-800"
      >
        <ArrowLeft size={16} />
        Kembali
      </Link>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="overflow-hidden rounded-[32px] bg-white card-shadow sm:col-span-2">
            <img
              src={images[0]}
              alt={listing.title}
              className="aspect-[16/10] h-full w-full object-cover"
            />
          </div>

          {images.slice(1, 5).map((url, i) => (
            <div
              key={url}
              className="overflow-hidden rounded-3xl bg-white card-shadow"
            >
              <img
                src={url}
                alt={`${listing.title} ${i + 2}`}
                className="aspect-[4/3] h-full w-full object-cover"
              />
            </div>
          ))}
        </div>

        <section className="rounded-[32px] bg-white p-7 card-shadow lg:p-9">
          <div className="flex flex-wrap gap-2">
            <span className="badge bg-emerald-50 text-emerald-800">
              {listing.property_type}
            </span>

            {listing.is_verified && (
              <span className="badge gap-1 bg-emerald-900 text-white">
                <ShieldCheck size={13} />
                Terverifikasi
              </span>
            )}

            {listing.featured && (
              <span className="badge bg-amber-50 text-amber-900">
                Pilihan
              </span>
            )}
          </div>

          <h1 className="display mt-5 text-4xl font-bold leading-tight text-emerald-950">
            {listing.title}
          </h1>

          <div className="mt-3 flex items-center gap-2 text-slate-500">
            <MapPin size={17} />
            {listing.area}, {listing.city}
          </div>

          <div className="mt-7 rounded-2xl bg-stone-50 p-5">
            <div className="text-sm text-slate-500">Harga sewa</div>
            <div className="mt-1 text-3xl font-extrabold">
              {formatMoney(listing.price)}{' '}
              <span className="text-base font-medium text-slate-500">
                /{listing.period.replace('an', '')}
              </span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            <InfoIcon
              icon={<BedDouble />}
              value={listing.bedrooms}
              label="Kamar"
            />
            <InfoIcon
              icon={<Bath />}
              value={listing.bathrooms}
              label="Mandi"
            />
            <InfoIcon
              icon={<Maximize2 />}
              value={listing.area_m2 ?? '-'}
              label="m²"
            />
          </div>

          {wa ? (
            <a
              target="_blank"
              rel="noreferrer"
              href={`https://wa.me/${wa}?text=${encodeURIComponent(
                `Halo, saya melihat listing "${listing.title}" di SYUZISHIM. Apakah masih tersedia?`,
              )}`}
              className="btn btn-primary mt-7 w-full"
            >
              <MessageCircle size={17} />
              Hubungi via WhatsApp
            </a>
          ) : (
            <div className="mt-7 rounded-2xl bg-stone-50 p-4 text-sm text-slate-500">
              Kontak WhatsApp belum dicantumkan pemilik.
            </div>
          )}

          <p className="mt-3 text-center text-xs text-slate-400">
            Jangan transfer sebelum mengecek lokasi, kondisi properti, dan
            identitas pemilik.
          </p>
        </section>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_.4fr]">
        <article className="rounded-3xl bg-white p-7 card-shadow">
          <h2 className="display text-3xl font-bold text-emerald-950">
            Tentang properti
          </h2>

          <p className="mt-4 whitespace-pre-line leading-8 text-slate-600">
            {listing.description}
          </p>

          {listing.facilities.length > 0 && (
            <>
              <h3 className="mt-8 text-lg font-bold">Fasilitas</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {listing.facilities.map((x) => (
                  <span
                    key={x}
                    className="badge bg-stone-100 text-slate-600"
                  >
                    {x}
                  </span>
                ))}
              </div>
            </>
          )}

          <div className="mt-8 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
            <span className="flex gap-2">
              <Check className="text-emerald-700" />
              Informasi harga tercatat
            </span>
            <span className="flex gap-2">
              <Check className="text-emerald-700" />
              Lokasi tertera
            </span>
            <span className="flex gap-2">
              <Check className="text-emerald-700" />
              Status listing tercatat
            </span>
            <span className="flex gap-2">
              <Check className="text-emerald-700" />
              Moderasi sebelum tayang
            </span>
          </div>
        </article>

        <aside className="space-y-5">
          <div className="rounded-3xl bg-emerald-950 p-7 text-white">
            <div className="text-sm text-emerald-200">
              Dipublikasikan oleh
            </div>
            <div className="mt-2 text-2xl font-bold">
              {listing.owner_display_name}
            </div>
            <div className="mt-6 rounded-2xl bg-white/10 p-4 text-sm leading-6 text-emerald-50">
              Tanda “Terverifikasi” hanya dapat diatur oleh moderator/admin.
            </div>
          </div>

          <ReportForm listingId={listing.id} />
        </aside>
      </div>
    </main>
  );
}

function InfoIcon({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: React.ReactNode;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-stone-200 p-4 [&_svg]:mx-auto [&_svg]:h-5 [&_svg]:w-5 [&_svg]:text-emerald-800">
      <div>{icon}</div>
      <div className="mt-2 font-bold">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}
