'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { discountAPI, categoryAPI, productAPI, branchAPI } from '@/lib/api/mitra';
import { Category, Product, Branch } from '@/types/mitra';
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

export default function NewDiscountPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

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
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [categoriesData, productsData, branchesData] = await Promise.all([
        categoryAPI.getAll(),
        productAPI.getAll(),
        branchAPI.getAll(),
      ]);
      
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      setProducts(Array.isArray(productsData) ? productsData : []);
      setBranches(Array.isArray(branchesData) ? branchesData : []);
    } catch (err: any) {
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
      await delay(2000);

      // Gabungkan tanggal dan waktu
      const startDateTime = `${formData.start_date}T${formData.start_time}:00`;
      const endDateTime = `${formData.end_date}T${formData.end_time}:00`;

      const dataToSend: any = {
        discount_name: formData.discount_name,
        discount_type: formData.discount_type,
        value: formData.value,
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

      if (formData.min_transaction_amount) dataToSend.min_transaction_amount = formData.min_transaction_amount;
      if (formData.max_transaction_amount) dataToSend.max_transaction_amount = formData.max_transaction_amount;
      if (formData.min_item_quantity) dataToSend.min_item_quantity = parseInt(formData.min_item_quantity);
      if (formData.max_item_quantity) dataToSend.max_item_quantity = parseInt(formData.max_item_quantity);
      if (formData.min_discount_amount) dataToSend.min_discount_amount = formData.min_discount_amount;
      if (formData.max_discount_amount) dataToSend.max_discount_amount = formData.max_discount_amount;

      console.log('=== DATA YANG DIKIRIM ===');
      console.log(JSON.stringify(dataToSend, null, 2));
      console.log('========================');

      await discountAPI.create(dataToSend);
      router.push('/mitra/discounts');
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.response?.data?.message || 'Gagal menyimpan Promo');
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
          <h1 className="text-3xl font-bold tracking-tight">Tambah Promo Baru</h1>
          <p className="text-muted-foreground">
            Buat aturan promo baru untuk produk Anda
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
              Tentukan nama dan kode Promo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="discount_name">Nama Promo *</Label>
              <Input
                id="discount_name"
                value={formData.discount_name}
                onChange={(e) => setFormData({ ...formData, discount_name: e.target.value })}
                placeholder="Masukkan nama Promo"
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
                placeholder="Masukkan kode Promo"
                maxLength={20}
                className="font-mono uppercase"
              />
              <p className="text-xs text-muted-foreground">
                Kosongkan jika ingin Promo diterapkan otomatis
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
                    placeholder="Masukkan persentase potongan"
                    required
                  />
                ) : (
                  <Input
                    id="value"
                    value={formData.value ? `Rp. ${Number(formData.value).toLocaleString('id-ID')}` : ''}
                    onChange={(e) => handleNumberInput(e, 'value')}
                    placeholder="Masukkan nominal potongan"
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
              Tentukan masa berlaku Promo (tanggal dan waktu)
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

        {/* Target Promo */}
        <Card>
          <CardHeader>
            <CardTitle>Target Promo</CardTitle>
            <CardDescription>
              Tentukan Promo berlaku untuk apa
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
                  {categories.filter((cat) => !cat.branch_id).length > 0 ? (
                    <div className="space-y-3">
                      {categories
                        .filter((cat) => !cat.branch_id)
                        .map((cat) => (
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
                      Tidak ada kategori general tersedia
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
                  {products.filter((prod) => !prod.branch_id).length > 0 ? (
                    <div className="space-y-3">
                      {products
                        .filter((prod) => !prod.branch_id)
                        .map((prod) => (
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
                      Tidak ada produk general tersedia
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
                  placeholder="Masukkan nominal minimal"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm">Maksimal Transaksi (Rp)</Label>
                <Input
                  value={displayFormatted(formData.max_transaction_amount)}
                  onChange={(e) => handleNumberInput(e, 'max_transaction_amount')}
                  placeholder="Masukkan nominal maksimal"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm">Minimal Item (Qty)</Label>
                <Input
                  value={displayFormatted(formData.min_item_quantity)}
                  onChange={(e) => handleNumberInput(e, 'min_item_quantity')}
                  placeholder="Masukkan jumlah minimal"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm">Maksimal Item (Qty)</Label>
                <Input
                  value={displayFormatted(formData.max_item_quantity)}
                  onChange={(e) => handleNumberInput(e, 'max_item_quantity')}
                  placeholder="Masukkan jumlah maksimal"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm">Minimal Potongan (Rp)</Label>
                <Input
                  value={displayFormatted(formData.min_discount_amount)}
                  onChange={(e) => handleNumberInput(e, 'min_discount_amount')}
                  placeholder="Masukkan nominal minimal potongan"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm">Maksimal Potongan (Rp)</Label>
                <Input
                  value={displayFormatted(formData.max_discount_amount)}
                  onChange={(e) => handleNumberInput(e, 'max_discount_amount')}
                  placeholder="Masukkan nominal maksimal potongan"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 sticky bottom-0 bg-background py-4 border-t">
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
            Simpan Promo
          </Button>
        </div>
      </form>
    </div>
  );
}
