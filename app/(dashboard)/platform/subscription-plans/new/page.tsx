'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithAuth } from '@/lib/api';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Save, Loader2, Package, DollarSign, Building2, Smartphone, Calendar, AlertCircle, FileText } from 'lucide-react';

export default function NewSubscriptionPlanPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // State form
  const [formData, setFormData] = useState({
    plan_name: '',
    price: '', // Disimpan sebagai string terformat (Rp 10.000) agar input terkontrol
    branch_limit: '',
    device_limit: '',
    duration_months: '',
    description: ''
  });

  // Helper: Format Angka ke Rupiah
  const formatRupiah = (value: string) => {
    // 1. Hapus semua karakter selain angka
    const numberString = value.replace(/[^0-9]/g, '');
    if (!numberString) return '';

    // 2. Format menggunakan Intl.NumberFormat
    const numberValue = parseInt(numberString, 10);
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numberValue); // Hasil: "Rp 10.000"
  };

  // Helper: Handle Perubahan Input Harga
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    // Format value menjadi Rupiah
    const formattedValue = formatRupiah(rawValue);
    setFormData({ ...formData, price: formattedValue });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validasi sederhana
    if (!formData.plan_name || !formData.price || !formData.branch_limit || !formData.device_limit || !formData.duration_months) {
        setError('Mohon lengkapi semua field yang bertanda bintang (*)');
        return;
    }

    setIsSubmitting(true);

    try {
      // 1. Bersihkan Harga dari format Rupiah (ambil angkanya saja)
      const cleanPrice = formData.price.replace(/[^0-9]/g, '');

      // 2. Kirim ke Backend + Delay 3 Detik
      await Promise.all([
        fetchWithAuth('/subscription-plan', {
          method: 'POST',
          body: {
            plan_name: formData.plan_name,
            price: Number(cleanPrice), // Konversi ke Number
            branch_limit: Number(formData.branch_limit),
            device_limit: Number(formData.device_limit),
            duration_months: Number(formData.duration_months),
            description: formData.description
          },
        }),
        new Promise(resolve => setTimeout(resolve, 3000)) // Delay minimal 3 detik
      ]);
      
      // Alert dihapus sesuai permintaan
      // Redirect ke halaman list
      router.push('/platform/subscription-plans');

    } catch (error: any) {
      console.error('Error creating plan:', error);
      setError(error.message || 'Gagal membuat paket. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          Kembali ke Daftar Paket
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Buat Paket Langganan Baru</h2>
          <p className="text-muted-foreground">
            Tentukan harga, limit cabang, device, dan durasi paket
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Informasi Paket */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Informasi Paket
              </CardTitle>
              <CardDescription>
                Nama dan deskripsi paket langganan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="plan_name">
                  Nama Paket <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="plan_name"
                  value={formData.plan_name}
                  onChange={(e) => setFormData({ ...formData, plan_name: e.target.value })}
                  placeholder="Masukkan nama paket"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  <FileText className="inline h-4 w-4 mr-1" />
                  Deskripsi Paket
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Masukkan deskripsi detail paket..."
                  disabled={isSubmitting}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Harga & Durasi */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Harga & Durasi
              </CardTitle>
              <CardDescription>
                Tentukan biaya dan periode langganan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="price">
                  Harga (Rp) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="price"
                  type="text" 
                  value={formData.price}
                  onChange={handlePriceChange}
                  placeholder="Masukkan harga paket"
                  required
                  disabled={isSubmitting}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Masukkan angka saja, format Rupiah akan otomatis muncul.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration_months">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Durasi (Bulan) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="duration_months"
                  type="number"
                  min="1"
                  value={formData.duration_months}
                  onChange={(e) => setFormData({ ...formData, duration_months: e.target.value })}
                  placeholder="Masukkan durasi paket"
                  required
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">
                  Masa aktif paket dalam bulan (1 Tahun = 12 Bulan)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Limit Fitur */}
        <Card>
          <CardHeader>
            <CardTitle>Limit Fitur Paket</CardTitle>
            <CardDescription>
              Batasi jumlah cabang dan perangkat yang dapat digunakan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="branch_limit">
                  <Building2 className="inline h-4 w-4 mr-1" />
                  Limit Cabang <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="branch_limit"
                  type="number"
                  min="1"
                  value={formData.branch_limit}
                  onChange={(e) => setFormData({ ...formData, branch_limit: e.target.value })}
                  placeholder="Masukkan limit cabang"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="device_limit">
                  <Smartphone className="inline h-4 w-4 mr-1" />
                  Limit Device <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="device_limit"
                  type="number"
                  min="1"
                  value={formData.device_limit}
                  onChange={(e) => setFormData({ ...formData, device_limit: e.target.value })}
                  placeholder="Masukkan limit device"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.back()}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Batal
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Simpan Paket
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}