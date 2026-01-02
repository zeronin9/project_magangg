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
  Info,
  XCircle,
} from 'lucide-react';
import { MetaPagination } from '@/lib/services/fetchData';

interface Category {
  category_id: string;
  category_name: string;
  branch_id?: string | null;
  is_active: boolean;
}

export default function BranchCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [meta, setMeta] = useState<MetaPagination | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [showArchived, setShowArchived] = useState(false);
  const [scopeFilter, setScopeFilter] = useState<'all' | 'general' | 'local'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSoftDeleteOpen, setIsSoftDeleteOpen] = useState(false);
  const [isHardDeleteOpen, setIsHardDeleteOpen] = useState(false);
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    category_name: '',
  });

  // Load data ketika filter berubah
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, scopeFilter, showArchived]); 

  // Reset pagination saat filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [scopeFilter, showArchived]);

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError('');

      let typeParam: string | undefined = undefined;
      if (scopeFilter === 'local') typeParam = 'local';
      if (scopeFilter === 'general') typeParam = 'general';

      const queryParams = {
        page: currentPage,
        limit: 10,
        type: typeParam,
        status: showArchived ? 'archived' : 'active',
        is_active: showArchived ? 'false' : 'true'
      };

      const response = await branchCategoryAPI.getAll(queryParams as any);

      const responseData = response as any;
      const categoryList = responseData.data || responseData.items || [];
      
      // ✅ SORTING: General dulu, kemudian Lokal
      const sortedCategories = categoryList.sort((a: Category, b: Category) => {
        const aIsGeneral = !a.branch_id;
        const bIsGeneral = !b.branch_id;
        
        if (aIsGeneral && !bIsGeneral) return -1;
        if (!aIsGeneral && bIsGeneral) return 1;
        
        return a.category_name.localeCompare(b.category_name);
      });
      
      setCategories(sortedCategories);
      setMeta(response.meta);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal memuat data kategori');
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ PERBAIKAN: Jangan reset formData saat buka modal (kecuali untuk edit)
  const handleOpenModal = (category?: Category) => {
    if (category) {
      // Mode Edit: Isi dengan data kategori yang dipilih
      setSelectedCategory(category);
      setFormData({
        category_name: category.category_name,
      });
    } else {
      // Mode Create: JANGAN reset formData, biarkan data sebelumnya tetap ada
      setSelectedCategory(null);
      // ❌ JANGAN reset formData di sini
    }
    setIsModalOpen(true);
  };

  // ✅ PERBAIKAN: Jangan reset formData saat dialog tertutup
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCategory(null);
    // ❌ JANGAN reset formData di sini
    // Biarkan data tetap ada untuk mencegah kehilangan data tidak sengaja
  };

  // ✅ TAMBAHAN: Handler baru untuk clear form manual
  const handleClearForm = () => {
    setFormData({
      category_name: '',
    });
  };

  // ✅ PERBAIKAN: Reset formData hanya setelah berhasil submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await delay(1000);

      if (selectedCategory) {
        await branchCategoryAPI.update(selectedCategory.category_id, formData);
      } else {
        await branchCategoryAPI.create(formData);
      }

      await loadData();
      
      // ✅ Reset formData hanya setelah berhasil submit
      setFormData({
        category_name: '',
      });
      
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
      await delay(1000);
      
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
      await delay(1000);

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
      await delay(1000);
      
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

  const handlePageChange = (page: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (meta && page > 0 && page <= meta.total_pages) {
      setCurrentPage(page);
    }
  };

  // Helper untuk cek apakah ada data yang diisi
  const hasUnsavedData = formData.category_name.trim() !== '';

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
          dilihat namun tidak dapat diedit.
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
        <CardHeader>
          <CardTitle>Daftar Kategori {showArchived ? '(Arsip)' : '(Aktif)'}</CardTitle>
          <CardDescription>
            {meta ? `Total ${meta.total_items} kategori` : 'Memuat data...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="text-center py-12">
              <Layers className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                {showArchived ? 'Tidak ada kategori di arsip' : 'Belum ada kategori aktif'}
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
                  {categories.map((category) => (
                    <TableRow key={category.category_id} className={category.is_active === false ? 'opacity-60 bg-muted/50' : ''}>
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
                        {!category.is_active ? (
                          <Badge variant="secondary">Diarsipkan</Badge>
                        ) : (
                          <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white">
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
                                {category.is_active !== false ? (
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
      {meta && meta.total_pages > 1 && (
        <div className="py-4 flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => handlePageChange(currentPage - 1, e)}
                  className={!meta.has_prev_page ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
              <PaginationItem>
                  <span className="flex items-center px-4 text-sm font-medium">
                    Halaman {meta.current_page} dari {meta.total_pages}
                  </span>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => handlePageChange(currentPage + 1, e)}
                  className={!meta.has_next_page ? 'pointer-events-none opacity-50' : ''}
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
                : 'Data akan tetap tersimpan meskipun dialog tertutup'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="category_name">
                  Nama Kategori <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="category_name"
                  value={formData.category_name}
                  onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
                  placeholder="Masukkan nama kategori"
                  required
                  disabled={isSubmitting}
                />
              </div>

              {/* ✅ TAMBAHAN: Info jika ada data yang tersimpan */}
              {!selectedCategory && hasUnsavedData && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Data sebelumnya masih tersimpan. Klik "Hapus Isian" jika ingin memulai dari awal.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter className="flex-row gap-2 sm:justify-between">
              {/* ✅ TAMBAHAN: Tombol Clear Form */}
              <div className="flex-1">
                {!selectedCategory && hasUnsavedData && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleClearForm} 
                    disabled={isSubmitting}
                    size="sm"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Hapus Isian
                  </Button>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCloseModal} 
                  disabled={isSubmitting}
                >
                  Batal
                </Button>
                
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {selectedCategory ? 'Update' : 'Simpan'}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Soft Delete Modal */}
      <Dialog open={isSoftDeleteOpen} onOpenChange={setIsSoftDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Arsipkan Kategori?</DialogTitle>
            <DialogDescription>
              Kategori <strong>{selectedCategory?.category_name}</strong> akan dipindahkan ke arsip dan tidak muncul di menu kasir.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSoftDeleteOpen(false)} disabled={isSubmitting}>Batal</Button>
            <Button className="bg-black text-white hover:bg-gray-800" onClick={handleSoftDelete} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Archive className="mr-2 h-4 w-4" />}
              Arsipkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Modal */}
      <Dialog open={isRestoreOpen} onOpenChange={setIsRestoreOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aktifkan Kembali?</DialogTitle>
            <DialogDescription>
              Kategori <strong>{selectedCategory?.category_name}</strong> akan kembali aktif dan muncul di menu kasir.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRestoreOpen(false)} disabled={isSubmitting}>Batal</Button>
            <Button onClick={handleRestore} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
              Aktifkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hard Delete Modal */}
      <Dialog open={isHardDeleteOpen} onOpenChange={setIsHardDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Hapus Permanen?
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus kategori <strong>{selectedCategory?.category_name}</strong> secara permanen?
              <br />
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHardDeleteOpen(false)} disabled={isSubmitting}>Batal</Button>
            <Button variant="destructive" onClick={handleHardDelete} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Hapus Permanen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
