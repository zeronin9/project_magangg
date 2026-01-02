'use client';

import { useState, useEffect } from 'react';
import { categoryAPI, branchAPI } from '@/lib/api/mitra';
import { Category, Branch, PaginationMeta } from '@/types/mitra';
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
  Trash2, 
  Layers,
  Building2,
  Globe,
  AlertCircle,
  Loader2,
  Filter,
  AlertTriangle,
  Archive,
  RotateCcw,
  Info,
  XCircle
} from 'lucide-react';

// Konstanta Pagination
const ITEMS_PER_PAGE = 10;

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State Filter & Pagination
  const [showArchived, setShowArchived] = useState(false);
  const [scopeFilter, setScopeFilter] = useState<'all' | 'general' | 'local'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isHardDeleteModalOpen, setIsHardDeleteModalOpen] = useState(false);
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  
  // Loading State
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    category_name: '',
  });

  // Load branches (hanya sekali)
  useEffect(() => {
    loadBranches();
  }, []);

  // Load categories ketika filter/page berubah
  useEffect(() => {
    loadCategories();
  }, [currentPage, showArchived, scopeFilter]);

  // Reset pagination saat filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [scopeFilter, showArchived]);

  // Helper Delay
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const loadBranches = async () => {
    try {
      const branchesData = await branchAPI.getAll();
      const branchesList = Array.isArray(branchesData) ? branchesData : [];
      setBranches(branchesList);
    } catch (err: any) {
      console.error('Gagal memuat branches:', err);
    }
  };

  // ✅ PERBAIKAN: Fungsi loadCategories dengan sorting General dulu, kemudian Lokal
  const loadCategories = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Siapkan parameter query
      const params: any = {
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        is_active: showArchived ? 'false' : 'true' 
      };

      // Handle Filter Scope
      if (scopeFilter === 'local') params.type = 'local';
      if (scopeFilter === 'general') params.type = 'general';
      
      // Panggil API dengan parameter objek
      const response = await categoryAPI.getAll(params);
      
      // Extract data dan meta dari response
      const categoriesList = Array.isArray(response.data) ? response.data : [];
      
      // Mapping relasi branch
      const categoriesWithBranch = categoriesList.map(category => {
        const branch = category.branch_id 
          ? branches.find(b => b.branch_id === category.branch_id)
          : null;
        return {
          ...category,
          branch: branch || category.branch || null
        };
      });
      
      // ✅ SORTING: General dulu, kemudian Lokal
      const sortedCategories = categoriesWithBranch.sort((a, b) => {
        // Kategori tanpa branch_id (General) diutamakan
        const aIsGeneral = !a.branch_id;
        const bIsGeneral = !b.branch_id;
        
        if (aIsGeneral && !bIsGeneral) return -1; // a (General) sebelum b (Lokal)
        if (!aIsGeneral && bIsGeneral) return 1;  // b (General) sebelum a (Lokal)
        
        // Jika sama-sama General atau sama-sama Lokal, urutkan berdasarkan nama
        return a.category_name.localeCompare(b.category_name, 'id-ID');
      });
      
      setCategories(sortedCategories);
      setMeta(response.meta);
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat data kategori');
      console.error('Error loading categories:', err);
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

      if (selectedCategory?.category_id) {
        await categoryAPI.update(selectedCategory.category_id, formData);
      } else {
        await categoryAPI.create(formData);
      }
      
      await loadCategories();
      
      // ✅ Reset formData hanya setelah berhasil submit
      setFormData({
        category_name: '',
      });
      
      handleCloseModal();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menyimpan kategori');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSoftDelete = async () => {
    if (!selectedCategory?.category_id) return;
    
    setIsSubmitting(true);
    try {
      await delay(1000);
      await categoryAPI.softDelete(selectedCategory.category_id);
      await loadCategories();
      setIsDeleteModalOpen(false);
      setSelectedCategory(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus kategori');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestore = async () => {
    if (!selectedCategory?.category_id) return;
    
    setIsSubmitting(true);
    try {
      await delay(1000);
      await categoryAPI.update(selectedCategory.category_id, { 
        category_name: selectedCategory.category_name,
        is_active: true
      });
      await loadCategories();
      setIsRestoreOpen(false);
      setSelectedCategory(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal mengaktifkan kategori');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHardDelete = async () => {
    if (!selectedCategory?.category_id) return;
    
    setIsSubmitting(true);
    try {
      await delay(1000);
      await categoryAPI.hardDelete(selectedCategory.category_id);
      await loadCategories();
      setIsHardDeleteModalOpen(false);
      setSelectedCategory(null);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Gagal menghapus permanen kategori';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePageChange = (page: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (page > 0 && page <= (meta?.total_pages || 1)) {
      setCurrentPage(page);
    }
  };

  // ✅ Helper untuk cek apakah ada data yang diisi
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
          <h1 className="text-3xl font-bold tracking-tight">Kategori Produk</h1>
          <p className="text-muted-foreground">
            Kelola kategori produk (General & Lokal)
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 @md:flex">
          <Button
            variant={showArchived ? "default" : "outline"}
            onClick={() => setShowArchived(!showArchived)}
          >
            <Archive className="mr-2 h-4 w-4" />
            {showArchived ? 'Sembunyikan Arsip' : 'Tampilkan Arsip'}
          </Button>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Kategori
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

      {/* Info Card */}
      <Alert>
        <Globe className="h-4 w-4" />
        <AlertDescription>
          <strong>Hybrid Scope:</strong> Kategori yang Anda buat akan otomatis menjadi{' '}
          <strong>General</strong> (berlaku untuk semua cabang). 
          Total Data: {meta?.total_items || 0}
        </AlertDescription>
      </Alert>

      {/* Filter */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filter Scope:</span>
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No</TableHead>
              <TableHead>Nama Kategori</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead>Cabang</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <Layers className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">
                    {showArchived ? 'Tidak ada kategori yang diarsipkan' : 'Tidak ada kategori ditemukan'}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category, idx) => (
                <TableRow key={category.category_id} className={category.is_active === false ? 'opacity-75 bg-muted/30' : ''}>
                  <TableCell>
                    {((meta?.current_page || 1) - 1) * ITEMS_PER_PAGE + idx + 1}
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-muted-foreground" />
                      {category.category_name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={category.branch_id ? 'secondary' : 'default'}>
                      {category.branch_id ? (
                        <Building2 className="mr-1 h-3 w-3" />
                      ) : (
                        <Globe className="mr-1 h-3 w-3" />
                      )}
                      {category.branch_id ? 'Lokal' : 'General'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {category.branch?.branch_name || 'Semua Cabang'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={category.is_active !== false ? "default" : "secondary"}>
                      {category.is_active !== false ? 'Aktif' : 'Diarsipkan'}
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
                        <DropdownMenuItem onClick={() => handleOpenModal(category)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        
                        {category.is_active !== false ? (
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedCategory(category);
                              setIsDeleteModalOpen(true);
                            }}
                            className="text-black"
                          >
                            <Archive className="mr-2 h-4 w-4" />
                            Arsipkan
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedCategory(category);
                              setIsRestoreOpen(true);
                            }}
                            className="text-black"
                          >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Aktifkan Kembali
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedCategory(category);
                            setIsHardDeleteModalOpen(true);
                          }}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
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
                   <span className="text-sm font-medium px-4">
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

            {/* Info Pagination Detail */}
            <div className="text-center text-xs text-muted-foreground mt-2">
              Menampilkan {categories.length} dari total {meta.total_items} data
            </div>
          </div>
        )}
      </Card>

      {/* Form Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
            </DialogTitle>
            <DialogDescription>
              {selectedCategory 
                ? 'Perbarui nama kategori'
                : 'Data akan tetap tersimpan meskipun dialog tertutup'
              }
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

      {/* Soft Delete (Archive) Confirmation */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Arsipkan Kategori?</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin mengarsipkan kategori <strong>{selectedCategory?.category_name}</strong>?
              <br/>
              Kategori akan dinonaktifkan namun data tetap tersimpan. Anda dapat melihatnya kembali dengan filter &quot;Tampilkan Arsip&quot;.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button 
              className="bg-black text-white hover:bg-gray-900" 
              onClick={handleSoftDelete} 
              disabled={isSubmitting}
            >
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
              <br/>
              Kategori akan muncul kembali di daftar aktif dan dapat digunakan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRestoreOpen(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button 
              className="bg-black text-white" 
              onClick={handleRestore} 
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Aktifkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hard Delete Confirmation */}
      <Dialog open={isHardDeleteModalOpen} onOpenChange={setIsHardDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-black flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Hapus Permanen?
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus kategori <strong>{selectedCategory?.category_name}</strong> secara permanen?
              <br/>
              Data yang dihapus tidak dapat dikembalikan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHardDeleteModalOpen(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button 
              variant="destructive"
              onClick={handleHardDelete} 
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Hapus Permanen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
