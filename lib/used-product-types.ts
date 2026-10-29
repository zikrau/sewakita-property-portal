
export type UsedProductCategory =
  | 'buku'
  | 'elektronik'
  | 'perlengkapan_kos'
  | 'pakaian'
  | 'olahraga_hobi'
  | 'lainnya';

export type UsedProductCondition =
  | 'seperti_baru'
  | 'sangat_baik'
  | 'baik'
  | 'layak_pakai';

export type UsedProductStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'archived';

export type ProductSaleStatus =
  | 'available'
  | 'reserved'
  | 'sold';

export type UsedProduct = {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  category: UsedProductCategory;
  item_condition: UsedProductCondition;
  price: number;
  image_urls: string[];
  city: string;
  area: string | null;
  status: UsedProductStatus;
  sale_status: ProductSaleStatus;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
};
