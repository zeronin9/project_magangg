'use client';

import { useState, useEffect } from 'react';
import { reportAPI, branchAPI } from '@/lib/api/mitra';
import { Branch } from '@/types/mitra';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { 
  FileText,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Download,
  AlertCircle,
  Loader2,
  Calendar
} from 'lucide-react';

export default function ReportsPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState('all');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: '',
  });
  const [salesReport, setSalesReport] = useState<any>(null);
  const [expensesReport, setExpensesReport] = useState<any>(null);
  const [itemsReport, setItemsReport] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('sales');

  useEffect(() => {
    loadBranches();
    
    // Set default date range (current month)
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    setDateRange({
      start: firstDay.toISOString().split('T')[0],
      end: lastDay.toISOString().split('T')[0],
    });
  }, []);

  const loadBranches = async () => {
    try {
      const data = await branchAPI.getAll();
      setBranches(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error loading branches:', err);
    }
  };

  const handleGenerateReport = async (type: 'sales' | 'expenses' | 'items') => {
    setIsLoading(true);
    setError('');
    
    try {
      const params: any = {};
      
      // Only add branchId if not "all"
      if (selectedBranchId && selectedBranchId !== 'all') {
        params.branchId = selectedBranchId;
      }
      if (dateRange.start) {
        params.tanggalMulai = dateRange.start;
      }
      if (dateRange.end) {
        params.tanggalSelesai = dateRange.end;
      }

      if (type === 'sales') {
        const data = await reportAPI.getSales(params);
        setSalesReport(data);
      } else if (type === 'expenses') {
        const data = await reportAPI.getExpenses(params);
        setExpensesReport(data);
      } else if (type === 'items') {
        const data = await reportAPI.getItems(params);
        setItemsReport(Array.isArray(data) ? data : []);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat laporan');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: string | number) => {
    return 'Rp ' + parseInt(value.toString()).toLocaleString('id-ID');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Laporan</h1>
        <p className="text-muted-foreground">
          Lihat laporan penjualan, pengeluaran, dan item terlaris
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
          <CardTitle className="text-base">Filter Laporan</CardTitle>
          <CardDescription>Pilih periode dan cabang untuk melihat laporan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="branch">Cabang</Label>
              <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Cabang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Cabang</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch.branch_id} value={branch.branch_id}>
                      {branch.branch_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sales">
            <DollarSign className="mr-2 h-4 w-4" />
            Penjualan
          </TabsTrigger>
          <TabsTrigger value="expenses">
            <TrendingUp className="mr-2 h-4 w-4" />
            Pengeluaran
          </TabsTrigger>
          <TabsTrigger value="items">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Item Terlaris
          </TabsTrigger>
        </TabsList>

        {/* Sales Report */}
        <TabsContent value="sales" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Laporan Penjualan</h3>
            <Button onClick={() => handleGenerateReport('sales')} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <FileText className="mr-2 h-4 w-4" />
              Generate Laporan
            </Button>
          </div>

          {salesReport && (
            <>
              {/* Summary Cards */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Total Penjualan</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(salesReport.summary?.total_sales || 0)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Jumlah Transaksi</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {salesReport.summary?.transaction_count || 0}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Total Diskon</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {formatCurrency(salesReport.summary?.total_discount || 0)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Total Pajak</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(salesReport.summary?.total_tax || 0)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Data Table */}
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Cabang</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Diskon</TableHead>
                      <TableHead className="text-right">Pajak</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesReport.data && salesReport.data.length > 0 ? (
                      salesReport.data.slice(0, 20).map((item: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>
                            {item.created_at ? formatDate(item.created_at) : '-'}
                          </TableCell>
                          <TableCell>{item.branch_name || 'N/A'}</TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(item.final_total || 0)}
                          </TableCell>
                          <TableCell className="text-right text-orange-600">
                            {formatCurrency(item.discount_amount || 0)}
                          </TableCell>
                          <TableCell className="text-right text-blue-600">
                            {formatCurrency(item.tax_amount || 0)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12">
                          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                          <p className="text-muted-foreground">Tidak ada data</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            </>
          )}

          {!salesReport && !isLoading && (
            <Card className="p-12">
              <div className="text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  Klik "Generate Laporan" untuk melihat data
                </p>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Expenses Report */}
        <TabsContent value="expenses" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Laporan Pengeluaran</h3>
            <Button onClick={() => handleGenerateReport('expenses')} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <FileText className="mr-2 h-4 w-4" />
              Generate Laporan
            </Button>
          </div>

          {expensesReport && (
            <>
              {/* Summary Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total Pengeluaran</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">
                    {formatCurrency(expensesReport.summary?.total_expenses || 0)}
                  </div>
                </CardContent>
              </Card>

              {/* Data Table */}
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Deskripsi</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead className="text-right">Jumlah</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expensesReport.data && expensesReport.data.length > 0 ? (
                      expensesReport.data.slice(0, 20).map((item: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>
                            {item.created_at ? formatDate(item.created_at) : '-'}
                          </TableCell>
                          <TableCell>{item.description || '-'}</TableCell>
                          <TableCell>{item.category || '-'}</TableCell>
                          <TableCell className="text-right font-semibold text-red-600">
                            {formatCurrency(item.amount || 0)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-12">
                          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                          <p className="text-muted-foreground">Tidak ada data</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            </>
          )}

          {!expensesReport && !isLoading && (
            <Card className="p-12">
              <div className="text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  Klik "Generate Laporan" untuk melihat data
                </p>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Items Report */}
        <TabsContent value="items" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Item Terlaris</h3>
            <Button onClick={() => handleGenerateReport('items')} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <FileText className="mr-2 h-4 w-4" />
              Generate Laporan
            </Button>
          </div>

          {itemsReport.length > 0 ? (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Peringkat</TableHead>
                    <TableHead>Produk</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead className="text-right">Terjual</TableHead>
                    <TableHead className="text-right">Total Pendapatan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itemsReport.map((item: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="font-bold">#{index + 1}</TableCell>
                      <TableCell className="font-medium">
                        {item.product_name || item.name || '-'}
                      </TableCell>
                      <TableCell>{item.category_name || '-'}</TableCell>
                      <TableCell className="text-right font-semibold text-blue-600">
                        {item.quantity_sold || item.total_sold || 0}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-green-600">
                        {formatCurrency(item.total_revenue || item.revenue || 0)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          ) : (
            !isLoading && (
              <Card className="p-12">
                <div className="text-center">
                  <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">
                    Klik "Generate Laporan" untuk melihat data
                  </p>
                </div>
              </Card>
            )
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
