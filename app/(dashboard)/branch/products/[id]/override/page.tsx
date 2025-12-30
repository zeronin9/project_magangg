'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { branchProductAPI } from '@/lib/api/branch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, Upload, ImageIcon, AlertCircle, Settings, Globe, Info } from 'lucide-react';
import Image from 'next/image';
import { formatRupiah } from '@/lib/utils';

interface BranchProductSetting {
  branch_product_setting_id?: string;
  sale_price?: number;
  branch_product_name?: string | null;
  branch_description?: string | null;
  branch_image_url?: string | null;
  is_available_at_branch: boolean;
}

interface Product {
  product_id: string;
  product_name: string;
  base_price: number;
  category_id: string;
  image_url?: string;
  description?: string;
  branch_id?: string | null;
  is_active: boolean;
  category?: {
    category_name: string;
  };
  branch_setting?: BranchProductSetting | null;
}

const getImageUrl = (path: string | null | undefined) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';
  const serverUrl = apiBaseUrl.replace(/\/api\/?$/, '');
  const cleanPath = path.replace(/\\/g, '/').replace(/^\//, '');
  return `${serverUrl}/${cleanPath}`;
};

// ✅ Helper function untuk delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function OverrideProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [imageError, setImageError] = useState('');
  const [imagePreview, setImagePreview] = useState<string>('');

  const [formData, setFormData] = useState({
    sale_price: '',
    branch_product_name: '',
    branch_description: '',
    is_available_at_branch: true,
    branch_product_image: null as File | null,
  });

  useEffect(() => {
    loadData();
  }, [productId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load product dari endpoint general
      const productsRes = await branchProductAPI.getAll({ 
        page: 1, 
        limit: 1000,
        type: 'general' 
      });
      
      const foundProduct = productsRes.items.find((p: Product) => p.product_id === productId);
      
      if (!foundProduct) {
        setError('Produk tidak ditemukan');
        return;
      }

      if (foundProduct.branch_id) {
        setError('Produk lokal tidak dapat di-override. Gunakan Edit untuk mengubah produk lokal.');
        return;
      }

      setProduct(foundProduct);
      
      const setting = foundProduct.branch_setting;
      setFormData({
        sale_price: setting?.sale_price?.toString() || foundProduct.base_price.toString(),
        branch_product_name: setting?.branch_product_name || '',
        branch_description: setting?.branch_description || '',
        is_available_at_branch: setting?.is_available_at_branch ?? true,
        branch_product_image: null,
      });
      
      const imgUrl = setting?.branch_image_url || foundProduct.image_url || '';
      setImagePreview(getImageUrl(imgUrl));
      
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError('Gagal memuat data produk');
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
      setFormData({ ...formData, branch_product_image: file });
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setFormData({ ...formData, sale_price: value });
  };

  // ✅ PERBAIKAN: Tambahkan delay 3 detik
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ✅ Validasi awal
    if (!product || imageError || isSubmitting) return;

    // ✅ Set submitting state SEGERA untuk disable button
    setIsSubmitting(true);
    setError('');

    try {
      // ✅ DELAY 3 DETIK di awal untuk mencegah double click
      console.log('⏳ Menunggu 3 detik sebelum submit...');
      await delay(3000);
      
      console.log('📤 Memproses override...');
      
      const formDataToSend = new FormData();
      formDataToSend.append('sale_price', formData.sale_price.replace(/[^0-9]/g, ''));
      formDataToSend.append('is_available_at_branch', formData.is_available_at_branch.toString());
      
      if (formData.branch_product_name && formData.branch_product_name.trim() !== '') {
        formDataToSend.append('branch_product_name', formData.branch_product_name);
      }
      
      if (formData.branch_description && formData.branch_description.trim() !== '') {
        formDataToSend.append('branch_description', formData.branch_description);
      }
      
      if (formData.branch_product_image) {
        formDataToSend.append('branch_product_image', formData.branch_product_image);
      }

      await branchProductAPI.setOverride(product.product_id, formDataToSend);
      
      console.log('✅ Override berhasil disimpan!');
      
      // Redirect ke halaman produk
      router.push('/branch/products');
      
    } catch (err: any) {
      console.error('❌ Error setting override:', err);
      setError(err.response?.data?.message || 'Gagal menyimpan override produk');
    } finally {
      // ✅ Reset submitting state setelah selesai atau error
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-48 w-full max-w-md" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const hasExistingOverride = !!product?.branch_setting?.branch_product_setting_id;

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {hasExistingOverride ? 'Edit Override' : 'Override Setting'}
            </h1>
            <Badge variant="outline" className="text-xs">
              <Globe className="mr-1 h-3 w-3" />
              General Product
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Sesuaikan produk general untuk cabang ini
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

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Override Setting:</strong> Perubahan hanya berlaku untuk cabang ini. 
          Produk asli dari pusat tidak akan terpengaruh.
        </AlertDescription>
      </Alert>

      {/* Original Product Info */}
      {product && (
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-lg">Informasi Produk Asli (General)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Nama Produk</p>
                <p className="font-medium">{product.product_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Harga Asli</p>
                <p className="font-medium">{formatRupiah(product.base_price)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Kategori</p>
                <p className="font-medium">{product.category?.category_name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Status Override</p>
                <Badge variant={hasExistingOverride ? 'default' : 'secondary'}>
                  {hasExistingOverride ? 'Sudah Di-override' : 'Belum Di-override'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Override Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Override Settings untuk Cabang Ini</CardTitle>
            <CardDescription>
              Kosongkan field yang tidak ingin di-override (akan menggunakan nilai asli)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status Ketersediaan */}
            <div className="space-y-2">
              <Label htmlFor="is_available">
                Status Ketersediaan <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.is_available_at_branch.toString()}
                onValueChange={(val) => setFormData({...formData, is_available_at_branch: val === 'true'})}
                disabled={isSubmitting}
              >
                <SelectTrigger id="is_available">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">✅ Tersedia di Cabang Ini</SelectItem>
                  <SelectItem value="false">❌ Tidak Tersedia di Cabang Ini</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Kontrol apakah produk ini ditampilkan di menu kasir cabang
              </p>
            </div>

            {/* Override Price */}
            <div className="space-y-2">
              <Label htmlFor="sale_price">
                Harga untuk Cabang Ini <span className="text-destructive">*</span>
              </Label>
              <Input
                id="sale_price"
                type="text"
                value={formData.sale_price ? `Rp ${Number(formData.sale_price).toLocaleString('id-ID')}` : ''}
                onChange={handlePriceChange}
                placeholder="Contoh: Rp 25,000"
                required
                disabled={isSubmitting}
              />
              {product && Number(formData.sale_price) !== product.base_price && (
                <p className="text-xs text-muted-foreground">
                  💡 Harga asli: <span className="line-through">{formatRupiah(product.base_price)}</span>
                  {' → '}
                  <span className="font-medium text-primary">
                    {formatRupiah(Number(formData.sale_price))}
                  </span>
                </p>
              )}
            </div>

            {/* Override Name */}
            <div className="space-y-2">
              <Label htmlFor="branch_product_name">
                Nama Produk Override (Opsional)
              </Label>
              <Input
                id="branch_product_name"
                value={formData.branch_product_name}
                onChange={(e) => setFormData({ ...formData, branch_product_name: e.target.value })}
                placeholder={`Kosongkan untuk menggunakan: "${product?.product_name}"`}
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                Ganti nama produk khusus untuk cabang ini (opsional)
              </p>
            </div>

            {/* Override Image */}
            <div className="space-y-2">
              <Label>Gambar Override (Opsional)</Label>
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
                    id="branch_image"
                    disabled={isSubmitting}
                  />
                  <Label 
                    htmlFor="branch_image" 
                    className={`cursor-pointer ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center gap-2 border-2 border-dashed rounded-lg px-6 py-3 hover:bg-muted/50 transition-colors">
                      <Upload className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {imagePreview ? 'Ganti Gambar' : 'Upload Gambar Baru (Max 1MB)'}
                      </span>
                    </div>
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Upload gambar khusus untuk cabang ini, atau biarkan kosong untuk menggunakan gambar asli
                </p>
              </div>
            </div>

            {/* Override Description */}
            <div className="space-y-2">
              <Label htmlFor="branch_description">
                Deskripsi untuk Cabang Ini (Opsional)
              </Label>
              <Textarea
                id="branch_description"
                value={formData.branch_description}
                onChange={(e) => setFormData({ ...formData, branch_description: e.target.value })}
                placeholder="Tambahkan deskripsi khusus untuk cabang ini..."
                rows={4}
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                Deskripsi khusus cabang (opsional)
              </p>
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
          <Button 
            type="submit" 
            disabled={isSubmitting || !!imageError}
            className="min-w-[180px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Settings className="mr-2 h-4 w-4" />
                {hasExistingOverride ? 'Update Override' : 'Simpan Override'}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
