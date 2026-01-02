'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchWithAuth } from '@/lib/api';
import { SubscriptionPlan } from '@/types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Save, Loader2, Package, DollarSign, Building2, Smartphone, Calendar, AlertCircle, FileText } from 'lucide-react';

export default function EditSubscriptionPlanPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);

  const [formData, setFormData] = useState({
    plan_name: '',
    price: '',
    branch_limit: '',
    device_limit: '',
    duration_months: '',
    description: ''
  });

  useEffect(() => {
    if (id) {
      loadPlan();
    }
  }, [id]);

  // ✅ PERBAIKAN: Tambahkan fallback logic untuk fetch plan
  const loadPlan = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      let planData = null;
      
      try {
        // Coba fetch langsung by ID
        planData = await fetchWithAuth(`/subscription-plan/${id}`);
      } catch (directError: any) {
        // Jika gagal, coba dari list semua paket
        console.warn(`⚠️ Direct fetch /subscription-plan/${id} failed, trying fallback...`);
        
        try {
          const allPlans = await fetchWithAuth('/subscription-plan');
          const plansList = Array.isArray(allPlans) ? allPlans : [];
          planData = plansList.find((p: SubscriptionPlan) => p.plan_id === id);
          
          if (!planData) {
            throw new Error('Paket tidak ditemukan dalam daftar');
          }
        } catch (listError: any) {
          console.error('❌ Fallback fetch also failed:', listError);
          throw new Error('Tidak dapat memuat data paket. Endpoint mungkin belum tersedia.');
        }
      }

      if (!planData) {
        throw new Error('Paket tidak ditemukan');
      }
      
      setPlan(planData);
      setFormData({
        plan_name: planData.plan_name,
        price: String(planData.price),
        branch_limit: String(planData.branch_limit),
        device_limit: String(planData.device_limit),
        duration_months: String(planData.duration_months),
        description: planData.description || ''
      });
    } catch (criticalError: any) {
      console.error('❌ Critical Error:', criticalError);
      setError(criticalError.message || 'Gagal memuat data paket');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await fetchWithAuth(`/subscription-plan/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          plan_name: formData.plan_name,
          price: Number(formData.price),
          branch_limit: Number(formData.branch_limit),
          device_limit: Number(formData.device_limit),
          duration_months: Number(formData.duration_months),
          description: formData.description,
          is_active: plan?.is_active
        }),
      });
      
      alert('Paket berhasil diupdate!');
      router.push('/platform/subscription-plans');
    } catch (error: any) {
      console.error('Error updating plan:', error);
      setError(error.message || 'Gagal mengupdate paket. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8 @container">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  // Error State
  if (error && !plan) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Error:</strong> {error}
          </AlertDescription>
        </Alert>
        <Card className="p-12">
          <div className="text-center space-y-4">
            <Package className="mx-auto h-12 w-12 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">Data Tidak Dapat Dimuat</h3>
              <p className="text-sm text-muted-foreground mt-2">{error}</p>
            </div>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => router.back()}>
                Kembali ke Daftar
              </Button>
              <Button onClick={loadPlan}>
                Coba Lagi
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Not Found State
  if (!plan) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
        <Card className="p-12">
          <div className="text-center space-y-4">
            <Package className="mx-auto h-12 w-12 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">Paket Tidak Ditemukan</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Paket dengan ID <code className="bg-muted px-1 rounded">{id}</code> tidak ditemukan.
              </p>
            </div>
            <Button onClick={() => router.push('/platform/subscription-plans')}>
              Kembali ke Daftar Paket
            </Button>
          </div>
        </Card>
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
          Kembali ke Daftar Paket
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Edit Paket Langganan</h2>
          <p className="text-muted-foreground">
            Perbarui informasi paket: {plan.plan_name}
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
                  placeholder="Contoh: Paket Starter, Premium, Enterprise"
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
                  placeholder="Deskripsi singkat tentang paket ini..."
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
                  placeholder="1000000"
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
                  placeholder="12"
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
                  placeholder="5"
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
                  placeholder="10"
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
            Update Paket
          </Button>
        </div>
      </form>
    </div>
  );
}
