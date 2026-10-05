import type { MetadataRoute } from 'next';
import { siteConfig, isSupabaseConfigured } from '@/lib/app-config';
import { createClient } from '@/lib/supabase/server';
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = [{ url: siteConfig.appUrl, lastModified: new Date() }, { url: `${siteConfig.appUrl}/login`, lastModified: new Date() }];
  if (!isSupabaseConfigured()) return base;
  try { const { data } = await (await createClient()).from('listings').select('id,updated_at').eq('status','approved').limit(5000); return [...base, ...(data ?? []).map(x => ({ url: `${siteConfig.appUrl}/listings/${x.id}`, lastModified: new Date(x.updated_at) }))]; } catch { return base; }
}
