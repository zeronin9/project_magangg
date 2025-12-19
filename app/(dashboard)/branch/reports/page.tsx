// app/(dashboard)/branch/reports/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
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
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { 
  FileText,
  AlertCircle,
  Loader2,
  User,
  CreditCard,
  XCircle
} from 'lucide-react';

// Konfigurasi Pagination
const ITEMS_PER_PAGE = 10;

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState({
    start: '',
    end: '',
  });
  
  const [salesReport, setSalesReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showVoidOnly, setShowVoidOnly] = useState(false);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);

  // Pagination states
  const [salesCurrentPage, setSalesCurrentPage] = useState(1);

  useEffect(() => {
    // Set default date range: Hari Ini s/d Besok
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Format YYYY-MM-DD
    const startDate = today.toISOString().split('T')[0];
    const endDate = tomorrow.toISOString().split('T')[0];
    
    setDateRange({
      start: startDate,
      end: endDate,
    });
  }, []);

  // Auto-generate laporan saat pertama kali load (setelah tanggal terisi)
  useEffect(() => {
    if (dateRange.start && dateRange.end && !hasInitialLoad) {
      setHasInitialLoad(true);
      // Panggil fungsi generate report otomatis
      handleGenerateReport(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange.start, dateRange.end, hasInitialLoad]);

  // Handler utama untuk mengambil data laporan penjualan
  const handleGenerateReport = async (isAutoLoad = false) => {
    // Validasi sederhana jika tanggal belum siap
    if (!dateRange.start || !dateRange.end) return;

    setIsLoading(true);
    setError('');
    
    // Hanya reset void filter dan pagination jika tombol diklik manual (bukan auto load)
    if (!isAutoLoad) {
      setShowVoidOnly(false);
      setSalesCurrentPage(1);
    }
    
    try {
      const page = isAutoLoad ? salesCurrentPage : 1;
      
      const params: any = {
        tanggalMulai: dateRange.start,
        tanggalSelesai: dateRange.end,
        limit: ITEMS_PER_PAGE,
        page: page,
        status: 'COMPLETED' // Default ambil data sukses
      };

      const res = await apiClient.get('/report/sales?' + new URLSearchParams(params));
      setSalesReport(res.data);

    } catch (err: any) {
      console.error('❌ Error fetching report:', err);
      setError(err.message || 'Gagal memuat laporan');
    } finally {
      setIsLoading(false);
    }
  };

  // Handler Pagination
  const onPageChange = async (newPage: number) => {
    setSalesCurrentPage(newPage);
    setIsLoading(true);
    try {
        const params: any = {
            tanggalMulai: dateRange.start,
            tanggalSelesai: dateRange.end,
            page: newPage,
            limit: ITEMS_PER_PAGE,
            status: showVoidOnly ? 'VOID_REQUESTED,VOIDED' : 'COMPLETED'
        };

        const res = await apiClient.get('/report/sales?' + new URLSearchParams(params));
        setSalesReport(res.data);
    } catch (err) {
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  };

  // Handler Toggle Filter Void
  const handleToggleVoidFilter = async () => {
    const newVoidState = !showVoidOnly;
    setShowVoidOnly(newVoidState);
    setSalesCurrentPage(1);
    setIsLoading(true);

    try {
        const params: any = {
            tanggalMulai: dateRange.start,
            tanggalSelesai: dateRange.end,
            page: 1,
            limit: ITEMS_PER_PAGE,
            status: newVoidState ? 'VOID_REQUESTED,VOIDED' : 'COMPLETED'
        };
        
        const res = await apiClient.get('/report/sales?' + new URLSearchParams(params));
        setSalesReport(res.data);
    } catch (err) {
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  };

  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === 'number' ? value : parseFloat(String(value)) || 0;
    return 'Rp. ' + Math.round(numValue).toLocaleString('id-ID');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Helper Badge Style
  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'COMPLETED': return { variant: 'default' as const, className: 'bg-black hover:bg-green-700' };
      case 'VOID_REQUESTED': return { variant: 'outline' as const, className: 'text-black border-black' };
      case 'VOIDED': return { variant: 'destructive' as const, className: 'bg-black' };
      default: return { variant: 'secondary' as const, className: '' };
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Laporan Penjualan</h1>
        <p className="text-muted-foreground">
          Lihat ringkasan dan detail transaksi penjualan harian
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filter Periode</CardTitle>
          <CardDescription>Rentang tanggal laporan (Default: Hari ini sampai Besok)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="start_date">Tanggal Mulai</Label>
              <Input
                id="start_date"
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">Tanggal Selesai</Label>
              <Input
                id="end_date"
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label className="invisible">Action</Label>
              <Button 
                onClick={() => handleGenerateReport(false)} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <FileText className="mr-2 h-4 w-4" />
                Apply
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Area */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Ringkasan Penjualan</h3>
          <div className="flex gap-2">
            <Button className='bg-black text-white hover:bg-gray-900 hover:text-white'
              onClick={handleToggleVoidFilter} 
              variant={showVoidOnly ? "destructive" : "outline"}
              disabled={isLoading}
              size="sm"
            >
              {showVoidOnly ? <XCircle className="mr-2 h-4 w-4" /> : <AlertCircle className="mr-2 h-4 w-4" />}
              {showVoidOnly ? 'Kembali ke Transaksi Sukses' : 'Lihat Transaksi Void'}
            </Button>
          </div>
        </div>

        {/* Loading State Skeleton (Optional Visual) */}
        {isLoading && !salesReport && (
          <div className="py-12 flex justify-center items-center">
             <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
             <span className="ml-2 text-muted-foreground">Memuat laporan...</span>
          </div>
        )}

        {salesReport && (
          <>
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card className={showVoidOnly ? "border-gray-200 bg-white" : "border-gray-200 bg-white"}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    {showVoidOnly ? 'Total Void' : 'Total Penjualan'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(salesReport.summary?.total_sales || 0)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    {showVoidOnly ? 'Jumlah Transaksi Void' : 'Jumlah Transaksi Sukses'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {salesReport.summary?.transaction_count || 0}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Data Table */}
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">No</TableHead>
                    <TableHead>No. Struk</TableHead>
                    <TableHead>Waktu</TableHead>
                    <TableHead>Kasir</TableHead>
                    <TableHead>Metode</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesReport.data && salesReport.data.length > 0 ? (
                    salesReport.data.map((item: any, index: number) => {
                      const globalIndex = (salesCurrentPage - 1) * ITEMS_PER_PAGE + index + 1;
                      const badgeStyle = getStatusBadgeStyle(item.status);
                      
                      return (
                        <TableRow key={item.transaction_id || index}>
                          <TableCell className="text-center">{globalIndex}</TableCell>
                          <TableCell className="font-mono text-xs">{item.receipt_number || '-'}</TableCell>
                          <TableCell className="text-sm">
                            {item.transaction_time ? formatDate(item.transaction_time) : '-'}
                          </TableCell>
                          <TableCell>
                              <div className="flex items-center gap-2">
                                  <User className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-sm">{item.shift?.cashier?.full_name || '-'}</span>
                              </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              <CreditCard className="mr-1 h-3 w-3" />
                              {item.payment_method || '-'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(item.total_amount || 0)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={badgeStyle.variant} className={`text-xs ${badgeStyle.className}`}>
                              {item.status || '-'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                        <p className="text-muted-foreground">Tidak ada data transaksi</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {salesReport.meta && salesReport.meta.total_pages > 1 && (
                  <div className="py-4">
                      <Pagination>
                          <PaginationContent>
                              <PaginationItem>
                                  <PaginationPrevious 
                                      href="#"
                                      onClick={(e) => { e.preventDefault(); onPageChange(salesCurrentPage - 1); }}
                                      className={!salesReport.meta.has_prev_page ? "pointer-events-none opacity-50" : ""}
                                  />
                              </PaginationItem>
                              <PaginationItem>
                                  <span className="px-4 text-sm font-medium">Halaman {salesCurrentPage} dari {salesReport.meta.total_pages}</span>
                              </PaginationItem>
                              <PaginationItem>
                                  <PaginationNext
                                      href="#"
                                      onClick={(e) => { e.preventDefault(); onPageChange(salesCurrentPage + 1); }}
                                      className={!salesReport.meta.has_next_page ? "pointer-events-none opacity-50" : ""}
                                  />
                              </PaginationItem>
                          </PaginationContent>
                      </Pagination>
                  </div>
              )}
            </Card>
          </>
        )}

        {/* Empty State jika belum ada data dan tidak loading */}
        {!salesReport && !isLoading && !hasInitialLoad && (
           <div className="text-center py-12 border rounded-md bg-muted/10">
             <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
             <p className="text-muted-foreground">Menyiapkan laporan...</p>
           </div>
        )}
      </div>
    </div>
  );
}