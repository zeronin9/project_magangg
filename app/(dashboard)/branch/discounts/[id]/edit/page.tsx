// app/(dashboard)/branch/discounts/[id]/edit/page.tsx

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
  Ticket,
  Clock
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

// Definisi Tipe Data (Sesuaikan dengan response API Cabang)
interface Category {
  category_id: string;
  category_name: string;
  branch_id?: string | null;
}

interface Product {
  product_id: string;
  product_name: string;
  branch_id?: string | null;
}

interface DiscountRule {
  discount_rule_id: string;
  discount_name: string;
  discount_code?: string;
  discount_type: 'PERCENTAGE' | 'NOMINAL' | 'FIXED_AMOUNT';
  value: number;
  start_date: string;
  end_date: string;
  applies_to: 'ENTIRE_TRANSACTION' | 'SPECIFIC_PRODUCTS' | 'SPECIFIC_CATEGORIES';
  product_ids?: string[] | string; // Bisa array atau string JSON
  category_ids?: string[] | string;
  min_transaction_amount?: number;
  max_transaction_amount?: number;
  min_item_quantity?: number;
  max_item_quantity?: number;
  min_discount_amount?: number;
  max_discount_amount?: number;
  // Field relasi opsional jika ada dari include
  products?: { product_id: string }[];
  categories?: { category_id: string }[];
}

