import type { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/app-config';
export default function robots(): MetadataRoute.Robots { return { rules: { userAgent: '*', allow: '/' }, sitemap: `${siteConfig.appUrl}/sitemap.xml` }; }
