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
  Globe,
  ImageIcon,
  Package,
  X
} from 'lucide-react';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';

// Helper URL Gambar
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

  useEffect(() => {
    loadData();
  }, [productId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [productData, categoriesData] = await Promise.all([
        productAPI.getAll(false),
        categoryAPI.getAll(),
      ]);

      const categoriesList = Array.isArray(categoriesData) ? categoriesData : [];
      setCategories(categoriesList);

      // Find product by ID
      const productsList = Array.isArray(productData) ? productData : [];
      const foundProduct = productsList.find((p: any) => p.product_id === productId);

      if (!foundProduct) {
        setError('Produk tidak ditemukan');
        return;
      }

      setProduct(foundProduct);
      setFormData({
        product_name: foundProduct.product_name,
        base_price: foundProduct.base_price.toString(),
        category_id: foundProduct.category_id,
        image_url: null,
      });

      const imageUrl = getImageUrl(foundProduct.image_url);
      setExistingImage(imageUrl);
      setImagePreview(imageUrl);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data produk');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      
      if (!allowedTypes.includes(file.type)) {
        setImageError('Format file tidak valid! Gunakan JPEG, JPG, PNG, atau GIF.');
        e.target.value = '';
        setFormData({ ...formData, image_url: null });
        setImagePreview(existingImage);
        return;
      }

      if (file.size > 1024 * 1024) {
        setImageError('Ukuran gambar terlalu besar! Maksimal 1MB.');
        e.target.value = '';
        setFormData({ ...formData, image_url: null });
        setImagePreview(existingImage);
        return;
      }

      console.log('File selected:', {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: new Date(file.lastModified)
      });

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
    
    // Reset file input
    const fileInput = document.getElementById('image_url') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
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
        console.log('Uploading new file:', {
          name: formData.image_url.name,
          type: formData.image_url.type,
          size: formData.image_url.size
        });
        
        formDataToSend.append('product_image', formData.image_url);
      }

      await productAPI.update(productId, formDataToSend);
      router.push('/mitra/products');
    } catch (err: any) {
      console.error('Error response:', err.response?.data);
      const errorMessage = err.response?.data?.message || err.message || 'Gagal memperbarui produk';
      setError(errorMessage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Batalkan perubahan? Data yang diubah akan hilang.')) {
      router.push('/mitra/products');
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 space-y-6 p-4 pt-6 md:p-6 lg:p-8 @container">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-10 w-48" />
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <Skeleton className="h-12 w-full max-w-2xl" />
        <Card className="max-w-2xl p-6 md:p-8">
          <div className="space-y-6">
            <div className="space-y-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="aspect-video w-full" />
            </div>
            <Skeleton className="h-px w-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-px w-full" />
            <div className="flex gap-3">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 flex-1" />
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8">
        <Button
          variant="ghost"
          className="w-fit -ml-4"
          onClick={() => router.push('/mitra/products')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Daftar Produk
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-4 pt-6 md:p-6 lg:p-8 @container">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          className="w-fit -ml-4"
          onClick={handleCancel}
          disabled={isSubmitting}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Daftar Produk
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Package className="h-8 w-8" />
            Edit Produk
          </h1>
          <p className="text-muted-foreground mt-1">
            Perbarui informasi produk <strong>{product?.product_name}</strong>
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Form Card */}
      <Card className="">
        <form onSubmit={handleSubmit} className="p-6 md:p-8" id="edit-product-form">
          <div className="space-y-6">
            {/* Image Upload */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Gambar Produk</Label>
              
              {imageError && (
                <Alert variant="destructive" className="py-3">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm font-medium">{imageError}</AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col gap-4">
                {imagePreview ? (
                  <div className="relative aspect-video w-100 rounded-lg overflow-hidden border-2 border-muted group">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      fill
                      className="object-cover"
                      unoptimized={true}
                    />
                    {formData.image_url && (
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={handleRemoveImage}
                          disabled={isSubmitting}
                        >
                          <X className="mr-2 h-4 w-4" />
                          Batalkan Gambar Baru
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-video w-full rounded-lg overflow-hidden border-2 border-dashed border-muted bg-muted/30 flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <ImageIcon className="h-12 w-12 text-muted-foreground/50 mx-auto" />
                      <p className="text-sm text-muted-foreground">Tidak ada gambar</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image_url"
                    disabled={isSubmitting}
                  />
                  <Label
                    htmlFor="image_url"
                    className={`flex-1 ${isSubmitting ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                  >
                    <div className={`flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-4 transition-colors ${
                      imageError 
                        ? 'border-destructive bg-destructive/5' 
                        : 'hover:bg-muted/50 hover:border-primary'
                    }`}>
                      <Upload className={`h-5 w-5 ${imageError ? 'text-destructive' : 'text-muted-foreground'}`} />
                      <span className={`text-sm font-medium ${imageError ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {formData.image_url ? 'Ganti Gambar Lagi' : 'Upload Gambar Baru'}
                      </span>
                    </div>
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Format: JPEG, JPG, PNG, atau GIF. Maksimal ukuran 1MB. 
                  {!formData.image_url && ' Kosongkan jika tidak ingin mengubah gambar.'}
                </p>
              </div>
            </div>

            <div className="border-t pt-6" />

            {/* Product Name */}
            <div className="space-y-2">
              <Label htmlFor="product_name" className="text-base font-semibold">
                Nama Produk <span className="text-destructive">*</span>
              </Label>
              <Input
                id="product_name"
                value={formData.product_name}
                onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                placeholder="Contoh: Nasi Goreng Spesial"
                required
                disabled={isSubmitting}
                className="text-base"
              />
            </div>

            {/* Base Price */}
            <div className="space-y-2">
              <Label htmlFor="base_price" className="text-base font-semibold">
                Harga <span className="text-destructive">*</span>
              </Label>
              <Input
                id="base_price"
                type="text"
                value={formData.base_price ? `Rp. ${Number(formData.base_price).toLocaleString('id-ID')}` : ''}
                onChange={handlePriceChange}
                placeholder="Masukkan harga produk"
                required
                disabled={isSubmitting}
                className="text-base"
              />
              <p className="text-xs text-muted-foreground">
                Masukkan hanya angka, format Rupiah akan otomatis ditambahkan
              </p>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category_id" className="text-base font-semibold">
                Kategori <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                required
                disabled={isSubmitting}
              >
                <SelectTrigger className="text-base">
                  <SelectValue placeholder="Pilih kategori produk" />
                </SelectTrigger>
                <SelectContent>
                  {categories.filter((category) => !category.branch_id).length > 0 ? (
                    categories
                      .filter((category) => !category.branch_id)
                      .map((category) => (
                        <SelectItem key={category.category_id} value={category.category_id}>
                          {category.category_name}
                        </SelectItem>
                      ))
                  ) : (
                    <div className="px-2 py-8 text-center text-sm text-muted-foreground">
                      <Package className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                      <p>Tidak ada kategori general tersedia</p>
                      <p className="text-xs mt-1">Silakan buat kategori terlebih dahulu</p>
                    </div>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Hanya kategori general yang dapat dipilih untuk produk general
              </p>
            </div>
          </div>
        </form>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4 sticky bottom-0 bg-background py-4 border-t">
        <Button 
          type="button" 
          variant="outline" 
          onClick={handleCancel} 
          disabled={isSubmitting}
        >
          Batal
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting || !!imageError || !formData.product_name || !formData.base_price || !formData.category_id}
          form="edit-product-form"
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
        </Button>
      </div>
    </div>
  );
}
