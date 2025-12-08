'use client';

import { useState, useEffect } from 'react';
import { discountAPI, categoryAPI, productAPI, branchAPI } from '@/lib/api/mitra';
import { DiscountRule, Category, Product, Branch } from '@/types/mitra';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
} from "@/components/ui/pagination";
import { 
  Plus, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Percent,
  Building2,
  Globe,
  AlertCircle,
  Loader2,
  Filter,
  Calendar,
  Tag,
  Eye,
  AlertTriangle,
  Archive,
  RotateCcw
} from 'lucide-react';
import { formatRupiah } from '@/lib/utils';

// Konfigurasi Pagination
const ITEMS_PER_PAGE = 5;

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<DiscountRule[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State Filter & Pagination
  const [showArchived, setShowArchived] = useState(false);
  const [scopeFilter, setScopeFilter] = useState<'all' | 'general' | 'local'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSoftDeleteOpen, setIsSoftDeleteOpen] = useState(false);
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  const [isHardDeleteModalOpen, setIsHardDeleteModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  const [selectedDiscount, setSelectedDiscount] = useState<DiscountRule | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form Data
  const [formData, setFormData] = useState({
    discount_name: '',
    discount_type: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED_AMOUNT',
    value: '',
    start_date: '',
    end_date: '',
    applies_to: 'ENTIRE_TRANSACTION' as 'ENTIRE_TRANSACTION' | 'SPECIFIC_CATEGORY' | 'SPECIFIC_PRODUCT',
    target_id: '',
    // Aturan Tambahan
    min_transaction_amount: '',
    max_transaction_amount: '',
    min_item_quantity: '',
    max_item_quantity: '',
    min_discount_amount: '',
    max_discount_amount: '',
  });

  useEffect(() => {
    loadData();
  }, [showArchived]);

  // Reset pagination saat filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [scopeFilter, showArchived]);

  // Helper Delay
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Helper Format Input (Hanya Angka)
  const handleNumberInput = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const val = e.target.value.replace(/\D/g, '');
    setFormData({ ...formData, [field]: val });
  };

  // Helper Tampilan Format Ribuan di Input
  const displayFormatted = (val: string) => {
    if (!val) return '';
    return Number(val).toLocaleString('id-ID');
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [discountsData, categoriesData, productsData, branchesData] = await Promise.all([
        discountAPI.getAll(),
        categoryAPI.getAll(),
        productAPI.getAll(),
        branchAPI.getAll(),
      ]);
      
      const branchesList = Array.isArray(branchesData) ? branchesData : [];
      const discountsList = Array.isArray(discountsData) ? discountsData : [];
      
      const filteredApiData = showArchived 
        ? discountsList.filter(d => d.is_active === false)
        : discountsList.filter(d => d.is_active !== false);

      const discountsWithBranch = filteredApiData.map(discount => {
        const branch = discount.branch_id 
          ? branchesList.find(b => b.branch_id === discount.branch_id)
          : null;
        return {
          ...discount,
          branch: branch || null
        };
      });
      
      setDiscounts(discountsWithBranch);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      setProducts(Array.isArray(productsData) ? productsData : []);
      setBranches(branchesList);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data diskon');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (discount?: DiscountRule) => {
    if (discount) {
      setSelectedDiscount(discount);
      setFormData({
        discount_name: discount.discount_name,
        discount_type: discount.discount_type,
        value: discount.value.toString(),
        start_date: discount.start_date.split('T')[0],
        end_date: discount.end_date.split('T')[0],
        applies_to: discount.applies_to,
        target_id: discount.target_id || '',
        min_transaction_amount: discount.min_transaction_amount?.toString() || '',
        max_transaction_amount: discount.max_transaction_amount?.toString() || '',
        min_item_quantity: discount.min_item_quantity?.toString() || '',
        max_item_quantity: discount.max_item_quantity?.toString() || '',
        min_discount_amount: discount.min_discount_amount?.toString() || '',
        max_discount_amount: discount.max_discount_amount?.toString() || '',
      });
    } else {
      setSelectedDiscount(null);
      setFormData({
        discount_name: '',
        discount_type: 'PERCENTAGE',
        value: '',
        start_date: '',
        end_date: '',
        applies_to: 'ENTIRE_TRANSACTION',
        target_id: '',
        min_transaction_amount: '',
        max_transaction_amount: '',
        min_item_quantity: '',
        max_item_quantity: '',
        min_discount_amount: '',
        max_discount_amount: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleViewDetail = (discount: DiscountRule) => {
    setSelectedDiscount(discount);
    setIsDetailModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDiscount(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await delay(2000);

      const dataToSend: any = {
        discount_name: formData.discount_name,
        discount_type: formData.discount_type,
        value: parseFloat(formData.value),
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(`${formData.end_date}T23:59:00`).toISOString(),
        applies_to: formData.applies_to,
      };

      if (formData.applies_to !== 'ENTIRE_TRANSACTION' && formData.target_id) {
        dataToSend.target_id = formData.target_id;
      }

      if (formData.min_transaction_amount) dataToSend.min_transaction_amount = parseFloat(formData.min_transaction_amount);
      if (formData.max_transaction_amount) dataToSend.max_transaction_amount = parseFloat(formData.max_transaction_amount);
      if (formData.min_item_quantity) dataToSend.min_item_quantity = parseInt(formData.min_item_quantity);
      if (formData.max_item_quantity) dataToSend.max_item_quantity = parseInt(formData.max_item_quantity);
      if (formData.min_discount_amount) dataToSend.min_discount_amount = parseFloat(formData.min_discount_amount);
      if (formData.max_discount_amount) dataToSend.max_discount_amount = parseFloat(formData.max_discount_amount);

      if (selectedDiscount) {
        await discountAPI.update(selectedDiscount.discount_rule_id, dataToSend);
      } else {
        await discountAPI.create(dataToSend);
      }
      await loadData();
      handleCloseModal();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menyimpan diskon');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchive = async () => {
    if (!selectedDiscount) return;
    
    setIsSubmitting(true);
    try {
      await delay(2000);
      await discountAPI.softDelete(selectedDiscount.discount_rule_id);
      await loadData();
      setIsSoftDeleteOpen(false);
      setSelectedDiscount(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal mengarsipkan diskon');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestore = async () => {
    if (!selectedDiscount) return;
    
    setIsSubmitting(true);
    try {
      await delay(2000);
      const restoreData = {
        is_active: true,
        discount_name: selectedDiscount.discount_name,
        discount_type: selectedDiscount.discount_type,
        value: selectedDiscount.value,
        start_date: selectedDiscount.start_date,
        end_date: selectedDiscount.end_date,
        applies_to: selectedDiscount.applies_to
      };
      
      await discountAPI.update(selectedDiscount.discount_rule_id, restoreData);
      await loadData();
      setIsRestoreOpen(false);
      setSelectedDiscount(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal mengaktifkan kembali diskon');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHardDelete = async () => {
    if (!selectedDiscount) return;
    
    setIsSubmitting(true);
    try {
      await delay(2000);
      await discountAPI.hardDelete(selectedDiscount.discount_rule_id);
      await loadData();
      setIsHardDeleteModalOpen(false);
      setSelectedDiscount(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus permanen');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1. Filter Logic
  const filteredDiscounts = discounts.filter(disc => {
    if (scopeFilter === 'general') return !disc.branch_id;
    if (scopeFilter === 'local') return !!disc.branch_id;
    return true;
  });

  const generalCount = discounts.filter(d => !d.branch_id).length;
  const localCount = discounts.filter(d => d.branch_id).length;

  // 2. Pagination Logic
  const totalItems = filteredDiscounts.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedDiscounts = filteredDiscounts.slice(startIndex, endIndex);

  const handlePageChange = (page: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getTargetName = (discount: DiscountRule | null) => {
    if (!discount || !discount.target_id) return '-';
    if (discount.applies_to === 'SPECIFIC_CATEGORY') {
      const cat = categories.find(c => c.category_id === discount.target_id);
      return cat ? `Kategori: ${cat.category_name}` : 'Kategori Tidak Ditemukan';
    }
    if (discount.applies_to === 'SPECIFIC_PRODUCT') {
      const prod = products.find(p => p.product_id === discount.target_id);
      return prod ? `Produk: ${prod.product_name}` : 'Produk Tidak Ditemukan';
    }
    return '-';
  };

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8 @container">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-12 w-full" />
        <Card>
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8 @container">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Diskon</h1>
          <p className="text-muted-foreground">
            Kelola aturan diskon (General & Lokal)
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={showArchived ? "default" : "outline"}
            onClick={() => setShowArchived(!showArchived)}
          >
            <Archive className="mr-2 h-4 w-4" />
            {showArchived ? 'Sembunyikan Arsip' : 'Tampilkan Arsip'}
          </Button>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Diskon
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Info Card */}
      <Alert>
        <Globe className="h-4 w-4" />
        <AlertDescription>
          <strong>Hybrid Scope:</strong> Diskon yang Anda buat akan otomatis menjadi{' '}
          <strong>General</strong> (berlaku untuk semua cabang). Total: {generalCount} General, {localCount} Lokal
        </AlertDescription>
      </Alert>

      {/* Filter */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium whitespace-nowrap">Filter Status:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={scopeFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setScopeFilter('all')}
            >
              Semua ({discounts.length})
            </Button>
            <Button
              variant={scopeFilter === 'general' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setScopeFilter('general')}
            >
              <Globe className="mr-2 h-3 w-3" />
              General ({generalCount})
            </Button>
            <Button
              variant={scopeFilter === 'local' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setScopeFilter('local')}
            >
              <Building2 className="mr-2 h-3 w-3" />
              Lokal ({localCount})
            </Button>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Diskon</TableHead>
              <TableHead>Tipe</TableHead>
              <TableHead>Nilai</TableHead>
              <TableHead>Periode</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedDiscounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <Percent className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">
                    {showArchived ? 'Tidak ada diskon di arsip' : 'Tidak ada diskon'}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              paginatedDiscounts.map((discount) => (
                <TableRow key={discount.discount_rule_id} className={!discount.is_active ? 'opacity-75 bg-muted/30' : ''}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      {discount.discount_name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {discount.discount_type === 'PERCENTAGE' ? 'Persentase' : 'Nominal'}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold">
                    {discount.discount_type === 'PERCENTAGE' 
                      ? `${discount.value}%`
                      : formatRupiah(discount.value)
                    }
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(discount.start_date)} - {formatDate(discount.end_date)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={discount.branch_id ? 'secondary' : 'default'}>
                      {discount.branch_id ? 'Lokal' : 'General'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleViewDetail(discount)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Detail
                        </DropdownMenuItem>
                        
                        {!showArchived ? (
                          <>
                            <DropdownMenuItem onClick={() => handleOpenModal(discount)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedDiscount(discount);
                                setIsSoftDeleteOpen(true);
                              }}
                              className="text-orange-600"
                            >
                              <Archive className="mr-2 h-4 w-4" />
                              Arsipkan
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedDiscount(discount);
                              setIsRestoreOpen(true);
                            }}
                            className="text-green-600"
                          >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Aktifkan Kembali
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedDiscount(discount);
                            setIsHardDeleteModalOpen(true);
                          }}
                          className="text-destructive focus:text-destructive"
                        >
                          <AlertTriangle className="mr-2 h-4 w-4" />
                          Hapus Permanen
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="py-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    href="#" 
                    onClick={(e) => handlePageChange(currentPage - 1, e)}
                    className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                
                {/* Generate Page Numbers */}
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
                    className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </Card>

      {/* Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detail Diskon</DialogTitle>
            <DialogDescription>Informasi lengkap aturan diskon</DialogDescription>
          </DialogHeader>
          {selectedDiscount && (
            <div className="space-y-4 py-2 text-sm max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-muted-foreground mb-1">Nama Diskon</p>
                  <p className="font-semibold">{selectedDiscount.discount_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Status</p>
                  <Badge variant={selectedDiscount.is_active ? 'default' : 'secondary'}>
                    {selectedDiscount.is_active ? 'Aktif' : 'Diarsipkan'}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Cakupan</p>
                  <Badge variant={selectedDiscount.branch_id ? 'secondary' : 'default'}>
                    {selectedDiscount.branch_id ? 'Lokal' : 'General'}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Tipe</p>
                  <p>{selectedDiscount.discount_type === 'PERCENTAGE' ? 'Persentase' : 'Nominal Tetap'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Nilai</p>
                  <p className="font-bold text-lg text-primary">
                    {selectedDiscount.discount_type === 'PERCENTAGE' 
                      ? `${selectedDiscount.value}%` 
                      : formatRupiah(selectedDiscount.value)
                    }
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground mb-1">Berlaku Untuk</p>
                  <p className="font-medium">
                    {selectedDiscount.applies_to === 'ENTIRE_TRANSACTION' ? 'Seluruh Transaksi' :
                     selectedDiscount.applies_to === 'SPECIFIC_CATEGORY' ? 'Kategori Tertentu' : 'Produk Tertentu'}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground mb-1">Target</p>
                  <p className="font-medium">{getTargetName(selectedDiscount)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground mb-1">Periode</p>
                  <div className="bg-muted p-2 rounded text-center font-mono">
                    {formatDate(selectedDiscount.start_date)} - {formatDate(selectedDiscount.end_date)}
                  </div>
                </div>
                
                {/* Detail Rupiah */}
                <div className="col-span-2 mt-2 pt-2 border-t">
                  <p className="font-semibold mb-2">Syarat & Ketentuan:</p>
                  <ul className="grid grid-cols-2 gap-2 text-muted-foreground">
                    <li>
                      <span className="block text-xs">Min. Transaksi</span>
                      <span className="font-medium text-foreground">{selectedDiscount.min_transaction_amount ? formatRupiah(selectedDiscount.min_transaction_amount) : '-'}</span>
                    </li>
                    <li>
                      <span className="block text-xs">Max. Transaksi</span>
                      <span className="font-medium text-foreground">{selectedDiscount.max_transaction_amount ? formatRupiah(selectedDiscount.max_transaction_amount) : '-'}</span>
                    </li>
                    <li>
                      <span className="block text-xs">Min. Diskon</span>
                      <span className="font-medium text-foreground">{selectedDiscount.min_discount_amount ? formatRupiah(selectedDiscount.min_discount_amount) : '-'}</span>
                    </li>
                    <li>
                      <span className="block text-xs">Max. Diskon</span>
                      <span className="font-medium text-foreground">{selectedDiscount.max_discount_amount ? formatRupiah(selectedDiscount.max_discount_amount) : '-'}</span>
                    </li>
                    <li>
                      <span className="block text-xs">Min. Item</span>
                      <span className="font-medium text-foreground">{selectedDiscount.min_item_quantity ? `${selectedDiscount.min_item_quantity} item` : '-'}</span>
                    </li>
                    <li>
                      <span className="block text-xs">Max. Item</span>
                      <span className="font-medium text-foreground">{selectedDiscount.max_item_quantity ? `${selectedDiscount.max_item_quantity} item` : '-'}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsDetailModalOpen(false)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Form Modal (Create/Edit) */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDiscount ? 'Edit Diskon' : 'Tambah Diskon Baru'}
            </DialogTitle>
            <DialogDescription>
              Isi detail aturan diskon di bawah ini.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="discount_name">Nama Diskon *</Label>
                <Input
                  id="discount_name"
                  value={formData.discount_name}
                  onChange={(e) => setFormData({ ...formData, discount_name: e.target.value })}
                  placeholder="Contoh: Promo Kemerdekaan"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discount_type">Tipe Diskon *</Label>
                  <Select
                    value={formData.discount_type}
                    onValueChange={(value: any) => setFormData({ ...formData, discount_type: value, value: '' })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">Persentase (%)</SelectItem>
                      <SelectItem value="FIXED_AMOUNT">Nominal (Rp)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="value">
                    Nilai * {formData.discount_type === 'PERCENTAGE' ? '(%)' : '(Rp)'}
                  </Label>
                  {formData.discount_type === 'PERCENTAGE' ? (
                    <Input
                      id="value"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      placeholder="10"
                      required
                    />
                  ) : (
                    // INPUT FORMAT RUPIAH
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">Rp</span>
                      <Input
                        id="value"
                        className="pl-9"
                        value={displayFormatted(formData.value)}
                        onChange={(e) => handleNumberInput(e, 'value')}
                        placeholder="10.000"
                        required
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Mulai *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_date">Selesai *</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="applies_to">Berlaku Untuk *</Label>
                <Select
                  value={formData.applies_to}
                  onValueChange={(value: any) => setFormData({ ...formData, applies_to: value, target_id: '' })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ENTIRE_TRANSACTION">Seluruh Transaksi</SelectItem>
                    <SelectItem value="SPECIFIC_CATEGORY">Kategori Tertentu</SelectItem>
                    <SelectItem value="SPECIFIC_PRODUCT">Produk Tertentu</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Target Selection */}
              {formData.applies_to === 'SPECIFIC_CATEGORY' && (
                <div className="space-y-2">
                  <Label htmlFor="target_id">Pilih Kategori *</Label>
                  <Select
                    value={formData.target_id}
                    onValueChange={(value) => setFormData({ ...formData, target_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.category_id} value={cat.category_id}>
                          {cat.category_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.applies_to === 'SPECIFIC_PRODUCT' && (
                <div className="space-y-2">
                  <Label htmlFor="target_id">Pilih Produk *</Label>
                  <Select
                    value={formData.target_id}
                    onValueChange={(value) => setFormData({ ...formData, target_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Produk" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((prod) => (
                        <SelectItem key={prod.product_id} value={prod.product_id}>
                          {prod.product_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Advanced Rules Section */}
              <div className="border-t pt-4 mt-2">
                <p className="font-medium mb-3 text-sm">Aturan Tambahan (Opsional)</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Min. Transaksi (Rp)</Label>
                    <Input
                      value={displayFormatted(formData.min_transaction_amount)}
                      onChange={(e) => handleNumberInput(e, 'min_transaction_amount')}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Max. Transaksi (Rp)</Label>
                    <Input
                      value={displayFormatted(formData.max_transaction_amount)}
                      onChange={(e) => handleNumberInput(e, 'max_transaction_amount')}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Min. Item (Qty)</Label>
                    <Input
                      value={displayFormatted(formData.min_item_quantity)}
                      onChange={(e) => handleNumberInput(e, 'min_item_quantity')}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Max. Item (Qty)</Label>
                    <Input
                      value={displayFormatted(formData.max_item_quantity)}
                      onChange={(e) => handleNumberInput(e, 'max_item_quantity')}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Min. Diskon (Rp)</Label>
                    <Input
                      value={displayFormatted(formData.min_discount_amount)}
                      onChange={(e) => handleNumberInput(e, 'min_discount_amount')}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Max. Diskon (Rp)</Label>
                    <Input
                      value={displayFormatted(formData.max_discount_amount)}
                      onChange={(e) => handleNumberInput(e, 'max_discount_amount')}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseModal}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selectedDiscount ? 'Update' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Archive (Soft Delete) Confirmation */}
      <Dialog open={isSoftDeleteOpen} onOpenChange={setIsSoftDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Arsipkan Diskon?</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin mengarsipkan diskon <strong>{selectedDiscount?.discount_name}</strong>?
              <br/>
              Diskon akan dinonaktifkan (Soft Delete).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSoftDeleteOpen(false)}>
              Batal
            </Button>
            <Button variant="default" className="bg-orange-600 hover:bg-orange-700" onClick={handleArchive} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Arsipkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Confirmation */}
      <Dialog open={isRestoreOpen} onOpenChange={setIsRestoreOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aktifkan Kembali?</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin mengaktifkan kembali diskon <strong>{selectedDiscount?.discount_name}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRestoreOpen(false)}>
              Batal
            </Button>
            <Button variant="default" className="bg-green-600 hover:bg-green-700" onClick={handleRestore} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Aktifkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hard Delete Confirmation */}
      <Dialog open={isHardDeleteModalOpen} onOpenChange={setIsHardDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Hapus Permanen?
            </DialogTitle>
            <DialogDescription>
              Diskon <strong>{selectedDiscount?.discount_name}</strong> akan dihapus selamanya dari database.
              <br/>
              <span className="text-xs bg-red-50 text-red-600 p-1 rounded mt-2 block">
                Tindakan ini tidak dapat dibatalkan.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHardDeleteModalOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleHardDelete} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Hapus Permanen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}