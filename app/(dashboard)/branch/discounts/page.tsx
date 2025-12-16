// app/(dashboard)/branch/discounts/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { branchDiscountAPI } from '@/lib/api/branch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface Discount {
  discount_rule_id: string;
  discount_name: string;
  discount_type: 'PERCENTAGE' | 'NOMINAL';
  value: number;
  start_date: string;
  end_date: string;
  branch_id?: string | null;
  is_active: boolean;
}

const ITEMS_PER_PAGE = 10;

export default function BranchDiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [showArchived, setShowArchived] = useState(false);
  const [scopeFilter, setScopeFilter] = useState<'all' | 'general' | 'local'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [isSoftDeleteOpen, setIsSoftDeleteOpen] = useState(false);
  const [isHardDeleteOpen, setIsHardDeleteOpen] = useState(false);
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    discount_name: '',
    discount_type: 'PERCENTAGE' as 'PERCENTAGE' | 'NOMINAL',
    value: '',
    start_date: '',
    end_date: '',
  });

  const [overrideData, setOverrideData] = useState({
    is_active_at_branch: true,
    value: '',
  });

  useEffect(() => {
    loadData();
  }, [showArchived]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, showArchived, scopeFilter]);

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
    setFormData({
      discount_name: '',
      discount_type: 'PERCENTAGE',
      value: '',
      start_date: '',
      end_date: '',
    });
  };

  const handleOpenOverrideModal = (discount: Discount) => {
    setSelectedDiscount(discount);
    setOverrideData({
      is_active_at_branch: true,
      value: discount.value.toString(),
    });
    setIsOverrideModalOpen(true);
  };

  const handleCloseOverrideModal = () => {
    setIsOverrideModalOpen(false);
    setSelectedDiscount(null);
    setOverrideData({
      is_active_at_branch: true,
      value: '',
    });
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setFormData({ ...formData, value });
  };

  const handleOverrideValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setOverrideData({ ...overrideData, value });
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

  const handleOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDiscount) return;

    setIsSubmitting(true);

    try {
      const payload = {
        is_active_at_branch: overrideData.is_active_at_branch,
        value: Number(overrideData.value),
      };

      await branchDiscountAPI.setOverride(selectedDiscount.discount_rule_id, payload);

      await loadData();
      handleCloseOverrideModal();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Gagal menyimpan override diskon';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSoftDelete = async () => {
    if (!selectedDiscount) return;

    setIsSubmitting(true);
    try {
      await delay(2000);
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
      await delay(2000);

      await branchDiscountAPI.update(selectedDiscount.discount_rule_id, {
        discount_name: selectedDiscount.discount_name,
        discount_type: selectedDiscount.discount_type,
        value: selectedDiscount.value,
        start_date: selectedDiscount.start_date,
        end_date: selectedDiscount.end_date,
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
      await delay(2000);
      await branchDiscountAPI.hardDelete(selectedDiscount.discount_rule_id);
      await loadData();
      setIsHardDeleteOpen(false);
      setSelectedDiscount(null);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Gagal menghapus diskon permanen';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter
  const filteredDiscounts = discounts.filter((discount) => {
    const matchesSearch = discount.discount_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesArchive = showArchived ? discount.is_active === false : discount.is_active !== false;
    const matchesScope =
      scopeFilter === 'all'
        ? true
        : scopeFilter === 'general'
        ? !discount.branch_id
        : scopeFilter === 'local'
        ? !!discount.branch_id
        : true;
    return matchesSearch && matchesArchive && matchesScope;
  });

  const generalCount = discounts.filter((d) => !d.branch_id && d.is_active !== false).length;
  const localCount = discounts.filter((d) => d.branch_id && d.is_active !== false).length;

  // Pagination
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

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8 @container">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-12 w-full" />
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8 @container">
      {/* Header */}
      <div className="flex flex-col gap-4 @md:flex-row @md:items-center @md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Diskon & Promo</h1>
          <p className="text-muted-foreground">Kelola diskon lokal & override diskon general</p>
        </div>
        <div className="grid grid-cols-2 gap-2 @md:flex">
          <Button variant={showArchived ? 'default' : 'outline'} onClick={() => setShowArchived(!showArchived)}>
            <Archive className="mr-2 h-4 w-4" />
            {showArchived ? 'Sembunyikan Arsip' : 'Tampilkan Arsip'}
          </Button>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Diskon Lokal
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

      {/* Info Alert */}
      <Alert>
        <Building2 className="h-4 w-4" />
        <AlertDescription>
          <strong>Diskon Lokal:</strong> Diskon yang Anda buat hanya berlaku untuk cabang ini. Diskon General dari pusat
          dapat di-override nilai/statusnya. Total: {generalCount} General, {localCount} Lokal
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
              Semua ({generalCount + localCount})
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
        <CardHeader>
          <CardTitle>Daftar Diskon</CardTitle>
          <CardDescription>
            Total {filteredDiscounts.length} diskon {showArchived ? 'diarsipkan' : 'aktif'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {paginatedDiscounts.length === 0 ? (
            <div className="text-center py-12">
              <Tag className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                {searchQuery ? 'Tidak ada hasil pencarian' : showArchived ? 'Tidak ada diskon di arsip' : 'Belum ada diskon'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Diskon</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Nilai</TableHead>
                    <TableHead>Periode</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedDiscounts.map((discount) => (
                    <TableRow key={discount.discount_rule_id} className={showArchived ? 'opacity-60' : ''}>
                      <TableCell className="font-medium">{discount.discount_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{discount.discount_type === 'PERCENTAGE' ? 'Persentase' : 'Nominal'}</Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-primary">
                        {discount.discount_type === 'PERCENTAGE' ? `${discount.value}%` : `Rp ${discount.value.toLocaleString('id-ID')}`}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(discount.start_date), 'dd MMM yyyy', { locale: id })} -{' '}
                          {format(new Date(discount.end_date), 'dd MMM yyyy', { locale: id })}
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
                      <TableCell>
                        {discount.is_active === false ? (
                          <Badge variant="secondary">Diarsipkan</Badge>
                        ) : (
                          <Badge variant="default" className="bg-black">
                            Aktif
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Aksi</DropdownMenuLabel>

                            {!showArchived ? (
                              <>
                                {discount.branch_id ? (
                                  <DropdownMenuItem onClick={() => handleOpenModal(discount)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem onClick={() => handleOpenOverrideModal(discount)}>
                                    <Settings className="mr-2 h-4 w-4" />
                                    Override Setting
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                {discount.branch_id && (
                                  <>
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
                              </>
                            ) : (
                              discount.branch_id && (
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
                              )
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="py-4 flex justify-center">
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
                  <PaginationLink href="#" isActive={currentPage === i + 1} onClick={(e) => handlePageChange(i + 1, e)}>
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

      {/* Create/Edit Discount Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedDiscount ? 'Edit Diskon Lokal' : 'Tambah Diskon Lokal Baru'}</DialogTitle>
            <DialogDescription>
              {selectedDiscount ? 'Perbarui informasi diskon lokal' : 'Diskon hanya berlaku untuk cabang Anda'}
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
                <p className="text-xs text-muted-foreground">
                  {formData.discount_type === 'PERCENTAGE' ? 'Masukkan angka tanpa %' : 'Masukkan nominal tanpa Rp'}
                </p>
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

      {/* Override Discount Modal */}
      <Dialog open={isOverrideModalOpen} onOpenChange={setIsOverrideModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Override Diskon General</DialogTitle>
            <DialogDescription>
              Ubah nilai atau status diskon <strong>{selectedDiscount?.discount_name}</strong> untuk cabang ini
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
                  Nilai asli:{' '}
                  {selectedDiscount?.discount_type === 'PERCENTAGE'
                    ? `${selectedDiscount?.value}%`
                    : `Rp ${selectedDiscount?.value.toLocaleString('id-ID')}`}
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
                    <SelectItem value="false">Non-Aktif</SelectItem>
                  </SelectContent>
                </Select>
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

      {/* Soft Delete Confirmation */}
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
            <Button variant="outline" onClick={() => setIsRestoreOpen(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button onClick={handleRestore} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Aktifkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hard Delete Confirmation */}
      <Dialog open={isHardDeleteOpen} onOpenChange={setIsHardDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-black flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Hapus Permanen?
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus diskon <strong>{selectedDiscount?.discount_name}</strong> secara permanen?
              <br />
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
