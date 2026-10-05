import Link from 'next/link';
import { Bath, BedDouble, MapPin, Maximize2, ShieldCheck, GraduationCap, Car } from 'lucide-react';
import type { Listing } from '@/lib/types';
import { formatMoney } from '@/lib/format';

const fallbackImage = 'https://images.unsplash.com/photo-1560185008-b033106af5c3?auto=format&fit=crop&w=1200&q=80';

export function ListingCard({ listing }: { listing: Listing }) {
  const image = listing.image_urls?.[0] || fallbackImage;
  return (
    <Link href={`/listings/${listing.id}`} className="group overflow-hidden rounded-3xl border border-stone-200 bg-white card-shadow">
      <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
        <img src={image} alt={listing.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        {listing.featured && <span className="absolute left-4 top-4 badge bg-white/90 text-emerald-900">Pilihan</span>}
        {listing.is_verified && <span className="absolute right-4 top-4 badge gap-1 bg-emerald-900/90 text-white"><ShieldCheck size={13} /> Terverifikasi</span>}
      </div>
      <div className="p-5">
        <div className="mb-2 flex items-center justify-between gap-3"><span className="text-xs font-bold uppercase tracking-[.14em] text-emerald-700">{listing.property_type}</span><span className="text-xs text-slate-400">{listing.owner_display_name}</span></div>
        <h3 className="display text-2xl font-bold leading-tight text-emerald-950">{listing.title}</h3>
        <div className="mt-2 flex items-center gap-1 text-sm text-slate-500"><MapPin size={15} />{listing.area}, {listing.city}</div>
        <div className="mt-4 flex gap-4 text-sm text-slate-600"><span className="flex items-center gap-1"><BedDouble size={15} />{listing.bedrooms}</span><span className="flex items-center gap-1"><Bath size={15} />{listing.bathrooms}</span><span className="flex items-center gap-1"><Maximize2 size={15} />{listing.area_m2 ?? '-'} m²</span></div>
        {listing.nearest_campus && (
  <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3">
    <div className="flex items-center gap-2 text-sm font-bold text-emerald-900">
      <GraduationCap size={16} />
      Dekat Kampus
    </div>

    <div className="mt-1 text-sm text-slate-700">
      {listing.nearest_campus}
    </div>

    {(listing.campus_distance_km != null || listing.campus_travel_minutes != null) && (
      <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
        {listing.campus_distance_km != null && (
          <span className="flex items-center gap-1">
            <MapPin size={13} />
            {listing.campus_distance_km} km
          </span>
        )}

        {listing.campus_travel_minutes != null && (
          <span className="flex items-center gap-1">
            <Car size={13} />
            ±{listing.campus_travel_minutes} menit
          </span>
        )}
      </div>
    )}
  </div>
)}
        <div className="mt-5 border-t border-stone-100 pt-4"><span className="text-xl font-extrabold text-slate-900">{formatMoney(listing.price)}</span><span className="text-sm text-slate-500">/{listing.period.replace('an','')}</span></div>
      </div>
    </Link>
  );
}
