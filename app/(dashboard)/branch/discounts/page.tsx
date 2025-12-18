// app/(dashboard)/branch/discounts/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { branchDiscountAPI } from '@/lib/api/branch';
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
} from '@/components/ui/pagination';
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Tag,
  AlertCircle,
  Loader2,
  Archive,
  AlertTriangle,
  RotateCcw,
  Globe,
  Building2,
  Filter,
  Settings,
  Calendar,
  Clock,
  Percent,
  Ticket
} from 'lucide-react';
import { formatRupiah, formatDate } from '@/lib/utils';

// Definisi Interface
interface Discount {
  discount_rule_id: string;
  discount_name: string;
  discount_code?: string;
  discount_type: 'PERCENTAGE' | 'NOMINAL' | 'FIXED_AMOUNT';
  value: number;
  start_date: string;
  end_date: string;
  branch_id?: string | null;
  is_active: boolean;
  
  // Field untuk logika override visual
  original_value?: number; 
  is_overridden?: boolean;
}

const ITEMS_PER_PAGE = 5;

export default function BranchDiscountsPage() {
  const router = useRouter();
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter & Pagination
  const [showArchived, setShowArchived] = useState(false);
  const [scopeFilter, setScopeFilter] = useState<'all' | 'general' | 'local' | 'override'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal States
  const [isSoftDeleteOpen, setIsSoftDeleteOpen] = useState(false);
  const [isHardDeleteOpen, setIsHardDeleteOpen] = useState(false);
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  
  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [showArchived]);

  useEffect(() => {
    setCurrentPage(1);
  }, [scopeFilter, showArchived]);

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Fetch Local & General Discounts secara parallel
      const [localResponse, generalResponse] = await Promise.all([
        branchDiscountAPI.getAll().catch(err => ({ data: [], error: err })),
        branchDiscountAPI.getGeneral().catch(err => ({ data: [], error: err })),
      ]);

      const localDiscounts: Discount[] = Array.isArray(localResponse.data) ? localResponse.data : [];
      const generalData = Array.isArray(generalResponse.data) ? generalResponse.data : [];
      
      // Mapping data General agar sesuai format tabel & mendeteksi override
      const mappedGeneralDiscounts: Discount[] = generalData.map((item: any) => {
        const branchSetting = item.branch_setting || {};
        
        // Gunakan nilai dari override jika ada, jika tidak gunakan master
        const effectiveValue = branchSetting.value ?? item.master_value;
        const isActive = branchSetting.is_active_at_branch ?? true; 
        const originalValue = item.master_value;

        // Cek apakah ada override (Nilai berubah ATAU status non-aktif)
        const isOverridden = (Number(effectiveValue) !== Number(originalValue)) || (isActive === false);

        return {
          discount_rule_id: item.discount_rule_id,
          discount_name: item.discount_name,
          discount_code: item.discount_code,
          discount_type: item.discount_type,
          value: Number(effectiveValue),
          start_date: item.start_date || new Date().toISOString(),
          end_date: item.end_date || new Date().toISOString(),
          branch_id: null, 
          is_active: isActive,
          original_value: Number(originalValue),
          is_overridden: isOverridden
        };
      });

      setDiscounts([...localDiscounts, ...mappedGeneralDiscounts]);

    } catch (err: any) {
      console.error("Error loading data:", err);
      setError(err.message || 'Gagal memuat data diskon');
    } finally {
      setIsLoading(false);
    }
  };

  // --- NAVIGATION HANDLERS ---

  const handleCreateClick = () => {
    router.push('/branch/discounts/new');
  };

  const handleEditClick = (discount: Discount) => {
    router.push(`/branch/discounts/${discount.discount_rule_id}/edit`);
  };

  const handleOverrideClick = (discount: Discount) => {
    router.push(`/branch/discounts/${discount.discount_rule_id}/override`);
  };

  // --- DELETE & RESTORE HANDLERS ---

  const handleSoftDelete = async () => {
    if (!selectedDiscount) return;
    setIsSubmitting(true);
    try {
      await delay(1000);
      await branchDiscountAPI.softDelete(selectedDiscount.discount_rule_id);
      await loadData();
      setIsSoftDeleteOpen(false);
      setSelectedDiscount(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menonaktifkan diskon');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestore = async () => {
    if (!selectedDiscount) return;
    setIsSubmitting(true);
    try {
      await delay(1000);
      await branchDiscountAPI.update(selectedDiscount.discount_rule_id, {
        ...selectedDiscount,
        is_active: true
      });
      await loadData();
      setIsRestoreOpen(false);
      setSelectedDiscount(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal mengaktifkan diskon');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHardDelete = async () => {
    if (!selectedDiscount) return;
    setIsSubmitting(true);
    try {
      await delay(1000);
      await branchDiscountAPI.hardDelete(selectedDiscount.discount_rule_id);
      await loadData();
      setIsHardDeleteOpen(false);
      setSelectedDiscount(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus permanen');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- FILTER LOGIC & COUNTS ---
  
  const checkActive = (d: Discount) => showArchived ? d.is_active === false : d.is_active !== false;

  // Hitung jumlah item
  // General: Tidak ada branch_id DAN TIDAK overridden
  const generalCount = discounts.filter((d) => !d.branch_id && !d.is_overridden && checkActive(d)).length;
  // Local: Ada branch_id
  const localCount = discounts.filter((d) => d.branch_id && checkActive(d)).length;
  // Override: Tidak ada branch_id TAPI overridden
  const overrideCount = discounts.filter((d) => !d.branch_id && d.is_overridden && checkActive(d)).length;
  // All: General Murni + Local (Exclude Override)
  const allCount = discounts.filter((d) => checkActive(d) && !d.is_overridden).length;

  const filteredDiscounts = discounts.filter((discount) => {
    // 1. Filter Archive
    if (!checkActive(discount)) return false;
    
    // 2. Filter Scope
    if (scopeFilter === 'general') {
      // Tampilkan General Murni Saja (Tidak Override)
      return !discount.branch_id && !discount.is_overridden;
    } else if (scopeFilter === 'local') {
      return !!discount.branch_id;
    } else if (scopeFilter === 'override') {
      return !discount.branch_id && !!discount.is_overridden;
    }
    
    // Default 'all': Tampilkan General & Lokal, TAPI sembunyikan yang Override
    return !discount.is_overridden;
  });

  // --- PAGINATION LOGIC ---
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

  const formatTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return '-';
    }
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
          <h1 className="text-3xl font-bold tracking-tight">Promo & Diskon</h1>
          <p className="text-muted-foreground">
            Kelola diskon lokal & atur override diskon general
          </p>
        </div>
        <div className="flex flex-col gap-2 @md:flex-row">
          <Button
            variant={showArchived ? 'default' : 'outline'}
            onClick={() => setShowArchived(!showArchived)}
            className="w-full @md:w-auto"
          >
            <Archive className="mr-2 h-4 w-4" />
            {showArchived ? 'Sembunyikan Arsip' : 'Tampilkan Arsip'}
          </Button>
          <Button 
            onClick={handleCreateClick}
            className="w-full @md:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Tambah Diskon Lokal
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Info Hybrid Scope */}
      <Alert>
        <Globe className="h-4 w-4" />
        <AlertDescription>
          <strong>Hybrid Scope:</strong> Diskon <strong>General</strong> berasal dari pusat. Anda dapat melakukan 
          <em> Override</em> untuk mengubah nilai atau menonaktifkannya khusus di cabang ini. 
          Diskon <strong>Lokal</strong> dikelola sepenuhnya oleh cabang.
          <br/>
          <span className="text-xs text-muted-foreground mt-1 block">
            Total: {generalCount} General, {localCount} Lokal, {overrideCount} Override
          </span>
        </AlertDescription>
      </Alert>

      {/* Filter Scope */}
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
              Semua ({allCount})
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
            <Button
              variant={scopeFilter === 'override' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setScopeFilter('override')}
            >
              <Settings className="mr-2 h-3 w-3" />
              Override ({overrideCount})
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
                <TableHead>Nilai (Efektif)</TableHead>
                <TableHead>Waktu Mulai</TableHead>
                <TableHead>Waktu Selesai</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedDiscounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <Percent className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">
                      {showArchived 
                        ? 'Tidak ada diskon di arsip' 
                        : scopeFilter === 'override'
                          ? 'Belum ada diskon yang di-override'
                          : 'Belum ada diskon yang sesuai filter'
                      }
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedDiscounts.map((discount) => (
                  <TableRow 
                    key={discount.discount_rule_id} 
                    className={!discount.is_active ? 'opacity-75 bg-muted/30' : ''}
                  >
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
                    <TableCell className="font-semibold text-primary">
                      {discount.discount_type === 'PERCENTAGE' 
                        ? `${discount.value}%` 
                        : formatRupiah(discount.value)
                      }
                      {discount.is_overridden && (
                        <div className="flex items-center gap-1 mt-1">
                          <Badge variant="outline" className="text-[10px] h-4 px-1 border-orange-200 text-orange-600 bg-orange-50">
                            Override
                          </Badge>
                        </div>
                      )}
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
                        {discount.branch_id ? (
                          <>
                            <Building2 className="mr-1 h-3 w-3" />
                            Lokal
                          </>
                        ) : (
                          <>
                            <Globe className="mr-1 h-3 w-3" />
                            General
                          </>
                        )}
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

                          {!showArchived ? (
                            <>
                              {discount.branch_id ? (
                                // --- AKSI UNTUK DISKON LOKAL ---
                                <>
                                  <DropdownMenuItem onClick={() => handleEditClick(discount)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
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
                                // --- AKSI UNTUK DISKON GENERAL (OVERRIDE) ---
                                <DropdownMenuItem onClick={() => handleOverrideClick(discount)}>
                                  <Settings className="mr-2 h-4 w-4" />
                                  Override Setting
                                </DropdownMenuItem>
                              )}
                            </>
                          ) : (
                            // --- AKSI UNTUK ARSIP ---
                            discount.branch_id && (
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
                            )
                          )}
                          
                          {/* Hapus Permanen Hanya untuk Lokal */}
                          {discount.branch_id && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedDiscount(discount);
                                  setIsHardDeleteOpen(true);
                                }}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Hapus Permanen
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="py-4">
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
                    className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </Card>

      {/* Dialog: Soft Delete */}
      <Dialog open={isSoftDeleteOpen} onOpenChange={setIsSoftDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Arsipkan Diskon?</DialogTitle>
            <DialogDescription>
              Diskon <strong>{selectedDiscount?.discount_name}</strong> akan dinonaktifkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSoftDeleteOpen(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button className="bg-black text-white hover:bg-gray-800" onClick={handleSoftDelete} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Arsipkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Restore */}
      <Dialog open={isRestoreOpen} onOpenChange={setIsRestoreOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aktifkan Kembali?</DialogTitle>
            <DialogDescription>
              Diskon <strong>{selectedDiscount?.discount_name}</strong> akan diaktifkan kembali.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRestoreOpen(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button className="bg-black text-white hover:bg-gray-800" onClick={handleRestore} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Aktifkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Hard Delete */}
      <Dialog open={isHardDeleteOpen} onOpenChange={setIsHardDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-black flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Hapus Permanen?
            </DialogTitle>
            <DialogDescription>
              Tindakan ini tidak dapat dibatalkan. Diskon <strong>{selectedDiscount?.discount_name}</strong> akan dihapus selamanya.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHardDeleteOpen(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button className="bg-black hover:bg-gray-800" variant="destructive" onClick={handleHardDelete} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Hapus Permanen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}