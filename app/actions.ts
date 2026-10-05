'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import type { UserRole } from '@/lib/types';

async function requireStaff(allowed: UserRole[] = ['admin', 'moderator']) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Anda harus login.');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const role = profile?.role as UserRole | undefined;
  if (!role || !allowed.includes(role)) throw new Error('Akses ditolak.');
  return { user, role };
}

async function audit(actorId: string, action: string, entityId: string, details: Record<string, unknown> = {}) {
  const admin = createAdminClient();
  await admin.from('audit_logs').insert({ actor_id: actorId, action, entity_type: 'listing', entity_id: entityId, details });
}

export async function moderateListing(formData: FormData) {
  const { user, role } = await requireStaff();
  const id = String(formData.get('id') ?? '');
  const decision = String(formData.get('decision') ?? '');
  const reason = String(formData.get('reason') ?? '').trim();
  if (!id || !['approved', 'rejected'].includes(decision)) throw new Error('Permintaan moderasi tidak valid.');

  const admin = createAdminClient();
  const { data: listing } = await admin.from('listings').select('status').eq('id', id).maybeSingle();
  if (!listing || listing.status !== 'pending') throw new Error('Listing tidak sedang menunggu moderasi.');
  const update = decision === 'approved'
    ? { status: 'approved', rejection_reason: null, published_at: new Date().toISOString() }
    : { status: 'rejected', rejection_reason: reason || 'Listing belum memenuhi ketentuan.', published_at: null, is_verified: false, featured: false };
  const { error } = await admin.from('listings').update(update).eq('id', id);
  if (error) throw error;
  await audit(user.id, `listing_${decision}`, id, { role, reason });
  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/dashboard');
  revalidatePath(`/listings/${id}`);
}

export async function setListingVerified(formData: FormData) {
  const { user } = await requireStaff();
  const id = String(formData.get('id') ?? '');
  const verified = String(formData.get('verified') ?? '') === 'true';
  if (!id) throw new Error('Listing tidak ditemukan.');
  const admin = createAdminClient();
  const { data: listing } = await admin.from('listings').select('status').eq('id', id).maybeSingle();
  if (!listing || listing.status !== 'approved') throw new Error('Hanya listing yang tayang yang dapat diverifikasi.');
  const { error } = await admin.from('listings').update({ is_verified: verified }).eq('id', id);
  if (error) throw error;
  await audit(user.id, verified ? 'listing_verified' : 'listing_unverified', id);
  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath(`/listings/${id}`);
}

export async function setListingFeatured(formData: FormData) {
  const { user, role } = await requireStaff(['admin']);
  const id = String(formData.get('id') ?? '');
  const featured = String(formData.get('featured') ?? '') === 'true';
  if (!id) throw new Error('Listing tidak ditemukan.');
  const admin = createAdminClient();
  const { data: listing } = await admin.from('listings').select('status').eq('id', id).maybeSingle();
  if (!listing || listing.status !== 'approved') throw new Error('Hanya listing yang tayang yang dapat dijadikan pilihan.');
  const { error } = await admin.from('listings').update({ featured }).eq('id', id);
  if (error) throw error;
  await audit(user.id, featured ? 'listing_featured' : 'listing_unfeatured', id, { role });
  revalidatePath('/');
  revalidatePath('/admin');
}

export async function archiveListing(formData: FormData) {
  const { user } = await requireStaff();
  const id = String(formData.get('id') ?? '');
  if (!id) throw new Error('Listing tidak ditemukan.');
  const admin = createAdminClient();
  const { error } = await admin.from('listings').update({ status: 'archived', published_at: null, is_verified: false, featured: false }).eq('id', id);
  if (error) throw error;
  await audit(user.id, 'listing_archived', id);
  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/dashboard');
}

export async function saveProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Anda harus login.');
  const fullName = String(formData.get('full_name') ?? '').trim();
  const phone = String(formData.get('phone') ?? '').trim();
  if (fullName.length < 2) throw new Error('Nama minimal 2 karakter.');
  const { error } = await supabase.from('profiles').update({ full_name: fullName, phone }).eq('id', user.id);
  if (error) throw error;
  revalidatePath('/dashboard');
}

export async function reportListing(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Silakan login untuk membuat laporan.');
  const listingId = String(formData.get('listing_id') ?? '');
  const category = String(formData.get('category') ?? 'lainnya');
  const note = String(formData.get('note') ?? '').trim();
  if (!listingId) throw new Error('Listing tidak ditemukan.');
  const { error } = await supabase.from('listing_reports').insert({ reporter_id: user.id, listing_id: listingId, category, note });
  if (error) throw error;
  revalidatePath(`/listings/${listingId}`);
}
