'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { branchProductAPI, cashierMenuAPI } from '@/lib/api/branch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  AlertCircle, 
  Package, 
  Building2, 
  Globe, 
  CheckCircle2, 
  Settings,
  Pencil,
  ImageIcon,
  Tag,
  DollarSign,
  Archive,
  Info
} from 'lucide-react';
import Image from 'next/image';
import { formatRupiah } from '@/lib/utils';

// --- Interfaces ---

interface MenuProduct {
  product_id: string;
  name: string;
  price: string | number;
  image_url: string | null;
  category: string;
  description?: string;
  is_available: boolean;
  branch_setting?: any;
  product_name?: string;
  base_price?: number;
  branch_id?: string;
  is_active?: boolean;
}

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
  branch?: {
    branch_name: string;
  };
  branch_setting?: BranchProductSetting | null;
  name?: string;
  price?: string | number;
  is_available?: boolean;
}

const getImageUrl = (path: string | null | undefined) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';
  const serverUrl = apiBaseUrl.replace(/\/api\/?$/, '');
  const cleanPath = path.replace(/\\/g, '/').replace(/^\//, '');
  return `${serverUrl}/${cleanPath}`;
};

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | MenuProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Helper Functions
  const isMenuProduct = (p: Product | MenuProduct | null): p is MenuProduct => {
    return !!p && 'name' in p && 'price' in p;
  };

  const getDisplayName = (): string => {
    if (!product) return '';
    if (isMenuProduct(product)) return product.name;
    return product.branch_setting?.branch_product_name || product.product_name || '';
  };

  const getDisplayPrice = (): number => {
    if (!product) return 0;
    if (isMenuProduct(product)) return Number(product.price);
    return product.branch_setting?.sale_price || product.base_price || 0;
  };

  const getDisplayImage = (): string => {
    if (!product) return '';
    if (isMenuProduct(product)) return getImageUrl(product.image_url);
    return getImageUrl(product.branch_setting?.branch_image_url || product.image_url);
  };

  const getDisplayCategory = (): string => {
    if (!product) return '-';
    if (isMenuProduct(product)) return product.category;
    return product.category?.category_name || '-';
  };

  const getDisplayDescription = (): string => {
    if (!product) return '';
    if (isMenuProduct(product)) return product.description || '';
    return product.branch_setting?.branch_description || product.description || '';
  };

  const isOverridden = (): boolean => {
    if (!product || isMenuProduct(product)) return false;
    return !!product.branch_setting?.branch_product_setting_id;
  };

  const getBasePrice = (): number => {
    if (!product || isMenuProduct(product)) return 0;
    return product.base_price || 0;
  };

  const isLocalProduct = (): boolean => {
    if (!product || isMenuProduct(product)) return false;
    return !!product.branch_id;
  };

  useEffect(() => {
    loadData();
  }, [productId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      console.log('🔍 Loading product with ID:', productId);
      
      let allProducts: (Product | MenuProduct)[] = [];

      // Load dari Menu Kasir dulu
      try {
        const menuRes = await cashierMenuAPI.getMenu(); 
        const menuData = menuRes.data.data || menuRes.data;
        allProducts = Array.isArray(menuData) ? menuData : [];
        console.log('✅ Loaded from menu kasir:', allProducts.length, 'products');
      } catch (menuErr) {
        console.log('⚠️ Menu kasir failed, trying products API...');
      }

      // Jika tidak ketemu, load dari Products API
      if (allProducts.length === 0) {
        try {
          const productsRes = await branchProductAPI.getAll({
            page: 1,
            limit: 1000,
            search: '',
            status: 'active'
          });
          allProducts = productsRes.items || [];
          console.log('✅ Loaded from products API:', allProducts.length, 'products');
        } catch (productsErr) {
          console.error('❌ Products API failed:', productsErr);
        }
      }

      // Cari produk berdasarkan ID
      const foundProduct = allProducts.find((p) => p.product_id === productId);
      
      if (!foundProduct) {
        console.error('❌ Product not found with ID:', productId);
        setError('Produk tidak ditemukan');
        return;
      }

      console.log('✅ Product found:', foundProduct);
      setProduct(foundProduct);
      
    } catch (err: any) {
      console.error('❌ Error loading data:', err);
      setError(err.response?.data?.message || err.message || 'Gagal memuat data produk');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    if (!product) return;
    
    if (isLocalProduct()) {
      // Untuk produk lokal, kembali ke halaman list dengan modal edit
      router.push(`/branch/products?edit=${product.product_id}`);
    } else {
      // Untuk produk general, ke halaman override
      router.push(`/branch/products/${product.product_id}/override`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-10 w-10" />
          <div className="flex-1">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Produk tidak ditemukan'}</AlertDescription>
        </Alert>
        <div className="flex justify-center mt-4">
          <Button onClick={() => router.push('/branch/products')}>
            Kembali ke Daftar Produk
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-4 pt-6 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-3xl font-bold tracking-tight">Detail Produk</h1>
            {isMenuProduct(product) && (
              <Badge variant="default" className="bg-black text-white">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Menu Kasir
              </Badge>
            )}
            {!isMenuProduct(product) && isLocalProduct() && (
              <Badge variant="secondary">
                <Building2 className="mr-1 h-3 w-3" />
                Produk Lokal
              </Badge>
            )}
            {!isMenuProduct(product) && !isLocalProduct() && (
              <Badge variant="outline">
                <Globe className="mr-1 h-3 w-3" />
                Produk General
              </Badge>
            )}
            {isOverridden() && (
              <Badge variant="default" className="bg-black text-white">
                <Settings className="mr-1 h-3 w-3" />
                Override
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1">
            Informasi lengkap tentang produk
          </p>
        </div>
        <Button onClick={handleEdit}>
          {isLocalProduct() ? (
            <>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </>
          ) : (
            <>
              <Settings className="mr-2 h-4 w-4" />
              {isOverridden() ? 'Edit Override' : 'Override Setting'}
            </>
          )}
        </Button>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Image */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Gambar Produk
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-video w-full rounded-lg overflow-hidden border bg-muted">
                {getDisplayImage() ? (
                  <Image
                    src={getDisplayImage()}
                    alt={getDisplayName()}
                    fill
                    className="object-cover"
                    unoptimized={true}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <ImageIcon className="h-20 w-20 text-muted-foreground/50" />
                  </div>
                )}
              </div>
              
              {!isMenuProduct(product) && isOverridden() && product.branch_setting?.branch_image_url && (
                <Alert className="mt-4">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Menggunakan gambar override khusus cabang
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Description */}
          {getDisplayDescription() && (
            <Card>
              <CardHeader>
                <CardTitle>Deskripsi</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {getDisplayDescription()}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Override Information */}
          {!isMenuProduct(product) && isOverridden() && product.branch_setting && (
            <Card className="border-primary/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Informasi Override
                </CardTitle>
                <CardDescription>
                  Setting khusus untuk cabang ini
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {product.branch_setting.branch_product_name && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Nama Override</p>
                      <p className="font-medium">{product.branch_setting.branch_product_name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Asli: {product.product_name}
                      </p>
                    </div>
                  )}

                  {product.branch_setting.sale_price && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Harga Override</p>
                      <p className="font-bold text-lg text-primary">
                        {formatRupiah(product.branch_setting.sale_price)}
                      </p>
                      {product.branch_setting.sale_price !== product.base_price && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Asli: <span className="line-through">{formatRupiah(product.base_price)}</span>
                        </p>
                      )}
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Status di Cabang</p>
                    <Badge variant={product.branch_setting.is_available_at_branch ? 'default' : 'secondary'}>
                      {product.branch_setting.is_available_at_branch ? '✅ Tersedia' : '❌ Tidak Tersedia'}
                    </Badge>
                  </div>

                  {product.branch_setting.branch_image_url && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Gambar Khusus</p>
                      <Badge variant="outline">
                        <ImageIcon className="mr-1 h-3 w-3" />
                        Menggunakan gambar cabang
                      </Badge>
                    </div>
                  )}
                </div>

                {product.branch_setting.branch_description && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Deskripsi Override</p>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">
                        {product.branch_setting.branch_description}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Info Cards */}
        <div className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Informasi Dasar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Nama Produk</p>
                <p className="font-semibold text-lg">{getDisplayName()}</p>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground mb-1">Kategori</p>
                <Badge variant="outline" className="text-sm">
                  <Tag className="mr-1 h-3 w-3" />
                  {getDisplayCategory()}
                </Badge>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground mb-1">Harga</p>
                <div className="flex items-baseline gap-2">
                  <p className="font-bold text-2xl text-primary">
                    {formatRupiah(getDisplayPrice())}
                  </p>
                  {!isMenuProduct(product) && isOverridden() && getDisplayPrice() !== getBasePrice() && (
                    <p className="text-sm text-muted-foreground line-through">
                      {formatRupiah(getBasePrice())}
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground mb-2">Status</p>
                <div className="flex flex-col gap-2">
                  {isMenuProduct(product) ? (
                    <Badge variant={product.is_available ? 'default' : 'secondary'}>
                      {product.is_available ? '✅ Tersedia' : '❌ Tidak Tersedia'}
                    </Badge>
                  ) : (
                    <>
                      <Badge variant={product.is_active ? 'default' : 'secondary'}>
                        {product.is_active ? '✅ Aktif' : '❌ Diarsipkan'}
                      </Badge>
                      {product.branch_setting && (
                        <Badge variant={product.branch_setting.is_available_at_branch ? 'default' : 'secondary'}>
                          {product.branch_setting.is_available_at_branch 
                            ? '✅ Tersedia di Cabang' 
                            : '❌ Tidak Tersedia di Cabang'}
                        </Badge>
                      )}
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product Type */}
          <Card>
            <CardHeader>
              <CardTitle>Scope Produk</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">Tipe</span>
                <Badge variant={isLocalProduct() ? 'secondary' : 'default'}>
                  {isMenuProduct(product) ? (
                    <>
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Menu Kasir
                    </>
                  ) : isLocalProduct() ? (
                    <>
                      <Building2 className="mr-1 h-3 w-3" />
                      Produk Lokal
                    </>
                  ) : (
                    <>
                      <Globe className="mr-1 h-3 w-3" />
                      Produk General
                    </>
                  )}
                </Badge>
              </div>

              {!isMenuProduct(product) && isOverridden() && (
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium">Override Status</span>
                  <Badge variant="default" className="bg-black text-white">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Sudah Di-override
                  </Badge>
                </div>
              )}

              <div className="pt-3 border-t space-y-2">
                <p className="text-xs text-muted-foreground">
                  {isMenuProduct(product) ? (
                    'Produk ini tampil di menu kasir'
                  ) : isLocalProduct() ? (
                    'Produk khusus cabang ini, tidak berlaku untuk cabang lain'
                  ) : isOverridden() ? (
                    'Produk general dengan setting khusus untuk cabang ini'
                  ) : (
                    'Produk general dari pusat, dapat di-override untuk cabang ini'
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Technical Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Informasi Teknis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Product ID</p>
                <code className="text-xs bg-muted px-2 py-1 rounded block break-all">
                  {product.product_id}
                </code>
              </div>

              {!isMenuProduct(product) && product.category_id && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Category ID</p>
                  <code className="text-xs bg-muted px-2 py-1 rounded block break-all">
                    {product.category_id}
                  </code>
                </div>
              )}

              {!isMenuProduct(product) && product.branch_setting?.branch_product_setting_id && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Override Setting ID</p>
                  <code className="text-xs bg-muted px-2 py-1 rounded block break-all">
                    {product.branch_setting.branch_product_setting_id}
                  </code>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