// Helper: Parse product_ids/category_ids dari backend
const parseArrayField = (field: any, relatedField?: any[]): string[] => {
  // Jika backend mengirim relation object (misal include: products)
  if (relatedField && Array.isArray(relatedField) && relatedField.length > 0) {
    const ids = relatedField.map(item => item.product_id || item.category_id).filter(Boolean);
    return ids;
  }
  
  // Jika field sudah berupa array
  if (Array.isArray(field)) {
    return field;
  }
  
  // Jika field berupa string JSON (misal dari raw query)
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

export default function EditBranchDiscountPage() {
  const router = useRouter();
  const params = useParams();
  const discountId = params.id as string;

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [discount, setDiscount] = useState<DiscountRule | null>(null);

  const [formData, setFormData] = useState({
    discount_name: '',
    discount_code: '',
    discount_type: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED_AMOUNT',
    value: '',
    start_date: '',
    start_time: '00:00',
    end_date: '',
    end_time: '23:59',
    applies_to: 'ENTIRE_TRANSACTION' as 'ENTIRE_TRANSACTION' | 'SPECIFIC_PRODUCTS' | 'SPECIFIC_CATEGORIES',
    product_ids: [] as string[],
    category_ids: [] as string[],
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
      
      // Ambil semua data yang diperlukan secara paralel
      // Menggunakan branchDiscountAPI bukan discountAPI (mitra)
      const [discountsData, categoriesData, productsData] = await Promise.all([
        branchDiscountAPI.getAll().catch(() => ({ data: [] })),
        branchCategoryAPI.getAll().catch(() => ({ data: [] })),
        branchProductAPI.getAll().catch(() => ({ data: [] })),
      ]);
      
      setCategories(Array.isArray(categoriesData.data) ? categoriesData.data : []);
      setProducts(Array.isArray(productsData.data) ? productsData.data : []);

      // Cari diskon spesifik dari list (karena API getById mungkin belum tersedia/sama strukturnya)
      const discountsList = Array.isArray(discountsData.data) ? discountsData.data : [];
      const foundDiscount = discountsList.find((d: any) => d.discount_rule_id === discountId);
      
      if (!foundDiscount) {
        setError('Promo tidak ditemukan');
        return;
      }

      setDiscount(foundDiscount);

      // Extract date and time from ISO string
      const startDateTime = new Date(foundDiscount.start_date);
      const endDateTime = new Date(foundDiscount.end_date);

      const startDate = startDateTime.toISOString().split('T')[0];
      const startTime = startDateTime.toTimeString().slice(0, 5);
      const endDate = endDateTime.toISOString().split('T')[0];
      const endTime = endDateTime.toTimeString().slice(0, 5);

      // Mapping tipe diskon (Backend mungkin return NOMINAL, Frontend pakai FIXED_AMOUNT untuk dropdown)
      const discountType = foundDiscount.discount_type === 'NOMINAL' ? 'FIXED_AMOUNT' : foundDiscount.discount_type;

      // Populate form with discount data
      setFormData({
        discount_name: foundDiscount.discount_name,
        discount_code: foundDiscount.discount_code || '',
        discount_type: discountType,
        value: foundDiscount.value.toString(),
        start_date: startDate,
        start_time: startTime,
        end_date: endDate,
        end_time: endTime,
        applies_to: foundDiscount.applies_to || 'ENTIRE_TRANSACTION',
        product_ids: parseArrayField(foundDiscount.product_ids, foundDiscount.products),
        category_ids: parseArrayField(foundDiscount.category_ids, foundDiscount.categories),
        min_transaction_amount: foundDiscount.min_transaction_amount?.toString() || '',
        max_transaction_amount: foundDiscount.max_transaction_amount?.toString() || '',
        min_item_quantity: foundDiscount.min_item_quantity?.toString() || '',
        max_item_quantity: foundDiscount.max_item_quantity?.toString() || '',
        min_discount_amount: foundDiscount.min_discount_amount?.toString() || '',
        max_discount_amount: foundDiscount.max_discount_amount?.toString() || '',
      });

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNumberInput = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const val = e.target.value.replace(/\D/g, '');
    setFormData({ ...formData, [field]: val });
  };

  const displayFormatted = (val: string) => {
    if (!val) return '';
    return Number(val).toLocaleString('id-ID');
  };

  const handleCategoryToggle = (categoryId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      category_ids: checked 
        ? [...prev.category_ids, categoryId]
        : prev.category_ids.filter(id => id !== categoryId)
    }));
  };

  const handleProductToggle = (productId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      product_ids: checked 
        ? [...prev.product_ids, productId]
        : prev.product_ids.filter(id => id !== productId)
    }));
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await delay(1000);

      // Gabungkan tanggal dan waktu
      const startDateTime = `${formData.start_date}T${formData.start_time}:00`;
      const endDateTime = `${formData.end_date}T${formData.end_time}:00`;

      // Kembalikan tipe ke format backend (FIXED_AMOUNT -> NOMINAL)
      const backendDiscountType = formData.discount_type === 'FIXED_AMOUNT' ? 'NOMINAL' : formData.discount_type;

      const dataToSend: any = {
        discount_name: formData.discount_name,
        discount_type: backendDiscountType,
        value: Number(formData.value),
        start_date: startDateTime,
        end_date: endDateTime,
        applies_to: formData.applies_to,
        is_active: true,
      };

      if (formData.discount_code && formData.discount_code.trim() !== '') {
        dataToSend.discount_code = formData.discount_code.trim().toUpperCase();
      }

      if (formData.applies_to === 'SPECIFIC_PRODUCTS') {
        dataToSend.product_ids = formData.product_ids;
      }

      if (formData.applies_to === 'SPECIFIC_CATEGORIES') {
        dataToSend.category_ids = formData.category_ids;
      }

      // Helper konversi ke number
      const toNumber = (val: string) => val ? Number(val) : undefined;

      if (formData.min_transaction_amount) dataToSend.min_transaction_amount = toNumber(formData.min_transaction_amount);
      if (formData.max_transaction_amount) dataToSend.max_transaction_amount = toNumber(formData.max_transaction_amount);
      if (formData.min_item_quantity) dataToSend.min_item_quantity = toNumber(formData.min_item_quantity);
      if (formData.max_item_quantity) dataToSend.max_item_quantity = toNumber(formData.max_item_quantity);
      if (formData.min_discount_amount) dataToSend.min_discount_amount = toNumber(formData.min_discount_amount);
      if (formData.max_discount_amount) dataToSend.max_discount_amount = toNumber(formData.max_discount_amount);

      console.log('=== DATA YANG DIKIRIM ===');
      console.log(JSON.stringify(dataToSend, null, 2));
      console.log('========================');

      await branchDiscountAPI.update(discountId, dataToSend);
      router.push('/branch/discounts');
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.response?.data?.message || err.message || 'Gagal menyimpan promo');
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

  if (error && !discount) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8 @container">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Promo</h1>
          </div>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
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
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Daftar Promo
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Promo Lokal</h1>
          <p className="text-muted-foreground">
            Perbarui informasi promo: {discount?.discount_name}
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
        {/* Informasi Dasar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Informasi Dasar
            </CardTitle>
            <CardDescription>
              Tentukan nama dan kode promo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="discount_name">Nama Promo *</Label>
              <Input
                id="discount_name"
                value={formData.discount_name}
                onChange={(e) => setFormData({ ...formData, discount_name: e.target.value })}
                placeholder="Masukkan nama promo"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount_code" className="flex items-center gap-2">
                <Ticket className="h-4 w-4" />
                Kode Promo (Opsional)
              </Label>
              <Input
                id="discount_code"
                value={formData.discount_code}
                onChange={(e) => setFormData({ ...formData, discount_code: e.target.value.toUpperCase() })}
                placeholder="Masukkan kode promo"
                maxLength={20}
                className="font-mono uppercase"
              />
              <p className="text-xs text-muted-foreground">
                Kosongkan jika ingin promo diterapkan otomatis
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tipe dan Nilai Promo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5" />
              Tipe dan Nilai Promo
            </CardTitle>
            <CardDescription>
              Tentukan jenis dan besaran potongan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discount_type">Tipe Promo *</Label>
                <Select
                  value={formData.discount_type}
                  onValueChange={(value: any) => setFormData({ ...formData, discount_type: value, value: '' })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Persentase (%)</SelectItem>
                    <SelectItem value="FIXED_AMOUNT">Nominal Tetap (Rp)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="value">
                  Nilai Promo * {formData.discount_type === 'PERCENTAGE' ? '(%)' : '(Rp)'}
                </Label>
                {formData.discount_type === 'PERCENTAGE' ? (
                  <Input
                    id="value"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    placeholder="Masukkan persentase promo"
                    required
                  />
                ) : (
                  <Input
                    id="value"
                    value={formData.value ? `Rp. ${Number(formData.value).toLocaleString('id-ID')}` : ''}
                    onChange={(e) => handleNumberInput(e, 'value')}
                    placeholder="Masukkan nominal harga"
                    required
                  />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Periode Aktif */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Periode Aktif
            </CardTitle>
            <CardDescription>
              Tentukan masa berlaku promo (tanggal dan waktu)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Tanggal Mulai *
                </Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="start_time" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Waktu Mulai *
                </Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Tanggal Selesai *
                </Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_time" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Waktu Selesai *
                </Label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  required
                />
              </div>
            </div>

            {formData.start_date && formData.end_date && (
              <Alert className="mt-4">
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  <strong>Periode:</strong> {new Date(`${formData.start_date}T${formData.start_time}`).toLocaleString('id-ID', { 
                    dateStyle: 'medium', 
                    timeStyle: 'short' 
                  })} - {new Date(`${formData.end_date}T${formData.end_time}`).toLocaleString('id-ID', { 
                    dateStyle: 'medium', 
                    timeStyle: 'short' 
                  })}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Target Diskon */}
        <Card>
          <CardHeader>
            <CardTitle>Target Promo</CardTitle>
            <CardDescription>
              Tentukan promo berlaku untuk apa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="applies_to">Berlaku Untuk *</Label>
              <Select
                value={formData.applies_to}
                onValueChange={(value: any) => setFormData({ ...formData, applies_to: value, product_ids: [], category_ids: [] })}
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ENTIRE_TRANSACTION">Seluruh Transaksi</SelectItem>
                  <SelectItem value="SPECIFIC_CATEGORIES">Kategori Tertentu</SelectItem>
                  <SelectItem value="SPECIFIC_PRODUCTS">Produk Tertentu</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Pilihan Kategori */}
            {formData.applies_to === 'SPECIFIC_CATEGORIES' && (
              <div className="space-y-2">
                <Label>Pilih Kategori * ({formData.category_ids.length} dipilih)</Label>
                <Card className="p-4 max-h-64 overflow-y-auto">
                  {categories.length > 0 ? (
                    <div className="space-y-3">
                      {categories.map((cat) => (
                        <div key={cat.category_id} className="flex items-center space-x-3 p-2 hover:bg-muted rounded-md">
                          <Checkbox
                            id={cat.category_id}
                            checked={formData.category_ids.includes(cat.category_id)}
                            onCheckedChange={(checked) => handleCategoryToggle(cat.category_id, checked as boolean)}
                          />
                          <label
                            htmlFor={cat.category_id}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                          >
                            {cat.category_name}
                          </label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Tidak ada kategori tersedia
                    </p>
                  )}
                </Card>
                {formData.category_ids.length === 0 && (
                  <p className="text-xs text-destructive">Minimal pilih 1 kategori</p>
                )}
              </div>
            )}

            {/* Pilihan Produk */}
            {formData.applies_to === 'SPECIFIC_PRODUCTS' && (
              <div className="space-y-2">
                <Label>Pilih Produk * ({formData.product_ids.length} dipilih)</Label>
                <Card className="p-4 max-h-64 overflow-y-auto">
                  {products.length > 0 ? (
                    <div className="space-y-3">
                      {products.map((prod) => (
                        <div key={prod.product_id} className="flex items-center space-x-3 p-2 hover:bg-muted rounded-md">
                          <Checkbox
                            id={prod.product_id}
                            checked={formData.product_ids.includes(prod.product_id)}
                            onCheckedChange={(checked) => handleProductToggle(prod.product_id, checked as boolean)}
                          />
                          <label
                            htmlFor={prod.product_id}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                          >
                            {prod.product_name}
                          </label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Tidak ada produk tersedia
                    </p>
                  )}
                </Card>
                {formData.product_ids.length === 0 && (
                  <p className="text-xs text-destructive">Minimal pilih 1 produk</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Aturan Tambahan */}
        <Card>
          <CardHeader>
            <CardTitle>Aturan Tambahan (Opsional)</CardTitle>
            <CardDescription>
              Tentukan syarat dan ketentuan tambahan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Minimal Transaksi (Rp)</Label>
                <Input
                  value={displayFormatted(formData.min_transaction_amount)}
                  onChange={(e) => handleNumberInput(e, 'min_transaction_amount')}
                  placeholder="Masukkan minimal transaksi"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm">Maksimal Transaksi (Rp)</Label>
                <Input
                  value={displayFormatted(formData.max_transaction_amount)}
                  onChange={(e) => handleNumberInput(e, 'max_transaction_amount')}
                  placeholder="Masukkan maksimal transaksi"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm">Minimal Item (Qty)</Label>
                <Input
                  value={displayFormatted(formData.min_item_quantity)}
                  onChange={(e) => handleNumberInput(e, 'min_item_quantity')}
                  placeholder="Masukkan minimal item"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm">Maksimal Item (Qty)</Label>
                <Input
                  value={displayFormatted(formData.max_item_quantity)}
                  onChange={(e) => handleNumberInput(e, 'max_item_quantity')}
                  placeholder="Masukkan maksimal item"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm">Minimal Potongan (Rp)</Label>
                <Input
                  value={displayFormatted(formData.min_discount_amount)}
                  onChange={(e) => handleNumberInput(e, 'min_discount_amount')}
                  placeholder="Masukkan minimal potongan"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm">Maksimal Potongan (Rp)</Label>
                <Input
                  value={displayFormatted(formData.max_discount_amount)}
                  onChange={(e) => handleNumberInput(e, 'max_discount_amount')}
                  placeholder="Masukkan maksimal potongan"
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
            disabled={
              isSubmitting || 
              (formData.applies_to === 'SPECIFIC_CATEGORIES' && formData.category_ids.length === 0) ||
              (formData.applies_to === 'SPECIFIC_PRODUCTS' && formData.product_ids.length === 0)
            }
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Update Promo
          </Button>
        </div>
      </form>
    </div>
  );
}