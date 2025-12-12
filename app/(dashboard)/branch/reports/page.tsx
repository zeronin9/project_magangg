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
import { BarChart3, AlertCircle, Loader2, Download, Calendar, TrendingUp } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface SalesReport {
  summary: {
    total_sales: string;
    total_transactions?: number;
    total_items_sold?: number;
  };
  data: Array<{
    transaction_id: string;
    transaction_date: string;
    total_amount: number;
    payment_method?: string;
    items_count?: number;
  }>;
}

export default function ReportsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [reportData, setReportData] = useState<SalesReport | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState({
    tanggalMulai: today,
    tanggalSelesai: today,
  });

  const handleGenerateReport = async () => {
    if (!formData.tanggalMulai || !formData.tanggalSelesai) {
      alert('Harap isi tanggal mulai dan selesai');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await branchReportAPI.getSales(formData.tanggalMulai, formData.tanggalSelesai);
      setReportData(response.data);
    } catch (err: any) {
      setError(err.message || 'Gagal mengambil laporan penjualan');
      setReportData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    if (!reportData) return;

    // Simple CSV export
    let csv = 'ID Transaksi,Tanggal,Total,Metode Pembayaran\n';
    reportData.data.forEach((row) => {
      csv += `${row.transaction_id},${format(new Date(row.transaction_date), 'dd/MM/yyyy HH:mm')},${row.total_amount},${
        row.payment_method || '-'
      }\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-penjualan-${formData.tanggalMulai}-${formData.tanggalSelesai}.csv`;
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
          transaksi cabang Anda.
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
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Penjualan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
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
                <div className="text-2xl font-bold">{reportData.summary.total_transactions || reportData.data.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Transaksi tercatat</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Rata-rata Transaksi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {reportData.data.length > 0
                    ? formatRupiah(Number(reportData.summary.total_sales) / reportData.data.length)
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
                  <CardDescription>Daftar semua transaksi dalam periode yang dipilih</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {reportData.data.length === 0 ? (
                <div className="text-center py-12">
                  <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">Tidak ada transaksi pada periode ini</p>
                </div>
              ) : (
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
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
