'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { branchAPI } from '@/lib/api/mitra';
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

export default function NewBranchPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    branch_name: '',
    address: '',
    phone_number: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await branchAPI.create(formData);
      router.push('/mitra/branches');
    } catch (err: any) {
      console.error('Error response:', err.response?.data);
      
      if (err.response?.status === 403) {
        setError('Gagal: Anda telah mencapai batas jumlah cabang untuk paket ini. Silakan upgrade paket Anda.');
      } else {
        const errorMessage = err.response?.data?.message || err.message || 'Gagal membuat cabang';
        setError(errorMessage);
      }
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
            Tambah Cabang Baru
          </h1>
          <p className="text-muted-foreground mt-1">
            Buat cabang baru untuk memperluas bisnis Anda
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
                    placeholder="Masukkan nomor telepon cabang"
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
                {isSubmitting ? 'Menyimpan...' : 'Simpan Cabang'}
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
}
