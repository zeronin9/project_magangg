// app/(dashboard)/branch/settings/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { branchSettingsAPI } from '@/lib/api/branch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  AlertCircle, 
  Loader2, 
  CheckCircle, 
  CreditCard, 
  Receipt,
  Trash2,
  Save,
  MoreHorizontal,
  Power,
  PowerOff
} from 'lucide-react';

interface PaymentMethod {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
}

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State khusus untuk melacak ID item yang sedang diproses agar loading hanya muncul di item tersebut
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  const [taxData, setTaxData] = useState({
    tax_name: '',
    tax_percentage: '',
    is_active: false,
  });

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  useEffect(() => {
    loadSettings();
  }, []);

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const [taxRes, paymentRes] = await Promise.all([
        branchSettingsAPI.getTax(),
        branchSettingsAPI.getPaymentMethods()
      ]);

      const tax = taxRes.data;
      setTaxData({
        tax_name: tax.tax_name || '',
        tax_percentage: tax.tax_percentage ? tax.tax_percentage.toString() : '',
        is_active: tax.is_active || false,
      });

      setPaymentMethods(Array.isArray(paymentRes.data) ? paymentRes.data : []);

    } catch (err: any) {
      console.error(err);
      setError('Gagal memuat pengaturan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTaxPercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setTaxData({ ...taxData, tax_percentage: value });
  };

  const handleSaveTax = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      const payload = {
        tax_name: taxData.tax_name,
        tax_percentage: Number(taxData.tax_percentage),
      };

      if (!payload.tax_name) throw new Error('Nama pajak wajib diisi');
      if (isNaN(payload.tax_percentage) || payload.tax_percentage < 0 || payload.tax_percentage > 100) {
        throw new Error('Persentase pajak harus antara 0 - 100');
      }

      // ✅ Tambahkan Delay 3 Detik di sini
      await delay(3000);

      await branchSettingsAPI.updateTax(payload);

      setSuccessMessage('Pengaturan pajak berhasil disimpan');
      setTaxData(prev => ({ ...prev, is_active: true }));
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Gagal menyimpan pengaturan pajak';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTax = async () => {
    if (isSubmitting) return;
    if (!confirm('Apakah Anda yakin ingin menonaktifkan pajak?')) return;

    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      await branchSettingsAPI.deleteTax();
      
      setSuccessMessage('Pajak berhasil dinonaktifkan');
      setTaxData({
        tax_name: '',
        tax_percentage: '0',
        is_active: false,
      });

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Gagal menghapus pajak';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePaymentMethod = async (methodId: string, currentStatus: boolean) => {
    if (isSubmitting) return; 

    setProcessingId(methodId); // Set ID yang sedang diproses
    setIsSubmitting(true);
    const newStatus = !currentStatus;

    try {
      await delay(3000); // Delay 3 detik

      await branchSettingsAPI.updatePaymentMethod({
        payment_method_id: methodId,
        is_active: newStatus,
      });

      setPaymentMethods((prev) =>
        prev.map((method) => (method.id === methodId ? { ...method, is_active: newStatus } : method))
      );

    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Gagal memperbarui metode pembayaran';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
      setProcessingId(null); // Reset ID
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8 @container">
      <div className="flex flex-col gap-4 @md:flex-row @md:items-center @md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pengaturan</h1>
          <p className="text-muted-foreground">Kelola pengaturan pajak dan metode pembayaran cabang</p>
        </div>
      </div>

      {successMessage && (
        <Alert className="border-green-600 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-600">{successMessage}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Tax Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Pengaturan Pajak</CardTitle>
              <CardDescription>Atur jenis dan persentase pajak untuk transaksi (PB1, PPN, dll)</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveTax} className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tax_name">Nama Pajak</Label>
                <Input
                  id="tax_name"
                  value={taxData.tax_name}
                  onChange={(e) => setTaxData({ ...taxData, tax_name: e.target.value })}
                  placeholder="Contoh: PB1"
                  required
                  disabled={isSubmitting} 
                />
                <p className="text-xs text-muted-foreground">Label pajak yang muncul di struk.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tax_percentage">Persentase (%)</Label>
                <div className="relative">
                  <Input
                    id="tax_percentage"
                    type="text"
                    value={taxData.tax_percentage}
                    onChange={handleTaxPercentageChange}
                    placeholder="10"
                    className="pr-8"
                    required
                    disabled={isSubmitting}
                  />
                  <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">%</span>
                </div>
                <p className="text-xs text-muted-foreground">Besaran pajak dari total transaksi.</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              {taxData.is_active ? (
                <Button 
                className='bg-black hover:bg-gray-800'
                  type="button" 
                  variant="destructive" 
                  onClick={handleDeleteTax} 
                  disabled={isSubmitting}
                  size="sm"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Non-aktifkan Pajak
                </Button>
              ) : (
                <div className="text-sm text-muted-foreground italic">
                  * Pajak saat ini tidak aktif
                </div>
              )}

              <Button type="submit" disabled={isSubmitting}>
                {/* Loader muncul jika sedang submitting DAN tidak ada proses pembayaran spesifik (artinya sedang save tax) */}
                {isSubmitting && !processingId ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Simpan Perubahan
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Payment Method Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Metode Pembayaran</CardTitle>
              <CardDescription>Aktifkan atau nonaktifkan metode pembayaran yang tersedia di kasir</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-0 divide-y">
            {paymentMethods.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Tidak ada metode pembayaran tersedia.</p>
            ) : (
              paymentMethods.map((method) => (
                <div key={method.id} className="flex items-center justify-between py-4">
                  <div className="space-y-1">
                    <Label 
                      className="text-base font-medium"
                    >
                      {method.name} 
                      <span className="ml-2 text-xs font-normal text-muted-foreground">({method.code})</span>
                    </Label>
                    <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${method.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                            {method.is_active ? 'Aktif' : 'Tidak Aktif'}
                        </span>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" disabled={isSubmitting}>
                        {isSubmitting && processingId === method.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : (
                          <MoreHorizontal className="h-4 w-4" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                      {method.is_active ? (
                        <DropdownMenuItem 
                            onClick={(e) => {
                                e.preventDefault(); 
                                handleTogglePaymentMethod(method.id, method.is_active);
                            }}
                            className="text-destructive focus:text-destructive cursor-pointer"
                            disabled={isSubmitting} 
                        >
                            {isSubmitting && processingId === method.id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <PowerOff className="mr-2 h-4 w-4" />
                            )}
                            Non-aktifkan
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem 
                            onClick={(e) => {
                                e.preventDefault(); 
                                handleTogglePaymentMethod(method.id, method.is_active);
                            }}
                            className="text-green-600 focus:text-green-600 cursor-pointer"
                            disabled={isSubmitting} 
                        >
                            {isSubmitting && processingId === method.id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Power className="mr-2 h-4 w-4" />
                            )}
                            Aktifkan
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))
            )}
          </div>
        </CardContent>
        <CardFooter className="bg-muted/50 px-6 py-4">
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Perubahan metode pembayaran akan langsung terlihat di aplikasi kasir (setelah refresh).</p>
            <p>• Pastikan minimal satu metode pembayaran aktif agar transaksi dapat berjalan.</p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}