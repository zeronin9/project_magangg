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
  RotateCcw,
  Globe,
  Building2,
  Filter,
  Settings,
  Calendar,
  Clock,
  Percent,
  Ticket,
  Eye,
} from 'lucide-react';
import { formatRupiah, formatDate } from '@/lib/utils';
import { MetaPagination } from '@/lib/services/fetchData';

// Interface helper untuk type safety
interface DiscountMeta {
  discount_name: string;
  discount_code?: string;
  discount_type: 'PERCENTAGE' | 'NOMINAL' | 'FIXED_AMOUNT';
  applies_to?: string;
  start_date: string;
  end_date: string;
}

interface GlobalConfig {
  is_active: boolean;
  value?: number;
  min_transaction_amount?: number;
  min_item_quantity?: number;
  max_transaction_amount?: number;
  max_item_quantity?: number;
  max_discount_amount?: number;
  min_discount_amount?: number;
}

interface BranchOverride {
  exists: boolean;
  is_active_at_branch: boolean;
  value?: number | null;
  min_transaction_amount?: number | null;
  min_item_quantity?: number | null;
  max_transaction_amount?: number | null;
  max_item_quantity?: number | null;
  max_discount_amount?: number | null;
  min_discount_amount?: number | null;
}

interface FinalEffective {
  is_active: boolean;
  source: 'BRANCH_ADJUSTED' | 'GLOBAL_DEFAULT';
  value?: number;
  min_transaction_amount?: number;
  min_item_quantity?: number;
  max_transaction_amount?: number;
  max_item_quantity?: number;
  max_discount_amount?: number;
  min_discount_amount?: number;
}

interface GeneralDiscount {
  id: string | number;
  meta: DiscountMeta;
  global_config: GlobalConfig;
  branch_override: BranchOverride;
  final_effective: FinalEffective;
}

// Interface untuk Diskon Lokal
interface LocalDiscount {
  discount_rule_id: string;
  discount_name: string;
  discount_code?: string;
  discount_type: 'PERCENTAGE' | 'NOMINAL' | 'FIXED_AMOUNT';
  value: number;
  start_date: string;
  end_date: string;
  branch_id: string;
  is_active: boolean;
}

// Interface untuk Display di Table
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
  is_overridden: boolean;
  scope: 'general' | 'local';
  source?: 'BRANCH_ADJUSTED' | 'GLOBAL_DEFAULT';
}

