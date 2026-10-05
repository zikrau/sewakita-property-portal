export type PropertyType = 'kost' | 'rumah' | 'kontrakan' | 'apartemen' | 'ruko' | 'villa' | 'lainnya';
export type RentalPeriod = 'harian' | 'mingguan' | 'bulanan' | 'tahunan';
export type ListingStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'archived';
export type UserRole = 'user' | 'moderator' | 'admin';

export type Listing = {
  id: string;
  owner_id: string;
  owner_display_name: string;
  title: string;
  property_type: PropertyType;
  city: string;
  area: string;
  address: string | null;
  nearest_campus: string | null;
campus_distance_km: number | null;
campus_travel_minutes: number | null;
  price: number;
  period: RentalPeriod;
  bedrooms: number;
  bathrooms: number;
  area_m2: number | null;
  furnished: boolean;
  description: string;
  facilities: string[];
  image_urls: string[];
  whatsapp: string | null;
  is_verified: boolean;
  featured: boolean;
  status: ListingStatus;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
};

export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
};
