// app/(dashboard)/branch/settings/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { branchSettingsAPI } from '@/lib/api/branch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Settings, AlertCircle, Loader2, CheckCircle, CreditCard, Receipt } from 'lucide-react';

export default function SettingsPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  // Tax Settings
  const [taxData, setTaxData] = useState({
    tax_name: '',
    tax_percentage: '',
  });

  // Payment Method Settings (example - adjust based on actual API)
  const [paymentMethods, setPaymentMethods] = useState([
    { id: 'cash', name: 'Cash', is_active: true },
    { id: 'qris', name: 'QRIS', is_active: true },
    { id: 'debit', name: 'Kartu Debit', is_active: true },
    { id: 'credit', name: 'Kartu Kredit', is_active: false },
  ]);

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const handleTaxPercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setTaxData({ ...taxData, tax_percentage: value });
  };

  const handleSaveTax = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      await delay(2000);

      const payload = {
        tax_name: taxData.tax_name,
        tax_percentage: Number(taxData.tax_percentage),
      };

      await branchSettingsAPI.updateTax(payload);

      setSuccessMessage('Pengaturan pajak berhasil disimpan');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Gagal menyimpan pengaturan pajak';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePaymentMethod = async (methodId: string, isActive: boolean) => {
    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      await delay(1500);

      await branchSettingsAPI.updatePaymentMethod({
        payment_method_id: methodId,
        is_active: isActive,
      });

      // Update local state
      setPaymentMethods((prev) =>
        prev.map((method) => (method.id === methodId ? { ...method, is_active: isActive } : method))
      );

      setSuccessMessage('Metode pembayaran berhasil diperbarui');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Gagal memperbarui metode pembayaran';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8 @container">
      {/* Header */}
      <div className="flex flex-col gap-4 @md:flex-row @md:items-center @md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pengaturan</h1>
          <p className="text-muted-foreground">Kelola pengaturan pajak dan metode pembayaran cabang</p>
        </div>
      </div>

      {/* Success Alert */}
      {successMessage && (
        <Alert className="border-green-600 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-600">{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Info Alert */}
      <Alert>
        <Settings className="h-4 w-4" />
        <AlertDescription>
          <strong>Pengaturan Cabang:</strong> Konfigurasi khusus untuk cabang Anda seperti pajak dan metode pembayaran
          yang tersedia.
        </AlertDescription>
      </Alert>

      {/* Tax Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            <div>
              <CardTitle>Pengaturan Pajak</CardTitle>
              <CardDescription>Atur jenis dan persentase pajak untuk transaksi</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveTax} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tax_name">Nama Pajak *</Label>
                <Input
                  id="tax_name"
                  value={taxData.tax_name}
                  onChange={(e) => setTaxData({ ...taxData, tax_name: e.target.value })}
                  placeholder="Contoh: PB1"
                  required
                />
                <p className="text-xs text-muted-foreground">Nama pajak yang akan ditampilkan di struk</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tax_percentage">Persentase Pajak (%) *</Label>
                <Input
                  id="tax_percentage"
                  type="text"
                  value={taxData.tax_percentage}
                  onChange={handleTaxPercentageChange}
                  placeholder="Contoh: 10"
                  required
                />
                <p className="text-xs text-muted-foreground">Persentase pajak yang akan dikenakan</p>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan Pengaturan Pajak
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Payment Method Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            <div>
              <CardTitle>Metode Pembayaran</CardTitle>
              <CardDescription>Aktifkan atau nonaktifkan metode pembayaran yang tersedia</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {paymentMethods.map((method, index) => (
              <div key={method.id}>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor={`payment-${method.id}`} className="text-base font-medium">
                      {method.name}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {method.is_active ? 'Tersedia untuk pembayaran' : 'Tidak tersedia'}
                    </p>
                  </div>
                  <Switch
                    id={`payment-${method.id}`}
                    checked={method.is_active}
                    onCheckedChange={(checked) => handleTogglePaymentMethod(method.id, checked)}
                    disabled={isSubmitting}
                  />
                </div>
                {index < paymentMethods.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Additional Info */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-base">Informasi Tambahan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            • <strong>Pajak:</strong> Akan diterapkan otomatis pada semua transaksi di cabang ini.
          </p>
          <p>
            • <strong>Metode Pembayaran:</strong> Hanya metode yang diaktifkan yang akan muncul di kasir.
          </p>
          <p>• Perubahan akan berlaku segera setelah disimpan.</p>
        </CardContent>
      </Card>
    </div>
  );
}
