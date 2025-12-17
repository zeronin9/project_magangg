// app/(dashboard)/branch/discounts/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { branchDiscountAPI } from '@/lib/api/branch';
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

// Definisi Interface sesuai kebutuhan Branch
interface Discount {
  discount_rule_id: string;
  discount_name: string;
  discount_code?: string;
  discount_type: 'PERCENTAGE' | 'NOMINAL';
  value: number;
  start_date: string;
  end_date: string;
  branch_id?: string | null;
  is_active: boolean;
  // Field opsional untuk logika override jika backend mengirimkannya
  original_value?: number; 
  is_overridden?: boolean;
}

const ITEMS_PER_PAGE = 5;

export default function BranchDiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter & Pagination
  const [showArchived, setShowArchived] = useState(false);
  const [scopeFilter, setScopeFilter] = useState<'all' | 'general' | 'local'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false); // Untuk Create/Edit Lokal
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false); // Untuk Override General
  const [isSoftDeleteOpen, setIsSoftDeleteOpen] = useState(false);
  const [isHardDeleteOpen, setIsHardDeleteOpen] = useState(false);
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  
  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Data untuk Diskon Lokal
  const [formData, setFormData] = useState({
    discount_name: '',
    discount_type: 'PERCENTAGE' as 'PERCENTAGE' | 'NOMINAL',
    value: '',
    start_date: '',
    end_date: '',
  });

  // Form Data untuk Override
  const [overrideData, setOverrideData] = useState({
    is_active_at_branch: true,
    value: '',
  });

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
      const response = await branchDiscountAPI.getAll();
      const discountsData = Array.isArray(response.data) ? response.data : [];
      setDiscounts(discountsData);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data diskon');
    } finally {
      setIsLoading(false);
    }
  };

  // --- HANDLERS UNTUK DISKON LOKAL ---

  const handleOpenModal = (discount?: Discount) => {
    if (discount) {
      setSelectedDiscount(discount);
      setFormData({
        discount_name: discount.discount_name,
        discount_type: discount.discount_type,
        value: discount.value.toString(),
        start_date: discount.start_date.split('T')[0],
        end_date: discount.end_date.split('T')[0],
      });
    } else {
      setSelectedDiscount(null);
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        discount_name: '',
        discount_type: 'PERCENTAGE',
        value: '',
        start_date: today,
        end_date: today,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDiscount(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        discount_name: formData.discount_name,
        discount_type: formData.discount_type,
        value: Number(formData.value),
        start_date: formData.start_date,
        end_date: formData.end_date,
      };

      if (selectedDiscount) {
        await branchDiscountAPI.update(selectedDiscount.discount_rule_id, payload);
      } else {
        await branchDiscountAPI.create(payload);
      }

      await loadData();
      handleCloseModal();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Gagal menyimpan diskon';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- HANDLERS UNTUK OVERRIDE (GENERAL) ---

  const handleOpenOverrideModal = (discount: Discount) => {
    setSelectedDiscount(discount);
    setOverrideData({
      is_active_at_branch: true, // Default active, user can change to inactive to hide general discount
      value: discount.value.toString(), // Pre-fill dengan nilai saat ini (baik itu asli atau sudah di-override sebelumnya)
    });
    setIsOverrideModalOpen(true);
  };

  const handleCloseOverrideModal = () => {
    setIsOverrideModalOpen(false);
    setSelectedDiscount(null);
  };

  const handleOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDiscount) return;

    setIsSubmitting(true);

    try {
      const payload = {
        is_active_at_branch: overrideData.is_active_at_branch,
        value: Number(overrideData.value),
      };

      // Memanggil endpoint override setting
      // Ini hanya akan menyimpan konfigurasi untuk cabang ini, tidak mengubah data master di Mitra
      await branchDiscountAPI.setOverride(selectedDiscount.discount_rule_id, payload);

      await loadData(); // Reload untuk melihat nilai 'value' yang sudah ter-update dari backend
      handleCloseOverrideModal();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Gagal menyimpan override diskon';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- HANDLERS LAINNYA ---

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setFormData({ ...formData, value });
  };

  const handleOverrideValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setOverrideData({ ...overrideData, value });
  };

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
      // Logic restore manual jika API restore khusus tidak ada, atau gunakan update
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

  // --- FILTER & PAGINATION LOGIC ---
  const filteredDiscounts = discounts.filter((discount) => {
    const matchesArchive = showArchived ? discount.is_active === false : discount.is_active !== false;
    const matchesScope =
      scopeFilter === 'all'
        ? true
        : scopeFilter === 'general'
        ? !discount.branch_id
        : scopeFilter === 'local'
        ? !!discount.branch_id
        : true;
    return matchesArchive && matchesScope;
  });

  const generalCount = discounts.filter((d) => !d.branch_id && d.is_active !== false).length;
  const localCount = discounts.filter((d) => d.branch_id && d.is_active !== false).length;

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
    return new Date(dateString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // --- RENDER ---
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
            onClick={() => handleOpenModal()}
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
            Total: {generalCount} General, {localCount} Lokal
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
              Semua ({filteredDiscounts.length})
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
                      {showArchived ? 'Tidak ada diskon di arsip' : 'Belum ada diskon'}
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
                      {/* Indikator visual jika nilai ini hasil override (opsional, tergantung data backend) */}
                      {discount.is_overridden && (
                        <sup className="text-xs text-orange-500 ml-1">(Override)</sup>
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
                                  <DropdownMenuItem onClick={() => handleOpenModal(discount)}>
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
                                <DropdownMenuItem onClick={() => handleOpenOverrideModal(discount)}>
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

      {/* Modal: Create/Edit Discount Lokal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedDiscount ? 'Edit Diskon Lokal' : 'Tambah Diskon Lokal Baru'}</DialogTitle>
            <DialogDescription>
              {selectedDiscount ? 'Perbarui informasi diskon lokal' : 'Diskon hanya berlaku untuk cabang ini'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="discount_name">Nama Diskon *</Label>
                <Input
                  id="discount_name"
                  value={formData.discount_name}
                  onChange={(e) => setFormData({ ...formData, discount_name: e.target.value })}
                  placeholder="Contoh: Promo Warga Lokal"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount_type">Tipe Diskon *</Label>
                <Select
                  value={formData.discount_type}
                  onValueChange={(value: 'PERCENTAGE' | 'NOMINAL') => setFormData({ ...formData, discount_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Persentase (%)</SelectItem>
                    <SelectItem value="NOMINAL">Nominal (Rp)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="value">Nilai Diskon *</Label>
                <Input
                  id="value"
                  type="text"
                  value={formData.value}
                  onChange={handleValueChange}
                  placeholder={formData.discount_type === 'PERCENTAGE' ? 'Contoh: 10' : 'Contoh: 5000'}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Tanggal Mulai *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_date">Tanggal Selesai *</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseModal} disabled={isSubmitting}>
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

      {/* Modal: Override Discount General */}
      <Dialog open={isOverrideModalOpen} onOpenChange={setIsOverrideModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Override Diskon General</DialogTitle>
            <DialogDescription>
              Ubah nilai atau status diskon <strong>{selectedDiscount?.discount_name}</strong> khusus untuk cabang ini.
              Perubahan ini tidak akan mempengaruhi data pusat.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleOverrideSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="override_value">Nilai Override *</Label>
                <Input
                  id="override_value"
                  type="text"
                  value={overrideData.value}
                  onChange={handleOverrideValueChange}
                  placeholder="Masukkan nilai baru"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Nilai saat ini:{' '}
                  {selectedDiscount?.discount_type === 'PERCENTAGE'
                    ? `${selectedDiscount?.value}%`
                    : formatRupiah(selectedDiscount?.value || 0)}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="is_active">Status di Cabang</Label>
                <Select
                  value={overrideData.is_active_at_branch.toString()}
                  onValueChange={(value) => setOverrideData({ ...overrideData, is_active_at_branch: value === 'true' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Aktif</SelectItem>
                    <SelectItem value="false">Non-Aktif (Sembunyikan)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Jika Non-Aktif, diskon ini tidak akan berlaku di cabang meskipun di pusat aktif.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseOverrideModal} disabled={isSubmitting}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan Override
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Soft Delete (Archive) */}
      <Dialog open={isSoftDeleteOpen} onOpenChange={setIsSoftDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Arsipkan Diskon?</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin mengarsipkan diskon <strong>{selectedDiscount?.discount_name}</strong>?
              <br />
              Diskon akan dinonaktifkan (Soft Delete).
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
              Apakah Anda yakin ingin mengaktifkan kembali diskon <strong>{selectedDiscount?.discount_name}</strong>?
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
              Apakah Anda yakin ingin menghapus diskon <strong>{selectedDiscount?.discount_name}</strong> secara permanen?
              Tindakan ini tidak dapat dibatalkan.
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