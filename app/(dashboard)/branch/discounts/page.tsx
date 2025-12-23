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
  Eye,
} from 'lucide-react';
import { formatRupiah, formatDate } from '@/lib/utils';
import { MetaPagination } from '@/lib/services/fetchData';

interface Discount {
  id: string;
  discount_name: string;
  discount_code?: string;
  discount_type: 'PERCENTAGE' | 'NOMINAL' | 'FIXED_AMOUNT';
  start_date: string;
  end_date: string;
  applies_to: string;
  
  final_value: number;
  final_is_active: boolean;
  
  scope: 'GENERAL' | 'LOCAL' | 'OVERRIDE';
  
  global_config?: any;
  branch_override?: any;
  final_effective?: any;
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

      let finalDiscounts: Discount[] = [];
      let paginationMeta: MetaPagination | null = null;

      // ========================================
      // FILTER: LOKAL (Branch-specific discounts)
      // ========================================
      if (scopeFilter === 'local') {
        try {
          const localResponse = await branchDiscountAPI.getAll({
            page: currentPage,
            limit: 10,
            search: searchQuery
          });
          
          const items = localResponse?.items || [];
          finalDiscounts = items.map((item: any) => ({
            id: item?.discount_rule_id || item?.id || 'unknown',
            discount_name: item?.discount_name || 'Unnamed Discount',
            discount_code: item?.discount_code,
            discount_type: item?.discount_type || 'PERCENTAGE',
            start_date: item?.start_date || new Date().toISOString(),
            end_date: item?.end_date || new Date().toISOString(),
            applies_to: item?.applies_to || 'ALL',
            final_value: Number(item?.value || 0),
            final_is_active: item?.is_active ?? true,
            scope: 'LOCAL'
          })).filter(d => d.id !== 'unknown');

          paginationMeta = localResponse?.meta || null;
        } catch (err) {
          console.error('❌ Error loading local discounts:', err);
          finalDiscounts = [];
        }
      }
      // ========================================
      // FILTER: GENERAL (Not overridden by branch)
      // ========================================
      else if (scopeFilter === 'general') {
        try {
          const generalResponse = await branchDiscountAPI.getGeneral();
          console.log('🔍 General Response:', JSON.stringify(generalResponse, null, 2));
          
          let rawData = generalResponse?.data || generalResponse || [];
          const generalDataArr = Array.isArray(rawData) ? rawData : [];

          console.log('📦 General Data Array Length:', generalDataArr.length);

          finalDiscounts = generalDataArr
            .filter((item: any) => {
              if (!item) return false;
              // General = belum di-override
              const hasOverride = item?.branch_override?.exists ?? false;
              return !hasOverride;
            })
            .map((item: any) => {
              try {
                if (!item || !item.meta) {
                  console.warn('⚠️ Item or meta is undefined');
                  return null;
                }

                return {
                  id: item?.id || 'unknown',
                  discount_name: item?.meta?.discount_name || 'Unnamed Discount',
                  discount_code: item?.meta?.discount_code,
                  discount_type: item?.meta?.discount_type || 'PERCENTAGE',
                  start_date: item?.meta?.start_date || new Date().toISOString(),
                  end_date: item?.meta?.end_date || new Date().toISOString(),
                  applies_to: item?.meta?.applies_to || 'ALL',
                  final_value: Number(item?.final_effective?.value || 0),
                  final_is_active: item?.final_effective?.is_active ?? true,
                  scope: 'GENERAL' as const,
                  global_config: item?.global_config,
                  branch_override: item?.branch_override,
                  final_effective: item?.final_effective
                };
              } catch (mapError) {
                console.error('❌ Error mapping general item:', mapError, item);
                return null;
              }
            })
            .filter((item): item is Discount => item !== null && item.id !== 'unknown');

          // Filter search
          if (searchQuery) {
            finalDiscounts = finalDiscounts.filter(d => 
              d?.discount_name?.toLowerCase()?.includes(searchQuery.toLowerCase()) || 
              (d?.discount_code && d.discount_code.toLowerCase().includes(searchQuery.toLowerCase()))
            );
          }
        } catch (err) {
          console.error('❌ Error loading general discounts:', err);
          finalDiscounts = [];
        }

        paginationMeta = null;
      }
      // ========================================
      // FILTER: OVERRIDE (General discounts that have been overridden)
      // ========================================
      else if (scopeFilter === 'override') {
        try {
          const generalResponse = await branchDiscountAPI.getGeneral();
          
          let rawData = generalResponse?.data || generalResponse || [];
          const generalDataArr = Array.isArray(rawData) ? rawData : [];

          finalDiscounts = generalDataArr
            .filter((item: any) => {
              if (!item) return false;
              // Override = sudah di-override
              const hasOverride = item?.branch_override?.exists ?? false;
              return hasOverride;
            })
            .map((item: any) => {
              try {
                if (!item || !item.meta) return null;

                return {
                  id: item?.id || 'unknown',
                  discount_name: item?.meta?.discount_name || 'Unnamed Discount',
                  discount_code: item?.meta?.discount_code,
                  discount_type: item?.meta?.discount_type || 'PERCENTAGE',
                  start_date: item?.meta?.start_date || new Date().toISOString(),
                  end_date: item?.meta?.end_date || new Date().toISOString(),
                  applies_to: item?.meta?.applies_to || 'ALL',
                  final_value: Number(item?.final_effective?.value || 0),
                  final_is_active: item?.final_effective?.is_active ?? true,
                  scope: 'OVERRIDE' as const,
                  global_config: item?.global_config,
                  branch_override: item?.branch_override,
                  final_effective: item?.final_effective
                };
              } catch (mapError) {
                console.error('❌ Error mapping override item:', mapError);
                return null;
              }
            })
            .filter((item): item is Discount => item !== null && item.id !== 'unknown');

          // Filter search
          if (searchQuery) {
            finalDiscounts = finalDiscounts.filter(d => 
              d?.discount_name?.toLowerCase()?.includes(searchQuery.toLowerCase()) || 
              (d?.discount_code && d.discount_code.toLowerCase().includes(searchQuery.toLowerCase()))
            );
          }
        } catch (err) {
          console.error('❌ Error loading override discounts:', err);
          finalDiscounts = [];
        }

        paginationMeta = null;
      }
      // ========================================
      // FILTER: SEMUA (General not overridden + Local)
      // Logic: Tampilkan General yang BELUM di-override + Lokal
      // ========================================
      else {
        try {
          // 1. Ambil diskon LOKAL
          let localItems: Discount[] = [];
          try {
            const localResponse = await branchDiscountAPI.getAll({
              page: 1,
              limit: 100,
              search: searchQuery
            });
            
            const items = localResponse?.items || [];
            localItems = items.map((item: any) => ({
              id: item?.discount_rule_id || item?.id || 'unknown',
              discount_name: item?.discount_name || 'Unnamed Discount',
              discount_code: item?.discount_code,
              discount_type: item?.discount_type || 'PERCENTAGE',
              start_date: item?.start_date || new Date().toISOString(),
              end_date: item?.end_date || new Date().toISOString(),
              applies_to: item?.applies_to || 'ALL',
              final_value: Number(item?.value || 0),
              final_is_active: item?.is_active ?? true,
              scope: 'LOCAL'
            })).filter(d => d.id !== 'unknown');
          } catch (err) {
            console.error('❌ Error loading local (all filter):', err);
          }

          // 2. Ambil diskon GENERAL (yang BELUM di-override saja)
          let generalItems: Discount[] = [];
          try {
            const generalResponse = await branchDiscountAPI.getGeneral();
            
            let rawData = generalResponse?.data || generalResponse || [];
            const generalDataArr = Array.isArray(rawData) ? rawData : [];

            generalItems = generalDataArr
              .filter((item: any) => {
                if (!item) return false;
                // Hanya ambil yang BELUM di-override
                const hasOverride = item?.branch_override?.exists ?? false;
                return !hasOverride;
              })
              .map((item: any) => {
                try {
                  if (!item || !item.meta) return null;
                  
                  return {
                    id: item?.id || 'unknown',
                    discount_name: item?.meta?.discount_name || 'Unnamed Discount',
                    discount_code: item?.meta?.discount_code,
                    discount_type: item?.meta?.discount_type || 'PERCENTAGE',
                    start_date: item?.meta?.start_date || new Date().toISOString(),
                    end_date: item?.meta?.end_date || new Date().toISOString(),
                    applies_to: item?.meta?.applies_to || 'ALL',
                    final_value: Number(item?.final_effective?.value || 0),
                    final_is_active: item?.final_effective?.is_active ?? true,
                    scope: 'GENERAL' as const,
                    global_config: item?.global_config,
                    branch_override: item?.branch_override,
                    final_effective: item?.final_effective
                  };
                } catch (mapError) {
                  console.error('❌ Error mapping item (all filter):', mapError);
                  return null;
                }
              })
              .filter((item): item is Discount => item !== null && item.id !== 'unknown');
          } catch (err) {
            console.error('❌ Error loading general (all filter):', err);
          }

          // 3. Gabungkan General (belum override) + Lokal
          const combined = [...generalItems, ...localItems];

          // 4. Deduplicate berdasarkan ID
          const uniqueMap = new Map();
          combined.forEach(item => {
            if (item && item.id && !uniqueMap.has(item.id)) {
              uniqueMap.set(item.id, item);
            }
          });
          finalDiscounts = Array.from(uniqueMap.values());

          // 5. Filter search
          if (searchQuery) {
            finalDiscounts = finalDiscounts.filter(d => 
              d?.discount_name?.toLowerCase()?.includes(searchQuery.toLowerCase()) || 
              (d?.discount_code && d.discount_code.toLowerCase().includes(searchQuery.toLowerCase()))
            );
          }
        } catch (err) {
          console.error('❌ Error loading all discounts:', err);
          finalDiscounts = [];
        }

        paginationMeta = null;
      }

