export const isSupabaseConfigured = () => Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

export const siteConfig = {
  name: 'SYUZISHIM',
  description: 'Platform hunian dan marketplace produk bekas layak pakai antarmahasiswa.',
  whatsappAdmin: process.env.NEXT_PUBLIC_ADMIN_WHATSAPP ?? '',
  appUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
};