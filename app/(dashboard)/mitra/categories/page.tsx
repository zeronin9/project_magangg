'use client';

import { useState, useEffect } from 'react';
import { categoryAPI, branchAPI } from '@/lib/api/mitra';
import { Category, Branch } from '@/types/mitra';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { CustomAlertDialog } from '@/components/ui/custom-alert-dialog';
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
  RotateCcw
} from 'lucide-react';

// Konstanta Pagination
const ITEMS_PER_PAGE = 5;

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
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

  useEffect(() => {
    loadData();
  }, [showArchived]);

  // Reset pagination saat filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [scopeFilter, showArchived]);

  // Helper Delay
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [categoriesData, branchesData] = await Promise.all([
        categoryAPI.getAll(),
        branchAPI.getAll(),
      ]);
      
      const branchesList = Array.isArray(branchesData) ? branchesData : [];
      const categoriesList = Array.isArray(categoriesData) ? categoriesData : [];
      
      const filteredCategoriesList = showArchived 
        ? categoriesList.filter(c => c.is_active === false)
        : categoriesList.filter(c => c.is_active !== false);
      
      const categoriesWithBranch = filteredCategoriesList.map(category => {
        const branch = category.branch_id 
          ? branchesList.find(b => b.branch_id === category.branch_id)
          : null;
        return {
          ...category,
          branch: branch || null
        };
      });
      
      setCategories(categoriesWithBranch);
      setBranches(branchesList);
    } catch (err: any) {
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
      await delay(3000);

      if (selectedCategory) {
        await categoryAPI.update(selectedCategory.category_id, formData);
      } else {
        await categoryAPI.create(formData);
      }
      await loadData();
      handleCloseModal();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menyimpan kategori');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSoftDelete = async () => {
    if (!selectedCategory) return;
    
    setIsSubmitting(true);
    try {
      await delay(3000);
      await categoryAPI.softDelete(selectedCategory.category_id);
      await loadData();
      setIsDeleteModalOpen(false);
      setSelectedCategory(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus kategori');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestore = async () => {
    if (!selectedCategory) return;
    
    setIsSubmitting(true);
    try {
      await delay(3000);
      await categoryAPI.update(selectedCategory.category_id, { 
        category_name: selectedCategory.category_name
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
      await delay(3000);
      await categoryAPI.hardDelete(selectedCategory.category_id);
      await loadData();
      setIsHardDeleteModalOpen(false);
      setSelectedCategory(null);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Gagal menghapus permanen kategori';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1. Filter Data
  const filteredCategories = categories.filter(cat => {
    if (scopeFilter === 'general') return !cat.branch_id;
    if (scopeFilter === 'local') return !!cat.branch_id;
    return true;
  });

  const generalCount = categories.filter(c => !c.branch_id).length;
  const localCount = categories.filter(c => c.branch_id).length;

  // 2. Logika Pagination
  const totalItems = filteredCategories.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedCategories = filteredCategories.slice(startIndex, endIndex);

  // Helper untuk pindah halaman
  const handlePageChange = (page: number, e: React.MouseEvent) => {
    e.preventDefault(); // Mencegah reload karena PaginationLink adalah <a>
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kategori Produk</h1>
          <p className="text-muted-foreground">
            Kelola kategori produk (General & Lokal)
          </p>
        </div>
        <div className="flex gap-2">
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
          <strong>General</strong> (berlaku untuk semua cabang). Total: {generalCount} General, {localCount} Lokal
        </AlertDescription>
      </Alert>

      {/* Filter */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filter Scope:</span>
          <div className="flex gap-2">
            <Button
              variant={scopeFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setScopeFilter('all')}
            >
              Semua ({categories.length})
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Kategori</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead>Cabang</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedCategories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <Layers className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">
                    {showArchived ? 'Tidak ada kategori yang diarsipkan' : 'Tidak ada kategori ditemukan'}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              paginatedCategories.map((category) => (
                <TableRow key={category.category_id} className={category.is_active === false ? 'opacity-75 bg-muted/30' : ''}>
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
                            className="text-orange-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Arsipkan
                          </DropdownMenuItem>
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

                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedCategory(category);
                            setIsHardDeleteModalOpen(true);
                          }}
                          className="text-destructive focus:text-destructive"
                        >
                          <AlertTriangle className="mr-2 h-4 w-4" />
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
        {totalPages > 1 && (
          <div className="py-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    href="#" 
                    onClick={(e) => handlePageChange(currentPage - 1, e)}
                    className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                
                {/* Generate Page Numbers */}
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
                    className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
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
                : 'Kategori akan dibuat sebagai General (berlaku untuk semua cabang)'
              }
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
                  placeholder="Contoh: Minuman, Makanan, Snack"
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
      <CustomAlertDialog
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        title="Arsipkan Kategori?"
        description={
          <div className="space-y-2">
            <p>
              Apakah Anda yakin ingin mengarsipkan kategori <strong>{selectedCategory?.category_name}</strong>?
            </p>
            <p className="text-sm text-muted-foreground">
              Kategori akan dinonaktifkan. Anda dapat melihatnya kembali dengan filter "Tampilkan Arsip".
            </p>
          </div>
        }
        onConfirm={handleSoftDelete}
        confirmText="Arsipkan"
        variant="warning"
      />

      {/* Restore Confirmation */}
      <CustomAlertDialog
        open={isRestoreOpen}
        onOpenChange={setIsRestoreOpen}
        title="Aktifkan Kembali?"
        description={
          <div className="space-y-2">
            <p>
              Apakah Anda yakin ingin mengaktifkan kembali kategori <strong>{selectedCategory?.category_name}</strong>?
            </p>
            <p className="text-sm text-muted-foreground">
              Kategori akan muncul kembali di daftar aktif dan dapat digunakan.
            </p>
          </div>
        }
        onConfirm={handleRestore}
        confirmText="Aktifkan"
        variant="default"
      />

      {/* Hard Delete Confirmation */}
      <CustomAlertDialog
        open={isHardDeleteModalOpen}
        onOpenChange={setIsHardDeleteModalOpen}
        title="Hapus Permanen?"
        description={
          <div className="space-y-3">
            <p>
              Apakah Anda yakin ingin menghapus kategori <strong>{selectedCategory?.category_name}</strong> secara permanen?
            </p>
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm">
              <div className="flex items-center gap-2 font-medium text-destructive mb-1">
                <AlertTriangle className="h-4 w-4" />
                PERINGATAN
              </div>
              <div className="text-destructive/80">
                Tindakan ini <strong>tidak dapat dibatalkan</strong>. Data kategori akan hilang dari database. 
                Gagal jika kategori sedang digunakan oleh produk.
              </div>
            </div>
          </div>
        }
        onConfirm={handleHardDelete}
        confirmText="Hapus Permanen"
        variant="destructive"
      />
    </div>
  );
}