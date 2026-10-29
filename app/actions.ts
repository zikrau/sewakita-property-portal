
'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import type { UserRole } from '@/lib/types';

async function requireStaff(allowed: UserRole[] = ['admin', 'moderator']) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Anda harus login.');

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (error) throw new Error('Gagal memeriksa hak akses.');

  const role = profile?.role as UserRole | undefined;

  if (!role || !allowed.includes(role)) {
    throw new Error('Akses ditolak.');
  }

  return { user, role };
}

async function audit(
  actorId: string,
  action: string,
  entityId: string,
  entityType: 'listing' | 'used_product' = 'listing',
  details: Record<string, unknown> = {},
) {
  const admin = createAdminClient();

  const { error } = await admin.from('audit_logs').insert({
    actor_id: actorId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    details,
  });

  if (error) {
    console.error('Audit log gagal disimpan:', error.message);
  }
}

/* =====================================================
   MODERASI HUNIAN
===================================================== */

export async function moderateListing(formData: FormData) {
  const { user, role } = await requireStaff();

  const id = String(formData.get('id') ?? '').trim();
  const decision = String(formData.get('decision') ?? '');
  const reason = String(formData.get('reason') ?? '').trim();

  if (!id || !['approved', 'rejected'].includes(decision)) {
    throw new Error('Permintaan moderasi tidak valid.');
  }

  if (decision === 'rejected' && !reason) {
    throw new Error('Alasan penolakan wajib diisi.');
  }

  const admin = createAdminClient();

  const { data: listing, error: readError } = await admin
    .from('listings')
    .select('status')
    .eq('id', id)
    .maybeSingle();

  if (readError) throw new Error('Gagal memeriksa listing hunian.');

  if (!listing || listing.status !== 'pending') {
    throw new Error('Listing tidak sedang menunggu moderasi.');
  }

  const update =
    decision === 'approved'
      ? {
          status: 'approved',
          rejection_reason: null,
          published_at: new Date().toISOString(),
        }
      : {
          status: 'rejected',
          rejection_reason: reason,
          published_at: null,
          is_verified: false,
          featured: false,
        };

  const { error } = await admin
    .from('listings')
    .update(update)
    .eq('id', id)
    .eq('status', 'pending');

  if (error) throw new Error('Gagal memperbarui status hunian.');

  await audit(user.id, `listing_${decision}`, id, 'listing', {
    role,
    reason,
  });

  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/dashboard');
  revalidatePath(`/listings/${id}`);
}

/* =====================================================
   VERIFIKASI HUNIAN
===================================================== */

export async function setListingVerified(formData: FormData) {
  const { user } = await requireStaff();

  const id = String(formData.get('id') ?? '').trim();
  const verified = String(formData.get('verified') ?? '') === 'true';

  if (!id) throw new Error('Listing tidak ditemukan.');

  const admin = createAdminClient();

  const { data: listing, error: readError } = await admin
    .from('listings')
    .select('status')
    .eq('id', id)
    .maybeSingle();

  if (readError) throw new Error('Gagal memeriksa listing hunian.');

  if (!listing || listing.status !== 'approved') {
    throw new Error('Hanya listing yang tayang yang dapat diverifikasi.');
  }

  const { error } = await admin
    .from('listings')
    .update({ is_verified: verified })
    .eq('id', id)
    .eq('status', 'approved');

  if (error) throw new Error('Gagal mengubah verifikasi hunian.');

  await audit(
    user.id,
    verified ? 'listing_verified' : 'listing_unverified',
    id,
  );

  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath(`/listings/${id}`);
}

/* =====================================================
   HUNIAN PILIHAN — KHUSUS ADMIN
===================================================== */

