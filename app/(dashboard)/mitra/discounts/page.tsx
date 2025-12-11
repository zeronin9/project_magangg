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
  RotateCcw,
  Ticket,
  X
} from 'lucide-react';
import { formatRupiah } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';

// ✅ HELPER: Parse product_ids/category_ids dari backend
const parseArrayField = (field: any, relatedField?: any[]): string[] => {
  console.log('🔍 DEBUG parseArrayField - Input:', field, 'Related:', relatedField);
  
  // Jika ada relatedField (products/categories), ekstrak ID dari situ
  if (relatedField && Array.isArray(relatedField) && relatedField.length > 0) {
    const ids = relatedField.map(item => item.product_id || item.category_id).filter(Boolean);
    console.log('✅ Extracted IDs from related field:', ids);
    return ids;
  }
  
  // Jika field sudah array dan berisi data
  if (Array.isArray(field)) {
    console.log('✅ Already array:', field);
    return field;
  }
  
  // Jika field adalah string, coba parse
  if (typeof field === 'string') {
    try {
      const parsed = JSON.parse(field);
      console.log('✅ Parsed from string:', parsed);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('❌ Failed to parse:', e);
      return [];
    }
  }
  
  console.log('⚠️ Returning empty array');
  return [];
};

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
  
  // ✅ UBAH: Form Data dengan arrays untuk product_ids dan category_ids
  const [formData, setFormData] = useState({
    discount_name: '',
    discount_code: '',
    discount_type: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED_AMOUNT',
    value: '',
    start_date: '',
    end_date: '',
    applies_to: 'ENTIRE_TRANSACTION' as 'ENTIRE_TRANSACTION' | 'SPECIFIC_PRODUCTS' | 'SPECIFIC_CATEGORIES',
    product_ids: [] as string[],  // ✅ UBAH: Array
    category_ids: [] as string[], // ✅ UBAH: Array
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

  useEffect(() => {
    setCurrentPage(1);
  }, [scopeFilter, showArchived]);

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handleNumberInput = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const val = e.target.value.replace(/\D/g, '');
    setFormData({ ...formData, [field]: val });
  };

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
    
    console.log('🔍 RAW DISCOUNTS DATA:', discountsList); // ✅ TAMBAHKAN INI
    
    const filteredApiData = showArchived 
      ? discountsList.filter(d => d.is_active === false)
      : discountsList.filter(d => d.is_active !== false);

    // ✅ PERBAIKAN: Parse product_ids dan category_ids
    // ✅ PERBAIKAN: Parse product_ids dan category_ids
const discountsWithBranch = filteredApiData.map(discount => {
  console.log('🔍 Processing discount:', discount.discount_name, {
    product_ids: discount.product_ids,
    category_ids: discount.category_ids,
    products: discount.products, // ✅ Tambahkan ini
    categories: discount.categories // ✅ Tambahkan ini
  });
  
  const branch = discount.branch_id 
    ? branchesList.find(b => b.branch_id === discount.branch_id)
    : null;
  
  return {
    ...discount,
    product_ids: parseArrayField(discount.product_ids, discount.products), // ✅ Pass products
    category_ids: parseArrayField(discount.category_ids, discount.categories), // ✅ Pass categories
    branch: branch || null
  };
});

    console.log('✅ PROCESSED DISCOUNTS:', discountsWithBranch); // ✅ TAMBAHKAN INI
    
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
      discount_code: discount.discount_code || '',
      discount_type: discount.discount_type,
      value: discount.value.toString(),
      start_date: discount.start_date.split('T')[0],
      end_date: discount.end_date.split('T')[0],
      applies_to: discount.applies_to,
      product_ids: parseArrayField(discount.product_ids, (discount as any).products), // ✅ Pass products
      category_ids: parseArrayField(discount.category_ids, (discount as any).categories), // ✅ Pass categories
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
        discount_code: '',
        discount_type: 'PERCENTAGE',
        value: '',
        start_date: '',
        end_date: '',
        applies_to: 'ENTIRE_TRANSACTION',
        product_ids: [],  // ✅ UBAH
        category_ids: [], // ✅ UBAH
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
  console.log('🔍 VIEW DETAIL - Original:', discount);
  
  const processed = {
    ...discount,
    product_ids: parseArrayField(discount.product_ids, (discount as any).products), // ✅ Pass products
    category_ids: parseArrayField(discount.category_ids, (discount as any).categories), // ✅ Pass categories
  };
  
  console.log('✅ VIEW DETAIL - Processed:', processed);
  
  setSelectedDiscount(processed);
  setIsDetailModalOpen(true);
};

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDiscount(null);
  };

  // ✅ HANDLER: Toggle checkbox untuk kategori
  const handleCategoryToggle = (categoryId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      category_ids: checked 
        ? [...prev.category_ids, categoryId]
        : prev.category_ids.filter(id => id !== categoryId)
    }));
  };

  // ✅ HANDLER: Toggle checkbox untuk produk
  const handleProductToggle = (productId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      product_ids: checked 
        ? [...prev.product_ids, productId]
        : prev.product_ids.filter(id => id !== productId)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await delay(2000);

      // ✅ SESUAIKAN: Payload sesuai dokumentasi API
      const dataToSend: any = {
        discount_name: formData.discount_name,
        discount_type: formData.discount_type,
        value: formData.value, // Kirim sebagai string sesuai dokumentasi
        start_date: formData.start_date, // Format YYYY-MM-DD
        end_date: formData.end_date,     // Format YYYY-MM-DD
        applies_to: formData.applies_to,
        is_active: true,
      };

      // Kirim discount_code jika diisi
      if (formData.discount_code && formData.discount_code.trim() !== '') {
        dataToSend.discount_code = formData.discount_code.trim().toUpperCase();
      }

      // ✅ KIRIM: product_ids jika SPECIFIC_PRODUCTS
      if (formData.applies_to === 'SPECIFIC_PRODUCTS') {
        dataToSend.product_ids = formData.product_ids;
      }

      // ✅ KIRIM: category_ids jika SPECIFIC_CATEGORIES
      if (formData.applies_to === 'SPECIFIC_CATEGORIES') {
        dataToSend.category_ids = formData.category_ids;
      }

      // Aturan tambahan (opsional) - kirim sebagai string
      if (formData.min_transaction_amount) dataToSend.min_transaction_amount = formData.min_transaction_amount;
      if (formData.max_transaction_amount) dataToSend.max_transaction_amount = formData.max_transaction_amount;
      if (formData.min_item_quantity) dataToSend.min_item_quantity = parseInt(formData.min_item_quantity);
      if (formData.max_item_quantity) dataToSend.max_item_quantity = parseInt(formData.max_item_quantity);
      if (formData.min_discount_amount) dataToSend.min_discount_amount = formData.min_discount_amount;
      if (formData.max_discount_amount) dataToSend.max_discount_amount = formData.max_discount_amount;

      console.log('=== DATA YANG DIKIRIM ===');
      console.log(JSON.stringify(dataToSend, null, 2));
      console.log('========================');

      if (selectedDiscount) {
        await discountAPI.update(selectedDiscount.discount_rule_id, dataToSend);
      } else {
        await discountAPI.create(dataToSend);
      }
      await loadData();
      handleCloseModal();
    } catch (err: any) {
      console.error('Error:', err);
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
        value: selectedDiscount.value.toString(),
        start_date: selectedDiscount.start_date.split('T')[0],
        end_date: selectedDiscount.end_date.split('T')[0],
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

  const filteredDiscounts = discounts.filter(disc => {
    if (scopeFilter === 'general') return !disc.branch_id;
    if (scopeFilter === 'local') return !!disc.branch_id;
    return true;
  });

  const generalCount = discounts.filter(d => !d.branch_id).length;
  const localCount = discounts.filter(d => d.branch_id).length;

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

  // ✅ UBAH: Fungsi untuk mendapatkan nama target
  const getTargetNames = (discount: DiscountRule | null) => {
    if (!discount) return '-';
    
    if (discount.applies_to === 'SPECIFIC_CATEGORIES' && discount.category_ids && discount.category_ids.length > 0) {
      const names = discount.category_ids
        .map(id => categories.find(c => c.category_id === id)?.category_name)
        .filter(Boolean);
      return names.length > 0 ? names.join(', ') : 'Kategori Tidak Ditemukan';
    }
    
    if (discount.applies_to === 'SPECIFIC_PRODUCTS' && discount.product_ids && discount.product_ids.length > 0) {
      const names = discount.product_ids
        .map(id => products.find(p => p.product_id === id)?.product_name)
        .filter(Boolean);
      return names.length > 0 ? names.join(', ') : 'Produk Tidak Ditemukan';
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
      <div className="flex flex-col gap-4 @md:flex-row @md:items-center @md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Diskon</h1>
          <p className="text-muted-foreground">
            Kelola aturan diskon (General & Lokal)
          </p>
        </div>
        <div className="flex flex-col gap-2 @md:flex-row">
          <Button
            variant={showArchived ? "default" : "outline"}
            onClick={() => setShowArchived(!showArchived)}
            className="w-full @md:w-auto"
          >
            <Archive className="mr-2 h-4 w-4" />
            {showArchived ? 'Sembunyikan Arsip' : 'Tampilkan Arsip'}
          </Button>
          <Button onClick={() => handleOpenModal()} className="w-full @md:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Tambah Diskon
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

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
            <span className="text-sm font-medium whitespace-nowrap">Filter Scope:</span>
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
              <TableHead>Kode</TableHead>
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
                <TableCell colSpan={7} className="text-center py-12">
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
                    {discount.discount_code ? (
                      <Badge variant="secondary" className="font-mono">
                        <Ticket className="mr-1 h-3 w-3" />
                        {discount.discount_code}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">Otomatis</span>
                    )}
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
                              className="text-black"
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
          {/* Nama Diskon */}
          <div>
            <p className="text-muted-foreground mb-1">Nama Diskon</p>
            <p className="font-semibold">{selectedDiscount.discount_name}</p>
          </div>
          
          {/* Status */}
          <div>
            <p className="text-muted-foreground mb-1">Status</p>
            <Badge variant={selectedDiscount.is_active ? 'default' : 'secondary'}>
              {selectedDiscount.is_active ? 'Aktif' : 'Diarsipkan'}
            </Badge>
          </div>
          
          {/* Kode Diskon */}
          <div>
            <p className="text-muted-foreground mb-1">Kode Diskon</p>
            {selectedDiscount.discount_code ? (
              <Badge variant="secondary" className="font-mono">
                <Ticket className="mr-1 h-3 w-3" />
                {selectedDiscount.discount_code}
              </Badge>
            ) : (
              <span className="text-muted-foreground">Otomatis</span>
            )}
          </div>
          
          {/* Cakupan */}
          <div>
            <p className="text-muted-foreground mb-1">Cakupan</p>
            <Badge variant={selectedDiscount.branch_id ? 'secondary' : 'default'}>
              {selectedDiscount.branch_id ? 'Lokal' : 'General'}
            </Badge>
          </div>
          
          {/* Tipe Diskon */}
          <div>
            <p className="text-muted-foreground mb-1">Tipe</p>
            <p>{selectedDiscount.discount_type === 'PERCENTAGE' ? 'Persentase' : 'Nominal Tetap'}</p>
          </div>
          
          {/* Nilai Diskon */}
          <div>
            <p className="text-muted-foreground mb-1">Nilai</p>
            <p className="font-bold text-lg text-primary">
              {selectedDiscount.discount_type === 'PERCENTAGE' 
                ? `${selectedDiscount.value}%` 
                : formatRupiah(selectedDiscount.value)
              }
            </p>
          </div>
          
          {/* Berlaku Untuk */}
          <div className="col-span-2">
            <p className="text-muted-foreground mb-1">Berlaku Untuk</p>
            <p className="font-medium">
              {selectedDiscount.applies_to === 'ENTIRE_TRANSACTION' ? 'Seluruh Transaksi' :
               selectedDiscount.applies_to === 'SPECIFIC_CATEGORIES' ? 'Kategori Tertentu' : 'Produk Tertentu'}
            </p>
          </div>
          
          {/* ✅ PERBAIKAN: Target (Kategori atau Produk) */}
          {selectedDiscount.applies_to !== 'ENTIRE_TRANSACTION' && (
            <div className="col-span-2">
              <p className="text-muted-foreground mb-1">
                {selectedDiscount.applies_to === 'SPECIFIC_CATEGORIES' ? 'Kategori Terpilih' : 'Produk Terpilih'}
              </p>
              
              {/* Jika Kategori */}
              {selectedDiscount.applies_to === 'SPECIFIC_CATEGORIES' && (
                <div className="space-y-2">
                  {selectedDiscount.category_ids && selectedDiscount.category_ids.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedDiscount.category_ids.map((catId) => {
                        const category = categories.find(c => c.category_id === catId);
                        return category ? (
                          <Badge key={catId} variant="outline" className="text-xs">
                            {category.category_name}
                          </Badge>
                        ) : (
                          <Badge key={catId} variant="destructive" className="text-xs">
                            ID: {catId.substring(0, 8)}... (Tidak ditemukan)
                          </Badge>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Tidak ada kategori dipilih</p>
                  )}
                </div>
              )}
              
              {/* Jika Produk */}
              {selectedDiscount.applies_to === 'SPECIFIC_PRODUCTS' && (
                <div className="space-y-2">
                  {selectedDiscount.product_ids && selectedDiscount.product_ids.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedDiscount.product_ids.map((prodId) => {
                        const product = products.find(p => p.product_id === prodId);
                        return product ? (
                          <Badge key={prodId} variant="outline" className="text-xs">
                            {product.product_name}
                          </Badge>
                        ) : (
                          <Badge key={prodId} variant="destructive" className="text-xs">
                            ID: {prodId.substring(0, 8)}... (Tidak ditemukan)
                          </Badge>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Tidak ada produk dipilih</p>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Periode */}
          <div className="col-span-2">
            <p className="text-muted-foreground mb-1">Periode Aktif</p>
            <div className="bg-muted p-2 rounded text-center font-mono text-sm">
              {formatDate(selectedDiscount.start_date)} - {formatDate(selectedDiscount.end_date)}
            </div>
          </div>
          
          {/* Syarat & Ketentuan */}
          <div className="col-span-2 mt-2 pt-2 border-t">
            <p className="font-semibold mb-2">Syarat & Ketentuan:</p>
            <div className="grid grid-cols-2 gap-3">
              {/* Min. Transaksi */}
              <div className="bg-muted/50 p-2 rounded">
                <span className="block text-xs text-muted-foreground">Min. Transaksi</span>
                <span className="font-medium text-sm">
                  {selectedDiscount.min_transaction_amount 
                    ? formatRupiah(selectedDiscount.min_transaction_amount) 
                    : '-'}
                </span>
              </div>
              
              {/* Max. Transaksi */}
              <div className="bg-muted/50 p-2 rounded">
                <span className="block text-xs text-muted-foreground">Max. Transaksi</span>
                <span className="font-medium text-sm">
                  {selectedDiscount.max_transaction_amount 
                    ? formatRupiah(selectedDiscount.max_transaction_amount) 
                    : '-'}
                </span>
              </div>
              
              {/* Min. Diskon */}
              <div className="bg-muted/50 p-2 rounded">
                <span className="block text-xs text-muted-foreground">Min. Diskon</span>
                <span className="font-medium text-sm">
                  {selectedDiscount.min_discount_amount 
                    ? formatRupiah(selectedDiscount.min_discount_amount) 
                    : '-'}
                </span>
              </div>
              
              {/* Max. Diskon */}
              <div className="bg-muted/50 p-2 rounded">
                <span className="block text-xs text-muted-foreground">Max. Diskon</span>
                <span className="font-medium text-sm">
                  {selectedDiscount.max_discount_amount 
                    ? formatRupiah(selectedDiscount.max_discount_amount) 
                    : '-'}
                </span>
              </div>
              
              {/* Min. Item */}
              <div className="bg-muted/50 p-2 rounded">
                <span className="block text-xs text-muted-foreground">Min. Item (Qty)</span>
                <span className="font-medium text-sm">
                  {selectedDiscount.min_item_quantity 
                    ? `${selectedDiscount.min_item_quantity} item` 
                    : '-'}
                </span>
              </div>
              
              {/* Max. Item */}
              <div className="bg-muted/50 p-2 rounded">
                <span className="block text-xs text-muted-foreground">Max. Item (Qty)</span>
                <span className="font-medium text-sm">
                  {selectedDiscount.max_item_quantity 
                    ? `${selectedDiscount.max_item_quantity} item` 
                    : '-'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
    <DialogFooter>
      <Button onClick={() => setIsDetailModalOpen(false)}>Tutup</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

      {/* Form Modal (Create/Edit) - LANJUTAN DI PART 2 */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDiscount ? 'Edit Diskon' : 'Tambah Diskon Baru'}
            </DialogTitle>
            <DialogDescription>
              Diskon akan dibuat sebagai General (berlaku untuk semua cabang).
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              {/* Nama Diskon */}
              <div className="space-y-2">
                <Label htmlFor="discount_name">Nama Diskon *</Label>
                <Input
                  id="discount_name"
                  value={formData.discount_name}
                  onChange={(e) => setFormData({ ...formData, discount_name: e.target.value })}
                  placeholder="Masukkan nama diskon"
                  required
                />
              </div>

              {/* Kode Diskon */}
<div className="space-y-2">
  <Label htmlFor="discount_code">Kode Diskon *</Label>
  <Input
    id="discount_code"
    value={formData.discount_code}
    onChange={(e) => setFormData({ ...formData, discount_code: e.target.value.toUpperCase() })}
    placeholder="Masukkan kode unik"
    maxLength={20}
    className="font-mono uppercase"
    required
  />
  <p className="text-xs text-muted-foreground">
    Masukkan kode unik untuk diskon ini
  </p>
</div>

              {/* Tipe & Nilai */}
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
                      placeholder="Masukkan nilai diskon"
                      required
                    />
                  ) : (
                    <div className="relative">
  <Input
    id="value"
    value={formData.value ? `Rp. ${Number(formData.value).toLocaleString('id-ID')}` : ''}
    onChange={(e) => handleNumberInput(e, 'value')}
    placeholder="Masukkan nilai potongan"
    required
  />
</div>

                  )}
                </div>
              </div>

              {/* Periode */}
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

              {/* Berlaku Untuk */}
              <div className="space-y-2">
                <Label htmlFor="applies_to">Berlaku Untuk *</Label>
                <Select
                  value={formData.applies_to}
                  onValueChange={(value: any) => setFormData({ ...formData, applies_to: value, product_ids: [], category_ids: [] })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ENTIRE_TRANSACTION">Seluruh Transaksi</SelectItem>
                    <SelectItem value="SPECIFIC_CATEGORIES">Kategori Tertentu</SelectItem>
                    <SelectItem value="SPECIFIC_PRODUCTS">Produk Tertentu</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* ✅ UBAH: Target Selection untuk Kategori (Multi-select dengan Checkbox) */}
              {formData.applies_to === 'SPECIFIC_CATEGORIES' && (
                <div className="space-y-2">
                  <Label>Pilih Kategori * ({formData.category_ids.length} dipilih)</Label>
                  <Card className="p-4 max-h-64 overflow-y-auto">
                    {categories.filter((cat) => !cat.branch_id).length > 0 ? (
                      <div className="space-y-2">
                        {categories
                          .filter((cat) => !cat.branch_id)
                          .map((cat) => (
                            <div key={cat.category_id} className="flex items-center space-x-2">
                              <Checkbox
                                id={cat.category_id}
                                checked={formData.category_ids.includes(cat.category_id)}
                                onCheckedChange={(checked) => handleCategoryToggle(cat.category_id, checked as boolean)}
                              />
                              <label
                                htmlFor={cat.category_id}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                {cat.category_name}
                              </label>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Tidak ada kategori general tersedia
                      </p>
                    )}
                  </Card>
                  {formData.category_ids.length === 0 && (
                    <p className="text-xs text-destructive">Minimal pilih 1 kategori</p>
                  )}
                </div>
              )}

              {/* ✅ UBAH: Target Selection untuk Produk (Multi-select dengan Checkbox) */}
              {formData.applies_to === 'SPECIFIC_PRODUCTS' && (
                <div className="space-y-2">
                  <Label>Pilih Produk * ({formData.product_ids.length} dipilih)</Label>
                  <Card className="p-4 max-h-64 overflow-y-auto">
                    {products.filter((prod) => !prod.branch_id).length > 0 ? (
                      <div className="space-y-2">
                        {products
                          .filter((prod) => !prod.branch_id)
                          .map((prod) => (
                            <div key={prod.product_id} className="flex items-center space-x-2">
                              <Checkbox
                                id={prod.product_id}
                                checked={formData.product_ids.includes(prod.product_id)}
                                onCheckedChange={(checked) => handleProductToggle(prod.product_id, checked as boolean)}
                              />
                              <label
                                htmlFor={prod.product_id}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                {prod.product_name}
                              </label>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Tidak ada produk general tersedia
                      </p>
                    )}
                  </Card>
                  {formData.product_ids.length === 0 && (
                    <p className="text-xs text-destructive">Minimal pilih 1 produk</p>
                  )}
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
              <Button 
                type="submit" 
                disabled={
                  isSubmitting || 
                  (formData.applies_to === 'SPECIFIC_CATEGORIES' && formData.category_ids.length === 0) ||
                  (formData.applies_to === 'SPECIFIC_PRODUCTS' && formData.product_ids.length === 0)
                }
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selectedDiscount ? 'Update' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Archive Confirmation */}
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
            <Button variant="default" className="bg-black" onClick={handleArchive} disabled={isSubmitting}>
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
            <DialogTitle className="flex items-center text-black gap-2">
              <AlertTriangle className="h-5 w-5" />
              Hapus Permanen? 
            </DialogTitle>
            <DialogDescription>
              Diskon <strong>{selectedDiscount?.discount_name}</strong> akan dihapus selamanya dari database.
              <br/>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHardDeleteModalOpen(false)}>
              Batal
            </Button>
            <Button className='bg-black hover:bg-gray-800' variant="destructive" onClick={handleHardDelete} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Hapus Permanen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
