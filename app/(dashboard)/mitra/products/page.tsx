'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { productAPI, categoryAPI, branchAPI } from '@/lib/api/mitra';
import { Product, Category, Branch, PaginationMeta } from '@/types/mitra';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
  Package,
  Building2,
  Globe,
  AlertCircle,
  Loader2,
  Filter,
  Archive,
  AlertTriangle,
  RotateCcw,
  Image as ImageIcon
} from 'lucide-react';
import Image from 'next/image';
import { formatRupiah } from '@/lib/utils';

// Helper URL Gambar
const getImageUrl = (path: string | null | undefined) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';
  const serverUrl = apiBaseUrl.replace(/\/api\/?$/, '');
  const cleanPath = path.replace(/\\/g, '/').replace(/^\//, '');
  return `${serverUrl}/${cleanPath}`;
};

// Konfigurasi Pagination
const ITEMS_PER_PAGE = 10;

export default function ProductsPage() {
  const router = useRouter();
  
  // Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  
  // UI States
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filter & Pagination States
  const [showArchived, setShowArchived] = useState(false);
  const [scopeFilter, setScopeFilter] = useState<'all' | 'general' | 'local'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal States
  const [isSoftDeleteOpen, setIsSoftDeleteOpen] = useState(false);
  const [isHardDeleteOpen, setIsHardDeleteOpen] = useState(false);
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initial Load (Categories & Branches only once)
  useEffect(() => {
    const loadDependencies = async () => {
      try {
        const [categoriesData, branchesData] = await Promise.all([
          categoryAPI.getAll(), // Asumsi category dropdown tidak butuh pagination berat
          branchAPI.getAll(),
        ]);
        
        // Handle response structure differences
        setCategories(Array.isArray(categoriesData) ? categoriesData : (categoriesData as any).data || []);
        setBranches(Array.isArray(branchesData) ? branchesData : []);
      } catch (err) {
        console.error("Failed to load dependencies", err);
      }
    };
    loadDependencies();
  }, []);

  // Load Products on Filter/Page Change
  useEffect(() => {
    loadProducts();
  }, [currentPage, showArchived, scopeFilter]);

  // Reset pagination saat filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [scopeFilter, showArchived]);

  // Helper Delay for UX
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Params construction
      const params: any = {
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        is_active: showArchived ? 'false' : 'true' // Kirim sebagai string query param
      };

      if (scopeFilter === 'local') params.type = 'local';
      if (scopeFilter === 'general') params.type = 'general';

      const response = await productAPI.getAll(params);
      
      const productsList = Array.isArray(response.data) ? response.data : [];
      
      // Client-side relation mapping (if backend doesn't join)
      // Note: Idealnya backend mengirim data yang sudah di-join
      const productsWithRelations = productsList.map((product: any) => {
        const branch = product.branch_id 
          ? branches.find(b => b.branch_id === product.branch_id)
          : null;
        
        // Fallback jika category tidak di-join backend, cari di state local
        const category = product.category || categories.find(c => c.category_id === product.category_id);
        
        return {
          ...product,
          branch: branch || product.branch || null,
          category: category || null
        };
      });
      
      setProducts(productsWithRelations);
      setMeta(response.meta); // Simpan metadata pagination dari server

    } catch (err: any) {
      setError(err.message || 'Gagal memuat data produk');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditProduct = (product: Product) => {
    router.push(`/mitra/products/${product.product_id}/edit`);
  };

  const handleSoftDelete = async () => {
    if (!selectedProduct) return;
    setIsSubmitting(true);
    try {
      await delay(1000); 
      await productAPI.softDelete(selectedProduct.product_id);
      await loadProducts();
      setIsSoftDeleteOpen(false);
      setSelectedProduct(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menonaktifkan produk');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestore = async () => {
    if (!selectedProduct) return;
    setIsSubmitting(true);
    try {
      await delay(1000); 
      // Asumsi backend support update field partial
      const payload = {
        is_active: true,
        product_name: selectedProduct.product_name,
        base_price: selectedProduct.base_price,
        category_id: selectedProduct.category_id
      };
      await productAPI.update(selectedProduct.product_id, payload);
      await loadProducts();
      setIsRestoreOpen(false);
      setSelectedProduct(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal mengaktifkan produk');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHardDelete = async () => {
    if (!selectedProduct) return;
    setIsSubmitting(true);
    try {
      await delay(1000); 
      await productAPI.hardDelete(selectedProduct.product_id);
      await loadProducts();
      setIsHardDeleteOpen(false);
      setSelectedProduct(null);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Gagal menghapus produk permanen';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePageChange = (page: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (page > 0 && meta && page <= meta.total_pages) {
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-48 w-full mb-4" />
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8 @container">
      {/* Header */}
      <div className="flex flex-col gap-4 @md:flex-row @md:items-center @md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Produk</h1>
          <p className="text-muted-foreground">
            Kelola produk (General & Lokal)
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
          <Button onClick={() => router.push('/mitra/products/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Produk
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
          <strong>Hybrid Scope:</strong> Produk yang Anda buat akan otomatis menjadi{' '}
          <strong>General</strong> (berlaku untuk semua cabang). 
          Total Data: {meta?.total_items || 0}
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

      {/* Products Grid */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {products.length === 0 ? (
          <Card className="col-span-full p-12">
            <div className="text-center">
              <Package className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                {showArchived ? 'Tidak ada produk di arsip' : 'Tidak ada produk ditemukan'}
              </p>
            </div>
          </Card>
        ) : (
          products.map((product) => (
            <Card key={product.product_id} className={`overflow-hidden p-0 gap-0 border relative group ${showArchived ? 'opacity-75 bg-muted/40' : ''}`}>
              {/* Product Image */}
              <div className="aspect-[4/3] bg-muted relative">
                {product.image_url ? (
                  <Image
                    src={getImageUrl(product.image_url)}
                    alt={product.product_name}
                    fill
                    className="object-cover"
                    unoptimized={true}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.parentElement?.classList.add('flex', 'items-center', 'justify-center');
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
                  </div>
                )}
                
                {product.image_url && (
                   <div className="hidden flex items-center justify-center h-full absolute inset-0 bg-muted -z-10">
                      <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
                   </div>
                )}

                {/* Status Badge */}
                {showArchived && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                    <Badge variant="secondary" className="bg-white/90 text-black">Diarsipkan</Badge>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-3 space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm line-clamp-1" title={product.product_name}>
                      {product.product_name}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {product.category?.category_name || 'Tanpa Kategori'}
                    </p>
                  </div>
                  {/* Action Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                      
                      {!showArchived ? (
                        <>
                          <DropdownMenuItem onClick={() => handleEditProduct(product)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => {
                            setSelectedProduct(product);
                            setIsSoftDeleteOpen(true);
                          }} className="text-black">
                            <Archive className="mr-2 h-4 w-4" />
                            Arsipkan
                          </DropdownMenuItem>
                        </>
                      ) : (
                        <DropdownMenuItem onClick={() => {
                          setSelectedProduct(product);
                          setIsRestoreOpen(true);
                        }} className="text-green-600">
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Aktifkan Kembali
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => {
                        setSelectedProduct(product);
                        setIsHardDeleteOpen(true);
                      }} className="text-destructive focus:text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Hapus Permanen
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-primary truncate">
                    {formatRupiah(Number(product.base_price))}
                  </p>
                  <Badge 
                    variant={product.branch_id ? 'secondary' : 'default'} 
                    className="text-[10px] h-5 px-1.5 shrink-0"
                  >
                    {product.branch_id ? <Building2 className='h-3 w-3'/> : <Globe className="h-3 w-3" />}
                  </Badge>
                </div>

                {product.branch && (
                  <p className="text-[10px] text-muted-foreground line-clamp-1">
                    <Building2 className="inline-block h-3 w-3 mr-1" />
                    {product.branch.branch_name}
                  </p>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {meta && meta.total_pages > 1 && (
        <div className="py-4 flex justify-center">
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
                 <span className="text-sm px-4">
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
        </div>
      )}

      {/* Soft Delete Confirmation */}
      <Dialog open={isSoftDeleteOpen} onOpenChange={setIsSoftDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Arsipkan Produk?</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin mengarsipkan <strong>{selectedProduct?.product_name}</strong>?
              <br/>
              Produk akan dinonaktifkan (Soft Delete) dan tidak muncul di menu kasir.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSoftDeleteOpen(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button 
              className="bg-black text-white hover:bg-gray-800"
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
              Apakah Anda yakin ingin mengaktifkan kembali produk <strong>{selectedProduct?.product_name}</strong>?
              <br/>
              Produk akan muncul kembali di daftar aktif dan menu kasir.
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
              Apakah Anda yakin ingin menghapus <strong>{selectedProduct?.product_name}</strong> secara permanen?
              <br/>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHardDeleteOpen(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button className='bg-black hover:bg-gray-800' variant="destructive" onClick={handleHardDelete} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Hapus Permanen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}