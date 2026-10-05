export function formatMoney(value: number | string) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export function formatDate(value: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(value));
}

export function normalizeWhatsapp(input: string | null | undefined) {
  if (!input) return '';
  let digits = input.replace(/\D/g, '');
  if (digits.startsWith('0')) digits = `62${digits.slice(1)}`;
  if (!digits.startsWith('62')) digits = `62${digits}`;
  return digits;
}

export const propertyTypes = [
  ['kost', 'Kost'],
  ['rumah', 'Rumah'],
  ['kontrakan', 'Kontrakan'],
  ['apartemen', 'Apartemen'],
  ['ruko', 'Ruko'],
  ['villa', 'Villa'],
  ['lainnya', 'Lainnya'],
] as const;

export const rentalPeriods = [
  ['harian', 'hari'],
  ['mingguan', 'minggu'],
  ['bulanan', 'bulan'],
  ['tahunan', 'tahun'],
] as const;