      setDiscounts(finalDiscounts);
      setMeta(paginationMeta);

    } catch (err: any) {
      console.error("❌ Error loading data:", err);
      setError(err.message || 'Gagal memuat data diskon');
      setDiscounts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateClick = () => router.push('/branch/discounts/new');
  const handleEditClick = (discount: Discount) => router.push(`/branch/discounts/${discount.id}/edit`);
  const handleOverrideClick = (discount: Discount) => router.push(`/branch/discounts/${discount.id}/override`);
  const handleDetailClick = (discount: Discount) => router.push(`/branch/discounts/${discount.id}`);

  const handleSoftDelete = async () => {
    if (!selectedDiscount) return;
    setIsSubmitting(true);
    try {
      await delay(1000);
      await branchDiscountAPI.softDelete(selectedDiscount.id);
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
      await branchDiscountAPI.update(selectedDiscount.id, {
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
      await branchDiscountAPI.hardDelete(selectedDiscount.id);
      await loadData();
      setIsHardDeleteOpen(false);
      setSelectedDiscount(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus permanen');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredDiscounts = discounts.filter((discount) => {
    const isActiveMatch = showArchived 
      ? discount.final_is_active === false 
      : discount.final_is_active !== false;
    return isActiveMatch;
  });

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
        <Globe className="h-4 w-4" />
        <AlertDescription>
          <strong>Filter Scope:</strong> <strong>Semua</strong> = General (belum override) + Lokal. 
          <strong> General</strong> = hanya diskon pusat belum di-override. 
          <strong> Lokal</strong> = diskon cabang. 
          <strong> Override</strong> = diskon pusat yang sudah di-override di cabang ini.
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
                  <TableRow key={discount.id} className={!discount.final_is_active ? 'opacity-75 bg-muted/30' : ''}>
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
                      {discount.discount_type === 'PERCENTAGE' ? `${discount.final_value}%` : formatRupiah(discount.final_value)}
                      {discount.scope === 'OVERRIDE' && (
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
                      {discount.scope === 'LOCAL' && (
                        <Badge variant="secondary">
                          <Building2 className="mr-1 h-3 w-3" /> Lokal
                        </Badge>
                      )}
                      {discount.scope === 'GENERAL' && (
                        <Badge variant="default">
                          <Globe className="mr-1 h-3 w-3" /> General
                        </Badge>
                      )}
                      {discount.scope === 'OVERRIDE' && (
                        <Badge variant="default" className="border-orange-200 text-orange-600 bg-orange-50">
                          <Settings className="mr-1 h-3 w-3" /> Override
                        </Badge>
                      )}
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
                              {discount.scope === 'LOCAL' ? (
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
                            discount.scope === 'LOCAL' && (
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