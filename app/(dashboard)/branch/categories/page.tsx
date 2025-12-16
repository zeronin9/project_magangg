// app/(dashboard)/branch/categories/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { branchCategoryAPI } from '@/lib/api/branch';
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
  Layers,
  AlertCircle,
  Loader2,
  Archive,
  AlertTriangle,
  RotateCcw,
  Globe,
  Building2,
  Filter,
} from 'lucide-react';

interface Category {
  category_id: string;
  category_name: string;
  branch_id?: string | null;
  is_active: boolean;
}

const ITEMS_PER_PAGE = 10;

export default function BranchCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [showArchived, setShowArchived] = useState(false);
  const [scopeFilter, setScopeFilter] = useState<'all' | 'general' | 'local'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSoftDeleteOpen, setIsSoftDeleteOpen] = useState(false);
  const [isHardDeleteOpen, setIsHardDeleteOpen] = useState(false);
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    category_name: '',
  });

  // ✅ PERBAIKAN: Hapus showArchived dari dependency agar tidak fetch ulang
  // Kita fetch semua data di awal, filtering dilakukan di client-side
  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, showArchived, scopeFilter]);

  // ✅ PERBAIKAN: Delay diatur ke 3000ms (3 detik)
  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError('');

      // ✅ LOGIKA BARU: Fetch 'general' & 'local' secara terpisah lalu gabung.
      // Alasannya: Endpoint default backend memfilter is_active=true.
      // Endpoint ?type=... di backend TIDAK memfilter is_active, jadi kita bisa dapat data arsip.
      const [generalRes, localRes] = await Promise.all([
        branchCategoryAPI.getAll('general'),
        branchCategoryAPI.getAll('local')
      ]);

      const generalData = Array.isArray(generalRes.data) ? generalRes.data : [];
      const localData = Array.isArray(localRes.data) ? localRes.data : [];

      // Gabungkan dan urutkan berdasarkan nama
      const allData = [...generalData, ...localData].sort((a, b) => 
        a.category_name.localeCompare(b.category_name)
      );

      setCategories(allData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal memuat data kategori');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setSelectedCategory(category);
      setFormData({
        category_name: category.category_name,
      });
    } else {
      setSelectedCategory(null);
      setFormData({
        category_name: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCategory(null);
    setFormData({
      category_name: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // ✅ Delay 3 detik
      await delay(3000);

      if (selectedCategory) {
        await branchCategoryAPI.update(selectedCategory.category_id, formData);
      } else {
        await branchCategoryAPI.create(formData);
      }

      await loadData();
      handleCloseModal();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Gagal menyimpan kategori';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSoftDelete = async () => {
    if (!selectedCategory) return;

    setIsSubmitting(true);
    try {
      // ✅ Delay 3 detik
      await delay(3000);
      
      await branchCategoryAPI.softDelete(selectedCategory.category_id);
      
      await loadData();
      setIsSoftDeleteOpen(false);
      setSelectedCategory(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menonaktifkan kategori');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestore = async () => {
    if (!selectedCategory) return;

    setIsSubmitting(true);
    try {
      // ✅ Delay 3 detik
      await delay(3000);

      await branchCategoryAPI.update(selectedCategory.category_id, {
        category_name: selectedCategory.category_name,
        is_active: true,
      });

      await loadData();
      setIsRestoreOpen(false);
      setSelectedCategory(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal mengaktifkan kategori');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHardDelete = async () => {
    if (!selectedCategory) return;

    setIsSubmitting(true);
    try {
      // ✅ Delay 3 detik
      await delay(3000);
      
      await branchCategoryAPI.hardDelete(selectedCategory.category_id);
      
      await loadData();
      setIsHardDeleteOpen(false);
      setSelectedCategory(null);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Gagal menghapus kategori permanen';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter
  const filteredCategories = categories.filter((category) => {
    const matchesSearch = category.category_name.toLowerCase().includes(searchQuery.toLowerCase());
    // Logika arsip: Jika showArchived true -> tampilkan non-aktif. Jika false -> tampilkan aktif.
    const matchesArchive = showArchived ? category.is_active === false : category.is_active !== false;
    
    const matchesScope =
      scopeFilter === 'all'
        ? true
        : scopeFilter === 'general'
        ? !category.branch_id
        : scopeFilter === 'local'
        ? !!category.branch_id
        : true;
    return matchesSearch && matchesArchive && matchesScope;
  });

  const generalCount = categories.filter((c) => !c.branch_id && c.is_active !== false).length;
  const localCount = categories.filter((c) => c.branch_id && c.is_active !== false).length;

  // Pagination
  const totalItems = filteredCategories.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedCategories = filteredCategories.slice(startIndex, endIndex);

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
          <h1 className="text-3xl font-bold tracking-tight">Kategori</h1>
          <p className="text-muted-foreground">Kelola kategori produk (General & Lokal)</p>
        </div>
        <div className="grid grid-cols-2 gap-2 @md:flex">
          <Button variant={showArchived ? 'default' : 'outline'} onClick={() => setShowArchived(!showArchived)}>
            <Archive className="mr-2 h-4 w-4" />
            {showArchived ? 'Sembunyikan Arsip' : 'Tampilkan Arsip'}
          </Button>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Kategori Lokal
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
          <strong>Kategori Lokal:</strong> Kategori yang Anda buat hanya berlaku untuk cabang ini. Kategori General dapat
          dilihat namun tidak dapat diedit. Total: {generalCount} General, {localCount} Lokal
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
          <CardTitle>Daftar Kategori</CardTitle>
          <CardDescription>
            Total {filteredCategories.length} kategori {showArchived ? 'diarsipkan' : 'aktif'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {paginatedCategories.length === 0 ? (
            <div className="text-center py-12">
              <Layers className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                {searchQuery
                  ? 'Tidak ada hasil pencarian'
                  : showArchived
                  ? 'Tidak ada kategori di arsip'
                  : 'Belum ada kategori'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Kategori</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCategories.map((category) => (
                    <TableRow key={category.category_id} className={showArchived ? 'opacity-60' : ''}>
                      <TableCell className="font-medium">{category.category_name}</TableCell>
                      <TableCell>
                        <Badge variant={category.branch_id ? 'secondary' : 'default'}>
                          {category.branch_id ? (
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
                        {category.is_active === false ? (
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

                            {category.branch_id ? (
                              <>
                                {!showArchived ? (
                                  <>
                                    <DropdownMenuItem onClick={() => handleOpenModal(category)}>
                                      <Pencil className="mr-2 h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedCategory(category);
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
                                        setSelectedCategory(category);
                                        setIsHardDeleteOpen(true);
                                      }}
                                      className="text-destructive focus:text-destructive"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Hapus Permanen
                                    </DropdownMenuItem>
                                  </>
                                ) : (
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedCategory(category);
                                      setIsRestoreOpen(true);
                                    }}
                                    className="text-green-600"
                                  >
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Aktifkan Kembali
                                  </DropdownMenuItem>
                                )}
                              </>
                            ) : (
                              <DropdownMenuItem disabled className="text-muted-foreground">
                                Tidak dapat diedit (General)
                              </DropdownMenuItem>
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

      {/* Form Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedCategory ? 'Edit Kategori Lokal' : 'Tambah Kategori Lokal Baru'}</DialogTitle>
            <DialogDescription>
              {selectedCategory
                ? 'Perbarui informasi kategori lokal'
                : 'Kategori hanya berlaku untuk cabang Anda'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="category_name">Nama Kategori *</Label>
                <Input
                  id="category_name"
                  value={formData.category_name}
                  onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
                  placeholder="Masukkan nama kategori"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseModal} disabled={isSubmitting}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selectedCategory ? 'Update' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Soft Delete Confirmation */}
      <Dialog open={isSoftDeleteOpen} onOpenChange={setIsSoftDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Arsipkan Kategori?</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin mengarsipkan kategori <strong>{selectedCategory?.category_name}</strong>?
              <br />
              Kategori akan dinonaktifkan (Soft Delete).
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
              Apakah Anda yakin ingin mengaktifkan kembali kategori <strong>{selectedCategory?.category_name}</strong>?
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
              Apakah Anda yakin ingin menghapus kategori <strong>{selectedCategory?.category_name}</strong> secara permanen?
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