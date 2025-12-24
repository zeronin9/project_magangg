'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { branchDiscountAPI } from '@/lib/api/branch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  AlertCircle,
  Tag,
  Calendar,
  Clock,
  Percent,
  Ticket,
  Globe,
  Building2,
  Settings,
  CheckCircle2,
  XCircle,
  Info,
} from 'lucide-react';
import { formatRupiah, formatDate } from '@/lib/utils';

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

  useEffect(() => {
    if (discountId) {
      loadDiscountDetail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discountId]);

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

  const formatTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleTimeString('id-ID', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (e) { 
      return '-'; 
    }
  };

  const handleBack = () => {
    router.push('/branch/discounts');
  };

  const handleEdit = () => {
    if (discount?.scope === 'local') {
      router.push(`/branch/discounts/${discountId}/edit`);
    } else {
      router.push(`/branch/discounts/${discountId}/override`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8">
        <Skeleton className="h-10 w-64" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !discount) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8">
        <Button variant="ghost" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Diskon tidak ditemukan'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const isTimeActive = isDiscountActive(discount.end_date);

  return (
    <div className="flex-1 space-y-6 p-4 pt-6 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
        {discount.scope === 'local' ? (
          <Button onClick={handleEdit}>
            <Settings className="mr-2 h-4 w-4" />
            Edit Diskon
          </Button>
        ) : (
          <Button onClick={handleEdit}>
            <Settings className="mr-2 h-4 w-4" />
            Override Setting
          </Button>
        )}
      </div>

      {/* Main Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-3xl flex items-center gap-3">
                <Tag className="h-8 w-8 text-muted-foreground" />
                {discount.discount_name}
              </CardTitle>
              <CardDescription>
                {discount.discount_code ? (
                  <Badge variant="secondary" className="font-mono text-sm">
                    <Ticket className="mr-1 h-4 w-4" /> {discount.discount_code}
                  </Badge>
                ) : (
                  <span className="text-sm text-muted-foreground">Diskon Otomatis (Tanpa Kode)</span>
                )}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 items-end">
              {/* Scope Badge */}
              <Badge variant={discount.scope === 'local' ? 'secondary' : 'default'} className="text-sm">
                {discount.scope === 'local' ? (
                  <><Building2 className="mr-1 h-4 w-4" /> Diskon Lokal</>
                ) : (
                  <><Globe className="mr-1 h-4 w-4" /> Diskon General</>
                )}
              </Badge>
              
              {/* Override Badge */}
              {discount.is_overridden && (
                <Badge variant="outline" className="border-orange-200 text-orange-600 bg-orange-50">
                  <Settings className="mr-1 h-3 w-3" /> Override Aktif
                </Badge>
              )}

              {/* Status Badge */}
              {isTimeActive ? (
                <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                  <CheckCircle2 className="mr-1 h-4 w-4" /> Aktif
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-gray-200 text-gray-700">
                  <XCircle className="mr-1 h-4 w-4" /> Tidak Aktif
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Nilai Diskon */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Nilai Diskon</h3>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-bold text-primary">
                {discount.discount_type === 'PERCENTAGE' 
                  ? `${discount.value}%` 
                  : formatRupiah(discount.value)
                }
              </p>
              <Badge variant="outline">
                {discount.discount_type === 'PERCENTAGE' ? 'Persentase' : 'Nominal'}
              </Badge>
            </div>
            
            {/* Show original value if overridden */}
            {discount.is_overridden && discount.original_value !== undefined && (
              <div className="mt-2 flex items-center gap-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Nilai original: <span className="line-through">
                    {discount.discount_type === 'PERCENTAGE' 
                      ? `${discount.original_value}%` 
                      : formatRupiah(discount.original_value)
                    }
                  </span>
                </span>
              </div>
            )}
          </div>

          <Separator />

          {/* Deskripsi */}
          {discount.description && (
            <>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Deskripsi</h3>
                <p className="text-sm">{discount.description}</p>
              </div>
              <Separator />
            </>
          )}

          {/* Periode Waktu */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Waktu Mulai</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-base">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDate(discount.start_date)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{formatTime(discount.start_date)} WIB</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Waktu Selesai</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-base">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDate(discount.end_date)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{formatTime(discount.end_date)} WIB</span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Syarat & Ketentuan */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Syarat & Ketentuan</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Min Transaction Amount */}
              {discount.min_transaction_amount !== null && discount.min_transaction_amount !== undefined && (
                <div className="flex justify-between items-center py-2 px-3 bg-muted/50 rounded-lg">
                  <span className="text-sm text-muted-foreground">Min. Transaksi</span>
                  <span className="font-medium">{formatRupiah(discount.min_transaction_amount)}</span>
                </div>
              )}

              {/* Max Transaction Amount */}
              {discount.max_transaction_amount !== null && discount.max_transaction_amount !== undefined && (
                <div className="flex justify-between items-center py-2 px-3 bg-muted/50 rounded-lg">
                  <span className="text-sm text-muted-foreground">Max. Transaksi</span>
                  <span className="font-medium">{formatRupiah(discount.max_transaction_amount)}</span>
                </div>
              )}

              {/* Min Item Quantity */}
              {discount.min_item_quantity !== null && discount.min_item_quantity !== undefined && (
                <div className="flex justify-between items-center py-2 px-3 bg-muted/50 rounded-lg">
                  <span className="text-sm text-muted-foreground">Min. Jumlah Item</span>
                  <span className="font-medium">{discount.min_item_quantity} item</span>
                </div>
              )}

              {/* Max Item Quantity */}
              {discount.max_item_quantity !== null && discount.max_item_quantity !== undefined && (
                <div className="flex justify-between items-center py-2 px-3 bg-muted/50 rounded-lg">
                  <span className="text-sm text-muted-foreground">Max. Jumlah Item</span>
                  <span className="font-medium">{discount.max_item_quantity} item</span>
                </div>
              )}

              {/* Min Discount Amount */}
              {discount.min_discount_amount !== null && discount.min_discount_amount !== undefined && (
                <div className="flex justify-between items-center py-2 px-3 bg-muted/50 rounded-lg">
                  <span className="text-sm text-muted-foreground">Min. Potongan</span>
                  <span className="font-medium">{formatRupiah(discount.min_discount_amount)}</span>
                </div>
              )}

              {/* Max Discount Amount */}
              {discount.max_discount_amount !== null && discount.max_discount_amount !== undefined && (
                <div className="flex justify-between items-center py-2 px-3 bg-muted/50 rounded-lg">
                  <span className="text-sm text-muted-foreground">Max. Potongan</span>
                  <span className="font-medium">{formatRupiah(discount.max_discount_amount)}</span>
                </div>
              )}

              {/* Usage Limit */}
              {discount.usage_limit !== null && discount.usage_limit !== undefined && (
                <div className="flex justify-between items-center py-2 px-3 bg-muted/50 rounded-lg">
                  <span className="text-sm text-muted-foreground">Batas Penggunaan</span>
                  <span className="font-medium">{discount.usage_limit} kali</span>
                </div>
              )}

              {/* Usage Count */}
              {discount.usage_count !== null && discount.usage_count !== undefined && (
                <div className="flex justify-between items-center py-2 px-3 bg-muted/50 rounded-lg">
                  <span className="text-sm text-muted-foreground">Sudah Digunakan</span>
                  <span className="font-medium">{discount.usage_count} kali</span>
                </div>
              )}
            </div>
            
            {!discount.min_transaction_amount && 
             !discount.max_transaction_amount && 
             !discount.min_item_quantity && 
             !discount.max_item_quantity && 
             !discount.max_discount_amount && 
             !discount.min_discount_amount && 
             !discount.usage_limit && (
              <p className="text-sm text-muted-foreground italic">Tidak ada syarat khusus</p>
            )}
          </div>

          <Separator />

          {/* Status Info */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Status</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {discount.is_active ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-gray-500" />
                )}
                <span className="text-sm">
                  {discount.is_active ? 'Diskon Aktif di Sistem' : 'Diskon Nonaktif di Sistem'}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                {isTimeActive ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-gray-500" />
                )}
                <span className="text-sm">
                  {isTimeActive ? 'Periode Waktu Masih Berlaku' : 'Periode Waktu Sudah Lewat'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
