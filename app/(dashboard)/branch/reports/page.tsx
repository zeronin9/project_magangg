// app/(dashboard)/branch/reports/page.tsx

'use client';

import { useState } from 'react';
import { branchReportAPI } from '@/lib/api/branch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
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
import { BarChart3, AlertCircle, Loader2, Download, Calendar, TrendingUp } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { MetaPagination } from '@/lib/services/fetchData';

// Interface Transaksi Individual
interface TransactionItem {
  transaction_id: string;
  transaction_date: string;
  total_amount: number;
  payment_method?: string;
  items_count?: number;
  status?: string;
}

// Interface Response Lengkap (Summary + Meta + Data)
interface SalesReportData {
  summary: {
    total_sales: string | number; // Backend mungkin kirim string untuk BigInt
    transaction_count: number;
    total_items_sold?: number;
  };
  meta: MetaPagination;
  data: TransactionItem[];
}

const ITEMS_PER_PAGE = 10;

export default function ReportsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // State utama untuk menampung response lengkap
  const [reportData, setReportData] = useState<SalesReportData | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState({
    tanggalMulai: today,
    tanggalSelesai: today,
  });

  // State untuk pagination saat ini
  const [currentPage, setCurrentPage] = useState(1);

  // Fungsi Fetch Data
  const fetchReport = async (page: number) => {
    if (!formData.tanggalMulai || !formData.tanggalSelesai) {
      alert('Harap isi tanggal mulai dan selesai');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Panggil API dengan parameter page & limit
      const response = await branchReportAPI.getSales(
        formData.tanggalMulai, 
        formData.tanggalSelesai, 
        page, 
        ITEMS_PER_PAGE
      );
      
      // Response dari fetchData sudah diparsing, namun struktur report sedikit beda
      // fetchData return { items, meta, ... }. 
      // Jika branch.ts sudah disesuaikan untuk return raw object atau di-map, sesuaikan di sini.
      // Asumsi berdasarkan kode API sebelumnya: return object lengkap.
      
      setReportData(response as unknown as SalesReportData);
      setCurrentPage(page);
    } catch (err: any) {
      setError(err.message || 'Gagal mengambil laporan penjualan');
      setReportData(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler Tombol Generate (Reset ke halaman 1)
  const handleGenerateReport = () => {
    fetchReport(1);
  };

  // Handler Ganti Halaman
  const handlePageChange = (newPage: number) => {
    if (reportData?.meta && newPage > 0 && newPage <= reportData.meta.total_pages) {
      fetchReport(newPage);
    }
  };

  const handleExport = () => {
    if (!reportData || !reportData.data.length) return;

    // Catatan: Ini hanya export halaman yang sedang tampil (Current View)
    let csv = 'ID Transaksi,Tanggal,Total,Metode Pembayaran,Status\n';
    reportData.data.forEach((row) => {
      csv += `${row.transaction_id},${format(new Date(row.transaction_date), 'dd/MM/yyyy HH:mm')},${row.total_amount},${
        row.payment_method || '-'
      },${row.status || 'COMPLETED'}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-penjualan-${formData.tanggalMulai}-${formData.tanggalSelesai}-hal${currentPage}.csv`;
    a.click();
  };

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8 @container">
      {/* Header */}
      <div className="flex flex-col gap-4 @md:flex-row @md:items-center @md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Laporan Penjualan</h1>
          <p className="text-muted-foreground">Generate laporan penjualan harian cabang</p>
        </div>
      </div>

      {/* Info Alert */}
      <Alert>
        <BarChart3 className="h-4 w-4" />
        <AlertDescription>
          <strong>Laporan Penjualan:</strong> Pilih rentang tanggal untuk melihat ringkasan penjualan dan detail
          transaksi. Data ditampilkan per halaman.
        </AlertDescription>
      </Alert>

      {/* Filter Form */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Laporan</CardTitle>
          <CardDescription>Pilih periode laporan yang ingin dilihat</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="tanggalMulai">Tanggal Mulai</Label>
              <Input
                id="tanggalMulai"
                type="date"
                value={formData.tanggalMulai}
                onChange={(e) => setFormData({ ...formData, tanggalMulai: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tanggalSelesai">Tanggal Selesai</Label>
              <Input
                id="tanggalSelesai"
                type="date"
                value={formData.tanggalSelesai}
                onChange={(e) => setFormData({ ...formData, tanggalSelesai: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label className="opacity-0">Action</Label>
              <Button className="w-full" onClick={handleGenerateReport} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? 'Memuat...' : 'Generate Laporan'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Report Result */}
      {reportData && (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Penjualan (Periode)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {/* Total Sales diambil dari summary (Total keseluruhan query, bukan cuma page ini) */}
                  {formatRupiah(Number(reportData.summary.total_sales))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(formData.tanggalMulai), 'dd MMM', { locale: id })} -{' '}
                  {format(new Date(formData.tanggalSelesai), 'dd MMM yyyy', { locale: id })}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Transaksi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reportData.summary.transaction_count}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Transaksi tercatat</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Rata-rata Transaksi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {reportData.summary.transaction_count > 0
                    ? formatRupiah(Number(reportData.summary.total_sales) / reportData.summary.transaction_count)
                    : formatRupiah(0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Per transaksi</p>
              </CardContent>
            </Card>
          </div>

          {/* Detail Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Detail Transaksi</CardTitle>
                  <CardDescription>
                    Halaman {reportData.meta.current_page} dari {reportData.meta.total_pages}
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV (Halaman Ini)
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {reportData.data.length === 0 ? (
                <div className="text-center py-12">
                  <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">Tidak ada transaksi pada halaman ini</p>
                </div>
              ) : (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID Transaksi</TableHead>
                          <TableHead>Tanggal & Waktu</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Metode Pembayaran</TableHead>
                          <TableHead>Items</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.data.map((transaction) => (
                          <TableRow key={transaction.transaction_id}>
                            <TableCell className="font-mono text-xs">
                              {transaction.transaction_id.substring(0, 8)}...
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                {format(new Date(transaction.transaction_date), 'dd MMM yyyy HH:mm', { locale: id })}
                              </div>
                            </TableCell>
                            <TableCell className="font-semibold text-primary">
                              {formatRupiah(Number(transaction.total_amount))}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{transaction.payment_method || 'Cash'}</Badge>
                            </TableCell>
                            <TableCell>{transaction.items_count || '-'} item</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination Component */}
                  {reportData.meta.total_pages > 1 && (
                    <div className="py-4 flex justify-center">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                handlePageChange(currentPage - 1);
                              }}
                              className={!reportData.meta.has_prev_page ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                          </PaginationItem>

                          <PaginationItem>
                            <span className="flex items-center px-4 text-sm font-medium">
                              Halaman {reportData.meta.current_page} dari {reportData.meta.total_pages}
                            </span>
                          </PaginationItem>

                          <PaginationItem>
                            <PaginationNext
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                handlePageChange(currentPage + 1);
                              }}
                              className={!reportData.meta.has_next_page ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
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
        </>
      )}
    </div>
  );
}