'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithAuth } from '@/lib/api';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Save, Loader2, Building2, Mail, Phone, User, Lock, AlertCircle } from 'lucide-react';
import { toast } from "sonner"; // Opsional: Jika Anda menggunakan toast untuk notifikasi

export default function NewPartnerPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    business_name: '',
    business_email: '',
    business_phone: '',
    username: '', 
    password: ''  
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validasi Frontend Sederhana
    if (!formData.business_name || !formData.business_email || !formData.business_phone || !formData.username || !formData.password) {
      setError('Semua field wajib diisi');
      return;
    }

    setIsSubmitting(true);

    try {
      // PERBAIKAN: Hapus headers manual, biarkan fetchWithAuth yang mengurusnya
      // Gunakan apiClient.post() yang sudah Anda buat di lib/api.ts agar lebih konsisten
      // ATAU gunakan fetchWithAuth tanpa mendefinisikan headers content-type manual
      
      const response = await fetchWithAuth('/partner', {
        method: 'POST',
        body: formData, // fetchWithAuth di lib/api.ts Anda otomatis men-stringify jika bukan FormData
      });

      console.log('Success Response:', response);
      // Gunakan alert bawaan browser dulu untuk memastikan
      alert('Mitra berhasil ditambahkan!'); 
      router.push('/platform/partners');

    } catch (err: any) {
      console.error('Error adding partner:', err);
      // Karena backend belum diperbaiki urutannya, kita menebak errornya
      setError(err.message || 'Gagal menambahkan mitra. Cek kembali data inputan (Username/Email mungkin sudah terpakai).');
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
          Kembali ke Daftar Mitra
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tambah Mitra Baru</h2>
          <p className="text-muted-foreground">
            Buat mitra baru dan akun Super Admin untuk mengakses sistem
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
          {/* Informasi Bisnis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Informasi Bisnis
              </CardTitle>
              <CardDescription>
                Data bisnis mitra yang akan ditambahkan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="business_name">
                  Nama Bisnis <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="business_name"
                  value={formData.business_name}
                  onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                  placeholder="PT. Contoh Sukses"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="business_email">
                  <Mail className="inline h-4 w-4 mr-1" />
                  Email Bisnis <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="business_email"
                  type="email"
                  value={formData.business_email}
                  onChange={(e) => setFormData({ ...formData, business_email: e.target.value })}
                  placeholder="bisnis@contoh.com"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="business_phone">
                  <Phone className="inline h-4 w-4 mr-1" />
                  Nomor Telepon <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="business_phone"
                  type="tel"
                  value={formData.business_phone}
                  onChange={(e) => setFormData({ ...formData, business_phone: e.target.value })}
                  placeholder="08123456789"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </CardContent>
          </Card>

          {/* Akun Super Admin */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Akun Super Admin
              </CardTitle>
              <CardDescription>
                Akun ini akan menjadi admin utama untuk mitra tersebut
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-blue-50/50 border-blue-200 text-blue-800">
                <AlertCircle className="h-4 w-4 text-blue-800" />
                <AlertDescription className="text-xs">
                  Sistem akan otomatis membuat akun User dengan role <b>Super Admin</b> yang terhubung ke Mitra ini.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="username">
                  <User className="inline h-4 w-4 mr-1" />
                  Username Admin <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="admin.contoh"
                  required
                  disabled={isSubmitting}
                  className="font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  <Lock className="inline h-4 w-4 mr-1" />
                  Password <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="******"
                  required
                  disabled={isSubmitting}
                  minLength={6}
                />
              </div>
            </CardContent>
          </Card>
        </div>

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
            Simpan Mitra
          </Button>
        </div>
      </form>
    </div>
  );
}