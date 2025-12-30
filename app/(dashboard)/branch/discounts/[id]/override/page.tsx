'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  branchDiscountAPI, 
  branchCategoryAPI, 
  branchProductAPI 
} from '@/lib/api/branch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
  Save,
  Calendar,
  Percent,
  Tag,
  Settings,
  Info
} from 'lucide-react';
import { formatRupiah } from '@/lib/utils';

// Helper: Parse array IDs
const parseArrayField = (field: any, relatedField?: any[]): string[] => {
  if (relatedField && Array.isArray(relatedField) && relatedField.length > 0) {
    return relatedField.map(item => item.product_id || item.category_id).filter(Boolean);
  }
  if (Array.isArray(field)) return field;
  if (typeof field === 'string') {
    try {
      const parsed = JSON.parse(field);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) { return []; }
  }
  return [];
};

export default function OverrideDiscountPage() {
  const router = useRouter();
  const params = useParams();
  const discountId = params.id as string;

  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Data Diskon Original (Master)
  const [masterDiscount, setMasterDiscount] = useState<any>(null);

  // Form Data untuk Override
  const [formData, setFormData] = useState({
    is_active_at_branch: 'true', // String for Select
    value: '',
    min_transaction_amount: '',
    max_transaction_amount: '',
    min_item_quantity: '',
    max_item_quantity: '',
    min_discount_amount: '',
    max_discount_amount: '',
  });

  useEffect(() => {
    if (discountId) {
      loadData();
    }
  }, [discountId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      console.log('🔍 Loading override data for discount ID:', discountId);

      // ✅ PERBAIKAN 1: Load products dan categories menggunakan fetchData yang return { items, meta }
      const [productsResponse, categoriesResponse] = await Promise.all([
        branchProductAPI.getAll({ page: 1, limit: 1000 }).catch(() => ({ items: [] })),
        branchCategoryAPI.getAll({ page: 1, limit: 1000 }).catch(() => ({ items: [] }))
      ]);

      const productsList = productsResponse?.items || [];
      const categoriesList = categoriesResponse?.items || [];

      setProducts(Array.isArray(productsList) ? productsList : []);
      setCategories(Array.isArray(categoriesList) ? categoriesList : []);

      console.log('✅ Loaded', productsList.length, 'products and', categoriesList.length, 'categories');

      // ✅ PERBAIKAN 2: Load general discounts dengan override info
      const overrideResponse = await branchDiscountAPI.getGeneralWithOverride();
      console.log('📦 Override response:', overrideResponse);
      
      let generalDiscounts = [];
      if (Array.isArray(overrideResponse)) {
        generalDiscounts = overrideResponse;
      } else if (overrideResponse?.data && Array.isArray(overrideResponse.data)) {
        generalDiscounts = overrideResponse.data;
      }

      console.log('📊 Total general discounts with override info:', generalDiscounts.length);

      // ✅ PERBAIKAN 3: Cari discount yang sesuai
      const foundDiscount = generalDiscounts.find((d: any) => 
        String(d.discount_rule_id) === String(discountId)
      );

      if (!foundDiscount) {
        setError('Data diskon general tidak ditemukan atau sudah dihapus.');
        return;
      }

      console.log('✅ Found discount:', foundDiscount.discount_name);
      setMasterDiscount(foundDiscount);

      // ✅ PERBAIKAN 4: Ambil override setting dari applied_in_branches
      let currentSetting: any = {};
      
      if (foundDiscount.applied_in_branches && Array.isArray(foundDiscount.applied_in_branches) && foundDiscount.applied_in_branches.length > 0) {
        currentSetting = foundDiscount.applied_in_branches[0];
        console.log('✅ Found existing override setting:', currentSetting);
      } else {
        console.log('ℹ️ No existing override setting, using master values as defaults');
      }

      // Helper untuk mengambil nilai string atau fallback ke string kosong
      const getVal = (overrideVal: any, masterVal: any) => {
        if (overrideVal !== null && overrideVal !== undefined) return String(overrideVal);
        if (masterVal !== null && masterVal !== undefined) return String(masterVal);
        return '';
      };

      // ✅ PERBAIKAN 5: Set form data dengan nilai override atau master
      setFormData({
        is_active_at_branch: currentSetting.is_active_at_branch !== undefined 
          ? String(currentSetting.is_active_at_branch) 
          : 'true',
        value: getVal(currentSetting.value, foundDiscount.value),
        min_transaction_amount: getVal(currentSetting.min_transaction_amount, foundDiscount.min_transaction_amount),
        max_transaction_amount: getVal(currentSetting.max_transaction_amount, foundDiscount.max_transaction_amount),
        min_item_quantity: getVal(currentSetting.min_item_quantity, foundDiscount.min_item_quantity),
        max_item_quantity: getVal(currentSetting.max_item_quantity, foundDiscount.max_item_quantity),
        min_discount_amount: getVal(currentSetting.min_discount_amount, foundDiscount.min_discount_amount),
        max_discount_amount: getVal(currentSetting.max_discount_amount, foundDiscount.max_discount_amount),
      });

      console.log('✅ Form data initialized:', formData);

    } catch (err: any) {
      console.error('❌ Error loading override data:', err);
      setError(err.message || 'Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNumberInput = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    // Hanya izinkan angka
    const val = e.target.value.replace(/\D/g, '');
    setFormData({ ...formData, [field]: val });
  };

  const displayFormatted = (val: string) => {
    if (!val) return '';
    return Number(val).toLocaleString('id-ID');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      console.log('📤 Submitting override data...');
      
      // Helper konversi: String kosong ('') menjadi null agar backend mereset nilai
      const toNullableNumber = (val: string) => {
        if (!val || val.trim() === '') return null;
        const num = Number(val);
        return isNaN(num) ? null : num;
      };

      const payload = {
        is_active_at_branch: formData.is_active_at_branch === 'true',
        value: toNullableNumber(formData.value),
        min_transaction_amount: toNullableNumber(formData.min_transaction_amount),
        max_transaction_amount: toNullableNumber(formData.max_transaction_amount),
        min_item_quantity: toNullableNumber(formData.min_item_quantity),
        max_item_quantity: toNullableNumber(formData.max_item_quantity),
        min_discount_amount: toNullableNumber(formData.min_discount_amount),
        max_discount_amount: toNullableNumber(formData.max_discount_amount),
      };

      console.log('📦 Payload:', payload);

      await branchDiscountAPI.setOverride(discountId, payload);
      
      console.log('✅ Override saved successfully');
      router.push('/branch/discounts');
    } catch (err: any) {
      console.error('❌ Error submitting override:', err);
      setError(err.response?.data?.message || err.message || 'Gagal menyimpan pengaturan override');
    } finally {
      setIsSubmitting(false);
    }
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

  if (error && !masterDiscount) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8 @container">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => router.back()}>Kembali</Button>
      </div>
    );
  }

  // Siapkan data master untuk display Read-Only
  const startDate = masterDiscount?.start_date ? new Date(masterDiscount.start_date).toISOString().split('T')[0] : '';
  const startTime = masterDiscount?.start_date ? new Date(masterDiscount.start_date).toTimeString().slice(0, 5) : '';
  const endDate = masterDiscount?.end_date ? new Date(masterDiscount.end_date).toISOString().split('T')[0] : '';
  const endTime = masterDiscount?.end_date ? new Date(masterDiscount.end_date).toTimeString().slice(0, 5) : '';
  
  const masterProductIds = parseArrayField(masterDiscount?.product_ids, masterDiscount?.products);
  const masterCategoryIds = parseArrayField(masterDiscount?.category_ids, masterDiscount?.categories);

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8 @container">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          className="w-fit -ml-4"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Daftar Promo
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            Override Setting
            <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">General Promo</Badge>
          </h1>
          <p className="text-muted-foreground">
            Sesuaikan aturan promo <strong>{masterDiscount?.discount_name}</strong> khusus untuk cabang ini.
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Status Cabang (Override Utama) */}
        <Card className="border-orange-200 bg-orange-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <Settings className="h-5 w-5" />
              Status di Cabang
            </CardTitle>
            <CardDescription>
              Anda dapat menonaktifkan promo ini khusus di cabang Anda meskipun di pusat aktif.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="is_active_at_branch">Status *</Label>
              <Select
                value={formData.is_active_at_branch}
                onValueChange={(value) => setFormData({ ...formData, is_active_at_branch: value })}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Aktif</SelectItem>
                  <SelectItem value="false">Non-Aktif (Sembunyikan)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Informasi Dasar (Read Only) */}
        <Card className="opacity-80 bg-muted/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Informasi Dasar (Master)
            </CardTitle>
            <CardDescription>Data ini diatur oleh pusat dan tidak dapat diubah</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Promo</Label>
              <Input value={masterDiscount?.discount_name || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label>Kode Promo</Label>
              <Input value={masterDiscount?.discount_code || '-'} disabled className="font-mono" />
            </div>
          </CardContent>
        </Card>

        {/* Tipe dan Nilai (Value Editable) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5" />
              Nilai Promo (Override)
            </CardTitle>
            <CardDescription>
              Anda dapat mengubah besaran potongan khusus untuk cabang ini
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipe Promo (Master)</Label>
                <Input value={masterDiscount?.discount_type === 'PERCENTAGE' ? 'Persentase (%)' : 'Nominal (Rp)'} disabled />
              </div>

              <div className="space-y-2">
                <Label htmlFor="value" className="text-primary font-semibold">
                  Nilai Promo * {masterDiscount?.discount_type === 'PERCENTAGE' ? '(%)' : '(Rp)'}
                </Label>
                {masterDiscount?.discount_type === 'PERCENTAGE' ? (
                  <Input
                    id="value"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    placeholder="Masukkan persentase"
                    required
                    className="border-primary/50 focus-visible:ring-primary"
                  />
                ) : (
                  <Input
                    id="value"
                    value={formData.value ? `Rp ${Number(formData.value).toLocaleString('id-ID')}` : ''}
                    onChange={(e) => handleNumberInput(e, 'value')}
                    placeholder="Masukkan nominal"
                    required
                    className="border-primary/50 focus-visible:ring-primary"
                  />
                )}
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  Nilai Master: <strong>{masterDiscount?.discount_type === 'PERCENTAGE' ? `${masterDiscount?.value}%` : formatRupiah(masterDiscount?.value || 0)}</strong>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Periode Aktif (Read Only) */}
        <Card className="opacity-80 bg-muted/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Periode Aktif (Master)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tanggal Mulai</Label>
                <Input type="date" value={startDate} disabled />
              </div>
              <div className="space-y-2">
                <Label>Waktu Mulai</Label>
                <Input type="time" value={startTime} disabled />
              </div>
              <div className="space-y-2">
                <Label>Tanggal Selesai</Label>
                <Input type="date" value={endDate} disabled />
              </div>
              <div className="space-y-2">
                <Label>Waktu Selesai</Label>
                <Input type="time" value={endTime} disabled />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Target Promo (Read Only) */}
        <Card className="opacity-80 bg-muted/20">
          <CardHeader>
            <CardTitle>Target Promo (Master)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Berlaku Untuk</Label>
              <Select value={masterDiscount?.applies_to || 'ENTIRE_TRANSACTION'} disabled>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ENTIRE_TRANSACTION">Seluruh Transaksi</SelectItem>
                  <SelectItem value="SPECIFIC_CATEGORIES">Kategori Tertentu</SelectItem>
                  <SelectItem value="SPECIFIC_PRODUCTS">Produk Tertentu</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Display Read-Only Selection */}
            {masterDiscount?.applies_to === 'SPECIFIC_CATEGORIES' && (
              <div className="space-y-2">
                <Label>Kategori Terpilih</Label>
                <Card className="p-4 max-h-48 overflow-y-auto">
                  <div className="space-y-2">
                    {categories
                      .filter(cat => masterCategoryIds.includes(cat.category_id))
                      .map(cat => (
                        <div key={cat.category_id} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Checkbox checked disabled />
                          <span>{cat.category_name}</span>
                        </div>
                      ))
                    }
                    {masterCategoryIds.length === 0 && <p className="text-sm">Tidak ada data kategori</p>}
                  </div>
                </Card>
              </div>
            )}

            {masterDiscount?.applies_to === 'SPECIFIC_PRODUCTS' && (
              <div className="space-y-2">
                <Label>Produk Terpilih</Label>
                <Card className="p-4 max-h-48 overflow-y-auto">
                  <div className="space-y-2">
                    {products
                      .filter(prod => masterProductIds.includes(prod.product_id))
                      .map(prod => (
                        <div key={prod.product_id} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Checkbox checked disabled />
                          <span>{prod.product_name}</span>
                        </div>
                      ))
                    }
                    {masterProductIds.length === 0 && <p className="text-sm">Tidak ada data produk</p>}
                  </div>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Aturan Tambahan (Override) */}
        <Card>
          <CardHeader>
            <CardTitle>Aturan Tambahan (Override)</CardTitle>
            <CardDescription>
              Override syarat dan ketentuan threshold jika diperlukan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Minimal Transaksi (Rp)</Label>
                <Input
                  value={formData.min_transaction_amount ? `Rp ${Number(formData.min_transaction_amount).toLocaleString('id-ID')}` : ''}
                  onChange={(e) => handleNumberInput(e, 'min_transaction_amount')}
                  placeholder={masterDiscount?.min_transaction_amount ? `Master: ${formatRupiah(masterDiscount.min_transaction_amount)}` : 'Tidak ada limit'}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm">Maksimal Transaksi (Rp)</Label>
                <Input
                  value={formData.max_transaction_amount ? `Rp ${Number(formData.max_transaction_amount).toLocaleString('id-ID')}` : ''}
                  onChange={(e) => handleNumberInput(e, 'max_transaction_amount')}
                  placeholder={masterDiscount?.max_transaction_amount ? `Master: ${formatRupiah(masterDiscount.max_transaction_amount)}` : 'Tidak ada limit'}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm">Minimal Item (Qty)</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.min_item_quantity}
                  onChange={(e) => setFormData({ ...formData, min_item_quantity: e.target.value })}
                  placeholder={masterDiscount?.min_item_quantity ? `Master: ${masterDiscount.min_item_quantity}` : 'Tidak ada limit'}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm">Maksimal Item (Qty)</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.max_item_quantity}
                  onChange={(e) => setFormData({ ...formData, max_item_quantity: e.target.value })}
                  placeholder={masterDiscount?.max_item_quantity ? `Master: ${masterDiscount.max_item_quantity}` : 'Tidak ada limit'}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm">Minimal Potongan (Rp)</Label>
                <Input
                  value={formData.min_discount_amount ? `Rp ${Number(formData.min_discount_amount).toLocaleString('id-ID')}` : ''}
                  onChange={(e) => handleNumberInput(e, 'min_discount_amount')}
                  placeholder={masterDiscount?.min_discount_amount ? `Master: ${formatRupiah(masterDiscount.min_discount_amount)}` : 'Tidak ada limit'}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm">Maksimal Potongan (Rp)</Label>
                <Input
                  value={formData.max_discount_amount ? `Rp ${Number(formData.max_discount_amount).toLocaleString('id-ID')}` : ''}
                  onChange={(e) => handleNumberInput(e, 'max_discount_amount')}
                  placeholder={masterDiscount?.max_discount_amount ? `Master: ${formatRupiah(masterDiscount.max_discount_amount)}` : 'Tidak ada limit'}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 sticky bottom-0 bg-background py-4 border-t z-10">
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
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Simpan Override
          </Button>
        </div>
      </form>
    </div>
  );
}
