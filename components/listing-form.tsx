'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { propertyTypes, rentalPeriods } from '@/lib/format';
import type { Listing } from '@/lib/types';
import { CheckCircle2, ImagePlus, Loader2, Trash2, Upload } from 'lucide-react';

const MAX_FILES = 8;
const MAX_SIZE = 5 * 1024 * 1024;

function storagePathFromUrl(url: string) {
  const marker = '/listing-images/';
  const index = url.indexOf(marker);
  return index >= 0 ? url.slice(index + marker.length) : '';
}

export function ListingForm({ userId, ownerName, initial }: { userId: string; ownerName: string; initial?: Listing }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [title, setTitle] = useState(initial?.title ?? '');
  const [propertyType, setPropertyType] = useState(initial?.property_type ?? 'kost');
  const [city, setCity] = useState(initial?.city ?? '');
  const [area, setArea] = useState(initial?.area ?? '');
  const [address, setAddress] = useState(initial?.address ?? '');
  const [nearestCampus, setNearestCampus] = useState(initial?.nearest_campus ?? '');
const [campusDistanceKm, setCampusDistanceKm] = useState(
  initial?.campus_distance_km ? String(initial.campus_distance_km) : ''
);
const [campusTravelMinutes, setCampusTravelMinutes] = useState(
  initial?.campus_travel_minutes ? String(initial.campus_travel_minutes) : ''
);
  const [price, setPrice] = useState(initial?.price ? String(initial.price) : '');
  const [period, setPeriod] = useState(initial?.period ?? 'bulanan');
  const [bedrooms, setBedrooms] = useState(initial?.bedrooms ? String(initial.bedrooms) : '1');
  const [bathrooms, setBathrooms] = useState(initial?.bathrooms ? String(initial.bathrooms) : '1');
  const [areaM2, setAreaM2] = useState(initial?.area_m2 ? String(initial.area_m2) : '');
  const [furnished, setFurnished] = useState(Boolean(initial?.furnished));
  const [facilities, setFacilities] = useState(initial?.facilities?.join(', ') ?? '');
  const [whatsapp, setWhatsapp] = useState(initial?.whatsapp ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [existingImages, setExistingImages] = useState<string[]>(initial?.image_urls ?? []);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState('');
  const [error, setError] = useState('');

  function selectFiles(input: FileList | null) {
    if (!input) return;
    const incoming = Array.from(input);
    const accepted: File[] = [];
    for (const file of incoming) {
      if (!file.type.startsWith('image/')) { setError('Hanya file gambar yang boleh diunggah.'); continue; }
      if (file.size > MAX_SIZE) { setError(`Ukuran ${file.name} lebih dari 5 MB.`); continue; }
      accepted.push(file);
    }
    if (existingImages.length + files.length + accepted.length > MAX_FILES) {
      setError(`Maksimal ${MAX_FILES} foto per listing.`);
      return;
    }
    setFiles(prev => [...prev, ...accepted]); setError('');
  }

  async function removeExisting(url: string) {
    const path = storagePathFromUrl(url);
    if (path) await supabase.storage.from('listing-images').remove([path]);
    setExistingImages(prev => prev.filter(item => item !== url));
  }

  async function uploadNewImages(listingId: string) {
    const urls: string[] = [];
    for (const file of files) {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `${userId}/${listingId}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('listing-images').upload(path, file, { upsert: false, contentType: file.type });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('listing-images').getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    return urls;
  }

 async function submit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();
  setBusy(true);
  setError('');
  setSaved('');

  try {
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const action = submitter?.value || 'moderate';

    if (title.trim().length < 5) {
      throw new Error('Judul minimal 5 karakter.');
    }

    if (!city.trim() || !area.trim()) {
      throw new Error('Kota dan area wajib diisi.');
    }

    if (!Number(price) || Number(price) < 0) {
      throw new Error('Harga tidak valid.');
    }

    if (!description.trim()) {
      throw new Error('Deskripsi wajib diisi.');
    }

    if (existingImages.length + files.length === 0) {
      throw new Error('Tambahkan minimal 1 foto.');
    }

    const newStatus = action === 'draft' ? 'draft' : 'pending';

    const createData = {
      owner_display_name: ownerName || 'Pemilik SYUZISHIM',
      title: title.trim(),
      property_type: propertyType,
      city: city.trim(),
      area: area.trim(),
      address: address.trim() || null,
      nearest_campus: nearestCampus.trim() || null,
campus_distance_km: campusDistanceKm ? Number(campusDistanceKm) : null,
campus_travel_minutes: campusTravelMinutes ? Number(campusTravelMinutes) : null,
      price: Number(price),
      period,
      bedrooms: Number(bedrooms),
      bathrooms: Number(bathrooms),
      area_m2: areaM2 ? Number(areaM2) : null,
      furnished,
      description: description.trim(),
      facilities: facilities
        .split(',')
        .map(x => x.trim())
        .filter(Boolean),
      whatsapp: whatsapp.trim() || null,
      status: 'draft',
    };

    let listingId = initial?.id;

    if (initial) {
      const updateData = {
        title: title.trim(),
        property_type: propertyType,
        city: city.trim(),
        area: area.trim(),
        address: address.trim() || null,
        nearest_campus: nearestCampus.trim() || null,
campus_distance_km: campusDistanceKm ? Number(campusDistanceKm) : null,
campus_travel_minutes: campusTravelMinutes ? Number(campusTravelMinutes) : null,
        price: Number(price),
        period,
        bedrooms: Number(bedrooms),
        bathrooms: Number(bathrooms),
        area_m2: areaM2 ? Number(areaM2) : null,
        furnished,
        description: description.trim(),
        facilities: facilities
          .split(',')
          .map(x => x.trim())
          .filter(Boolean),
        image_urls: existingImages,
        whatsapp: whatsapp.trim() || null,
        status: newStatus,
      };

      const { error: updateError } = await supabase
        .from('listings')
        .update(updateData)
        .eq('id', initial.id);

      if (updateError) throw updateError;
    } else {
      const { data, error: insertError } = await supabase
        .from('listings')
        .insert({
          ...createData,
          status: newStatus,
          owner_id: userId,
        })
        .select('id')
        .single();

      if (insertError) throw insertError;

      listingId = data.id;
    }

    const uploaded = await uploadNewImages(listingId!);
    const finalImages = [...existingImages, ...uploaded];

    const { error: finalError } = await supabase
      .from('listings')
      .update({
        image_urls: finalImages,
        status: newStatus,
      })
      .eq('id', listingId!);

    if (finalError) throw finalError;

    setFiles([]);
    setExistingImages(finalImages);

    if (newStatus === 'draft') {
      setSaved('Draft berhasil disimpan.');
    } else {
      setSaved('Listing dikirim untuk moderasi. Admin akan meninjau sebelum tayang.');
    }

    router.refresh();

    if (!initial) {
      setTimeout(() => router.push('/dashboard'), 600);
    }
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Gagal menyimpan listing.');
  } finally {
    setBusy(false);
  }
}
  return (
    <form onSubmit={submit} className="space-y-7">
      {saved && <div className="alert alert-success"><CheckCircle2 size={18} />{saved}</div>}
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="grid gap-5 md:grid-cols-2">
        <label className="md:col-span-2"><span className="field-label">Judul listing</span><input className="input" required value={title} onChange={e => setTitle(e.target.value)} placeholder="Contoh: Kost Putri Nyaman Dekat Kampus" /></label>
        <label><span className="field-label">Jenis properti</span><select className="input" value={propertyType} onChange={e => setPropertyType(e.target.value as typeof propertyType)}>{propertyTypes.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
        <label><span className="field-label">Periode harga</span><select className="input" value={period} onChange={e => setPeriod(e.target.value as typeof period)}>{rentalPeriods.map(([value, label]) => <option value={value} key={value}>Per {label}</option>)}</select></label>
        <label><span className="field-label">Kota / Kabupaten</span><input className="input" required value={city} onChange={e => setCity(e.target.value)} placeholder="Banda Aceh" /></label>
        <label><span className="field-label">Area / Kecamatan</span><input className="input" required value={area} onChange={e => setArea(e.target.value)} placeholder="Syiah Kuala" /></label>
        <label className="md:col-span-2"><span className="field-label">Alamat / patokan</span><input className="input" value={address} onChange={e => setAddress(e.target.value)} placeholder="Alamat lengkap atau patokan lokasi" /></label>
        <div className="md:col-span-2 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5">
  <div className="mb-4">
    <h3 className="font-bold text-emerald-950">Kampus terdekat</h3>
    <p className="mt-1 text-sm text-slate-500">
      Informasi ini membantu calon penyewa mengetahui jarak properti ke kampus.
    </p>
  </div>

  <div className="grid gap-4 md:grid-cols-3">
    <label>
      <span className="field-label">Nama kampus</span>
      <input
        className="input"
        value={nearestCampus}
        onChange={e => setNearestCampus(e.target.value)}
        placeholder="Universitas Syiah Kuala"
      />
    </label>

    <label>
      <span className="field-label">Jarak (km)</span>
      <input
        className="input"
        type="number"
        min="0"
        step="0.1"
        value={campusDistanceKm}
        onChange={e => setCampusDistanceKm(e.target.value)}
        placeholder="1.2"
      />
    </label>

    <label>
      <span className="field-label">Estimasi waktu (menit)</span>
      <input
        className="input"
        type="number"
        min="0"
        value={campusTravelMinutes}
        onChange={e => setCampusTravelMinutes(e.target.value)}
        placeholder="5"
      />
    </label>
  </div>
</div>
        <label><span className="field-label">Harga sewa (Rp)</span><input className="input" required type="number" min="0" value={price} onChange={e => setPrice(e.target.value)} placeholder="850000" /></label>
        <label><span className="field-label">WhatsApp pemilik</span><input className="input" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="08123456789" /></label>
        <label><span className="field-label">Kamar tidur</span><input className="input" type="number" min="0" value={bedrooms} onChange={e => setBedrooms(e.target.value)} /></label>
        <label><span className="field-label">Kamar mandi</span><input className="input" type="number" min="0" value={bathrooms} onChange={e => setBathrooms(e.target.value)} /></label>
        <label><span className="field-label">Luas (m²)</span><input className="input" type="number" min="0" value={areaM2} onChange={e => setAreaM2(e.target.value)} placeholder="16" /></label>
        <label className="flex items-center gap-3 rounded-2xl border border-stone-200 px-4 py-3"><input type="checkbox" checked={furnished} onChange={e => setFurnished(e.target.checked)} /><span className="font-semibold">Furnished</span></label>
        <label className="md:col-span-2"><span className="field-label">Fasilitas <span className="font-normal text-slate-400">(pisahkan dengan koma)</span></span><input className="input" value={facilities} onChange={e => setFacilities(e.target.value)} placeholder="Wi-Fi, Parkir, Listrik, Dapur bersama" /></label>
        <label className="md:col-span-2"><span className="field-label">Deskripsi</span><textarea className="input min-h-40" required value={description} onChange={e => setDescription(e.target.value)} placeholder="Jelaskan kondisi, aturan, akses, fasilitas, dan informasi penting lainnya." /></label>
      </div>

      <section className="rounded-3xl border border-stone-200 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold">Foto properti</h2><p className="text-sm text-slate-500">Maksimal 8 foto, JPG/PNG/WebP, maksimal 5 MB per foto.</p></div><label className="btn btn-secondary cursor-pointer"><Upload size={16} /> Tambah foto<input className="hidden" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={e => selectFiles(e.target.files)} /></label></div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {existingImages.map((url, index) => <div key={url} className="relative overflow-hidden rounded-2xl border border-stone-200"><img src={url} alt={`Foto ${index + 1}`} className="aspect-square w-full object-cover" /><button type="button" onClick={() => removeExisting(url)} className="absolute right-2 top-2 rounded-full bg-white/90 p-2 text-red-700 shadow"><Trash2 size={14} /></button></div>)}
          {files.map(file => <div key={`${file.name}-${file.size}`} className="relative overflow-hidden rounded-2xl border border-dashed border-emerald-300 bg-emerald-50 p-3"><div className="flex aspect-square flex-col items-center justify-center text-center text-emerald-900"><ImagePlus size={28} /><span className="mt-2 line-clamp-2 text-xs font-semibold">{file.name}</span></div></div>)}
          {existingImages.length + files.length === 0 && <div className="col-span-full flex min-h-40 items-center justify-center rounded-2xl border-2 border-dashed border-stone-200 text-sm text-slate-400">Belum ada foto.</div>}
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
  <button
    type="submit"
    name="action"
    value="draft"
    disabled={busy}
    className="btn btn-secondary px-7 disabled:opacity-50"
  >
    {busy ? (
      <>
        <Loader2 className="animate-spin" size={17} />
        Menyimpan…
      </>
    ) : (
      'Simpan Draft'
    )}
  </button>

  <button
    type="submit"
    name="action"
    value="moderate"
    disabled={busy}
    className="btn btn-primary px-7 disabled:opacity-50"
  >
    {busy ? (
      <>
        <Loader2 className="animate-spin" size={17} />
        Memproses…
      </>
    ) : (
      'Kirim untuk Moderasi'
    )}
  </button>
</div>
    </form>
  );
}
