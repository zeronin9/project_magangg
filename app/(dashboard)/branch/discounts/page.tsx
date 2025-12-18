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
import { Input } from '@/components/ui/input';
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
  Ticket,
  Search,
} from 'lucide-react';
import { formatRupiah, formatDate } from '@/lib/utils';
import { MetaPagination } from '@/lib/services/fetchData';

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
  original_value?: number; 
  is_overridden?: boolean;
}

export default function BranchDiscountsPage() {
  const router = useRouter();
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [meta, setMeta] = useState<MetaPagination | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter & Pagination
  const [showArchived, setShowArchived] = useState(false);
  const [scopeFilter, setScopeFilter] = useState<'all' | 'general' | 'local' | 'override'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal States
  const [isSoftDeleteOpen, setIsSoftDeleteOpen] = useState(false);
  const [isHardDeleteOpen, setIsHardDeleteOpen] = useState(false);
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  
  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Trigger Load Data
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchQuery, scopeFilter]);

  // Reset page saat filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, scopeFilter]);

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError('');

      let localItems: Discount[] = [];
      let generalItems: Discount[] = [];
      let newMeta: MetaPagination | null = null;

      // 1. Fetch Local Discounts (Hanya jika scope 'all' atau 'local')
      if (scopeFilter === 'all' || scopeFilter === 'local') {
        const localResponse = await branchDiscountAPI.getAll({
          page: currentPage,
          limit: 10,
          search: searchQuery
        });
        localItems = localResponse.items;
        
        // Simpan meta hanya jika sedang filter 'local' atau 'all' (dan override logic paging untuk 'all' nanti)
        if (scopeFilter === 'local') {
            newMeta = localResponse.meta;
        }
      }

      // 2. Fetch General/Override Discounts (Hanya jika scope 'all', 'general', atau 'override')
      if (scopeFilter === 'all' || scopeFilter === 'general' || scopeFilter === 'override') {
        try {
          const generalResponse = await branchDiscountAPI.getGeneral();
          const rawData = generalResponse.data.data || generalResponse.data;
          const generalDataArr = Array.isArray(rawData) ? rawData : [];

          // Mapping General Data
          generalItems = generalDataArr.map((item: any) => {
            const branchSetting = item.branch_setting || {};
            
            const masterValue = Number(item.master_value || item.value || 0);
            const branchValue = branchSetting.value !== undefined ? Number(branchSetting.value) : masterValue;
            
            const isActive = branchSetting.is_active_at_branch !== undefined 
              ? branchSetting.is_active_at_branch 
              : (item.is_active ?? true);

            const isOverridden = (branchValue !== masterValue) || (branchSetting.is_active_at_branch !== undefined);

            return {
              discount_rule_id: item.discount_rule_id,
              discount_name: item.discount_name,
              discount_code: item.discount_code,
              discount_type: item.discount_type,
              value: branchValue,
              start_date: item.start_date || new Date().toISOString(),
              end_date: item.end_date || new Date().toISOString(),
              branch_id: null, // General selalu null
              is_active: isActive,
              original_value: masterValue,
              is_overridden: isOverridden
            };
          });

          // Client-side filtering untuk general search
          if (searchQuery) {
            generalItems = generalItems.filter(d => 
              d.discount_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
              (d.discount_code && d.discount_code.toLowerCase().includes(searchQuery.toLowerCase()))
            );
          }

        } catch (err) {
          console.error("Gagal load general discounts", err);
        }
      }

      // 3. Gabungkan Data Sesuai Filter
      let finalDiscounts: Discount[] = [];

      if (scopeFilter === 'local') {
        // HANYA LOKAL (branch_id != null)
        finalDiscounts = localItems;
      } else if (scopeFilter === 'general') {
        // HANYA GENERAL MURNI (branch_id == null DAN TIDAK OVERRIDE)
        finalDiscounts = generalItems.filter(d => !d.is_overridden);
        newMeta = null; // Reset pagination server-side karena ini list client-side
      } else if (scopeFilter === 'override') {
        // HANYA OVERRIDE (branch_id == null DAN OVERRIDE)
        finalDiscounts = generalItems.filter(d => d.is_overridden);
        newMeta = null;
      } else {
        // ALL (Gabungan Semuanya dengan Deduplikasi ID)
        // Gabungkan localItems (paginated) + generalItems (all)
        // Note: Pagination server-side di 'all' jadi agak aneh karena general items tidak ter-paginate dari server.
        // Biasanya untuk 'all' kita load semua general + local page 1.
        
        const combined = [...localItems, ...generalItems];
        
        // Deduplikasi ID
        const uniqueMap = new Map();
        combined.forEach(item => {
            if(!uniqueMap.has(item.discount_rule_id)) {
                uniqueMap.set(item.discount_rule_id, item);
            }
        });
        
        finalDiscounts = Array.from(uniqueMap.values());
        
        // Jika di mode 'all', meta pagination local mungkin tidak relevan untuk total gabungan, 
        // tapi kita bisa tetap tampilkan untuk navigasi bagian lokalnya.
        // Atau set null jika ingin client-side pagination untuk gabungan.
        // Di sini kita biarkan null agar konsisten client-side paging untuk 'all' view.
        newMeta = null; 
      }

      setDiscounts(finalDiscounts);
      setMeta(newMeta);

    } catch (err: any) {
      console.error("Error loading data:", err);
      setError(err.message || 'Gagal memuat data diskon');
    } finally {
      setIsLoading(false);
    }
  };

  // --- NAVIGATION & ACTION HANDLERS ---
  const handleCreateClick = () => router.push('/branch/discounts/new');
  const handleEditClick = (discount: Discount) => router.push(`/branch/discounts/${discount.discount_rule_id}/edit`);
  const handleOverrideClick = (discount: Discount) => router.push(`/branch/discounts/${discount.discount_rule_id}/override`);

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

  // --- FILTER DISPLAY LOGIC ---
  // Filter final sebelum render (terutama untuk Archive)
  const filteredDiscounts = discounts.filter((discount) => {
    // 1. Filter Archive Status
    const isActiveMatch = showArchived ? discount.is_active === false : discount.is_active !== false;
    if (!isActiveMatch) return false;

    // 2. Filter Scope (Double Check)
    // Meskipun sudah difilter di loadData, kita pastikan lagi di sini untuk konsistensi visual
    if (scopeFilter === 'general') return !discount.branch_id && !discount.is_overridden;
    if (scopeFilter === 'local') return !!discount.branch_id;
    if (scopeFilter === 'override') return !discount.branch_id && !!discount.is_overridden;
    
    return true; // All
  });

  // Client-Side Pagination (jika meta server-side null, misal filter General/Override/All)
  const itemsToShow = meta ? filteredDiscounts : filteredDiscounts.slice((currentPage - 1) * 10, currentPage * 10);
  const totalPagesClient = Math.ceil(filteredDiscounts.length / 10);

  const formatTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    } catch (e) { return '-'; }
  };

  const handlePageChange = (page: number) => {
    if (meta) {
        // Server side
        if (page > 0 && page <= meta.total_pages) setCurrentPage(page);
    } else {
        // Client side
        if (page > 0 && page <= totalPagesClient) setCurrentPage(page);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8 @container">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-12 w-full" />
        <Card>
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
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
          <p className="text-muted-foreground">Kelola diskon lokal & atur override diskon general</p>
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
          <Button onClick={handleCreateClick} className="w-full @md:w-auto">
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
        </AlertDescription>
      </Alert>

      {/* Filter & Search */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium whitespace-nowrap">Filter Scope:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant={scopeFilter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setScopeFilter('all')}>Semua</Button>
            <Button variant={scopeFilter === 'general' ? 'default' : 'outline'} size="sm" onClick={() => setScopeFilter('general')}><Globe className="mr-2 h-3 w-3" /> General</Button>
            <Button variant={scopeFilter === 'local' ? 'default' : 'outline'} size="sm" onClick={() => setScopeFilter('local')}><Building2 className="mr-2 h-3 w-3" /> Lokal</Button>
            <Button variant={scopeFilter === 'override' ? 'default' : 'outline'} size="sm" onClick={() => setScopeFilter('override')}><Settings className="mr-2 h-3 w-3" /> Override</Button>
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
              {itemsToShow.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <Percent className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">
                      {searchQuery ? 'Tidak ada hasil pencarian' : 'Belum ada diskon'}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                itemsToShow.map((discount) => (
                  <TableRow key={discount.discount_rule_id} className={!discount.is_active ? 'opacity-75 bg-muted/30' : ''}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        {discount.discount_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      {discount.discount_code ? (
                        <Badge variant="secondary" className="font-mono"><Ticket className="mr-1 h-3 w-3" /> {discount.discount_code}</Badge>
                      ) : <span className="text-muted-foreground text-xs">Otomatis</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{discount.discount_type === 'PERCENTAGE' ? 'Persentase' : 'Nominal'}</Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-primary">
                      {discount.discount_type === 'PERCENTAGE' ? `${discount.value}%` : formatRupiah(discount.value)}
                      {discount.is_overridden && (
                        <div className="flex items-center gap-1 mt-1">
                          <Badge variant="outline" className="text-[10px] h-4 px-1 border-orange-200 text-orange-600 bg-orange-50">Override</Badge>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm"><Calendar className="h-3 w-3 text-muted-foreground" /> <span>{formatDate(discount.start_date)}</span></div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" /> <span>{formatTime(discount.start_date)}</span></div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm"><Calendar className="h-3 w-3 text-muted-foreground" /> <span>{formatDate(discount.end_date)}</span></div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" /> <span>{formatTime(discount.end_date)}</span></div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={discount.branch_id ? 'secondary' : 'default'}>
                        {discount.branch_id ? <><Building2 className="mr-1 h-3 w-3" /> Lokal</> : <><Globe className="mr-1 h-3 w-3" /> General</>}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {!showArchived ? (
                            <>
                              {discount.branch_id ? (
                                <>
                                  <DropdownMenuItem onClick={() => handleEditClick(discount)}><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => { setSelectedDiscount(discount); setIsSoftDeleteOpen(true); }} className="text-black"><Archive className="mr-2 h-4 w-4" /> Arsipkan</DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => { setSelectedDiscount(discount); setIsHardDeleteOpen(true); }} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Hapus Permanen</DropdownMenuItem>
                                </>
                              ) : (
                                <DropdownMenuItem onClick={() => handleOverrideClick(discount)}><Settings className="mr-2 h-4 w-4" /> Override Setting</DropdownMenuItem>
                              )}
                            </>
                          ) : (
                            discount.branch_id && (
                              <DropdownMenuItem onClick={() => { setSelectedDiscount(discount); setIsRestoreOpen(true); }} className="text-black"><RotateCcw className="mr-2 h-4 w-4" /> Aktifkan Kembali</DropdownMenuItem>
                            )
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

        {/* Pagination Logic: Support both Server-Side (meta) & Client-Side */}
        <div className="py-4 flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    href="#" 
                    onClick={(e) => { 
                        e.preventDefault(); 
                        if ((meta && meta.current_page > 1) || (!meta && currentPage > 1)) {
                            handlePageChange(currentPage - 1); 
                        }
                    }}
                    className={
                        (meta && !meta.has_prev_page) || (!meta && currentPage <= 1)
                        ? 'pointer-events-none opacity-50' 
                        : 'cursor-pointer'
                    }
                  />
                </PaginationItem>
                <PaginationItem>
                  <span className="flex items-center px-4 text-sm font-medium">
                    Halaman {currentPage} dari {meta ? meta.total_pages : totalPagesClient}
                  </span>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext 
                    href="#" 
                    onClick={(e) => { 
                        e.preventDefault(); 
                        if ((meta && meta.current_page < meta.total_pages) || (!meta && currentPage < totalPagesClient)) {
                            handlePageChange(currentPage + 1); 
                        }
                    }}
                    className={
                        (meta && !meta.has_next_page) || (!meta && currentPage >= totalPagesClient)
                        ? 'pointer-events-none opacity-50' 
                        : 'cursor-pointer'
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
        </div>
      </Card>

      {/* Dialogs */}
      <Dialog open={isSoftDeleteOpen} onOpenChange={setIsSoftDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Arsipkan Diskon?</DialogTitle>
            <DialogDescription>Diskon <strong>{selectedDiscount?.discount_name}</strong> akan dinonaktifkan.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSoftDeleteOpen(false)}>Batal</Button>
            <Button className="bg-black text-white hover:bg-gray-800" onClick={handleSoftDelete} disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Arsipkan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRestoreOpen} onOpenChange={setIsRestoreOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aktifkan Kembali?</DialogTitle>
            <DialogDescription>Diskon <strong>{selectedDiscount?.discount_name}</strong> akan diaktifkan kembali.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRestoreOpen(false)}>Batal</Button>
            <Button className="bg-black text-white hover:bg-gray-800" onClick={handleRestore} disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Aktifkan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isHardDeleteOpen} onOpenChange={setIsHardDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Permanen?</DialogTitle>
            <DialogDescription>Tindakan ini tidak dapat dibatalkan.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHardDeleteOpen(false)}>Batal</Button>
            <Button className="bg-black hover:bg-gray-800" variant="destructive" onClick={handleHardDelete} disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Hapus Permanen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}