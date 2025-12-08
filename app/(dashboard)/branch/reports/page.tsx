'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api'; // Menggunakan apiClient langsung jika belum ada di branchPageAPI
import { formatRupiah } from '@/lib/utils';
import { FileText, Calendar, DollarSign, TrendingUp, Download } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";

export default function BranchReportsPage() {
  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    setIsLoading(true);
    try {
      // Menggunakan endpoint sales report (Doc 8.3)
      const res = await apiClient.get(
        `/report/sales?tanggalMulai=${dateRange.start}&tanggalSelesai=${dateRange.end}`
      );
      setReportData(res.data);
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8 @container">
      <div className="flex flex-col gap-4 @md:flex-row @md:items-center @md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Laporan Penjualan</h2>
          <p className="text-muted-foreground">Analisa performa penjualan cabang</p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Periode</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col @md:flex-row gap-4 items-end">
            <div className="grid w-full gap-2">
              <label className="text-sm font-medium">Tanggal Mulai</label>
              <Input 
                type="date" 
                value={dateRange.start} 
                onChange={e => setDateRange({...dateRange, start: e.target.value})} 
              />
            </div>
            <div className="grid w-full gap-2">
              <label className="text-sm font-medium">Tanggal Selesai</label>
              <Input 
                type="date" 
                value={dateRange.end} 
                onChange={e => setDateRange({...dateRange, end: e.target.value})} 
              />
            </div>
            <Button onClick={fetchReport} disabled={isLoading} className="w-full @md:w-auto">
              <FileText className="mr-2 h-4 w-4" /> Tampilkan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Omzet</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reportData ? formatRupiah(reportData.summary?.total_sales || 0) : '-'}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jumlah Transaksi</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reportData?.data?.length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Table */}
      <Card>
        <CardHeader>
          <CardTitle>Rincian Transaksi</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton rows={5} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu</TableHead>
                  <TableHead>No. Struk</TableHead>
                  <TableHead>Metode Bayar</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData?.data?.map((trx: any) => (
                  <TableRow key={trx.transaction_id}>
                    <TableCell>
                      {new Date(trx.created_at).toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{trx.receipt_number || trx.transaction_id.slice(0,8)}</TableCell>
                    <TableCell>{trx.payment_method || 'Tunai'}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatRupiah(trx.final_amount || trx.total_amount)}
                    </TableCell>
                  </TableRow>
                ))}
                {(!reportData?.data || reportData.data.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Tidak ada data penjualan pada periode ini.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}