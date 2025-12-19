'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { categoryAPI, productAPI } from '@/lib/api/mitra';
import { Category, Product } from '@/types/mitra';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ArrowLeft,
  AlertCircle,
  Loader2,
  Upload,
  ImageIcon,
  Package,
  X
} from 'lucide-react';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';

// --- HELPER: URL Gambar ---
const getImageUrl = (path: string | null | undefined) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';
  const serverUrl = apiBaseUrl.replace(/\/api\/?$/, '');
  const cleanPath = path.replace(/\\/g, '/').replace(/^\//, '');
  return `${serverUrl}/${cleanPath}`;
};

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  // --- STATE ---
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [imageError, setImageError] = useState('');
  
  const [imagePreview, setImagePreview] = useState<string>('');
  const [existingImage, setExistingImage] = useState<string>('');
  
  const [formData, setFormData] = useState({
    product_name: '',
    base_price: '',
    category_id: '',
    image_url: null as File | null,
  });

  // --- LOAD DATA ---
  useEffect(() => {
    if (productId) {
      loadData();
    }
  }, [productId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError('');
      console.log("DEBUG: Memulai fetch data untuk ID:", productId);

      // 1. Fetch Parallel
      const [categoriesRes, productRes] = await Promise.all([
        categoryAPI.getAll({ type: 'general', limit: 100 }),
        productAPI.getById(productId)
      ]) as [any, any];

      // 2. Debugging Data Response
      console.log("DEBUG: Categories Response:", categoriesRes);
      console.log("DEBUG: Product Response:", productRes);

      // 3. Set Kategori (Handle struktur Paginated atau Array biasa)
      const categoriesList = categoriesRes.data || (Array.isArray(categoriesRes) ? categoriesRes : []);
      setCategories(categoriesList);

      // 4. Validasi & Set Produk
      // Backend mungkin mengembalikan object langsung atau { data: object }
      const productData = productRes.data || productRes;
      
      if (!productData || !productData.product_id) {
        throw new Error('Data produk tidak valid atau tidak ditemukan.');
      }

      setProduct(productData);

      // 5. Konversi Data ke Form (Safety Checks)
      const safeName = productData.product_name || '';
      const safePrice = productData.base_price ? productData.base_price.toString() : '';
      const safeCategory = productData.category_id || '';

      console.log("DEBUG: Setting Form Data:", { safeName, safePrice, safeCategory });

      setFormData({
        product_name: safeName,
        base_price: safePrice,
        category_id: safeCategory,
        image_url: null,
      });

      // 6. Set Preview Gambar
      if (productData.image_url) {
        const fullImageUrl = getImageUrl(productData.image_url);
        console.log("DEBUG: Image URL:", fullImageUrl);
        setExistingImage(fullImageUrl);
        setImagePreview(fullImageUrl);
      }

    } catch (err: any) {
      console.error("ERROR loadData:", err);
      // Detil error untuk user
      let msg = err.message || 'Gagal memuat data produk';
      if (err.response?.status === 404) msg = 'Produk tidak ditemukan di database.';
      if (err.response?.status === 500) msg = 'Terjadi kesalahan server.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // --- HANDLERS ---
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      
      if (!allowedTypes.includes(file.type)) {
        setImageError('Format file tidak valid!');
        e.target.value = '';
        setFormData({ ...formData, image_url: null });
        setImagePreview(existingImage);
        return;
      }

      if (file.size > 1024 * 1024) { 
        setImageError('Ukuran gambar maksimal 1MB.');
        e.target.value = '';
        setFormData({ ...formData, image_url: null });
        setImagePreview(existingImage);
        return;
      }

      setImageError('');
      setFormData({ ...formData, image_url: file });
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setFormData({ ...formData, image_url: null });
    setImagePreview(existingImage);
    setImageError('');
    const fileInput = document.getElementById('image_url') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setFormData({ ...formData, base_price: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (imageError) return;

    setIsSubmitting(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('product_name', formData.product_name);
      formDataToSend.append('base_price', formData.base_price);
      formDataToSend.append('category_id', formData.category_id);
      
      if (formData.image_url) {
        formDataToSend.append('product_image', formData.image_url);
      }

      await productAPI.update(productId, formDataToSend);
      router.push('/mitra/products');
      router.refresh(); 

    } catch (err: any) {
      console.error('Submit Error:', err.response?.data);
      setError(err.response?.data?.message || err.message || 'Gagal update produk');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/mitra/products');
  };

  // --- RENDER ---
  if (isLoading) {
    return (
      <div className="flex-1 space-y-6 p-4 pt-6 md:p-6 lg:p-8">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Card className="max-w-2xl p-6">
          <div className="space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </Card>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8">
        <Button variant="ghost" onClick={handleCancel}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <br />
            <span className="text-xs opacity-70">Cek console browser (F12) untuk detail debug.</span>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-4 pt-6 md:p-6 lg:p-8 @container">
      <div className="flex flex-col gap-4">
        <Button variant="ghost" className="w-fit -ml-4" onClick={handleCancel} disabled={isSubmitting}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Daftar Produk
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Package className="h-8 w-8" /> Edit Produk
          </h1>
          <p className="text-muted-foreground mt-1">Perbarui informasi produk</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="">
        <form onSubmit={handleSubmit} className="p-6 md:p-8" id="edit-product-form">
          <div className="space-y-6">
            
            {/* GAMBAR */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Gambar Produk</Label>
              {imageError && (
                <Alert variant="destructive" className="py-2">
                  <AlertDescription className="text-sm">{imageError}</AlertDescription>
                </Alert>
              )}
              <div className="flex flex-col gap-4">
                {imagePreview ? (
                  <div className="relative aspect-video w-full max-w-md rounded-lg overflow-hidden border-2 border-muted group">
                    <Image src={imagePreview} alt="Preview" fill className="object-cover" unoptimized={true} />
                    {formData.image_url && (
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button className='bg-black hover:bg-gray-800' type="button" variant="destructive" size="sm" onClick={handleRemoveImage}>
                          <X className="mr-2 h-4 w-4" /> Batalkan Gambar Baru
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-video w-full max-w-md rounded-lg border-2 border-dashed border-muted bg-muted/30 flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <ImageIcon className="h-12 w-12 text-muted-foreground/50 mx-auto" />
                      <p className="text-sm text-muted-foreground">Tidak ada gambar</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-2 max-w-md">
                  <Input type="file" accept="image/*" onChange={handleImageChange} className="hidden" id="image_url" disabled={isSubmitting} />
                  <Label htmlFor="image_url" className={`flex-1 ${isSubmitting ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                    <div className={`flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-4 transition-colors ${imageError ? 'border-destructive bg-destructive/5' : 'hover:bg-muted/50'}`}>
                      <Upload className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">
                        {formData.image_url ? 'Ganti Gambar Lagi' : 'Upload Gambar Baru'}
                      </span>
                    </div>
                  </Label>
                </div>
              </div>
            </div>

            <div className="border-t pt-2" />

            {/* NAMA PRODUK */}
            <div className="space-y-2">
              <Label htmlFor="product_name">Nama Produk <span className="text-destructive">*</span></Label>
              <Input
                id="product_name"
                value={formData.product_name} // Pastikan ini terikat state
                onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                required
                disabled={isSubmitting}
                placeholder="Nama Produk"
              />
            </div>

            {/* HARGA */}
            <div className="space-y-2">
              <Label htmlFor="base_price">Harga <span className="text-destructive">*</span></Label>
              <Input
                id="base_price"
                value={formData.base_price ? `Rp. ${Number(formData.base_price).toLocaleString('id-ID')}` : ''}
                onChange={handlePriceChange}
                required
                disabled={isSubmitting}
                placeholder="0"
              />
            </div>

            {/* KATEGORI */}
            <div className="space-y-2">
              <Label htmlFor="category_id">Kategori <span className="text-destructive">*</span></Label>
              <Select
                value={formData.category_id} // Pastikan ID ini ada di list categories
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                required
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder={categories.length > 0 ? "Pilih kategori" : "Memuat kategori..."} />
                </SelectTrigger>
                <SelectContent>
                  {categories.length > 0 ? (
                    categories.map((category) => (
                      <SelectItem key={category.category_id} value={category.category_id}>
                        {category.category_name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                      Tidak ada kategori general.
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

          </div>
        </form>
      </Card>

      <div className="flex justify-end gap-4 sticky bottom-0 bg-background py-4 border-t z-10">
        <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
          Batal
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting || !!imageError || !formData.product_name}
          form="edit-product-form"
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Simpan Perubahan
        </Button>
      </div>
    </div>
  );
}