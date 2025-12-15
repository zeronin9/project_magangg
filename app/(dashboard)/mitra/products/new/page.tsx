'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { categoryAPI, productAPI } from '@/lib/api/mitra';
import { Category } from '@/types/mitra';
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
  ImageIcon
} from 'lucide-react';
import Image from 'next/image';

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [imageError, setImageError] = useState('');
  const [imagePreview, setImagePreview] = useState<string>('');
  
  const [formData, setFormData] = useState({
    product_name: '',
    base_price: '',
    category_id: '',
    image_url: null as File | null,
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      const categoriesData = await categoryAPI.getAll();
      const categoriesList = Array.isArray(categoriesData) ? categoriesData : [];
      setCategories(categoriesList);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat kategori');
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
        setImagePreview('');
        return;
      }

      if (file.size > 1024 * 1024) {
        setImageError('Ukuran gambar terlalu besar! Maksimal 1MB.');
        e.target.value = '';
        setFormData({ ...formData, image_url: null });
        setImagePreview('');
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

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setFormData({ ...formData, base_price: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (imageError) return;

    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('product_name', formData.product_name);
      formDataToSend.append('base_price', formData.base_price);
      formDataToSend.append('category_id', formData.category_id);
      
      if (formData.image_url) {
        console.log('Uploading file:', {
          name: formData.image_url.name,
          type: formData.image_url.type,
          size: formData.image_url.size
        });
        
        formDataToSend.append('product_image', formData.image_url);
      }

      await productAPI.create(formDataToSend);
      router.push('/mitra/products');
    } catch (err: any) {
      console.error('Error response:', err.response?.data);
      const errorMessage = err.response?.data?.message || err.message || 'Gagal menyimpan produk';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/mitra/products');
  };

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8 @container">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          className="w-fit -ml-4"
          onClick={handleCancel}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Daftar Produk
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tambah Produk Baru</h1>
          <p className="text-muted-foreground">
            Produk akan dibuat sebagai General (berlaku untuk semua cabang)
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
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Gambar Produk</Label>
              
              {imageError && (
                <Alert variant="destructive" className="mb-2 py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs font-medium">{imageError}</AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col gap-4">
                {imagePreview ? (
                  <div className="relative aspect-video w-100 rounded-lg overflow-hidden border">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      fill
                      className="object-cover"
                      unoptimized={true}
                    />
                  </div>
                ) : (
                  <div className="aspect-video w-100 rounded-lg overflow-hidden border bg-muted flex items-center justify-center">
                    <ImageIcon className="h-16 w-16 text-muted-foreground/50" />
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image_url"
                  />
                  <Label
                    htmlFor="image_url"
                    className="flex-1 cursor-pointer"
                  >
                    <div className={`flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-4 transition-colors ${imageError ? 'border-destructive bg-destructive/5' : 'hover:bg-muted/50'}`}>
                      <Upload className={`h-5 w-5 ${imageError ? 'text-destructive' : 'text-muted-foreground'}`} />
                      <span className={`text-sm ${imageError ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                        {imagePreview ? 'Ganti Gambar' : 'Upload Gambar (Max 1MB)'}
                      </span>
                    </div>
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Format: JPEG, JPG, PNG, atau GIF. Maksimal 1MB.
                </p>
              </div>
            </div>

            {/* Product Name */}
            <div className="space-y-2">
              <Label htmlFor="product_name">
                Nama Produk <span className="text-destructive">*</span>
              </Label>
              <Input
                id="product_name"
                value={formData.product_name}
                onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                placeholder="Masukkan nama produk"
                required
              />
            </div>

            {/* Base Price */}
            <div className="space-y-2">
              <Label htmlFor="base_price">
                Harga <span className="text-destructive">*</span>
              </Label>
              <Input
                id="base_price"
                type="text"
                value={formData.base_price ? `Rp. ${Number(formData.base_price).toLocaleString('id-ID')}` : ''}
                onChange={handlePriceChange}
                placeholder="Masukkan harga"
                required
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category_id">
                Kategori <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Kategori" />
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
                    <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                      Tidak ada kategori general tersedia
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancel} 
                disabled={isSubmitting}
                className="flex-1"
              >
                Batal
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !!imageError}
                className="flex-1"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan Produk
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
}
