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

  const [formData, setFormData] = useState({
    plan_name: '',
    price: '',
    branch_limit: '',
    device_limit: '',
    duration_months: '',
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await fetchWithAuth('/subscription-plan', {
        method: 'POST',
        body: JSON.stringify({
          plan_name: formData.plan_name,
          price: Number(formData.price),
          branch_limit: Number(formData.branch_limit),
          device_limit: Number(formData.device_limit),
          duration_months: Number(formData.duration_months),
          description: formData.description
        }),
      });
      
      alert('Paket langganan berhasil dibuat!');
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
        {/* Grid 2 kolom */}
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
                  placeholder="Masukkan deskripsi paket"
                  disabled={isSubmitting}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Opsional - akan ditampilkan kepada mitra
                </p>
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
                  type="number"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="Masukkan harga paket"
                  required
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">
                  Harga tanpa titik atau koma (contoh: 1000000 untuk Rp 1.000.000)
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
                  Berapa bulan paket ini berlaku (contoh: 1, 6, 12)
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
                <p className="text-xs text-muted-foreground">
                  Jumlah maksimal cabang yang dapat dibuat
                </p>
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
                <p className="text-xs text-muted-foreground">
                  Jumlah maksimal perangkat yang dapat diaktifkan
                </p>
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
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Simpan Paket
          </Button>
        </div>
      </form>
    </div>
  );
}
