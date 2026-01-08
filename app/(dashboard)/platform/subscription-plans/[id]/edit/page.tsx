'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { fetchWithAuth } from '@/lib/api';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Save, Loader2, Package, DollarSign, Building2, Smartphone, Calendar, AlertCircle, FileText } from 'lucide-react';
import { DetailSkeleton } from '@/components/skeletons/DetailSkeleton';

export default function EditSubscriptionPlanPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    plan_name: '',
    price: '', // String format Rupiah (Rp 10.000)
    branch_limit: '',
    device_limit: '',
    duration_months: '',
    description: ''
  });

  // Helper: Format Rupiah
  const formatRupiah = (value: string | number) => {
    if (!value) return '';
    const numberString = value.toString().replace(/[^0-9]/g, '');
    const numberValue = parseInt(numberString, 10);
    if (isNaN(numberValue)) return '';
    
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numberValue);
  };

  // 1. Fetch Data saat halaman dimuat
  useEffect(() => {
    if (id) {
      loadPlan();
    }
  }, [id]);

  const loadPlan = async () => {
    try {
      setIsLoading(true);
      setError('');

      // WORKAROUND: Ambil semua paket lalu filter manual jika endpoint detail belum ada
      const allPlans = await fetchWithAuth('/subscription-plan');
      
      const plan = Array.isArray(allPlans) 
        ? allPlans.find((p: any) => p.plan_id === id)
        : null;

      if (!plan) {
        throw new Error('Paket langganan tidak ditemukan.');
      }

      // Isi Form dengan data yang ada
      setFormData({
        plan_name: plan.plan_name,
        price: formatRupiah(plan.price),
        branch_limit: plan.branch_limit.toString(),
        device_limit: plan.device_limit.toString(),
        duration_months: plan.duration_months.toString(),
        description: plan.description || ''
      });

    } catch (err: any) {
      console.error('Error loading plan:', err);
      setError('Gagal memuat data paket. ' + (err.message || ''));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Perubahan Input Harga
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    setFormData({ ...formData, price: formatRupiah(rawValue) });
  };

  // 2. Handle Submit (Update Data)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.plan_name || !formData.price || !formData.branch_limit || !formData.device_limit || !formData.duration_months) {
        setError('Mohon lengkapi semua field wajib.');
        return;
    }

    setIsSubmitting(true);

    try {
      // Bersihkan format Rupiah menjadi angka murni
      const cleanPrice = formData.price.replace(/[^0-9]/g, '');

      // Kirim Request UPDATE (PUT) + Delay 3 Detik
      await Promise.all([
        fetchWithAuth(`/subscription-plan/${id}`, {
          method: 'PUT',
          body: {
            plan_name: formData.plan_name,
            price: Number(cleanPrice),
            branch_limit: Number(formData.branch_limit),
            device_limit: Number(formData.device_limit),
            duration_months: Number(formData.duration_months),
            description: formData.description
          },
        }),
        new Promise(resolve => setTimeout(resolve, 3000)) // Delay minimal 3 detik
      ]);
      
      // Redirect tanpa alert toast
      router.push('/platform/subscription-plans');

    } catch (error: any) {
      console.error('Error updating plan:', error);
      setError(error.message || 'Gagal memperbarui paket.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <DetailSkeleton />;

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8 @container">
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          className="w-fit -ml-4"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Batal Edit
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Edit Paket Langganan</h2>
          <p className="text-muted-foreground">
            Perbarui informasi paket {formData.plan_name && `"${formData.plan_name}"`}
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
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Informasi Paket */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Informasi Paket
              </CardTitle>
              <CardDescription>Nama dan deskripsi paket</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="plan_name">Nama Paket <span className="text-destructive">*</span></Label>
                <Input
                  id="plan_name"
                  value={formData.plan_name}
                  onChange={(e) => setFormData({ ...formData, plan_name: e.target.value })}
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">
                  <FileText className="inline h-4 w-4 mr-1" />
                  Deskripsi
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
              <CardDescription>Biaya dan periode langganan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="price">Harga (Rp) <span className="text-destructive">*</span></Label>
                <Input
                  id="price"
                  type="text"
                  value={formData.price}
                  onChange={handlePriceChange}
                  placeholder="Rp 0"
                  required
                  disabled={isSubmitting}
                  className="font-mono"
                />
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
                  required
                  disabled={isSubmitting}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Limit Fitur */}
        <Card>
          <CardHeader>
            <CardTitle>Limit Fitur</CardTitle>
            <CardDescription>Batasan cabang dan perangkat</CardDescription>
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
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
            Batal
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Simpan Perubahan
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}