'use client';

import { useState, useEffect, useMemo } from 'react';
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
  CheckCircle2,
  XCircle,
  Search,
} from 'lucide-react';
import { formatRupiah, formatDate } from '@/lib/utils';

interface BranchDiscountSetting {
  discount_rule_id: string;
  branch_id: string;
  is_active_at_branch: boolean;
  value?: number | null;
  min_transaction_amount?: number | null;
  min_item_quantity?: number | null;
  max_transaction_amount?: number | null;
  max_item_quantity?: number | null;
  max_discount_amount?: number | null;
  min_discount_amount?: number | null;
}

interface GeneralDiscountFromBackend {
  discount_rule_id: string;
  discount_name: string;
  discount_code?: string;
  discount_type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: number;
  start_date: string;
  end_date: string;
  partner_id: string;
  branch_id: null;
  is_active: boolean;
  applied_in_branches?: BranchDiscountSetting[];
}

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
}

export default function BranchDiscountsPage() {
  const router = useRouter();
  const [allDiscounts, setAllDiscounts] = useState<Discount[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [showArchived, setShowArchived] = useState(false);
  const [scopeFilter, setScopeFilter] = useState<'all' | 'general' | 'local' | 'override'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  
  // ✅ PERBAIKAN 1: Hanya gunakan 1 state untuk search (tanpa debounce)
  const [searchTerm, setSearchTerm] = useState('');

  const [isSoftDeleteOpen, setIsSoftDeleteOpen] = useState(false);
  const [isHardDeleteOpen, setIsHardDeleteOpen] = useState(false);
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  
  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ PERBAIKAN 2: Load data hanya saat mount dan saat filter berubah (TIDAK saat search)
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopeFilter, showArchived]);

  // ✅ PERBAIKAN 3: Reset page hanya saat filter atau archived berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [scopeFilter, showArchived]);

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const isDiscountActive = (endDate: string): boolean => {
    try {
      const now = new Date();
      const end = new Date(endDate);
      return end > now;
    } catch (e) {
      return false;
    }
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError('');

      console.log('='.repeat(80));
      console.log('🔄 LOADING DATA - scopeFilter:', scopeFilter, '| showArchived:', showArchived);
      console.log('='.repeat(80));

      let localItems: Discount[] = [];
      let generalItems: Discount[] = [];
      let overrideInfo: Map<string, BranchDiscountSetting> = new Map();

      // Fetch OVERRIDE INFO
      if (scopeFilter === 'all' || scopeFilter === 'general' || scopeFilter === 'override') {
        try {
          console.log('🔍 Step 1: Fetching OVERRIDE INFO from /branch-discount-setting...');
          const overrideResponse = await branchDiscountAPI.getGeneralWithOverride();
          console.log('📦 Override Response:', overrideResponse);
          
          if (Array.isArray(overrideResponse)) {
            overrideResponse.forEach((item: any) => {
              if (item.applied_in_branches && item.applied_in_branches.length > 0) {
                const branchSetting = item.applied_in_branches[0];
                overrideInfo.set(item.discount_rule_id, branchSetting);
              }
            });
          }
          console.log(`✅ Found ${overrideInfo.size} override settings`);
        } catch (err) {
          console.error("❌ ERROR fetching override info:", err);
        }
      }

      // Fetch LOCAL discounts
      const shouldLoadLocal = scopeFilter === 'all' || scopeFilter === 'local';
      
      if (shouldLoadLocal) {
        try {
          console.log('🔍 Step 2: Fetching LOCAL discounts (/discount-rule?type=local)...');
          
          // ✅ PERBAIKAN 4: Load SEMUA data local tanpa search (filter di client)
          const localParams: any = { 
            page: 1, 
            limit: 1000, // Load semua
            search: '', // Kosongkan search, filter di client
            type: 'local',
            status: showArchived ? 'archived' : 'active'
          };
          
          console.log('📤 LOCAL PARAMS:', localParams);
          const localResponse = await branchDiscountAPI.getAll(localParams);
          
          console.log('📦 LOCAL RESPONSE:', localResponse);
          
          const items = localResponse?.items || [];
          console.log(`📊 Total LOCAL items from API: ${items.length}`);
          
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
              }));
            
            console.log(`✅ Processed ${localItems.length} LOCAL items`);
          }
        } catch (err) {
          console.error("❌ ERROR fetching local discounts:", err);
        }
      }

      // Fetch GENERAL discounts
      const shouldLoadGeneral = scopeFilter === 'all' || scopeFilter === 'general' || scopeFilter === 'override';
      
      if (shouldLoadGeneral) {
        try {
          console.log('🔍 Step 3: Fetching GENERAL discounts (/discount-rule?type=general)...');
          
          // ✅ PERBAIKAN 5: Load SEMUA data general tanpa search (filter di client)
          const generalParams = {
            page: 1, 
            limit: 1000, // Load semua
            search: '', // Kosongkan search, filter di client
            status: showArchived ? 'archived' : 'active'
          };
          
          const generalResponse = await branchDiscountAPI.getGeneral(generalParams);
          
          console.log('📦 GENERAL RESPONSE:', generalResponse);
          
          const items = generalResponse?.items || [];
          console.log(`📊 Total GENERAL items: ${items.length}`);

          if (Array.isArray(items)) {
            generalItems = items
              .filter((item: GeneralDiscountFromBackend) => item && item.discount_rule_id && item.discount_name)
              .map((item: GeneralDiscountFromBackend) => {
                const branchSetting = overrideInfo.get(item.discount_rule_id);
                const hasOverride = !!branchSetting;

                let effectiveValue = Number(item.value || 0);
                let originalValue = Number(item.value || 0);
                let isActive = item.is_active ?? true;

                if (hasOverride) {
                  if (branchSetting.value !== null && branchSetting.value !== undefined) {
                    effectiveValue = Number(branchSetting.value);
                  }
                  isActive = item.is_active && branchSetting.is_active_at_branch;
                }

                return {
                  discount_rule_id: item.discount_rule_id,
                  discount_name: item.discount_name,
                  discount_code: item.discount_code,
                  discount_type: item.discount_type,
                  value: effectiveValue,
                  start_date: item.start_date,
                  end_date: item.end_date,
                  branch_id: null,
                  is_active: isActive,
                  original_value: hasOverride ? originalValue : undefined,
                  is_overridden: hasOverride,
                  scope: 'general' as const,
                } as Discount;
              });
            
            console.log(`✅ Processed ${generalItems.length} GENERAL items`);
          }
        } catch (err) {
          console.error("❌ ERROR fetching general discounts:", err);
        }
      }

      // COMBINE DATA
      let finalDiscounts: Discount[] = [];

      console.log('---');
      console.log('🎯 COMBINING DATA:');
      console.log(`   - GENERAL items: ${generalItems.length}`);
      console.log(`   - LOCAL items: ${localItems.length}`);
      console.log(`   - OVERRIDE count: ${overrideInfo.size}`);

      switch (scopeFilter) {
        case 'all':
          finalDiscounts = [...generalItems, ...localItems];
          console.log(`📋 Filter ALL: ${finalDiscounts.length} total`);
          break;
          
        case 'general':
          finalDiscounts = [...generalItems];
          console.log(`🌍 Filter GENERAL: ${finalDiscounts.length} items`);
          break;
          
        case 'local':
          finalDiscounts = [...localItems];
          console.log(`🏬 Filter LOCAL: ${finalDiscounts.length} items`);
          break;
          
        case 'override':
          finalDiscounts = generalItems.filter(d => d.is_overridden);
          console.log(`⚙️ Filter OVERRIDE: ${finalDiscounts.length} items`);
          break;
      }

      // DEDUPLICATE
      const discountMap = new Map<string, Discount>();
      finalDiscounts.forEach(discount => {
        if (!discountMap.has(discount.discount_rule_id)) {
          discountMap.set(discount.discount_rule_id, discount);
        }
      });

      finalDiscounts = Array.from(discountMap.values());

      // SORTING
      finalDiscounts.sort((a, b) => {
        if (a.scope === 'general' && b.scope === 'local') return -1;
        if (a.scope === 'local' && b.scope === 'general') return 1;
        
        const isTimeActiveA = isDiscountActive(a.end_date);
        const isTimeActiveB = isDiscountActive(b.end_date);
        
        const isFullyActiveA = a.is_active && isTimeActiveA;
        const isFullyActiveB = b.is_active && isTimeActiveB;
        
        if (isFullyActiveA && !isFullyActiveB) return -1;
        if (!isFullyActiveA && isFullyActiveB) return 1;
        
        return a.discount_name.localeCompare(b.discount_name);
      });

      console.log('✅ FINAL RESULT:', finalDiscounts.length, 'items');
      console.log('='.repeat(80));

      setAllDiscounts(finalDiscounts);

    } catch (err) {
      const error = err as Error;
      console.error("❌ CRITICAL ERROR:", error);
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

  // ✅ PERBAIKAN 6: Filter client-side (seperti di halaman Mitra)
  const filteredDiscounts = useMemo(() => {
    if (!searchTerm || searchTerm.trim() === '') {
      return allDiscounts;
    }

    const query = searchTerm.toLowerCase().trim();
    return allDiscounts.filter(discount => {
      const nameMatch = discount.discount_name.toLowerCase().includes(query);
      const codeMatch = discount.discount_code?.toLowerCase().includes(query);
      
      return nameMatch || codeMatch;
    });
  }, [allDiscounts, searchTerm]);

  // ✅ PERBAIKAN 7: Client-side pagination
  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(filteredDiscounts.length / 10);
    const startIndex = (currentPage - 1) * 10;
    const endIndex = startIndex + 10;
    const itemsToShow = filteredDiscounts.slice(startIndex, endIndex);
    
    return {
      itemsToShow,
      currentTotalPages: totalPages || 1,
      hasPrevPage: currentPage > 1,
      hasNextPage: currentPage < totalPages
    };
  }, [filteredDiscounts, currentPage]);

  const { itemsToShow, currentTotalPages, hasPrevPage, hasNextPage } = paginationData;

  const formatTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    } catch (e) { return '-'; }
  };

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= currentTotalPages) {
      setCurrentPage(page);
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
          <br/>• <strong>Semua</strong> = Semua Diskon General (termasuk yang override) + Lokal
          <br/>• <strong>General</strong> = Semua diskon General (termasuk yang ada override)
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
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Cari nama atau kode diskon..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
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
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {itemsToShow.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12">
                    <Percent className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">
                      {searchTerm 
                        ? `Tidak ada hasil untuk "${searchTerm}"` 
                        : showArchived 
                          ? 'Belum ada diskon yang diarsipkan' 
                          : 'Belum ada diskon'}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                itemsToShow.map((discount) => {
                  const isTimeActive = isDiscountActive(discount.end_date);
                  
                  return (
                    <TableRow key={discount.discount_rule_id} className={!discount.is_active ? 'opacity-75 bg-muted/30' : ''}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-muted-foreground" />
                          {discount.discount_name}
                          {!discount.is_active && (
                            <Badge variant="outline" className="ml-2 text-xs bg-gray-100">
                              Diarsipkan
                            </Badge>
                          )}
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
                          {discount.is_overridden && discount.original_value !== undefined && (
                            <div className="flex items-center gap-1">
                              <Badge variant="outline" className="text-[10px] h-4 px-1 border-orange-200 text-orange-600 bg-orange-50">
                                Override
                              </Badge>
                              <span className="text-[10px] text-muted-foreground line-through">
                                {discount.discount_type === 'PERCENTAGE' ? `${discount.original_value}%` : formatRupiah(discount.original_value)}
                              </span>
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
                      <TableCell>
                        {discount.is_active && isTimeActive ? (
                          <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                            <CheckCircle2 className="mr-1 h-3 w-3" /> Aktif
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-gray-200 text-gray-700">
                            <XCircle className="mr-1 h-3 w-3" /> Tidak Aktif
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
                            {!discount.is_active ? (
                              discount.scope === 'local' && (
                                <DropdownMenuItem onClick={() => { setSelectedDiscount(discount); setIsRestoreOpen(true); }} className="text-black">
                                  <RotateCcw className="mr-2 h-4 w-4" /> Aktifkan Kembali
                                </DropdownMenuItem>
                              )
                            ) : (
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
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {currentTotalPages > 1 && (
          <div className="py-4 flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    href="#" 
                    onClick={(e) => { 
                      e.preventDefault(); 
                      if (hasPrevPage) {
                        handlePageChange(currentPage - 1); 
                      }
                    }}
                    className={
                      !hasPrevPage
                        ? 'pointer-events-none opacity-50' 
                        : 'cursor-pointer'
                    }
                  />
                </PaginationItem>
                <PaginationItem>
                  <span className="flex items-center px-4 text-sm font-medium">
                    Halaman {currentPage} dari {currentTotalPages}
                  </span>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext 
                    href="#" 
                    onClick={(e) => { 
                      e.preventDefault(); 
                      if (hasNextPage) {
                        handlePageChange(currentPage + 1); 
                      }
                    }}
                    className={
                      !hasNextPage
                        ? 'pointer-events-none opacity-50' 
                        : 'cursor-pointer'
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
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