export default function BranchDiscountsPage() {
  const router = useRouter();
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [meta, setMeta] = useState<MetaPagination | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [showArchived, setShowArchived] = useState(false);
  const [scopeFilter, setScopeFilter] = useState<'all' | 'general' | 'local' | 'override'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  const [isSoftDeleteOpen, setIsSoftDeleteOpen] = useState(false);
  const [isHardDeleteOpen, setIsHardDeleteOpen] = useState(false);
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  
  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchQuery, scopeFilter]);

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

      // 1. Fetch Local Discounts (Diskon yang dibuat langsung di cabang)
      if (scopeFilter === 'all' || scopeFilter === 'local') {
        try {
          const localResponse = await branchDiscountAPI.getAll({
            page: currentPage,
            limit: 10,
            search: searchQuery
          });
          
          const items = localResponse?.items || [];
          if (Array.isArray(items)) {
            localItems = items
              .filter((item: LocalDiscount) => item?.discount_rule_id && item?.discount_name)
              .map((item: LocalDiscount) => ({
                discount_rule_id: item.discount_rule_id,
                discount_name: item.discount_name,
                discount_code: item.discount_code,
                discount_type: item.discount_type,
                value: Number(item.value || 0),
                start_date: item.start_date || new Date().toISOString(),
                end_date: item.end_date || new Date().toISOString(),
                branch_id: item.branch_id,
                is_active: item.is_active ?? true,
                original_value: undefined,
                is_overridden: false,
                scope: 'local' as const,
                source: undefined
              }));
          }
          
          // Gunakan meta hanya jika filter scope adalah 'local'
          if (scopeFilter === 'local') {
            newMeta = localResponse?.meta || null;
          }
        } catch (err) {
          console.error("Gagal load local discounts:", err);
          setError('Gagal memuat diskon lokal');
        }
      }

      // 2. Fetch General Discounts (Diskon dari Partner/Pusat dengan kemungkinan override)
      if (scopeFilter === 'all' || scopeFilter === 'general' || scopeFilter === 'override') {
        try {
          const generalResponse = await branchDiscountAPI.getGeneral();
          
          // Ambil array data dari response
          const generalDataArr: GeneralDiscount[] = Array.isArray(generalResponse) 
            ? generalResponse 
            : (generalResponse as any)?.data || [];

          // Validasi dan transformasi data general
          generalItems = generalDataArr
            .filter((item) => {
              if (!item || !item.id || !item.meta || !item.meta.discount_name) {
                console.warn('⚠️ General discount item tidak valid, di-skip:', item);
                return false;
              }
              return true;
            })
            .map((item) => {
              const meta = item.meta;
              const globalConfig = item.global_config;
              const branchOverride = item.branch_override;
              const finalEffective = item.final_effective;

              // Cek apakah diskon ini di-override atau tidak
              const isOverridden = branchOverride.exists === true;
              
              // Gunakan nilai dari final_effective (sudah di-compute oleh backend)
              const effectiveValue = Number(finalEffective.value ?? globalConfig.value ?? 0);
              const originalValue = Number(globalConfig.value ?? 0);
              const isActive = finalEffective.is_active ?? true;

              return {
                discount_rule_id: String(item.id),
                discount_name: meta.discount_name,
                discount_code: meta.discount_code,
                discount_type: meta.discount_type ?? 'PERCENTAGE',
                value: effectiveValue,
                start_date: meta.start_date ?? new Date().toISOString(),
                end_date: meta.end_date ?? new Date().toISOString(),
                branch_id: null,
                is_active: isActive,
                original_value: originalValue,
                is_overridden: isOverridden,
                scope: 'general' as const,
                source: finalEffective.source
              } as Discount;
            });

          // Filter pencarian client-side untuk general items
          if (searchQuery) {
            const q = searchQuery.toLowerCase();
            generalItems = generalItems.filter((d) =>
              d.discount_name.toLowerCase().includes(q) ||
              (d.discount_code && d.discount_code.toLowerCase().includes(q))
            );
          }
        } catch (err) {
          console.error("Gagal load general discounts:", err);
          setError('Gagal memuat diskon general');
        }
      }

      // 3. LOGIKA FILTER SCOPE yang Diperbaiki
      let finalDiscounts: Discount[] = [];

      switch (scopeFilter) {
        case 'all':
          // Filter "Semua" = Gabungan General (semua) + Lokal
          // Tidak ada duplikasi karena General (branch_id=null) vs Lokal (branch_id=xxx) berbeda
          finalDiscounts = [...generalItems, ...localItems];
          newMeta = null; // Tidak pakai pagination server untuk "all"
          break;
          
        case 'general':
          // Filter "General" = Hanya diskon General yang BELUM di-override
          finalDiscounts = generalItems.filter(d => !d.is_overridden);
          newMeta = null; // Tidak pakai pagination server
          break;
          
        case 'local':
          // Filter "Lokal" = Hanya diskon yang dibuat langsung di cabang
          finalDiscounts = localItems;
          // newMeta sudah di-set dari localResponse di atas
          break;
          
        case 'override':
          // Filter "Override" = Hanya diskon General yang SUDAH di-override di cabang ini
          finalDiscounts = generalItems.filter(d => d.is_overridden);
          newMeta = null; // Tidak pakai pagination server
          break;
          
        default:
          finalDiscounts = [];
          break;
      }

      setDiscounts(finalDiscounts);
      setMeta(newMeta);

    } catch (err) {
      const error = err as Error;
      console.error("Error loading data:", error);
      setError(error.message || 'Gagal memuat data diskon');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateClick = () => router.push('/branch/discounts/new');
  const handleEditClick = (discount: Discount) => router.push(`/branch/discounts/${discount.discount_rule_id}/edit`);
  const handleOverrideClick = (discount: Discount) => router.push(`/branch/discounts/${discount.discount_rule_id}/override`);
  const handleDetailClick = (discount: Discount) => router.push(`/branch/discounts/${discount.discount_rule_id}`);

  const handleSoftDelete = async () => {
    if (!selectedDiscount) return;
    setIsSubmitting(true);
    try {
      await delay(1000);
      await branchDiscountAPI.softDelete(selectedDiscount.discount_rule_id);
      await loadData();
      setIsSoftDeleteOpen(false);
      setSelectedDiscount(null);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Gagal menonaktifkan diskon');
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
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Gagal mengaktifkan diskon');
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
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Gagal menghapus permanen');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter berdasarkan status archived
  const filteredDiscounts = discounts.filter((discount) => {
    const isActiveMatch = showArchived ? !discount.is_active : discount.is_active;
    return isActiveMatch;
  });

  // Pagination logic
  const itemsToShow = meta 
    ? filteredDiscounts 
    : filteredDiscounts.slice((currentPage - 1) * 10, currentPage * 10);
  const totalPagesClient = Math.ceil(filteredDiscounts.length / 10);

  const formatTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    } catch (e) { return '-'; }
  };

  const handlePageChange = (page: number) => {
    if (meta) {
      if (page > 0 && page <= meta.total_pages) setCurrentPage(page);
    } else {
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

      <Alert>
        <Filter className="h-4 w-4" />
        <AlertDescription>
          <strong>Filter Scope:</strong> 
          <br/>• <strong>Semua</strong> = Diskon General + Lokal (gabungan semua diskon)
          <br/>• <strong>General</strong> = Hanya diskon pusat yang belum di-override 
          <br/>• <strong>Lokal</strong> = Hanya diskon khusus cabang ini
          <br/>• <strong>Override</strong> = Diskon general yang sudah diubah di cabang ini
        </AlertDescription>
      </Alert>

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
          
          <div className="flex-1 max-w-sm ml-auto">
            <Input 
              placeholder="Cari diskon..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </Card>

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
                      <div className="flex flex-col gap-1">
                        <div>
                          {discount.discount_type === 'PERCENTAGE' ? `${discount.value}%` : formatRupiah(discount.value)}
                        </div>
                        {discount.is_overridden && (
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="text-[10px] h-4 px-1 border-orange-200 text-orange-600 bg-orange-50">
                              Override
                            </Badge>
                            {discount.original_value !== undefined && (
                              <span className="text-[10px] text-muted-foreground line-through">
                                {discount.discount_type === 'PERCENTAGE' ? `${discount.original_value}%` : formatRupiah(discount.original_value)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
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
                      <Badge variant={discount.scope === 'local' ? 'secondary' : 'default'}>
                        {discount.scope === 'local' ? (
                          <><Building2 className="mr-1 h-3 w-3" /> Lokal</>
                        ) : (
                          <><Globe className="mr-1 h-3 w-3" /> General</>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleDetailClick(discount)}>
                            <Eye className="mr-2 h-4 w-4" /> Detail
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          {!showArchived ? (
                            <>
                              {discount.scope === 'local' ? (
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
                            discount.scope === 'local' && (
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