export async function setListingFeatured(formData: FormData) {
  const { user, role } = await requireStaff(['admin']);

  const id = String(formData.get('id') ?? '').trim();
  const featured = String(formData.get('featured') ?? '') === 'true';

  if (!id) throw new Error('Listing tidak ditemukan.');

  const admin = createAdminClient();

  const { data: listing, error: readError } = await admin
    .from('listings')
    .select('status')
    .eq('id', id)
    .maybeSingle();

  if (readError) throw new Error('Gagal memeriksa listing hunian.');

  if (!listing || listing.status !== 'approved') {
    throw new Error('Hanya listing yang tayang yang dapat dijadikan pilihan.');
  }

  const { error } = await admin
    .from('listings')
    .update({ featured })
    .eq('id', id)
    .eq('status', 'approved');

  if (error) throw new Error('Gagal mengubah status hunian pilihan.');

  await audit(
    user.id,
    featured ? 'listing_featured' : 'listing_unfeatured',
    id,
    'listing',
    { role },
  );

  revalidatePath('/');
  revalidatePath('/admin');
}

/* =====================================================
   ARSIP HUNIAN
===================================================== */

export async function archiveListing(formData: FormData) {
  const { user } = await requireStaff();

  const id = String(formData.get('id') ?? '').trim();

  if (!id) throw new Error('Listing tidak ditemukan.');

  const admin = createAdminClient();

  const { data: listing, error: readError } = await admin
    .from('listings')
    .select('status')
    .eq('id', id)
    .maybeSingle();

  if (readError) throw new Error('Gagal memeriksa listing hunian.');
  if (!listing) throw new Error('Listing tidak ditemukan.');

  const { error } = await admin
    .from('listings')
    .update({
      status: 'archived',
      published_at: null,
      is_verified: false,
      featured: false,
    })
    .eq('id', id);

  if (error) throw new Error('Gagal mengarsipkan hunian.');

  await audit(user.id, 'listing_archived', id);

  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/dashboard');
}

/* =====================================================
   MODERASI PRODUK MAHASISWA
   Menggunakan RPC SECURITY DEFINER yang sudah dibuat
   di Supabase dan memeriksa role admin/moderator.
===================================================== */

export async function moderateUsedProduct(formData: FormData) {
  const { user, role } = await requireStaff();

  const id = String(formData.get('id') ?? '').trim();
  const decision = String(formData.get('decision') ?? '');
  const reason = String(formData.get('reason') ?? '').trim();

  if (!id || !['approved', 'rejected', 'archived'].includes(decision)) {
    throw new Error('Permintaan moderasi produk tidak valid.');
  }

  if (decision === 'rejected' && !reason) {
    throw new Error('Alasan penolakan produk wajib diisi.');
  }

  const supabase = await createClient();

  const { error } = await supabase.rpc('moderate_used_product', {
    p_product_id: id,
    p_new_status: decision,
    p_rejection_reason: decision === 'rejected' ? reason : null,
  });

  if (error) {
    console.error('Moderasi produk gagal:', error.message);
    throw new Error('Moderasi produk gagal. Periksa status produk dan izin moderasi.');
  }

  await audit(
    user.id,
    `used_product_${decision}`,
    id,
    'used_product',
    { role, reason },
  );

  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/dashboard');
  revalidatePath('/produk-mahasiswa');
}

/* =====================================================
   SIMPAN PROFIL
===================================================== */

export async function saveProfile(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Anda harus login.');

  const fullName = String(formData.get('full_name') ?? '').trim();
  const phone = String(formData.get('phone') ?? '').trim();

  if (fullName.length < 2) {
    throw new Error('Nama minimal 2 karakter.');
  }

  const { error } = await supabase
    .from('profiles')
    .update({ full_name: fullName, phone })
    .eq('id', user.id);

  if (error) throw new Error('Gagal menyimpan profil.');

  revalidatePath('/dashboard');
}

/* =====================================================
   LAPORKAN HUNIAN
===================================================== */

export async function reportListing(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Silakan login untuk membuat laporan.');

  const listingId = String(formData.get('listing_id') ?? '').trim();
  const category = String(formData.get('category') ?? 'lainnya');
  const note = String(formData.get('note') ?? '').trim();

  if (!listingId) throw new Error('Listing tidak ditemukan.');

  const { error } = await supabase.from('listing_reports').insert({
    reporter_id: user.id,
    listing_id: listingId,
    category,
    note,
  });

  if (error) throw new Error('Gagal mengirim laporan.');

  revalidatePath(`/listings/${listingId}`);
}
