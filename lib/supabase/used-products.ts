
import type { SupabaseClient } from '@supabase/supabase-js';
import type { UsedProduct } from '@/lib/used-product-types';

export async function getApprovedUsedProducts(
  supabase: SupabaseClient,
  filters?: {
    q?: string;
    category?: string;
    city?: string;
    min?: string;
    max?: string;
  }
): Promise<UsedProduct[]> {
  let query = supabase
    .from('used_products')
    .select(
      'id, seller_id, title, description, category, item_condition, price, image_urls, city, area, status, sale_status, created_at, updated_at'
    )
    .eq('status', 'approved')
    .eq('sale_status', 'available')
    .order('created_at', { ascending: false })
    .limit(60);

  const q = filters?.q?.trim();

  if (q) {
    const safe = q.replace(/[%_]/g, '\\$&').replace(/,/g, ' ');
    query = query.or(
      `title.ilike.%${safe}%,description.ilike.%${safe}%,city.ilike.%${safe}%,area.ilike.%${safe}%`
    );
  }

  if (filters?.category) {
    query = query.eq('category', filters.category);
  }

  if (filters?.city) {
    query = query.ilike(
      'city',
      `%${filters.city.replace(/[%_]/g, '\\$&')}%`
    );
  }

  if (filters?.min && Number.isFinite(Number(filters.min))) {
    query = query.gte('price', Number(filters.min));
  }

  if (filters?.max && Number.isFinite(Number(filters.max))) {
    query = query.lte('price', Number(filters.max));
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data ?? []) as unknown as UsedProduct[];
}
