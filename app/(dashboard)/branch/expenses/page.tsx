'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { expenseAPI } from '@/lib/api/branch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  Calendar,
  Eye,
  X,
  Download,
  FileText,
  Image as ImageIcon,
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
    shiftSchedule?: {
      shift_name: string;
    };
    shift_schedule?: {
      shift_name: string;
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
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [meta, setMeta] = useState<MetaPagination | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
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

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError('');

      const response = await expenseAPI.getAll({
        page: currentPage,
        limit: 10,
        search: searchQuery
      });

      console.log('Expense Data:', response.items);

      setExpenses(response.items);
      setMeta(response.meta);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal memuat data kas keluar');
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleDelete = async () => {
    if (!selectedExpense) return;

    setIsSubmitting(true);
    try {
      await delay(3000); // 3 detik delay
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

  const handlePageChange = (page: number) => {
    if (meta && page > 0 && page <= meta.total_pages) {
      setCurrentPage(page);
    }
  };

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
        <Button onClick={() => router.push('/branch/expenses/new')}>
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
                      const globalIndex = meta ? (meta.current_page - 1) * 10 + index + 1 : index + 1;
                      
                      const operatorName = expense.user?.full_name || 'System'; 
                      const shiftCashierName = expense.shift?.cashier?.full_name; 
                      
                      const displayName = shiftCashierName || operatorName;
                      const isSurrogateInput = shiftCashierName && operatorName !== shiftCashierName;

                      const shiftNameData = expense.shift?.shiftSchedule?.shift_name || expense.shift?.shift_schedule?.shift_name;
                      const shiftName = shiftNameData || 'Shift';

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
                                  {shiftName}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate" title={expense.description}>
                            {expense.description}
                          </TableCell>
                          
                          <TableCell className="text-sm">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <div>
                                  <div className="font-medium text-gray-900 text-sm">
                                    {displayName}
                                  </div>
                                </div>
                              </div>
                              
                              {isSurrogateInput && (
                                <div className="text-[12px] text-muted-foreground">
                                {operatorName}
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
