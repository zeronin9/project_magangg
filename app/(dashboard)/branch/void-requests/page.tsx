// app/(dashboard)/branch/void-requests/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { voidRequestAPI } from '@/lib/api/branch';
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
import { FileX, AlertCircle, Loader2, CheckCircle, XCircle, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { formatRupiah } from '@/lib/utils';

interface VoidRequest {
  transaction_id: string;
  void_reason: string;
  requested_by: string;
  transaction_date?: string;
  total_amount?: number;
  status?: string;
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

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const loadData = async () => {
    try {
      setIsLoading(true);
      const response = await voidRequestAPI.getAll();
      const requestsData = Array.isArray(response.data) ? response.data : [];

      setVoidRequests(requestsData);
    } catch (err: any) {
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
      await delay(2000);
      await voidRequestAPI.review(selectedRequest.transaction_id, reviewAction === 'approve');

      await loadData();
      handleCloseReview();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Gagal memproses permintaan void';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pagination
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
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8 @container">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
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
          <h1 className="text-3xl font-bold tracking-tight">Permintaan Void</h1>
          <p className="text-muted-foreground">Review dan setujui/tolak permintaan pembatalan transaksi</p>
        </div>
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
        <FileX className="h-4 w-4" />
        <AlertDescription>
          <strong>Permintaan Void:</strong> Kasir dapat meminta pembatalan transaksi. Sebagai admin cabang, Anda perlu
          menyetujui atau menolak setiap permintaan.
        </AlertDescription>
      </Alert>

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
              <p className="text-muted-foreground">Tidak ada permintaan void pending</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Transaksi</TableHead>
                    <TableHead>Alasan</TableHead>
                    <TableHead>Diminta Oleh</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRequests.map((request) => (
                    <TableRow key={request.transaction_id}>
                      <TableCell className="font-mono text-xs">{request.transaction_id.substring(0, 8)}...</TableCell>
                      <TableCell className="font-medium">{request.void_reason}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 text-muted-foreground" />
                          {request.requested_by}
                        </div>
                      </TableCell>
                      <TableCell>
                        {request.transaction_date ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {format(new Date(request.transaction_date), 'dd MMM yyyy HH:mm', { locale: id })}
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {request.total_amount ? formatRupiah(Number(request.total_amount)) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-green-600 border-green-600 hover:bg-green-50"
                            onClick={() => handleOpenReview(request, 'approve')}
                          >
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Setuju
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-destructive border-destructive hover:bg-destructive/10"
                            onClick={() => handleOpenReview(request, 'reject')}
                          >
                            <XCircle className="mr-1 h-3 w-3" />
                            Tolak
                          </Button>
                        </div>
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

      {/* Review Confirmation */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {reviewAction === 'approve' ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Setujui Void?
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-destructive" />
                  Tolak Void?
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {reviewAction === 'approve' ? (
                <>
                  Apakah Anda yakin ingin <strong>menyetujui</strong> permintaan void ini?
                  <br />
                  <br />
                  <strong>Alasan:</strong> {selectedRequest?.void_reason}
                  <br />
                  <strong>Diminta oleh:</strong> {selectedRequest?.requested_by}
                  <br />
                  <br />
                  Transaksi akan dibatalkan dan tidak dapat dikembalikan.
                </>
              ) : (
                <>
                  Apakah Anda yakin ingin <strong>menolak</strong> permintaan void ini?
                  <br />
                  <br />
                  <strong>Alasan:</strong> {selectedRequest?.void_reason}
                  <br />
                  <strong>Diminta oleh:</strong> {selectedRequest?.requested_by}
                  <br />
                  <br />
                  Transaksi akan tetap tercatat dan tidak dibatalkan.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
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
              {reviewAction === 'approve' ? 'Setuju' : 'Tolak'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
