import { AuthForm } from '@/components/auth-form';
import { isSupabaseConfigured } from '@/lib/app-config';

export const dynamic = 'force-dynamic';
export default function LoginPage() {
  return <main className="mx-auto grid min-h-[calc(100vh-80px)] max-w-6xl items-center gap-10 px-5 py-12 lg:grid-cols-2 lg:px-8"><div className="hidden lg:block"><div className="badge bg-emerald-50 text-emerald-800">SYUZISHIM</div><h1 className="display mt-5 text-6xl font-bold leading-tight text-emerald-950">Pasang properti tanpa menyerahkan kendali sistem.</h1><p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">Akun pemilik hanya mengelola listing miliknya. Moderasi, verifikasi, dan fitur pilihan tetap berada di sisi staf.</p>{!isSupabaseConfigured() && <div className="mt-6 alert alert-warning">Supabase belum dikonfigurasi. Halaman depan masih dapat dibuka dalam mode demo.</div>}</div><AuthForm /></main>;
}
