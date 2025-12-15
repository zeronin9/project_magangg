'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { discountAPI, categoryAPI, productAPI, branchAPI } from '@/lib/api/mitra';
import { DiscountRule, Category, Product, Branch } from '@/types/mitra';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  AlertCircle,
  Loader2,
  Pencil,
  Tag,
  Ticket,
  Calendar,
  Percent,
  Globe,
  Building2,
  Archive,
  RotateCcw,
  AlertTriangle,
  Clock
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

// Helper: Parse product_ids/category_ids dari backend
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

export default function DiscountDetailPage() {
  const router = useRouter();
  const params = useParams();
  const discountId = params.id as string;

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [discount, setDiscount] = useState<DiscountRule | null>(null);

  // Modal states
  const [isSoftDeleteOpen, setIsSoftDeleteOpen] = useState(false);
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  const [isHardDeleteModalOpen, setIsHardDeleteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [discountId]);

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [discountsData, categoriesData, productsData, branchesData] = await Promise.all([
        discountAPI.getAll(),
        categoryAPI.getAll(),
        productAPI.getAll(),
        branchAPI.getAll(),
      ]);
      
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      setProducts(Array.isArray(productsData) ? productsData : []);
      setBranches(Array.isArray(branchesData) ? branchesData : []);

      // Find the specific discount
      const discountsList = Array.isArray(discountsData) ? discountsData : [];
      const foundDiscount = discountsList.find(d => d.discount_rule_id === discountId);
      
      if (!foundDiscount) {
        setError('Diskon tidak ditemukan');
        return;
      }

      const processed = {
        ...foundDiscount,
        product_ids: parseArrayField(foundDiscount.product_ids, (foundDiscount as any).products),
        category_ids: parseArrayField(foundDiscount.category_ids, (foundDiscount as any).categories),
      };

      setDiscount(processed);

    } catch (err: any) {
      setError(err.message || 'Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!discount) return;
    
    setIsSubmitting(true);
    try {
      await delay(2000);
      await discountAPI.softDelete(discount.discount_rule_id);
      router.push('/mitra/discounts');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal mengarsipkan diskon');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestore = async () => {
    if (!discount) return;
    
    setIsSubmitting(true);
    try {
      await delay(2000);
      const restoreData = {
        is_active: true,
        discount_name: discount.discount_name,
        discount_type: discount.discount_type,
        value: discount.value.toString(),
        start_date: discount.start_date,
        end_date: discount.end_date,
        applies_to: discount.applies_to
      };
      
      await discountAPI.update(discount.discount_rule_id, restoreData);
      await loadData();
      setIsRestoreOpen(false);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal mengaktifkan kembali diskon');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHardDelete = async () => {
    if (!discount) return;
    
    setIsSubmitting(true);
    try {
      await delay(2000);
      await discountAPI.hardDelete(discount.discount_rule_id);
      router.push('/mitra/discounts');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus permanen');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
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
            onClick={() => router.push('/mitra/discounts')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Detail Diskon</h1>
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

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8 @container">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => router.push('/mitra/discounts')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Detail Diskon</h1>
            <p className="text-muted-foreground">
              Informasi lengkap aturan diskon
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {discount.is_active ? (
            <>
              <Button
                variant="outline"
                onClick={() => router.push(`/mitra/discounts/${discount.discount_rule_id}/edit`)}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsSoftDeleteOpen(true)}
              >
                <Archive className="mr-2 h-4 w-4" />
                Arsipkan
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              onClick={() => setIsRestoreOpen(true)}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Aktifkan Kembali
            </Button>
          )}
          <Button
            variant="destructive"
            onClick={() => setIsHardDeleteModalOpen(true)}
            className="bg-black hover:bg-gray-800"
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            Hapus Permanen
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Status Badge */}
      {!discount.is_active && (
        <Alert>
          <Archive className="h-4 w-4" />
          <AlertDescription>
            <strong>Diskon Diarsipkan:</strong> Diskon ini tidak aktif dan tidak dapat digunakan dalam transaksi.
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
              <p className="text-sm text-muted-foreground mb-1">Nama Diskon</p>
              <p className="font-semibold text-lg">{discount.discount_name}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Kode Diskon</p>
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

        {/* Nilai Diskon */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5" />
              Nilai Diskon
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Tipe Diskon</p>
              <p className="font-medium">
                {discount.discount_type === 'PERCENTAGE' ? 'Persentase' : 'Nominal Tetap'}
              </p>
            </div>

            <div className="bg-primary/5 p-4 rounded-lg border-2 border-primary/20">
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
                <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border-2 border-green-200 dark:border-green-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Tanggal</p>
                      <p className="font-bold text-lg text-green-700 dark:text-green-300">
                        {formatDate(discount.start_date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground mb-1">Jam</p>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-green-700 dark:text-green-300" />
                        <p className="font-bold text-lg text-green-700 dark:text-green-300">
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
                <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg border-2 border-red-200 dark:border-red-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Tanggal</p>
                      <p className="font-bold text-lg text-red-700 dark:text-red-300">
                        {formatDate(discount.end_date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground mb-1">Jam</p>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-red-700 dark:text-red-300" />
                        <p className="font-bold text-lg text-red-700 dark:text-red-300">
                          {formatTime(discount.end_date)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800 mt-4">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                <strong>Durasi:</strong> {Math.ceil((new Date(discount.end_date).getTime() - new Date(discount.start_date).getTime()) / (1000 * 60 * 60 * 24))} hari
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Target Diskon */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Target Diskon</CardTitle>
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
                    {discount.category_ids.map((catId) => {
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
                    {discount.product_ids.map((prodId) => {
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
            Aturan tambahan yang berlaku untuk diskon ini
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
              <p className="text-xs text-muted-foreground mb-1">Min. Diskon</p>
              <p className="font-semibold text-sm">
                {discount.min_discount_amount 
                  ? formatRupiah(discount.min_discount_amount) 
                  : '-'}
              </p>
            </div>
            
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Max. Diskon</p>
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

      {/* Archive Confirmation */}
      <Dialog open={isSoftDeleteOpen} onOpenChange={setIsSoftDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Arsipkan Diskon?</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin mengarsipkan diskon <strong>{discount.discount_name}</strong>?
              <br/>
              Diskon akan dinonaktifkan (Soft Delete).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSoftDeleteOpen(false)}>
              Batal
            </Button>
            <Button variant="default" className="bg-black" onClick={handleArchive} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Arsipkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Confirmation */}
      <Dialog open={isRestoreOpen} onOpenChange={setIsRestoreOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aktifkan Kembali?</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin mengaktifkan kembali diskon <strong>{discount.discount_name}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRestoreOpen(false)}>
              Batal
            </Button>
            <Button variant="default" className="bg-black" onClick={handleRestore} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Aktifkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hard Delete Confirmation */}
      <Dialog open={isHardDeleteModalOpen} onOpenChange={setIsHardDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center text-black gap-2">
              <AlertTriangle className="h-5 w-5" />
              Hapus Permanen? 
            </DialogTitle>
            <DialogDescription>
              Diskon <strong>{discount.discount_name}</strong> akan dihapus selamanya dari database.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHardDeleteModalOpen(false)}>
              Batal
            </Button>
            <Button className='bg-black hover:bg-gray-800' variant="destructive" onClick={handleHardDelete} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Hapus Permanen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
