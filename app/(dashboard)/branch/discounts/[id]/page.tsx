'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { branchDiscountAPI, branchCategoryAPI, branchProductAPI } from '@/lib/api/branch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  AlertCircle,
  Loader2,
  Tag,
  Ticket,
  Calendar,
  Percent,
  Globe,
  Building2,
  Archive,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { formatRupiah } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Helper: Parse product_ids/category_ids
const parseArrayField = (field: any, relatedField?: any[]): string[] => {
  if (relatedField && Array.isArray(relatedField) && relatedField.length > 0) {
    const ids = relatedField.map(item => item.product_id || item.category_id).filter(Boolean);
    return ids;
  }
  
  if (Array.isArray(field)) {
    return field;
  }
  
  if (typeof field === 'string') {
    try {
      const parsed = JSON.parse(field);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }
  
  return [];
};

export default function BranchDiscountDetailPage() {
  const router = useRouter();
  const params = useParams();
  const discountId = params.id as string;

  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [discount, setDiscount] = useState<any | null>(null);

  // Modal states
  const [isSoftDeleteOpen, setIsSoftDeleteOpen] = useState(false);
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  const [isHardDeleteModalOpen, setIsHardDeleteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (discountId) {
      loadData();
    }
  }, [discountId]);

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load Detail Diskon, Kategori, dan Produk (Limit besar untuk mapping nama)
      const [discountRes, categoriesData, productsData] = await Promise.all([
        branchDiscountAPI.getById(discountId).catch(() => null),
        branchCategoryAPI.getAll({ limit: 100 }).catch(() => ({ items: [] })),
        branchProductAPI.getAll({ limit: 100 }).catch(() => ({ items: [] })),
      ]);
      
      const cats = categoriesData?.items || [];
      const prods = productsData?.items || [];

      setCategories(cats);
      setProducts(prods);

      // Handle response structure
      const foundDiscount = discountRes?.data?.data || discountRes?.data || discountRes;

      if (!foundDiscount || !foundDiscount.discount_rule_id) {
        setError('Promo tidak ditemukan');
        return;
      }

      // Process relations
      const processed = {
        ...foundDiscount,
        product_ids: parseArrayField(foundDiscount.product_ids, foundDiscount.products),
        category_ids: parseArrayField(foundDiscount.category_ids, foundDiscount.categories),
      };

      setDiscount(processed);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!discount) return;
    setIsSubmitting(true);
    try {
      await delay(1000);
      await branchDiscountAPI.softDelete(discount.discount_rule_id);
      router.push('/branch/discounts');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal mengarsipkan promo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestore = async () => {
    if (!discount) return;
    setIsSubmitting(true);
    try {
      await delay(1000);
      // Restore logic: Update status active
      await branchDiscountAPI.update(discount.discount_rule_id, {
        ...discount,
        is_active: true
      });
      await loadData(); 
      setIsRestoreOpen(false);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal mengaktifkan kembali promo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHardDelete = async () => {
    if (!discount) return;
    setIsSubmitting(true);
    try {
      await delay(1000);
      await branchDiscountAPI.hardDelete(discount.discount_rule_id);
      router.push('/branch/discounts');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus permanen');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch { return '-'; }
  };

  const formatTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch { return '-'; }
  };

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8 @container">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error && !discount) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8 @container">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => router.push('/branch/discounts')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Detail Promo</h1>
          </div>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!discount) return null;

  // Cek apakah ini diskon lokal atau general untuk menentukan hak akses hapus/edit
  const isLocal = !!discount.branch_id;

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8 @container">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          className="w-fit -ml-4"
          onClick={() => router.push('/branch/discounts')}
          disabled={isSubmitting}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Daftar Promo
        </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Detail Promo</h1>
            <p className="text-muted-foreground">
              Informasi lengkap aturan Promo
            </p>
          </div>
        </div>
        
        {/* Tombol Aksi Header (Hanya untuk Lokal) */}
        {isLocal && (
           <div className="flex gap-2">
             {!discount.is_active ? (
               <Button variant="outline" className="text-green-600 border-green-200 bg-green-50" onClick={() => setIsRestoreOpen(true)}>
                 Aktifkan Kembali
               </Button>
             ) : (
                <Button variant="outline" onClick={() => setIsSoftDeleteOpen(true)}>
                  Arsipkan
                </Button>
             )}
             <Button onClick={() => router.push(`/branch/discounts/${discount.discount_rule_id}/edit`)}>
                Edit Promo
             </Button>
           </div>
        )}
      </div>

      {/* Status Badge */}
      {!discount.is_active && (
        <Alert>
          <Archive className="h-4 w-4" />
          <AlertDescription>
            <strong>Promo Diarsipkan:</strong> Promo ini tidak aktif dan tidak dapat digunakan dalam transaksi.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informasi Dasar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Informasi Dasar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Nama Promo</p>
              <p className="font-semibold text-lg">{discount.discount_name}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Kode Promo</p>
              {discount.discount_code ? (
                <Badge variant="secondary" className="font-mono text-sm">
                  <Ticket className="mr-1 h-3 w-3" />
                  {discount.discount_code}
                </Badge>
              ) : (
                <span className="text-muted-foreground text-sm">Otomatis (tanpa kode)</span>
              )}
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Status</p>
              <Badge variant={discount.is_active ? 'default' : 'secondary'} className="text-sm">
                {discount.is_active ? 'Aktif' : 'Diarsipkan'}
              </Badge>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Cakupan</p>
              <Badge variant={discount.branch_id ? 'secondary' : 'default'} className="text-sm">
                {discount.branch_id ? (
                  <>
                    <Building2 className="mr-1 h-3 w-3" />
                    Lokal
                  </>
                ) : (
                  <>
                    <Globe className="mr-1 h-3 w-3" />
                    General
                  </>
                )}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Nilai promo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5" />
              Nilai Promo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Tipe Promo</p>
              <p className="font-medium">
                {discount.discount_type === 'PERCENTAGE' ? 'Persentase' : 'Nominal Tetap'}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg ">
              <p className="text-sm text-muted-foreground mb-1">Nilai Potongan</p>
              <p className="font-bold text-3xl text-primary">
                {discount.discount_type === 'PERCENTAGE' 
                  ? `${discount.value}%` 
                  : formatRupiah(discount.value)
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Periode Aktif */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Periode Aktif
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Mulai */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Waktu Mulai</span>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Tanggal</p>
                      <p className="font-bold text-lg text-black">
                        {formatDate(discount.start_date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground mb-1">Jam</p>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-black" />
                        <p className="font-bold text-lg text-black">
                          {formatTime(discount.start_date)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Selesai */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Waktu Selesai</span>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg ">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Tanggal</p>
                      <p className="font-bold text-lg text-black ">
                        {formatDate(discount.end_date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground mb-1">Jam</p>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-black " />
                        <p className="font-bold text-lg text-black">
                          {formatTime(discount.end_date)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg mt-4">
              <p className="text-sm font-medium text-black ">
                <strong>Durasi:</strong> {Math.ceil((new Date(discount.end_date).getTime() - new Date(discount.start_date).getTime()) / (1000 * 60 * 60 * 24))} hari
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Target promo */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Target Promo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Berlaku Untuk</p>
              <Badge variant="outline" className="text-sm">
                {discount.applies_to === 'ENTIRE_TRANSACTION' ? 'Seluruh Transaksi' :
                 discount.applies_to === 'SPECIFIC_CATEGORIES' ? 'Kategori Tertentu' : 'Produk Tertentu'}
              </Badge>
            </div>

            {discount.applies_to === 'SPECIFIC_CATEGORIES' && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Kategori Terpilih ({discount.category_ids?.length || 0})</p>
                {discount.category_ids && discount.category_ids.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {discount.category_ids.map((catId: string) => {
                      const category = categories.find(c => c.category_id === catId);
                      return category ? (
                        <Badge key={catId} variant="secondary" className="text-xs">
                          {category.category_name}
                        </Badge>
                      ) : (
                        <Badge key={catId} variant="destructive" className="text-xs">
                          ID: {catId.substring(0, 8)}... (Tidak ditemukan)
                        </Badge>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Tidak ada kategori dipilih</p>
                )}
              </div>
            )}

            {discount.applies_to === 'SPECIFIC_PRODUCTS' && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Produk Terpilih ({discount.product_ids?.length || 0})</p>
                {discount.product_ids && discount.product_ids.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {discount.product_ids.map((prodId: string) => {
                      const product = products.find(p => p.product_id === prodId);
                      return product ? (
                        <Badge key={prodId} variant="secondary" className="text-xs">
                          {product.product_name}
                        </Badge>
                      ) : (
                        <Badge key={prodId} variant="destructive" className="text-xs">
                          ID: {prodId.substring(0, 8)}... (Tidak ditemukan)
                        </Badge>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Tidak ada produk dipilih</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Syarat & Ketentuan */}
      <Card>
        <CardHeader>
          <CardTitle>Syarat & Ketentuan</CardTitle>
          <CardDescription>
            Aturan tambahan yang berlaku untuk promo ini
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Min. Transaksi</p>
              <p className="font-semibold text-sm">
                {discount.min_transaction_amount 
                  ? formatRupiah(discount.min_transaction_amount) 
                  : '-'}
              </p>
            </div>
            
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Max. Transaksi</p>
              <p className="font-semibold text-sm">
                {discount.max_transaction_amount 
                  ? formatRupiah(discount.max_transaction_amount) 
                  : '-'}
              </p>
            </div>
            
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Min. Promo</p>
              <p className="font-semibold text-sm">
                {discount.min_discount_amount 
                  ? formatRupiah(discount.min_discount_amount) 
                  : '-'}
              </p>
            </div>
            
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Max. Promo</p>
              <p className="font-semibold text-sm">
                {discount.max_discount_amount 
                  ? formatRupiah(discount.max_discount_amount) 
                  : '-'}
              </p>
            </div>
            
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Min. Item (Qty)</p>
              <p className="font-semibold text-sm">
                {discount.min_item_quantity 
                  ? `${discount.min_item_quantity} item` 
                  : '-'}
              </p>
            </div>
            
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Max. Item (Qty)</p>
              <p className="font-semibold text-sm">
                {discount.max_item_quantity 
                  ? `${discount.max_item_quantity} item` 
                  : '-'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs: Soft Delete, Restore, Hard Delete (Hanya jika isLocal) */}
      {isLocal && (
        <>
          <Dialog open={isSoftDeleteOpen} onOpenChange={setIsSoftDeleteOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Arsipkan Promo?</DialogTitle>
                <DialogDescription>
                  Apakah Anda yakin ingin mengarsipkan promo <strong>{discount.discount_name}</strong>?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsSoftDeleteOpen(false)}>Batal</Button>
                <Button variant="default" className="bg-black" onClick={handleArchive} disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Arsipkan
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isRestoreOpen} onOpenChange={setIsRestoreOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Aktifkan Kembali?</DialogTitle>
                <DialogDescription>
                  Apakah Anda yakin ingin mengaktifkan kembali promo <strong>{discount.discount_name}</strong>?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsRestoreOpen(false)}>Batal</Button>
                <Button variant="default" className="bg-black" onClick={handleRestore} disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Aktifkan
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isHardDeleteModalOpen} onOpenChange={setIsHardDeleteModalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center text-black gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Hapus Permanen? 
                </DialogTitle>
                <DialogDescription>
                  Promo <strong>{discount.discount_name}</strong> akan dihapus selamanya dari database.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsHardDeleteModalOpen(false)}>Batal</Button>
                <Button className='bg-black hover:bg-gray-800' variant="destructive" onClick={handleHardDelete} disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Hapus Permanen
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}