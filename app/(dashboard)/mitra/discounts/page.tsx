'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { discountAPI, categoryAPI, productAPI, branchAPI } from '@/lib/api/mitra';
import { DiscountRule, Category, Product, Branch, PaginationMeta } from '@/types/mitra';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
  Clock
} from 'lucide-react';
import { formatRupiah } from '@/lib/utils';

// Helper: Parse product_ids/category_ids
const parseArrayField = (field: any, relatedField?: any[]): string[] => {
  if (relatedField && Array.isArray(relatedField) && relatedField.length > 0) {
    const ids = relatedField.map(item => item.product_id || item.category_id).filter(Boolean);
    return ids;
  }
  
  if (Array.isArray(field)) {
    return field;
  }
  
  if (typeof field === 'string') {
    try {
      const parsed = JSON.parse(field);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }
  
  return [];
};

// Konfigurasi Pagination
const ITEMS_PER_PAGE = 5;

export default function DiscountsPage() {
  const router = useRouter();
  
  // Data States
  const [discounts, setDiscounts] = useState<DiscountRule[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  
  // UI States
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filter & Pagination States
  const [showArchived, setShowArchived] = useState(false);
  const [scopeFilter, setScopeFilter] = useState<'all' | 'general' | 'local'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal States
  const [isSoftDeleteOpen, setIsSoftDeleteOpen] = useState(false);
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  const [isHardDeleteModalOpen, setIsHardDeleteModalOpen] = useState(false);
  
  const [selectedDiscount, setSelectedDiscount] = useState<DiscountRule | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper Delay
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Initial Load
  useEffect(() => {
    const loadDependencies = async () => {
      try {
        const [categoriesData, productsData, branchesData] = await Promise.all([
          categoryAPI.getAll(), 
          productAPI.getAll(),
          branchAPI.getAll(),
        ]);

        setCategories(Array.isArray(categoriesData) ? categoriesData : (categoriesData as any).data || []);
        setProducts(Array.isArray(productsData) ? productsData : (productsData as any).data || []);
        setBranches(Array.isArray(branchesData) ? branchesData : []);
      } catch (err) {
        console.error("Gagal memuat data pendukung", err);
      }
    };
    loadDependencies();
  }, []);

  // Load Discounts
  useEffect(() => {
    loadDiscounts();
  }, [currentPage, showArchived, scopeFilter]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [scopeFilter, showArchived]);

  const loadDiscounts = async () => {
    try {
      setIsLoading(true);
      
      // ✅ PERBAIKAN: Menggunakan parameter 'status' sesuai backend baru
      const params: any = {
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        status: showArchived ? 'archived' : 'active' // Ubah dari is_active ke status
      };

      if (scopeFilter === 'local') params.type = 'local';
      if (scopeFilter === 'general') params.type = 'general';

      const response = await discountAPI.getAll(params);
      const discountsList = Array.isArray(response.data) ? response.data : [];
      
      const discountsWithBranch = discountsList.map(discount => {
        const branch = discount.branch_id 
          ? branches.find(b => b.branch_id === discount.branch_id)
          : null;
        
        return {
          ...discount,
          product_ids: parseArrayField(discount.product_ids, discount.products),
          category_ids: parseArrayField(discount.category_ids, discount.categories),
          branch: branch || null
        };
      });
      
      setDiscounts(discountsWithBranch);
      setMeta(response.meta);

    } catch (err: any) {
      setError(err.message || 'Gagal memuat data Promo');
    } finally {
      setIsLoading(false);
    }
  };

  // Actions Handlers
  const handleArchive = async () => {
    if (!selectedDiscount) return;
    setIsSubmitting(true);
    try {
      await delay(1000);
      await discountAPI.softDelete(selectedDiscount.discount_rule_id);
      
      // Refresh list (item akan hilang dari view Active)
      await loadDiscounts();
      
      setIsSoftDeleteOpen(false);
      setSelectedDiscount(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal mengarsipkan Promo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestore = async () => {
    if (!selectedDiscount) return;
    setIsSubmitting(true);
    try {
      await delay(1000);
      // Kirim is_active: true agar backend melakukan restore (sesuai logika updateDiscountRule)
      const restoreData = {
        is_active: true,
        discount_name: selectedDiscount.discount_name,
        discount_type: selectedDiscount.discount_type,
        // Pastikan format nilai sesuai
        value: selectedDiscount.value.toString(),
        start_date: selectedDiscount.start_date,
        end_date: selectedDiscount.end_date,
        applies_to: selectedDiscount.applies_to
      };
      
      await discountAPI.update(selectedDiscount.discount_rule_id, restoreData);
      
      // Refresh list (item akan hilang dari view Archive)
      await loadDiscounts();
      
      setIsRestoreOpen(false);
      setSelectedDiscount(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal mengaktifkan kembali Promo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHardDelete = async () => {
    if (!selectedDiscount) return;
    setIsSubmitting(true);
    try {
      await delay(1000);
      await discountAPI.hardDelete(selectedDiscount.discount_rule_id);
      await loadDiscounts();
      setIsHardDeleteModalOpen(false);
      setSelectedDiscount(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus permanen');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePageChange = (page: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (page > 0 && meta && page <= meta.total_pages) {
      setCurrentPage(page);
    }
  };

  // Formatters
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('id-ID', {
      hour: '2-digit', minute: '2-digit'
    });
  };

  const renderStatusBadge = (discount: DiscountRule) => {
    if (!discount.is_active) {
      return <Badge variant="secondary" className="bg-gray-200 text-gray-700 hover:bg-gray-300">Diarsipkan</Badge>;
    }
    const now = new Date();
    const endDate = new Date(discount.end_date);
    if (now > endDate) {
      return <Badge className='bg-white text-black border-black' variant="destructive">Tdk Aktif</Badge>;
    }
    return <Badge className="bg-green-600 text-white">Aktif</Badge>;
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
          <h1 className="text-3xl font-bold tracking-tight">Promo</h1>
          <p className="text-muted-foreground">
            Kelola aturan Promo (General & Lokal)
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
          <Button 
            onClick={() => router.push('/mitra/discounts/new')} 
            className="w-full @md:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Tambah Promo
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
          <strong>Hybrid Scope:</strong> Promo yang Anda buat akan otomatis menjadi{' '}
          <strong>General</strong> (berlaku untuk semua cabang). 
          Total Data: {meta?.total_items || 0}
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
              Semua
            </Button>
            <Button
              variant={scopeFilter === 'general' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setScopeFilter('general')}
            >
              <Globe className="mr-2 h-3 w-3" />
              General
            </Button>
            <Button
              variant={scopeFilter === 'local' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setScopeFilter('local')}
            >
              <Building2 className="mr-2 h-3 w-3" />
              Lokal
            </Button>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Promo</TableHead>
                <TableHead>Kode</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Nilai</TableHead>
                <TableHead>Waktu Mulai</TableHead>
                <TableHead>Waktu Selesai</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {discounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12">
                    <Percent className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">
                      {showArchived ? 'Tidak ada Promo di arsip' : 'Tidak ada Promo'}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                discounts.map((discount) => (
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
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span>{formatDate(discount.start_date)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{formatTime(discount.start_date)}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span>{formatDate(discount.end_date)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{formatTime(discount.end_date)}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={discount.branch_id ? 'secondary' : 'default'}>
                        {discount.branch_id ? 'Lokal' : 'General'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {renderStatusBadge(discount)}
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
                          <DropdownMenuItem onClick={() => router.push(`/mitra/discounts/${discount.discount_rule_id}`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Detail
                          </DropdownMenuItem>
                          
                          {!showArchived ? (
                            <>
                              <DropdownMenuItem onClick={() => router.push(`/mitra/discounts/${discount.discount_rule_id}/edit`)}>
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
                              className="text-black"
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
        </div>

        {/* Pagination Controls */}
        {meta && meta.total_pages > 1 && (
          <div className="py-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    href="#" 
                    onClick={(e) => handlePageChange(currentPage - 1, e)}
                    className={!meta.has_prev_page ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                <PaginationItem>
                    <span className="text-sm px-4">
                        Halaman {meta.current_page} dari {meta.total_pages}
                    </span>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext 
                    href="#" 
                    onClick={(e) => handlePageChange(currentPage + 1, e)}
                    className={!meta.has_next_page ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </Card>

      {/* Dialogs */}
      <Dialog open={isSoftDeleteOpen} onOpenChange={setIsSoftDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Arsipkan Promo?</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin mengarsipkan Promo <strong>{selectedDiscount?.discount_name}</strong>?
              <br/>
              Promo akan dinonaktifkan (Soft Delete).
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

      <Dialog open={isRestoreOpen} onOpenChange={setIsRestoreOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aktifkan Kembali?</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin mengaktifkan kembali Promo <strong>{selectedDiscount?.discount_name}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRestoreOpen(false)}>
              Batal
            </Button>
            <Button variant="default" className="bg-black" onClick={handleRestore} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Aktifkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isHardDeleteModalOpen} onOpenChange={setIsHardDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center text-black gap-2">
              <AlertTriangle className="h-5 w-5" />
              Hapus Permanen? 
            </DialogTitle>
            <DialogDescription>
              Promo <strong>{selectedDiscount?.discount_name}</strong> akan dihapus selamanya dari database.
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