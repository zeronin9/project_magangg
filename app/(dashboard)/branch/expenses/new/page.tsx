'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { expenseAPI } from '@/lib/api/branch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  AlertCircle,
  Upload,
  ArrowLeft,
  Save,
  DollarSign,
  FileText,
  Calendar,
  Image as ImageIcon,
  Receipt,
} from 'lucide-react';
import Image from 'next/image';

export default function NewExpensePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageError, setImageError] = useState('');
  const [imagePreview, setImagePreview] = useState<string>('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    expense_date: new Date().toISOString().split('T')[0],
    proof_image: null as File | null,
  });

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];

      if (!allowedTypes.includes(file.type)) {
        setImageError('Format file tidak valid! Gunakan JPEG, JPG, atau PNG.');
        e.target.value = '';
        setFormData({ ...formData, proof_image: null });
        setImagePreview('');
        return;
      }

      if (file.size > 1 * 1024 * 1024) {
        setImageError('Ukuran gambar terlalu besar! Maksimal 1MB.');
        e.target.value = '';
        setFormData({ ...formData, proof_image: null });
        setImagePreview('');
        return;
      }

      setImageError('');
      setFormData({ ...formData, proof_image: file });

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setFormData({ ...formData, amount: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (imageError) return;

    setIsSubmitting(true);
    setError('');

    try {
      await delay(3000); // 3 detik delay
      
      const formDataToSend = new FormData();
      formDataToSend.append('amount', formData.amount);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('expense_date', formData.expense_date);

      if (formData.proof_image) {
        formDataToSend.append('proof_image', formData.proof_image);
      }

      await expenseAPI.create(formDataToSend);

      router.push('/branch/expenses');
    } catch (err: any) {
      console.error('Error response:', err.response?.data);
      const errorMessage = err.response?.data?.message || err.message || 'Gagal menyimpan kas keluar';
      setError(errorMessage);
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
          Kembali ke Kas Keluar
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tambah Kas Keluar</h1>
          <p className="text-muted-foreground">
            Catat pengeluaran operasional cabang dengan bukti (opsional)
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
        {/* Informasi Pengeluaran */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Informasi Pengeluaran
            </CardTitle>
            <CardDescription>
              Detail pengeluaran yang akan dicatat
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Jumlah Pengeluaran */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Jumlah Pengeluaran *
              </Label>
              <Input
                id="amount"
                type="text"
                value={formData.amount ? `Rp. ${Number(formData.amount).toLocaleString('id-ID')}` : ''}
                onChange={handleAmountChange}
                placeholder="Masukkan jumlah pengeluaran"
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Deskripsi */}
            <div className="space-y-2">
              <Label htmlFor="description" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Deskripsi *
              </Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Masukkan deskripsi pengeluaran"
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Tanggal */}
            <div className="space-y-2">
              <Label htmlFor="expense_date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Tanggal Pengeluaran *
              </Label>
              <Input
                id="expense_date"
                type="date"
                value={formData.expense_date}
                onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                required
                disabled={isSubmitting}
              />
            </div>
          </CardContent>
        </Card>

        {/* Bukti Pengeluaran */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Bukti Pengeluaran
            </CardTitle>
            <CardDescription>
              Upload foto struk atau bukti pembayaran (Opsional)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {imageError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm font-medium">{imageError}</AlertDescription>
              </Alert>
            )}

            {/* Preview Gambar */}
            {imagePreview && (
              <div className="space-y-2">
                <Label>Preview Bukti</Label>
                <div className="relative aspect-video w-full rounded-lg overflow-hidden border bg-muted">
                  <Image 
                    src={imagePreview} 
                    alt="Preview Bukti" 
                    fill 
                    className="object-contain" 
                    unoptimized={true} 
                  />
                </div>
              </div>
            )}
            
            {/* Upload Area */}
            <div className="space-y-2">
              <Label htmlFor="proof_image">
                {imagePreview ? 'Ganti Bukti' : 'Upload Bukti'}
              </Label>
              <Input
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                onChange={handleImageChange}
                className="hidden"
                id="proof_image"
                disabled={isSubmitting}
              />
              <Label htmlFor="proof_image" className="cursor-pointer">
                <div className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-lg p-8 transition-colors ${
                  imageError 
                    ? 'border-destructive bg-destructive/5' 
                    : 'hover:bg-muted/50 border-muted-foreground/25'
                } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <div className={`p-3 rounded-full ${imageError ? 'bg-destructive/10' : 'bg-muted'}`}>
                    <Upload className={`h-6 w-6 ${imageError ? 'text-destructive' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="text-center space-y-1">
                    <p className={`text-sm font-medium ${imageError ? 'text-destructive' : 'text-foreground'}`}>
                      {imagePreview ? 'Klik untuk mengganti bukti' : 'Klik untuk upload bukti'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      JPG, JPEG, atau PNG (Max. 1MB)
                    </p>
                  </div>
                </div>
              </Label>
            </div>
          </CardContent>
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
          <Button type="submit" disabled={isSubmitting || !!imageError}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Simpan Pengeluaran
          </Button>
        </div>
      </form>
    </div>
  );
}
