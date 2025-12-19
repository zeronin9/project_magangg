// app/(dashboard)/branch/void-requests/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { voidRequestAPI } from '@/lib/api/branch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { 
  FileX, 
  AlertCircle, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  User, 
  Receipt,
  MoreHorizontal 
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { formatRupiah } from '@/lib/utils';
import { toast } from 'sonner';

interface VoidRequest {
  transaction_id: string;
  receipt_number: string;
  void_reason: string;
  requested_by: string;
  transaction_time: string;
  total_amount: string;
  status: string;
}

const ITEMS_PER_PAGE = 10;

export default function VoidRequestsPage() {
  const [voidRequests, setVoidRequests] = useState<VoidRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [currentPage, setCurrentPage] = useState(1);

  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<VoidRequest | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  // Helper untuk delay (3 detik)
  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await voidRequestAPI.getAll();
      const requestsData = Array.isArray(response.data) ? response.data : [];
      setVoidRequests(requestsData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal memuat data permintaan void');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenReview = (request: VoidRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setReviewAction(action);
    setIsReviewOpen(true);
  };

  const handleCloseReview = () => {
    setIsReviewOpen(false);
    setSelectedRequest(null);
    setReviewAction('approve');
  };

  const handleReview = async () => {
    if (!selectedRequest) return;

    setIsSubmitting(true);
    try {
      // ✅ Tambahkan Delay 3 Detik di sini
      await delay(3000);

      // Panggil API setelah delay
      await voidRequestAPI.review(selectedRequest.transaction_id, reviewAction === 'approve');
      
      toast.success(`Permintaan void berhasil ${reviewAction === 'approve' ? 'disetujui' : 'ditolak'}`);
      await loadData();
      handleCloseReview();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Gagal memproses permintaan void';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pagination Logic
  const totalItems = voidRequests.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedRequests = voidRequests.slice(startIndex, endIndex);

  const handlePageChange = (page: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8">
        <Skeleton className="h-8 w-48 mb-4" />
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Permintaan Void</h1>
          <p className="text-muted-foreground">Review dan setujui/tolak permintaan pembatalan transaksi</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Summary Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Permintaan Pending</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{voidRequests.length}</div>
          <p className="text-xs text-muted-foreground mt-1">Menunggu review</p>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Permintaan Void</CardTitle>
          <CardDescription>Transaksi yang dimintakan pembatalan oleh kasir</CardDescription>
        </CardHeader>
        <CardContent>
          {paginatedRequests.length === 0 ? (
            <div className="text-center py-12">
              <FileX className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Tidak ada permintaan void pending saat ini.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No. Resi</TableHead>
                    <TableHead>Alasan Void</TableHead>
                    <TableHead>Kasir</TableHead>
                    <TableHead>Waktu Transaksi</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRequests.map((request) => (
                    <TableRow key={request.transaction_id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Receipt className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono">{request.receipt_number || request.transaction_id.substring(0, 8)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate" title={request.void_reason}>
                        {request.void_reason}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 text-muted-foreground" />
                          {request.requested_by}
                        </div>
                      </TableCell>
                      <TableCell>
                        {request.transaction_time ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {format(new Date(request.transaction_time), 'dd MMM yyyy HH:mm', { locale: id })}
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {request.total_amount ? formatRupiah(Number(request.total_amount)) : '-'}
                      </TableCell>
                      
                      {/* Dropdown Menu Aksi */}
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleOpenReview(request, 'approve')}
                              className="text-green-600 focus:text-green-600 cursor-pointer"
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              <span>Setujui Permintaan</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleOpenReview(request, 'reject')}
                              className="text-destructive focus:text-destructive cursor-pointer"
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              <span>Tolak Permintaan</span>
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
                  <PaginationLink 
                    href="#" 
                    isActive={currentPage === i + 1} 
                    onClick={(e) => handlePageChange(i + 1, e)}
                  >
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

      {/* Review Confirmation Dialog */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {reviewAction === 'approve' ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Konfirmasi Penyetujuan Void
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-destructive" />
                  Konfirmasi Penolakan Void
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              Mohon tinjau detail permintaan void di bawah ini sebelum melanjutkan.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            {reviewAction === 'approve' ? (
              <div className="space-y-4">
                <p className="text-sm">Apakah Anda yakin ingin <strong>menyetujui</strong> pembatalan transaksi ini?</p>
                
                <div className="bg-muted p-4 rounded-md text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">No. Resi:</span>
                    <span className="font-medium font-mono">{selectedRequest?.receipt_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Alasan:</span>
                    <span className="font-medium">{selectedRequest?.void_reason}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Kasir:</span>
                    <span className="font-medium">{selectedRequest?.requested_by}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 mt-2">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-bold">{selectedRequest?.total_amount ? formatRupiah(Number(selectedRequest.total_amount)) : '-'}</span>
                  </div>
                </div>

                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Transaksi akan dibatalkan permanen dan stok akan dikembalikan (jika diatur demikian).
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm">Apakah Anda yakin ingin <strong>menolak</strong> permintaan void ini?</p>
                
                <div className="bg-muted p-4 rounded-md text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">No. Resi:</span>
                    <span className="font-medium font-mono">{selectedRequest?.receipt_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Alasan:</span>
                    <span className="font-medium">{selectedRequest?.void_reason}</span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  * Status transaksi akan kembali menjadi COMPLETED (Sukses) dan tidak dibatalkan.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseReview} disabled={isSubmitting}>
              Batal
            </Button>
            <Button
              className={
                reviewAction === 'approve'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-destructive hover:bg-destructive/90'
              }
              onClick={handleReview}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {reviewAction === 'approve' ? 'Ya, Setujui' : 'Ya, Tolak'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}