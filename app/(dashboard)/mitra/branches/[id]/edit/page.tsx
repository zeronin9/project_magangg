'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { branchAPI } from '@/lib/api/mitra';
import { Branch } from '@/types/mitra';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft,
  AlertCircle,
  Loader2,
  Building2,
  MapPin,
  Phone,
  Info
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditBranchPage() {
  const router = useRouter();
  const params = useParams();
  const branchId = params.id as string;

  const [branch, setBranch] = useState<Branch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    branch_name: '',
    address: '',
    phone_number: '',
  });

  useEffect(() => {
    loadBranch();
  }, [branchId]);

  const loadBranch = async () => {
    try {
      setIsLoading(true);
      const branchesData = await branchAPI.getAll(false);

      // Find branch by ID
      const branchesList = Array.isArray(branchesData) ? branchesData : [];
      const foundBranch = branchesList.find((b: any) => b.branch_id === branchId);

      if (!foundBranch) {
        setError('Cabang tidak ditemukan');
        return;
      }

      setBranch(foundBranch);
      setFormData({
        branch_name: foundBranch.branch_name,
        address: foundBranch.address || '',
        phone_number: foundBranch.phone_number || '',
      });
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data cabang');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await branchAPI.update(branchId, formData);
      router.push('/mitra/branches');
    } catch (err: any) {
      console.error('Error response:', err.response?.data);
      const errorMessage = err.response?.data?.message || err.message || 'Gagal memperbarui cabang';
      setError(errorMessage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers, spaces, hyphens, and plus sign
    const value = e.target.value.replace(/[^0-9\s\-+]/g, '');
    setFormData({ ...formData, phone_number: value });
  };

  if (isLoading) {
    return (
      <div className="flex-1 space-y-6 p-4 pt-6 md:p-6 lg:p-8 @container">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-10 w-48" />
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <Skeleton className="h-12 w-full max-w-2xl" />
        <Card className="max-w-2xl p-6 md:p-8">
          <div className="space-y-6">
            <div className="space-y-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-px w-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-24 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-px w-full" />
            <div className="flex gap-3">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 flex-1" />
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (error && !branch) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8">
        <Button
          variant="ghost"
          className="w-fit -ml-4"
          onClick={() => router.push('/mitra/branches')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Daftar Cabang
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-4 pt-6 md:p-6 lg:p-8 @container">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          className="w-fit -ml-4"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Daftar Cabang
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Building2 className="h-8 w-8" />
            Edit Cabang
          </h1>
          <p className="text-muted-foreground mt-1">
            Perbarui informasi cabang <strong>{branch?.branch_name}</strong>
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

      {/* Form Card */}
      <Card className="">
        <form onSubmit={handleSubmit} className="p-6 md:p-8">
          <div className="space-y-6">
            {/* Branch Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Building2 className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">Informasi Cabang</h3>
              </div>

              {/* Branch Name */}
              <div className="space-y-2">
                <Label htmlFor="branch_name" className="text-base font-semibold">
                  Nama Cabang <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="branch_name"
                  value={formData.branch_name}
                  onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
                  placeholder="Masukkan nama cabang"
                  required
                  disabled={isSubmitting}
                  className="text-base"
                />
                <p className="text-xs text-muted-foreground">
                  Nama cabang yang mudah dikenali dan membedakan dengan cabang lain
                </p>
              </div>
            </div>

            <div className="border-t pt-6" />

            {/* Contact Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <MapPin className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">Informasi Kontak</h3>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="address" className="text-base font-semibold">
                  Alamat Lengkap
                </Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Masukkan alamat lengkap cabang"
                  disabled={isSubmitting}
                  className="text-base min-h-[100px] resize-none"
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Alamat lengkap cabang untuk keperluan operasional dan pengiriman
                </p>
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <Label htmlFor="phone_number" className="text-base font-semibold">
                  Nomor Telepon
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone_number"
                    type="tel"
                    value={formData.phone_number}
                    onChange={handlePhoneChange}
                    placeholder="masukkan nomor telepon cabang"
                    disabled={isSubmitting}
                    className="text-base pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Nomor telepon yang dapat dihubungi untuk cabang ini
                </p>
              </div>
            </div>

            <div className="border-t pt-6" />

            {/* Form Actions */}
            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.back()} 
                disabled={isSubmitting}
                className="flex-1"
              >
                Batal
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !formData.branch_name}
                className="flex-1"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
}
