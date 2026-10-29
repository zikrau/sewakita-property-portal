
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type UsedProductFormProps = {
  userId: string;
};

const categories = [
  { value: 'buku', label: 'Buku' },
  { value: 'elektronik', label: 'Elektronik' },
  { value: 'perlengkapan_kos', label: 'Perlengkapan kos' },
  { value: 'pakaian', label: 'Pakaian' },
  { value: 'olahraga_hobi', label: 'Olahraga dan hobi' },
  { value: 'lainnya', label: 'Lainnya' },
];

const conditions = [
  { value: 'seperti_baru', label: 'Seperti baru' },
  { value: 'sangat_baik', label: 'Sangat baik' },
  { value: 'baik', label: 'Baik' },
  { value: 'layak_pakai', label: 'Layak pakai' },
];

export function UsedProductForm({ userId }: UsedProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('lainnya');
  const [condition, setCondition] = useState('baik');
  const [price, setPrice] = useState('');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [images, setImages] = useState<File[]>([]);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
    saveAsDraft = false,
  ) {
    event.preventDefault();
    setMessage('');

    const cleanTitle = title.trim();
    const numericPrice = Number(price);

    if (!cleanTitle) {
      setMessage('Nama produk wajib diisi.');
      return;
    }

    if (!price || !Number.isFinite(numericPrice) || numericPrice < 0) {
      setMessage('Masukkan harga yang valid.');
      return;
    }

    if (images.length > 8) {
      setMessage('Maksimal 8 foto untuk setiap produk.');
      return;
    }

    const oversizedImage = images.find(
      (file) => file.size > 5 * 1024 * 1024,
    );

    if (oversizedImage) {
      setMessage('Ukuran setiap foto maksimal 5 MB.');
      return;
    }

    setLoading(true);

    const supabase = createClient();
    let productId: string | null = null;
    const uploadedPaths: string[] = [];

    try {
      const { data: product, error: insertError } = await supabase
        .from('used_products')
        .insert({
          seller_id: userId,
          title: cleanTitle,
          description: description.trim() || null,
          category,
          item_condition: condition,
          price: numericPrice,
          city: city.trim() || null,
          area: area.trim() || null,
          image_urls: [],
          status: saveAsDraft ? 'draft' : 'pending',
          sale_status: 'available',
        })
        .select('id')
        .single();

      if (insertError) {
        throw insertError;
      }

      productId = product.id;

      const imageUrls: string[] = [];

      for (const file of images) {
        const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const safeExtension = /^[a-z0-9]+$/.test(extension)
          ? extension
          : 'jpg';
        const path = `${userId}/${product.id}/${crypto.randomUUID()}.${safeExtension}`;

        const { error: uploadError } = await supabase.storage
          .from('listing-images')
          .upload(path, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type || 'application/octet-stream',
          });

        if (uploadError) {
          throw uploadError;
        }

        uploadedPaths.push(path);

        const { data: publicUrlData } = supabase.storage
          .from('listing-images')
          .getPublicUrl(path);

        imageUrls.push(publicUrlData.publicUrl);
      }

      if (imageUrls.length > 0) {
        const { error: updateError } = await supabase
          .from('used_products')
          .update({ image_urls: imageUrls })
          .eq('id', product.id)
          .eq('seller_id', userId);

        if (updateError) {
          throw updateError;
        }
      }

      setMessage(
        saveAsDraft
          ? 'Produk berhasil disimpan sebagai draf.'
          : 'Produk berhasil dikirim dan menunggu moderasi.',
      );

      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      if (uploadedPaths.length > 0) {
        try {
          await supabase.storage
            .from('listing-images')
            .remove(uploadedPaths);
        } catch {
          // Pembersihan foto gagal; lanjutkan menampilkan error utama.
        }
      }

      if (productId) {
        try {
          await supabase
            .from('used_products')
            .delete()
            .eq('id', productId)
            .eq('seller_id', userId);
        } catch {
          // Pembersihan data gagal; lanjutkan menampilkan error utama.
        }
      }

      setMessage(
        error instanceof Error
          ? error.message
          : 'Terjadi kesalahan saat menyimpan produk.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => handleSubmit(event, false)}
    >
      <div>
        <label
          htmlFor="title"
          className="mb-2 block text-sm font-medium"
        >
          Nama produk *
        </label>
        <input
          id="title"
          required
          maxLength={150}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Contoh: Buku kuliah bekas"
          className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="mb-2 block text-sm font-medium"
        >
          Deskripsi produk
        </label>
        <textarea
          id="description"
          rows={4}
          maxLength={3000}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Jelaskan kondisi dan detail produk..."
          className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="category"
            className="mb-2 block text-sm font-medium"
          >
            Kategori *
          </label>
          <select
            id="category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="w-full rounded-xl border border-gray-300 px-4 py-3"
          >
            {categories.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="condition"
            className="mb-2 block text-sm font-medium"
          >
            Kondisi barang *
          </label>
          <select
            id="condition"
            value={condition}
            onChange={(event) => setCondition(event.target.value)}
            className="w-full rounded-xl border border-gray-300 px-4 py-3"
          >
            {conditions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label
          htmlFor="price"
          className="mb-2 block text-sm font-medium"
        >
          Harga (Rp) *
        </label>
        <input
          id="price"
          type="number"
          required
          min="0"
          step="1"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          placeholder="Contoh: 50000"
          className="w-full rounded-xl border border-gray-300 px-4 py-3"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="city"
            className="mb-2 block text-sm font-medium"
          >
            Kota
          </label>
          <input
            id="city"
            maxLength={100}
            value={city}
            onChange={(event) => setCity(event.target.value)}
            placeholder="Contoh: Banda Aceh"
            className="w-full rounded-xl border border-gray-300 px-4 py-3"
          />
        </div>

        <div>
          <label
            htmlFor="area"
            className="mb-2 block text-sm font-medium"
          >
            Kecamatan atau area
          </label>
          <input
            id="area"
            maxLength={150}
            value={area}
            onChange={(event) => setArea(event.target.value)}
            placeholder="Nama kecamatan atau area"
            className="w-full rounded-xl border border-gray-300 px-4 py-3"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="images"
          className="mb-2 block text-sm font-medium"
        >
          Foto produk (maksimal 8 foto, masing-masing 5 MB)
        </label>
        <input
          id="images"
          type="file"
          accept="image/*"
          multiple
          onChange={(event) =>
            setImages(Array.from(event.target.files ?? []))
          }
          className="block w-full rounded-xl border border-gray-300 px-4 py-3"
        />
        <p className="mt-2 text-xs text-gray-500">
          Gunakan foto asli yang jelas dan sesuai kondisi barang.
        </p>
      </div>

      {message && (
        <p
          role="status"
          className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm"
        >
          {message}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Menyimpan...' : 'Kirim untuk moderasi'}
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={(event) => {
            const form = event.currentTarget.form;
            if (form) {
              void handleSubmit(
                {
                  preventDefault: () => undefined,
                } as React.FormEvent<HTMLFormElement>,
                true,
              );
            }
          }}
          className="rounded-xl border border-gray-300 px-5 py-3 font-semibold hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Simpan draf
        </button>
      </div>
    </form>
  );
}
