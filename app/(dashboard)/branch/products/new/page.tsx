'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { branchProductAPI, branchCategoryAPI } from '@/lib/api/branch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Loader2, Upload, ImageIcon, AlertCircle, Package } from 'lucide-react';
import Image from 'next/image';

interface Category {
  category_id: string;
  category_name: string;
  branch_id?: string | null;
}

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
    description: '',
    image_url: null as File | null,
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      const res = await branchCategoryAPI.getAll({ limit: 100 });
      setCategories(res.items || []);
    } catch (err) {
      console.error('Error loading categories:', err);
      setError('Gagal memuat kategori');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        setImageError('Ukuran gambar terlalu besar! Maksimal 1MB.');
        return;
      }
      setImageError('');
      setFormData({ ...formData, image_url: file });
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setFormData({ ...formData, base_price: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (imageError || isSubmitting) return;

    setIsSubmitting(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('product_name', formData.product_name);
      formDataToSend.append('base_price', formData.base_price.replace(/[^0-9]/g, ''));
      formDataToSend.append('category_id', formData.category_id);
      
      if (formData.description) {
        formDataToSend.append('description', formData.description);
      }
      
      if (formData.image_url) {
        formDataToSend.append('product_image', formData.image_url);
      }

      await branchProductAPI.create(formDataToSend);
      router.push('/branch/products');
    } catch (err: any) {
      console.error('Error creating product:', err);
      setError(err.response?.data?.message || 'Gagal menyimpan produk');
    } finally {
      setIsSubmitting(false);
    }
  };

  const localCategories = categories.filter(cat => cat.branch_id);

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tambah Produk Lokal</h1>
          <p className="text-muted-foreground">Buat produk baru khusus untuk cabang ini</p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Info Alert */}
      <Alert>
        <Package className="h-4 w-4" />
        <AlertDescription>
          <strong>Produk Lokal:</strong> Produk yang Anda buat hanya akan tersedia di cabang ini dan tidak akan muncul di cabang lain.
        </AlertDescription>
      </Alert>

      {/* Form Card */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Informasi Produk</CardTitle>
            <CardDescription>Lengkapi data produk lokal cabang Anda</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Gambar Produk</Label>
              {imageError && (
                <Alert variant="destructive" className="mb-2 py-2">
                  <AlertDescription className="text-xs font-medium">{imageError}</AlertDescription>
                </Alert>
              )}
              <div className="flex flex-col gap-4">
                {imagePreview ? (
                  <div className="relative aspect-video w-full max-w-md rounded-lg overflow-hidden border">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      fill
                      className="object-cover"
                      unoptimized={true}
                    />
                  </div>
                ) : (
                  <div className="relative aspect-video w-full max-w-md rounded-lg overflow-hidden border bg-muted flex items-center justify-center">
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
                  <Label htmlFor="image_url" className="cursor-pointer">
                    <div className="flex items-center gap-2 border-2 border-dashed rounded-lg px-6 py-3 hover:bg-muted/50 transition-colors">
                      <Upload className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {imagePreview ? 'Ganti Gambar' : 'Upload Gambar (Max 1MB)'}
                      </span>
                    </div>
                  </Label>
                </div>
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
                placeholder="Contoh: Nasi Goreng Special"
                required
              />
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="base_price">
                Harga <span className="text-destructive">*</span>
              </Label>
              <Input
                id="base_price"
                type="text"
                value={formData.base_price ? `Rp ${Number(formData.base_price).toLocaleString('id-ID')}` : ''}
                onChange={handlePriceChange}
                placeholder="Contoh: Rp 25,000"
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
                  {localCategories.length > 0 ? (
                    localCategories.map((category) => (
                      <SelectItem key={category.category_id} value={category.category_id}>
                        {category.category_name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-8 text-center">
                      <p className="text-sm text-muted-foreground mb-2">Belum ada kategori lokal</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => router.push('/branch/categories')}
                      >
                        Buat Kategori
                      </Button>
                    </div>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Hanya kategori lokal cabang yang dapat dipilih
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi (Opsional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Tambahkan deskripsi produk..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Batal
          </Button>
          <Button type="submit" disabled={isSubmitting || !!imageError || localCategories.length === 0}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan Produk
          </Button>
        </div>
      </form>
    </div>
  );
}
