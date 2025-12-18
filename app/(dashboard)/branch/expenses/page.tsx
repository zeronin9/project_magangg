// app/(dashboard)/branch/expenses/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { expenseAPI } from '@/lib/api/branch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Plus,
  MoreHorizontal,
  Trash2,
  AlertCircle,
  Loader2,
  AlertTriangle,
  Upload,
  Calendar,
  Eye,
  Image as ImageIcon,
  X,
  Download,
  FileText,
  User,
  Search,
} from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { formatRupiah } from '@/lib/utils';
import { MetaPagination } from '@/lib/services/fetchData';

interface Expense {
  expense_id: string;
  amount: number;
  description: string;
  expense_date: string;
  proof_image?: string;
  shift_id?: string | null;
  created_at: string;
  user?: {
    full_name: string;
  };
  shift?: {
    cashier?: {
      full_name: string;
    };
  };
}

const getImageUrl = (path: string | null | undefined) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';
  const serverUrl = apiBaseUrl.replace(/\/api\/?$/, '');
  const cleanPath = path.replace(/\\/g, '/').replace(/^\//, '');
  return `${serverUrl}/${cleanPath}`;
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  // ✅ State untuk Meta Pagination
  const [meta, setMeta] = useState<MetaPagination | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [selectedProof, setSelectedProof] = useState<{
    image_url: string;
    description: string;
    amount: string;
    date: string;
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageError, setImageError] = useState('');
  const [imagePreview, setImagePreview] = useState<string>('');

  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    expense_date: '',
    proof_image: null as File | null,
  });

  // ✅ Trigger loadData saat page atau search berubah
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchQuery]);

  // Reset page ke 1 saat melakukan pencarian
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError('');

      // ✅ Panggil API dengan parameter Pagination & Search
      const response = await expenseAPI.getAll({
        page: currentPage,
        limit: 10,
        search: searchQuery
      });

      setExpenses(response.items);
      setMeta(response.meta);

    } catch (err: any) {
      setError(err.message || 'Gagal memuat data kas keluar');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Handlers Modal Create ---
  const handleOpenModal = () => {
    setSelectedExpense(null);
    const today = new Date().toISOString().split('T')[0];
    setFormData({
      amount: '',
      description: '',
      expense_date: today,
      proof_image: null,
    });
    setImagePreview('');
    setImageError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedExpense(null);
    setFormData({
      amount: '',
      description: '',
      expense_date: '',
      proof_image: null,
    });
    setImagePreview('');
    setImageError('');
  };

  // --- Handlers Modal View Proof ---
  const handleViewProof = (expense: Expense) => {
    const imageUrl = getImageUrl(expense.proof_image);
    
    setSelectedProof({
      image_url: imageUrl,
      description: expense.description,
      amount: formatRupiah(Number(expense.amount)),
      date: format(new Date(expense.expense_date), 'dd MMMM yyyy', { locale: id }),
    });
    setIsProofModalOpen(true);
  };

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

      if (file.size > 2 * 1024 * 1024) {
        setImageError('Ukuran gambar terlalu besar! Maksimal 2MB.');
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

    try {
      await delay(2000);
      const formDataToSend = new FormData();
      formDataToSend.append('amount', formData.amount);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('expense_date', formData.expense_date);

      if (formData.proof_image) {
        formDataToSend.append('proof_image', formData.proof_image);
      }

      await expenseAPI.create(formDataToSend);

      await loadData();
      handleCloseModal();
    } catch (err: any) {
      console.error('Error response:', err.response?.data);
      const errorMessage = err.response?.data?.message || err.message || 'Gagal menyimpan kas keluar';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedExpense) return;

    setIsSubmitting(true);
    try {
      await delay(2000);
      await expenseAPI.delete(selectedExpense.expense_id);
      await loadData();
      setIsDeleteOpen(false);
      setSelectedExpense(null);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Gagal menghapus kas keluar';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ Helper Pagination
  const handlePageChange = (page: number) => {
    if (meta && page > 0 && page <= meta.total_pages) {
      setCurrentPage(page);
    }
  };

  // Hitung total halaman ini (karena pagination server-side tidak return total sum semua data kecuali endpoint khusus report)
  const currentPageTotal = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8 @container">
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 mb-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Card>
          <div className="p-6">
            <Skeleton className="h-64 w-full" />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8 @container">
      {/* Header */}
      <div className="flex flex-col gap-4 @md:flex-row @md:items-center @md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kas Keluar</h1>
          <p className="text-muted-foreground">Catat dan kelola pengeluaran operasional cabang</p>
        </div>
        <Button onClick={handleOpenModal}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Pengeluaran
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total (Halaman Ini)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-black">{formatRupiah(currentPageTotal)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Jumlah Pengeluaran</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Menggunakan meta.total_items untuk total keseluruhan */}
            <div className="text-3xl font-bold text-black">{meta ? meta.total_items : 0} item</div>
          </CardContent>
        </Card>
      </div>

      {/* Table Section */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Pengeluaran</CardTitle>
          <CardDescription>Daftar lengkap transaksi kas keluar</CardDescription>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                {searchQuery ? 'Tidak ada hasil pencarian' : 'Belum ada data pengeluaran'}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16 text-center">No</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Deskripsi</TableHead>
                      <TableHead className="w-48">Input Oleh</TableHead>
                      <TableHead>Jumlah</TableHead>
                      <TableHead className="text-center">Bukti</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((expense, index) => {
                      // Hitung nomor urut global
                      const globalIndex = meta ? (meta.current_page - 1) * 10 + index + 1 : index + 1;
                      
                      const operatorName = expense.user?.full_name || '-';
                      const cashierName = expense.shift?.cashier?.full_name || '-';
                      const showBothRoles = operatorName !== cashierName && cashierName !== '-';

                      return (
                        <TableRow key={expense.expense_id}>
                          <TableCell className="font-medium text-center">
                            {globalIndex}
                          </TableCell>
                          <TableCell className="text-sm">
                            <div className="flex flex-col gap-1">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                {format(new Date(expense.expense_date), 'dd MMM yyyy', { locale: id })}
                              </span>
                              {expense.shift_id && (
                                <Badge variant="outline" className="w-fit text-[10px] h-5">
                                  Shift
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate" title={expense.description}>
                            {expense.description}
                          </TableCell>
                          
                          <TableCell className="text-sm">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2">
                                <User className="h-3.5 w-3.5 text-black flex-shrink-0" />
                                <div>
                                  <div className="font-medium text-gray-900 text-sm">
                                    {cashierName}
                                  </div>
                                </div>
                              </div>
                              
                              {showBothRoles && (
                                <div className="flex items-center gap-2 pl-1 pt-1 border-t border-gray-100">
                                  <div>
                                    <div className="font-medium text-gray-700 text-xs">
                                      {operatorName}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </TableCell>

                          <TableCell className="font-bold text-black">
                            {formatRupiah(Number(expense.amount))}
                          </TableCell>
                          <TableCell className="text-center">
                            {expense.proof_image ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewProof(expense)}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8"
                              >
                                <Eye className="mr-1 h-3.5 w-3.5" />
                                Lihat
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">Tidak ada</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedExpense(expense);
                                    setIsDeleteOpen(true);
                                  }}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Hapus
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* ✅ Pagination Component */}
              {meta && meta.total_pages > 1 && (
                <div className="py-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(currentPage - 1);
                          }}
                          className={!meta.has_prev_page ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>

                      <PaginationItem>
                        <span className="flex items-center px-4 text-sm font-medium">
                          Halaman {meta.current_page} dari {meta.total_pages}
                        </span>
                      </PaginationItem>

                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(currentPage + 1);
                          }}
                          className={!meta.has_next_page ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal Create Expense */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Kas Keluar</DialogTitle>
            <DialogDescription>Catat pengeluaran baru dengan bukti (opsional)</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Jumlah Pengeluaran *</Label>
                <Input
                  id="amount"
                  type="text"
                  value={formData.amount ? `Rp. ${Number(formData.amount).toLocaleString('id-ID')}` : ''}
                  onChange={handleAmountChange}
                  placeholder="Masukkan jumlah"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi *</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Contoh: Beli Token Listrik"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expense_date">Tanggal *</Label>
                <Input
                  id="expense_date"
                  type="date"
                  value={formData.expense_date}
                  onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Bukti Pengeluaran (Opsional)</Label>
                {imageError && (
                  <Alert variant="destructive" className="mb-2 py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs font-medium">{imageError}</AlertDescription>
                  </Alert>
                )}
                <div className="flex flex-col gap-4">
                  {imagePreview && (
                    <div className="relative aspect-video w-full rounded-lg overflow-hidden border">
                      <Image src={imagePreview} alt="Preview" fill className="object-cover" unoptimized={true} />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={handleImageChange}
                      className="hidden"
                      id="proof_image"
                    />
                    <Label htmlFor="proof_image" className="flex-1 cursor-pointer">
                      <div className={`flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-4 transition-colors ${imageError ? 'border-destructive bg-destructive/5' : 'hover:bg-muted/50'}`}>
                        <Upload className={`h-5 w-5 ${imageError ? 'text-destructive' : 'text-muted-foreground'}`} />
                        <span className={`text-sm ${imageError ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                          {imagePreview ? 'Ganti Bukti' : 'Upload Bukti (Max 2MB)'}
                        </span>
                      </div>
                    </Label>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseModal} disabled={isSubmitting}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting || !!imageError}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal View Proof */}
      <Dialog open={isProofModalOpen} onOpenChange={setIsProofModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Bukti Pengeluaran
            </DialogTitle>
          </DialogHeader>
          
          {selectedProof && (
            <div className="space-y-4 py-4">
              {/* Gambar Bukti */}
              <div className="space-y-2 pt-2 border-t">
                <p className="text-sm font-medium text-gray-900">Foto Bukti</p>
                <div className="relative w-full min-h-[300px] bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center border border-gray-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedProof.image_url}
                    alt="Bukti Pengeluaran"
                    className="max-w-full max-h-[60vh] object-contain rounded"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = '<div class="text-center p-8"><p class="text-muted-foreground">Gagal memuat gambar atau gambar tidak tersedia</p></div>';
                      }
                    }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t sticky bottom-0 bg-white">
                <Button variant="outline" onClick={() => setIsProofModalOpen(false)}>
                  <X className="mr-2 h-4 w-4" />
                  Tutup
                </Button>
                <Button onClick={() => window.open(selectedProof.image_url, '_blank')}>
                  <Download className="mr-2 h-4 w-4" />
                  Download / Buka Asli
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Delete */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-black flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Hapus Pengeluaran?
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus pengeluaran <strong>{selectedExpense?.description}</strong> sebesar{' '}
              <strong>{selectedExpense ? formatRupiah(Number(selectedExpense.amount)) : ''}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button className="bg-black hover:bg-gray-800" variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}