'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { branchDiscountAPI } from '@/lib/api/branch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  AlertTriangle,
  Settings,
  CheckCircle2,
  XCircle,
  Info,
  MoreHorizontal,
  Edit,
  ArchiveRestore,
  Trash2,
} from 'lucide-react';
import { formatRupiah } from '@/lib/utils';

// Interface untuk detail diskon
interface DiscountDetail {
  discount_rule_id: string;
  discount_name: string;
  discount_code?: string;
  discount_type: 'PERCENTAGE' | 'NOMINAL' | 'FIXED_AMOUNT';
  value: number;
  start_date: string;
  end_date: string;
  branch_id?: string | null;
  is_active: boolean;
  original_value?: number;
  is_overridden?: boolean;
  scope: 'general' | 'local';
  
  // Info tambahan untuk detail
  description?: string;
  min_transaction_amount?: number;
  max_transaction_amount?: number;
  min_item_quantity?: number;
  max_item_quantity?: number;
  max_discount_amount?: number;
  min_discount_amount?: number;
  usage_limit?: number;
  usage_count?: number;
}

export default function DiscountDetailPage() {
  const router = useRouter();
  const params = useParams();
  const discountId = params?.id as string;

  const [discount, setDiscount] = useState<DiscountDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal states
  const [isSoftDeleteOpen, setIsSoftDeleteOpen] = useState(false);
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  const [isHardDeleteModalOpen, setIsHardDeleteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (discountId) {
      loadDiscountDetail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discountId]);

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  // Helper function untuk cek status waktu diskon
  const isDiscountActive = (endDate: string): boolean => {
    try {
      const now = new Date();
      const end = new Date(endDate);
      return end > now;
    } catch (e) {
      return false;
    }
  };

  const loadDiscountDetail = async () => {
    try {
      setIsLoading(true);
      setError('');

      console.log('🔍 Loading discount detail for ID:', discountId);

      // Try to get from local discounts first
      try {
        const localResponse = await branchDiscountAPI.getAll({ 
          page: 1, 
          limit: 100 
        });
        
        const localItem = (localResponse?.items || []).find(
          (item: any) => item.discount_rule_id === discountId
        );

        if (localItem) {
          console.log('✅ Found in LOCAL discounts');
          setDiscount({
            discount_rule_id: localItem.discount_rule_id,
            discount_name: localItem.discount_name,
            discount_code: localItem.discount_code,
            discount_type: localItem.discount_type,
            value: Number(localItem.value || 0),
            start_date: localItem.start_date,
            end_date: localItem.end_date,
            branch_id: localItem.branch_id,
            is_active: localItem.is_active ?? true,
            original_value: undefined,
            is_overridden: false,
            scope: 'local',
            description: localItem.description,
            min_transaction_amount: localItem.min_transaction_amount,
            max_transaction_amount: localItem.max_transaction_amount,
            min_item_quantity: localItem.min_item_quantity,
            max_item_quantity: localItem.max_item_quantity,
            max_discount_amount: localItem.max_discount_amount,
            min_discount_amount: localItem.min_discount_amount,
            usage_limit: localItem.usage_limit,
            usage_count: localItem.usage_count,
          });
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.warn('⚠️ Error checking local discounts:', err);
      }

      // Try to get from general discounts with override info
      try {
        const overrideResponse = await branchDiscountAPI.getGeneralWithOverride();
        const generalItem = Array.isArray(overrideResponse)
          ? overrideResponse.find((item: any) => item.discount_rule_id === discountId)
          : null;

        if (generalItem) {
          console.log('✅ Found in GENERAL discounts');
          
          const branchSetting = generalItem.applied_in_branches?.[0];
          const hasOverride = !!branchSetting;
          
          let effectiveValue = Number(generalItem.value || 0);
          let originalValue = Number(generalItem.value || 0);
          let isActive = generalItem.is_active ?? true;

          if (hasOverride) {
            if (branchSetting.value !== null && branchSetting.value !== undefined) {
              effectiveValue = Number(branchSetting.value);
            }
            isActive = generalItem.is_active && branchSetting.is_active_at_branch;
          }

          setDiscount({
            discount_rule_id: generalItem.discount_rule_id,
            discount_name: generalItem.discount_name,
            discount_code: generalItem.discount_code,
            discount_type: generalItem.discount_type,
            value: effectiveValue,
            start_date: generalItem.start_date,
            end_date: generalItem.end_date,
            branch_id: null,
            is_active: isActive,
            original_value: hasOverride ? originalValue : undefined,
            is_overridden: hasOverride,
            scope: 'general',
            description: generalItem.description,
            min_transaction_amount: hasOverride && branchSetting.min_transaction_amount !== null
              ? branchSetting.min_transaction_amount
              : generalItem.min_transaction_amount,
            max_transaction_amount: hasOverride && branchSetting.max_transaction_amount !== null
              ? branchSetting.max_transaction_amount
              : generalItem.max_transaction_amount,
            min_item_quantity: hasOverride && branchSetting.min_item_quantity !== null
              ? branchSetting.min_item_quantity
              : generalItem.min_item_quantity,
            max_item_quantity: hasOverride && branchSetting.max_item_quantity !== null
              ? branchSetting.max_item_quantity
              : generalItem.max_item_quantity,
            max_discount_amount: hasOverride && branchSetting.max_discount_amount !== null
              ? branchSetting.max_discount_amount
              : generalItem.max_discount_amount,
            min_discount_amount: hasOverride && branchSetting.min_discount_amount !== null
              ? branchSetting.min_discount_amount
              : generalItem.min_discount_amount,
            usage_limit: generalItem.usage_limit,
            usage_count: generalItem.usage_count,
          });
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.warn('⚠️ Error checking general discounts:', err);
      }

      // If not found in both
      setError('Diskon tidak ditemukan');
    } catch (err) {
      const error = err as Error;
      console.error('❌ Error loading discount detail:', error);
      setError(error.message || 'Gagal memuat detail diskon');
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
      setIsSoftDeleteOpen(false);
      await loadDiscountDetail(); // Reload untuk update status
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
      await delay(1000);
      await branchDiscountAPI.update(discount.discount_rule_id, {
        ...discount,
        is_active: true
      });
      setIsRestoreOpen(false);
      await loadDiscountDetail(); // Reload untuk update status
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
            onClick={() => router.push('/branch/discounts')}
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

  const isTimeActive = isDiscountActive(discount.end_date);

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8 @container">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            className="w-fit -ml-4"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Daftar Diskon
          </Button>

          {/* Action Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" disabled={isSubmitting}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Aksi</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {discount.scope === 'local' && discount.is_active && (
                <DropdownMenuItem onClick={() => router.push(`/branch/discounts/edit/${discount.discount_rule_id}`)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Diskon
                </DropdownMenuItem>
              )}
              
              {discount.scope === 'general' && (
                <DropdownMenuItem onClick={() => router.push(`/branch/discounts/override/${discount.discount_rule_id}`)}>
                  <Settings className="mr-2 h-4 w-4" />
                  Override Setting
                </DropdownMenuItem>
              )}

              {discount.is_active ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setIsSoftDeleteOpen(true)}
                    className="text-orange-600"
                  >
                    <Archive className="mr-2 h-4 w-4" />
                    Arsipkan
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setIsRestoreOpen(true)}
                    className="text-green-600"
                  >
                    <ArchiveRestore className="mr-2 h-4 w-4" />
                    Aktifkan Kembali
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setIsHardDeleteModalOpen(true)}
                    className="text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Hapus Permanen
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight">Detail Diskon</h1>
          <p className="text-muted-foreground">
            Informasi lengkap aturan Diskon
          </p>
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
              <p className="text-sm text-muted-foreground mb-1">Status Sistem</p>
              <Badge variant={discount.is_active ? 'default' : 'secondary'} className="text-sm">
                {discount.is_active ? 'Aktif' : 'Diarsipkan'}
              </Badge>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Status Waktu</p>
              {isTimeActive ? (
                <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-sm">
                  <CheckCircle2 className="mr-1 h-3 w-3" /> Aktif
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-gray-200 text-gray-700 text-sm">
                  <XCircle className="mr-1 h-3 w-3" /> Tidak Aktif
                </Badge>
              )}
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Cakupan</p>
              <Badge variant={discount.scope === 'local' ? 'secondary' : 'default'} className="text-sm">
                {discount.scope === 'local' ? (
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

            {discount.is_overridden && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Override</p>
                <Badge variant="outline" className="border-orange-200 text-orange-600 bg-orange-50 text-sm">
                  <Settings className="mr-1 h-3 w-3" /> Override Aktif
                </Badge>
              </div>
            )}
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

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Nilai Potongan</p>
              <p className="font-bold text-3xl text-primary">
                {discount.discount_type === 'PERCENTAGE' 
                  ? `${discount.value}%` 
                  : formatRupiah(discount.value)
                }
              </p>
            </div>

            {discount.is_overridden && discount.original_value !== undefined && (
              <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                <div className="flex items-center gap-2 mb-1">
                  <Info className="h-4 w-4 text-orange-600" />
                  <p className="text-xs text-orange-600 font-medium">Nilai Original</p>
                </div>
                <p className="text-sm text-muted-foreground line-through">
                  {discount.discount_type === 'PERCENTAGE' 
                    ? `${discount.original_value}%` 
                    : formatRupiah(discount.original_value)
                  }
                </p>
              </div>
            )}
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
                      <p className="font-bold text-lg text-black dark:text-black">
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
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Tanggal</p>
                      <p className="font-bold text-lg text-black">
                        {formatDate(discount.end_date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground mb-1">Jam</p>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-black" />
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
              <p className="text-sm font-medium text-black">
                <strong>Durasi:</strong> {Math.ceil((new Date(discount.end_date).getTime() - new Date(discount.start_date).getTime()) / (1000 * 60 * 60 * 24))} hari
              </p>
            </div>
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
              Diskon akan dinonaktifkan dan tidak dapat digunakan dalam transaksi.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSoftDeleteOpen(false)} disabled={isSubmitting}>
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
              <br/>
              Diskon akan dapat digunakan kembali dalam transaksi.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRestoreOpen(false)} disabled={isSubmitting}>
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
              <br/>
              <strong className="text-red-600">Tindakan ini tidak dapat dibatalkan!</strong>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHardDeleteModalOpen(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button className="bg-red-600 hover:bg-red-700" onClick={handleHardDelete} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Hapus Permanen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
