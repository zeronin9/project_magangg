'use client';

import { useState, useEffect } from 'react';
import { reportAPI, branchAPI } from '@/lib/api/mitra';
import { Branch } from '@/types/mitra';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { 
  FileText,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Download,
  AlertCircle,
  Loader2,
  User,
  CreditCard,
  Package,
  Eye,
  ImageIcon,
  X,
  XCircle
} from 'lucide-react';

// Konfigurasi Pagination
const ITEMS_PER_PAGE = 5;

export default function ReportsPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState('all');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: '',
  });
  const [initialDateRange, setInitialDateRange] = useState({
    start: '',
    end: '',
  });
  const [salesReport, setSalesReport] = useState<any>(null);
  const [expensesReport, setExpensesReport] = useState<any>(null);
  const [itemsReport, setItemsReport] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('sales');
  const [showVoidOnly, setShowVoidOnly] = useState(false);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);

  // Pagination states
  const [salesCurrentPage, setSalesCurrentPage] = useState(1);
  const [expensesCurrentPage, setExpensesCurrentPage] = useState(1);
  const [itemsCurrentPage, setItemsCurrentPage] = useState(1);

  // Modal state untuk bukti pengeluaran
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [selectedProof, setSelectedProof] = useState<{
    image_url: string;
    description: string;
    amount: string;
    date: string;
    user: string;
    cashier: string;
    branch: string;
  } | null>(null);

  useEffect(() => {
    loadBranches();
    
    // Set default date range (hari ini sampai besok)
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const startDate = today.toISOString().split('T')[0];
    const endDate = tomorrow.toISOString().split('T')[0];
    
    setDateRange({
      start: startDate,
      end: endDate,
    });

    setInitialDateRange({
      start: startDate,
      end: endDate,
    });
  }, []);

  // Auto-generate laporan saat pertama kali load (setelah dateRange ter-set)
  useEffect(() => {
    if (dateRange.start && dateRange.end && !hasInitialLoad) {
      setHasInitialLoad(true);
      // Generate semua laporan secara otomatis
      handleGenerateReport('sales', true);
      handleGenerateReport('expenses', true);
      handleGenerateReport('items', true);
    }
  }, [dateRange.start, dateRange.end, hasInitialLoad]);

  const loadBranches = async () => {
    try {
      const data = await branchAPI.getAll();
      setBranches(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error loading branches:', err);
    }
  };

  const handleGenerateReport = async (type: 'sales' | 'expenses' | 'items', isAutoLoad = false) => {
    setIsLoading(true);
    setError('');
    
    // Hanya reset void filter jika bukan auto load
    if (!isAutoLoad) {
      setShowVoidOnly(false);
    }
    
    // Reset pagination saat generate report baru
    if (type === 'sales') setSalesCurrentPage(1);
    if (type === 'expenses') setExpensesCurrentPage(1);
    if (type === 'items') setItemsCurrentPage(1);
    
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

      console.log('📊 Fetching report:', type, 'with params:', params);

      if (type === 'sales') {
        // Request dengan status COMPLETED untuk laporan utama
        const completedParams = { ...params, status: 'COMPLETED' };
        const completedData = await reportAPI.getSales(completedParams) as any;
        
        // Request SEMUA status untuk filter void
        const allData = await reportAPI.getSales(params) as any;
        
        if (completedData.data && Array.isArray(completedData.data)) {
          // Sort berdasarkan transaction_time (terlama di atas)
          completedData.data.sort((a: any, b: any) => {
            const dateA = new Date(a.transaction_time || 0).getTime();
            const dateB = new Date(b.transaction_time || 0).getTime();
            return dateA - dateB;
          });

          setSalesReport({
            data: completedData.data,
            summary: completedData.summary,
            all_data: allData.data || [] // Simpan semua data untuk filter void
          });
        } else {
          setSalesReport(completedData);
        }
        
      } else if (type === 'expenses') {
        const data = await reportAPI.getExpenses(params) as any;
        
        // Sort data berdasarkan expense_date (terlama di atas)
        if (data.data && Array.isArray(data.data)) {
          data.data.sort((a: any, b: any) => {
            const dateA = new Date(a.expense_date || 0).getTime();
            const dateB = new Date(b.expense_date || 0).getTime();
            return dateA - dateB;
          });
        }
        
        setExpensesReport(data);
      } else if (type === 'items') {
        // ✅ PERBAIKAN DI SINI
        // 1. Tambahkan limit besar (100) agar Client-Side Pagination mendapatkan cukup data
        const itemsParams = { ...params, status: 'COMPLETED', limit: 100 };
        const response = await reportAPI.getItems(itemsParams) as any;
        
        console.log('✅ Items Report Data:', response);
        
        // 2. Ambil array dari properti .data karena backend mengembalikan { meta, data }
        const itemsList = response.data || (Array.isArray(response) ? response : []);
        setItemsReport(itemsList);
      }
    } catch (err: any) {
      console.error('❌ Error fetching report:', err);
      setError(err.response?.data?.message || 'Gagal memuat laporan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleVoidFilter = () => {
    setShowVoidOnly(!showVoidOnly);
    setSalesCurrentPage(1);
  };

  const handleViewProof = (expense: any) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_GAMBAR_URL;
    let imagePath = expense.proof_image || '';
    
    imagePath = imagePath.replace(/^\/+/, '');
    const imageUrl = `${baseUrl}/${imagePath}`;
    
    // Ekstrak informasi kasir dan operator dari struktur backend
    const operatorName = expense.user?.full_name || '-';
    const cashierName = expense.shift?.cashier?.full_name || '-';
    
    setSelectedProof({
      image_url: imageUrl,
      description: expense.description || '-',
      amount: expense.amount || '0',
      date: expense.expense_date || '',
      user: operatorName,
      cashier: cashierName,
      branch: expense.branch?.branch_name || '-'
    });
    setIsProofModalOpen(true);
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

  const formatDateOnly = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Pagination helper functions
  const getPaginatedData = (data: any[], currentPage: number) => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return data.slice(startIndex, endIndex);
  };

  const getTotalPages = (dataLength: number) => {
    return Math.ceil(dataLength / ITEMS_PER_PAGE);
  };

  const handlePageChange = (page: number, setPage: (page: number) => void, totalPages: number) => {
    if (page > 0 && page <= totalPages) {
      setPage(page);
    }
  };

  // Helper untuk mendapatkan badge style berdasarkan status
  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return {
          variant: 'default' as const,
          className: 'bg-black text-white '
        };
      case 'VOID_REQUESTED':
        return {
          variant: 'outline' as const,
          className: 'bg-white text-black border-gray-400 '
        };
      case 'VOIDED':
        return {
          variant: 'destructive' as const,
          className: 'bg-black text-white'
        };
      default:
        return {
          variant: 'secondary' as const,
          className: ''
        };
    }
  };

  // Filter sales data berdasarkan void status
  const getFilteredSalesData = () => {
    if (!salesReport) return [];
    
    if (showVoidOnly) {
      // Ambil dari all_data dan filter hanya void
      const allData = salesReport.all_data || [];
      return allData.filter((item: any) => 
        item.status === 'VOID_REQUESTED' || item.status === 'VOIDED'
      );
    }
    
    // Default: tampilkan data COMPLETED dari backend
    return salesReport.data || [];
  };

  // Hitung summary untuk void transactions
  const getVoidSummary = () => {
    if (!showVoidOnly || !salesReport) return null;
    
    const voidTransactions = getFilteredSalesData();
    
    return {
      total_sales: voidTransactions.reduce((sum: number, item: any) => 
        sum + parseFloat(item.total_amount || 0), 0
      ).toString(),
      transaction_count: voidTransactions.length,
      total_subtotal: voidTransactions.reduce((sum: number, item: any) => 
        sum + parseFloat(item.subtotal || 0), 0
      ).toString(),
      total_discount: voidTransactions.reduce((sum: number, item: any) => 
        sum + parseFloat(item.total_discount || 0), 0
      ).toString(),
      total_tax: voidTransactions.reduce((sum: number, item: any) => 
        sum + parseFloat(item.total_tax || 0), 0
      ).toString()
    };
  };

  // Pagination data
  const filteredSalesData = getFilteredSalesData();
  const paginatedSalesData = filteredSalesData.length > 0 ? getPaginatedData(filteredSalesData, salesCurrentPage) : [];
  const salesTotalPages = filteredSalesData.length > 0 ? getTotalPages(filteredSalesData.length) : 0;

  const paginatedExpensesData = expensesReport?.data ? getPaginatedData(expensesReport.data, expensesCurrentPage) : [];
  const expensesTotalPages = expensesReport?.data ? getTotalPages(expensesReport.data.length) : 0;

  const paginatedItemsData = itemsReport.length > 0 ? getPaginatedData(itemsReport, itemsCurrentPage) : [];
  const itemsTotalPages = itemsReport.length > 0 ? getTotalPages(itemsReport.length) : 0;

  const displaySummary = showVoidOnly ? getVoidSummary() : salesReport?.summary;

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8 @container">
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
          <div className="grid gap-4 md:grid-cols-4">
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

            {/* Tombol Generate Laporan - Sejajar dengan Tanggal Selesai */}
            <div className="space-y-2">
              <Label className="invisible">Action</Label>
              <Button 
                onClick={() => handleGenerateReport(activeTab as 'sales' | 'expenses' | 'items')} 
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
            <div className="flex gap-2">
              {salesReport && (
                <Button 
                  onClick={handleToggleVoidFilter} 
                  variant={showVoidOnly ? "destructive" : "outline"}
                  disabled={isLoading}
                  className={showVoidOnly 
                    ? "bg-black text-white hover:bg-black  border-gray-300" 
                    : "border-gray-300 text-black-600 hover:bg-gray-50"
                  }
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  {showVoidOnly ? 'Tampilkan Semua' : 'Tampilkan Void'}
                </Button>
              )}
            </div>
          </div>

          {salesReport && (
            <>
              {/* Summary Cards */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card className={showVoidOnly ? "border-gray-200 bg-white" : ""}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">
                      {showVoidOnly ? 'Total Void' : 'Total Penjualan'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${showVoidOnly ? 'text-black' : 'text-black'}`}>
                      {formatCurrency(displaySummary?.total_sales || 0)}
                    </div>
                  </CardContent>
                </Card>

                <Card className={showVoidOnly ? "border-gray-200 bg-white" : ""}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">
                      {showVoidOnly ? 'Jumlah Void' : 'Jumlah Transaksi'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${showVoidOnly ? 'text-black' : 'text-black'}`}>
                      {displaySummary?.transaction_count || 0}
                    </div>
                  </CardContent>
                </Card>

              </div>

              {/* Data Table dengan Pagination */}
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">No</TableHead>
                      <TableHead>No. Struk</TableHead>
                      <TableHead>Waktu Transaksi</TableHead>
                      <TableHead>Cabang</TableHead>
                      <TableHead className="w-48">Kasir</TableHead>
                      <TableHead>Metode</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedSalesData.length > 0 ? (
                      paginatedSalesData.map((item: any, index: number) => {
                        const globalIndex = (salesCurrentPage - 1) * ITEMS_PER_PAGE + index + 1;
                        
                        const operatorName = item.user?.full_name || '-';
                        const cashierName = item.shift?.cashier?.full_name || '-';
                        const showBothRoles = operatorName !== cashierName && cashierName !== '-';
                        const badgeStyle = getStatusBadgeStyle(item.status);
                        
                        return (
                          <TableRow key={item.transaction_id || index}>
                            <TableCell className="font-medium text-center">
                              {globalIndex}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {item.receipt_number || '-'}
                            </TableCell>
                            <TableCell className="text-sm">
                              {item.transaction_time ? formatDate(item.transaction_time) : '-'}
                            </TableCell>
                            <TableCell>
                              {item.branch?.branch_name || 'N/A'}
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
                            
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                <CreditCard className="mr-1 h-3 w-3" />
                                {item.payment_method || '-'}
                              </Badge>
                            </TableCell>
                            <TableCell className=" font-semibold text-gray-800">
                              {formatCurrency(item.total_amount || 0)}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={badgeStyle.variant}
                                className={`text-xs ${badgeStyle.className}`}
                              >
                                {item.status || '-'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12">
                          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                          <p className="text-muted-foreground">
                            {showVoidOnly ? 'Tidak ada transaksi void' : 'Tidak ada data transaksi'}
                          </p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                {salesTotalPages > 1 && (
                  <div className="py-4">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            href="#" 
                            onClick={(e) => {
                              e.preventDefault();
                              handlePageChange(salesCurrentPage - 1, setSalesCurrentPage, salesTotalPages);
                            }}
                            className={salesCurrentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                        
                        {Array.from({ length: salesTotalPages }).map((_, i) => (
                          <PaginationItem key={i}>
                            <PaginationLink 
                              href="#" 
                              isActive={salesCurrentPage === i + 1}
                              onClick={(e) => {
                                e.preventDefault();
                                handlePageChange(i + 1, setSalesCurrentPage, salesTotalPages);
                              }}
                            >
                              {i + 1}
                            </PaginationLink>
                          </PaginationItem>
                        ))}

                        <PaginationItem>
                          <PaginationNext 
                            href="#" 
                            onClick={(e) => {
                              e.preventDefault();
                              handlePageChange(salesCurrentPage + 1, setSalesCurrentPage, salesTotalPages);
                            }}
                            className={salesCurrentPage >= salesTotalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                    <div className="text-center text-sm text-muted-foreground mt-2">
                      Halaman {salesCurrentPage} dari {salesTotalPages} ({filteredSalesData.length} total transaksi)
                    </div>
                  </div>
                )}
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
          </div>

          {expensesReport && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Total Pengeluaran</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-black">
                      {formatCurrency(expensesReport.summary?.total_expenses || 0)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Jumlah Pengeluaran</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {expensesReport.summary?.expense_count || 0} item
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">No</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Deskripsi</TableHead>
                      <TableHead>Cabang</TableHead>
                      <TableHead className="w-48">Input Oleh</TableHead>
                      <TableHead>Jumlah</TableHead>
                      <TableHead className="text-center">Bukti</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedExpensesData.length > 0 ? (
                      paginatedExpensesData.map((item: any, index: number) => {
                        const globalIndex = (expensesCurrentPage - 1) * ITEMS_PER_PAGE + index + 1;
                        
                        const operatorName = item.user?.full_name || '-';
                        const cashierName = item.shift?.cashier?.full_name || '-';
                        const showBothRoles = operatorName !== cashierName && cashierName !== '-';
                        
                        return (
                          <TableRow key={item.expense_id || index}>
                            <TableCell className="font-medium text-center">
                              {globalIndex}
                            </TableCell>
                            <TableCell className="text-sm">
                              {item.expense_date ? formatDateOnly(item.expense_date) : '-'}
                            </TableCell>
                            <TableCell className="max-w-xs">
                              <div className="truncate" title={item.description}>
                                {item.description || '-'}
                              </div>
                            </TableCell>
                            <TableCell>
                              {item.branch?.branch_name || 'N/A'}
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
                            
                            <TableCell className=" font-semibold text-black">
                              {formatCurrency(item.amount || 0)}
                            </TableCell>
                            <TableCell className="text-center">
                              {item.proof_image ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewProof(item)}
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                  <Eye className="mr-1 h-4 w-4" />
                                  Lihat Bukti
                                </Button>
                              ) : (
                                <span className="text-xs text-muted-foreground">Tidak ada bukti</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12">
                          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                          <p className="text-muted-foreground">Tidak ada data pengeluaran</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                {expensesTotalPages > 1 && (
                  <div className="py-4">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            href="#" 
                            onClick={(e) => {
                              e.preventDefault();
                              handlePageChange(expensesCurrentPage - 1, setExpensesCurrentPage, expensesTotalPages);
                            }}
                            className={expensesCurrentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                        
                        {Array.from({ length: expensesTotalPages }).map((_, i) => (
                          <PaginationItem key={i}>
                            <PaginationLink 
                              href="#" 
                              isActive={expensesCurrentPage === i + 1}
                              onClick={(e) => {
                                e.preventDefault();
                                handlePageChange(i + 1, setExpensesCurrentPage, expensesTotalPages);
                              }}
                            >
                              {i + 1}
                            </PaginationLink>
                          </PaginationItem>
                        ))}

                        <PaginationItem>
                          <PaginationNext 
                            href="#" 
                            onClick={(e) => {
                              e.preventDefault();
                              handlePageChange(expensesCurrentPage + 1, setExpensesCurrentPage, expensesTotalPages);
                            }}
                            className={expensesCurrentPage >= expensesTotalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                    <div className="text-center text-sm text-muted-foreground mt-2">
                      Halaman {expensesCurrentPage} dari {expensesTotalPages} ({expensesReport.data.length} total pengeluaran)
                    </div>
                  </div>
                )}
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
          </div>

          {itemsReport.length > 0 ? (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16 text-center">No</TableHead>
                    <TableHead className="w-24 text-center">Rank</TableHead>
                    <TableHead>Produk</TableHead>
                    <TableHead className="text-center">Quantity Terjual</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedItemsData.map((item: any, index: number) => {
                    const globalIndex = (itemsCurrentPage - 1) * ITEMS_PER_PAGE + index + 1;
                    return (
                      <TableRow key={item.product_id || index}>
                        <TableCell className="font-medium text-center">
                          {globalIndex}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge 
                            variant={globalIndex <= 3 ? 'default' : 'secondary'}
                            className="font-bold text-sm px-3 py-1"
                          >
                            #{globalIndex}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Package className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                            <span className="font-medium text-base">{item.product_name || '-'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div>
                            <div className="font-bold text-xl text-black">
                              {item.quantity_sold || 0}
                            </div>
                            <div className="text-xs text-muted-foreground">item</div>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {itemsTotalPages > 1 && (
                <div className="py-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          href="#" 
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(itemsCurrentPage - 1, setItemsCurrentPage, itemsTotalPages);
                          }}
                          className={itemsCurrentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: itemsTotalPages }).map((_, i) => (
                        <PaginationItem key={i}>
                          <PaginationLink 
                            href="#" 
                            isActive={itemsCurrentPage === i + 1}
                            onClick={(e) => {
                              e.preventDefault();
                              handlePageChange(i + 1, setItemsCurrentPage, itemsTotalPages);
                            }}
                          >
                            {i + 1}
                          </PaginationLink>
                        </PaginationItem>
                      ))}

                      <PaginationItem>
                        <PaginationNext 
                          href="#" 
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(itemsCurrentPage + 1, setItemsCurrentPage, itemsTotalPages);
                          }}
                          className={itemsCurrentPage >= itemsTotalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                  <div className="text-center text-sm text-muted-foreground mt-2">
                    Halaman {itemsCurrentPage} dari {itemsTotalPages} ({itemsReport.length} total produk)
                  </div>
                </div>
              )}
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

      {/* Modal Bukti Pengeluaran */}
      <Dialog open={isProofModalOpen} onOpenChange={setIsProofModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Bukti Pengeluaran
            </DialogTitle>
            <DialogDescription>
              Lihat foto bukti pengeluaran operasional
            </DialogDescription>
          </DialogHeader>
                
          {selectedProof && (
            <div className="space-y-4 py-4">
              {/* Gambar Bukti */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-900">Foto Bukti</p>
                <div className="relative w-full h-full bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center border border-gray-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedProof.image_url}
                    alt="Bukti Pengeluaran"
                    className="max-w-full max-h-full object-contain rounded"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = '<div class="text-center"><p class="text-muted-foreground">Gagal memuat gambar</p></div>';
                      }
                    }}
                  />
                </div>
              </div>

              {/* Action Buttons - Sticky di bawah */}
              <div className="flex justify-end gap-2 pt-4 border-t sticky  bg-white">
                <Button
                  variant="outline"
                  onClick={() => setIsProofModalOpen(false)}
                >
                  <X className="mr-2 h-4 w-4" />
                  Tutup
                </Button>
                <Button
                  onClick={() => window.open(selectedProof.image_url, '_blank')}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Bukti
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}