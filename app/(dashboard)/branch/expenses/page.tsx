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
  TrendingDown,
  AlertCircle,
  Loader2,
  AlertTriangle,
  Upload,
  Calendar,
  Eye,
  Image as ImageIcon,
} from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { formatRupiah } from '@/lib/utils';

interface Expense {
  expense_id: string;
  amount: number;
  description: string;
  expense_date: string;
  proof_image?: string;
  shift_id?: string | null;
  created_at: string;
}

const getImageUrl = (path: string | null | undefined) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';
  const serverUrl = apiBaseUrl.replace(/\/api\/?$/, '');
  const cleanPath = path.replace(/\\/g, '/').replace(/^\//, '');
  return `${serverUrl}/${cleanPath}`;
};

const ITEMS_PER_PAGE = 10;

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isImageViewOpen, setIsImageViewOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageError, setImageError] = useState('');
  const [imagePreview, setImagePreview] = useState<string>('');

  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    expense_date: '',
    proof_image: null as File | null,
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const loadData = async () => {
    try {
      setIsLoading(true);
      const response = await expenseAPI.getAll();
      const expensesData = Array.isArray(response.data) ? response.data : [];

      // Sort by date descending
      const sortedExpenses = expensesData.sort(
        (a: any, b: any) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime()
      );

      setExpenses(sortedExpenses);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data kas keluar');
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleViewImage = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsImageViewOpen(true);
  };

  // Filter
  const filteredExpenses = expenses.filter((expense) => {
    const searchLower = searchQuery.toLowerCase();
    return expense.description.toLowerCase().includes(searchLower);
  });

  // Calculate total
  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);

  // Pagination
  const totalItems = filteredExpenses.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedExpenses = filteredExpenses.slice(startIndex, endIndex);

  const handlePageChange = (page: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8 @container">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-12 w-full" />
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
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
          <p className="text-muted-foreground">Catat pengeluaran operasional cabang</p>
        </div>
        <Button onClick={handleOpenModal}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Pengeluaran
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Info Alert */}
      <Alert>
        <TrendingDown className="h-4 w-4" />
        <AlertDescription>
          <strong>Kas Keluar:</strong> Catat semua pengeluaran operasional seperti pembelian bahan, utilitas, dll. Upload
          bukti untuk dokumentasi.
        </AlertDescription>
      </Alert>

      {/* Summary Card */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Pengeluaran</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{formatRupiah(totalExpenses)}</div>
            <p className="text-xs text-muted-foreground mt-1">{filteredExpenses.length} transaksi</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Cari deskripsi pengeluaran..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Kas Keluar</CardTitle>
          <CardDescription>Daftar semua pengeluaran operasional</CardDescription>
        </CardHeader>
        <CardContent>
          {paginatedExpenses.length === 0 ? (
            <div className="text-center py-12">
              <TrendingDown className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                {searchQuery ? 'Tidak ada hasil pencarian' : 'Belum ada data pengeluaran'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead>Jumlah</TableHead>
                    <TableHead>Bukti</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedExpenses.map((expense) => (
                    <TableRow key={expense.expense_id}>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {format(new Date(expense.expense_date), 'dd MMM yyyy', { locale: id })}
                        </div>
                        {expense.shift_id && (
                          <Badge variant="outline" className="mt-1 text-[10px]">
                            Via Shift
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{expense.description}</TableCell>
                      <TableCell className="font-bold text-destructive">{formatRupiah(Number(expense.amount))}</TableCell>
                      <TableCell>
                        {expense.proof_image ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewImage(expense)}
                            className="h-8 gap-1"
                          >
                            <Eye className="h-3 w-3" />
                            Lihat
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">Tidak ada</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Aksi</DropdownMenuLabel>

                            {expense.proof_image && (
                              <>
                                <DropdownMenuItem onClick={() => handleViewImage(expense)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Lihat Bukti
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}

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
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="py-4 flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => handlePageChange(currentPage - 1, e)}
                  className={currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>

              {Array.from({ length: totalPages }).map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink href="#" isActive={currentPage === i + 1} onClick={(e) => handlePageChange(i + 1, e)}>
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => handlePageChange(currentPage + 1, e)}
                  className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Create Expense Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Kas Keluar</DialogTitle>
            <DialogDescription>Catat pengeluaran operasional cabang dengan bukti (opsional)</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              {/* Amount */}
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

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi *</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Contoh: Beli galon air"
                  required
                />
              </div>

              {/* Expense Date */}
              <div className="space-y-2">
                <Label htmlFor="expense_date">Tanggal Pengeluaran *</Label>
                <Input
                  id="expense_date"
                  type="date"
                  value={formData.expense_date}
                  onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                  required
                />
              </div>

              {/* Image Upload */}
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
                      <div
                        className={`flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-4 transition-colors ${
                          imageError ? 'border-destructive bg-destructive/5' : 'hover:bg-muted/50'
                        }`}
                      >
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

      {/* Image View Modal */}
      <Dialog open={isImageViewOpen} onOpenChange={setIsImageViewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Bukti Pengeluaran</DialogTitle>
            <DialogDescription>
              {selectedExpense?.description} - {formatRupiah(Number(selectedExpense?.amount || 0))}
            </DialogDescription>
          </DialogHeader>
          <div className="relative aspect-video w-full rounded-lg overflow-hidden border bg-muted">
            {selectedExpense?.proof_image ? (
              <Image
                src={getImageUrl(selectedExpense.proof_image)}
                alt="Bukti"
                fill
                className="object-contain"
                unoptimized={true}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <ImageIcon className="h-16 w-16 text-muted-foreground/50" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImageViewOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-black flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Hapus Pengeluaran?
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus pengeluaran <strong>{selectedExpense?.description}</strong> sebesar{' '}
              <strong>{formatRupiah(Number(selectedExpense?.amount || 0))}</strong>?
              <br />
              <strong className="text-destructive">Data dan bukti gambar akan dihapus permanen!</strong>
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
