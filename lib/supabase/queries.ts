import type { SupabaseClient } from '@supabase/supabase-js';
import type { Listing } from '@/lib/types';

export async function getApprovedListings(
  supabase: SupabaseClient,
  filters?: { q?: string; type?: string; city?: string; min?: string; max?: string }
): Promise<Listing[]> {
  let query = supabase
    .from('listings')
    .select('*')
    .eq('status', 'approved')
    .order('featured', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(60);

  const q = filters?.q?.trim();
  if (q) {
    const safe = q.replace(/[%_]/g, '\\$&').replace(/,/g, ' ');
    query = query.or(`title.ilike.%${safe}%,city.ilike.%${safe}%,area.ilike.%${safe}%,description.ilike.%${safe}%`);
  }
  if (filters?.type) query = query.eq('property_type', filters.type);
  if (filters?.city) query = query.ilike('city', `%${filters.city.replace(/[%_]/g, '\\$&')}%`);
  if (filters?.min && Number.isFinite(Number(filters.min))) query = query.gte('price', Number(filters.min));
  if (filters?.max && Number.isFinite(Number(filters.max))) query = query.lte('price', Number(filters.max));

 const { data, error } = await query;

if (error) throw error;

return (data ?? []) as Listing[];
}

export async function getListing(supabase: SupabaseClient, id: string) {
  const { data, error } = await supabase.from('listings').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data as Listing | null;
}
