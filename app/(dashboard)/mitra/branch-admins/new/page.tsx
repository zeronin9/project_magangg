'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { branchAdminAPI, branchAPI } from '@/lib/api/mitra';
import { Branch } from '@/types/mitra';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
  Users,
  Building2,
  User,
  Lock,
  Info
} from 'lucide-react';

export default function NewBranchAdminPage() {
  const router = useRouter();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    password: '',
    confirmPassword: '',
    branch_id: '',
  });

  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      setIsLoading(true);
      const branchesData = await branchAPI.getAll();
      const branchesList = Array.isArray(branchesData) ? branchesData : [];
      setBranches(branchesList);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data cabang');
    } finally {
      setIsLoading(false);
    }
  };

  const validatePassword = () => {
    if (formData.password !== formData.confirmPassword) {
      setPasswordError('Password dan konfirmasi password tidak cocok');
      return false;
    }
    if (formData.password.length < 6) {
      setPasswordError('Password minimal 6 karakter');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePassword()) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const submitData = {
        full_name: formData.full_name,
        username: formData.username,
        password: formData.password,
        branch_id: formData.branch_id,
      };

      await branchAdminAPI.create(submitData);
      router.push('/mitra/branch-admins');
    } catch (err: any) {
      console.error('Error response:', err.response?.data);
      const errorMessage = err.response?.data?.message || err.message || 'Gagal membuat admin cabang';
      setError(errorMessage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, password: e.target.value });
    setPasswordError('');
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, confirmPassword: e.target.value });
    setPasswordError('');
  };

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8">
        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Memuat data...</p>
          </div>
        </div>
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
          Kembali ke Daftar Admin Cabang
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Users className="h-8 w-8" />
            Tambah Admin Cabang Baru
          </h1>
          <p className="text-muted-foreground mt-1">
            Buat akun admin baru untuk mengelola cabang tertentu
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
        <form onSubmit={handleSubmit} className="p-6 md:p-8" id="admin-form">
          <div className="space-y-6">
            {/* Personal Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <User className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">Informasi Personal</h3>
              </div>

              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-base font-semibold">
                  Nama Lengkap <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Masukkan nama lengkap"
                  required
                  disabled={isSubmitting}
                  className="text-base"
                />
                <p className="text-xs text-muted-foreground">
                  Nama lengkap admin yang akan ditampilkan di sistem
                </p>
              </div>
            </div>

            <div className="border-t pt-6" />

            {/* Account Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Lock className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">Informasi Akun</h3>
              </div>

              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-base font-semibold">
                  Username <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Masukkan username"
                  required
                  disabled={isSubmitting}
                  className="text-base"
                  autoComplete="off"
                />
                <p className="text-xs text-muted-foreground">
                  Username harus unik dan akan digunakan untuk login
                </p>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-base font-semibold">
                  Password <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={handlePasswordChange}
                  placeholder="Masukkan password"
                  required
                  disabled={isSubmitting}
                  className="text-base"
                  autoComplete="new-password"
                />
                <p className="text-xs text-muted-foreground">
                  Minimal 6 karakter
                </p>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-base font-semibold">
                  Konfirmasi Password <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  placeholder="Masukkan ulang password"
                  required
                  disabled={isSubmitting}
                  className="text-base"
                  autoComplete="new-password"
                />
                {passwordError && (
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">{passwordError}</AlertDescription>
                  </Alert>
                )}
              </div>
            </div>

            <div className="border-t pt-6" />

            {/* Branch Assignment Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Building2 className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">Penugasan Cabang</h3>
              </div>

              {/* Branch Selection */}
              <div className="space-y-2">
                <Label htmlFor="branch_id" className="text-base font-semibold">
                  Cabang <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.branch_id}
                  onValueChange={(value) => setFormData({ ...formData, branch_id: value })}
                  required
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="text-base">
                    <SelectValue placeholder="Pilih cabang untuk admin ini" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.length > 0 ? (
                      branches.map((branch) => (
                        <SelectItem key={branch.branch_id} value={branch.branch_id}>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            {branch.branch_name}
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-8 text-center text-sm text-muted-foreground">
                        <Building2 className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                        <p>Tidak ada cabang tersedia</p>
                        <p className="text-xs mt-1">Silakan buat cabang terlebih dahulu</p>
                      </div>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Admin hanya dapat mengakses data dari cabang yang dipilih
                </p>
              </div>
            </div>
          </div>
        </form>
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
            !formData.full_name || 
            !formData.username || 
            !formData.password || 
            !formData.confirmPassword || 
            !formData.branch_id ||
            !!passwordError
          }
          form="admin-form"
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? 'Menyimpan...' : 'Simpan Admin Cabang'}
        </Button>
      </div>
    </div>
  );
}
