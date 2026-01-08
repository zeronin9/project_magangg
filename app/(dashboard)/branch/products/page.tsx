'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { branchProductAPI, cashierMenuAPI } from '@/lib/api/branch';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
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
  RotateCcw,
  Image as ImageIcon,
  Settings,
  CheckCircle2,
  Search,
  Eye,
} from 'lucide-react';
import Image from 'next/image';
import { formatRupiah } from '@/lib/utils';

// --- Interfaces ---

interface MenuProduct {
  product_id: string;
  name: string;
  price: string | number;
  image_url: string | null;
  category: string;
  description?: string;
  is_available: boolean;
  branch_setting?: any;
  product_name?: string;
  base_price?: number;
  branch_id?: string;
  is_active?: boolean;
}

interface BranchProductSetting {
  branch_product_setting_id?: string;
  sale_price?: number;
  branch_product_name?: string | null;
  branch_description?: string | null;
  branch_image_url?: string | null;
  is_available_at_branch: boolean;
}

interface Product {
  product_id: string;
  product_name: string;
  base_price: number;
  category_id: string;
  image_url?: string;
  description?: string;
  branch_id?: string | null;
  is_active: boolean;
  category?: {
    category_name: string;
  };
  branch?: {
    branch_name: string;
  };
  branch_setting?: BranchProductSetting | null;
  name?: string;
  price?: string | number;
  is_available?: boolean;
}

const getImageUrl = (path: string | null | undefined) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';
  const serverUrl = apiBaseUrl.replace(/\/api\/?$/, '');
  const cleanPath = path.replace(/\\/g, '/').replace(/^\//, '');
  return `${serverUrl}/${cleanPath}`;
};

export default function BranchProductsPage() {
  const router = useRouter();
  
  // State Data
  const [allProducts, setAllProducts] = useState<(Product | MenuProduct)[]>([]);
  
  // State UI
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter & Pagination States
  const [scopeFilter, setScopeFilter] = useState<'all' | 'general' | 'local' | 'overridden'>('overridden');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  // Modal States (hanya untuk Delete/Restore)
  const [isSoftDeleteOpen, setIsSoftDeleteOpen] = useState(false);
  const [isHardDeleteOpen, setIsHardDeleteOpen] = useState(false);
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | MenuProduct | null>(null);

  // --- Helpers ---
  
  const isMenuProduct = (p: Product | MenuProduct | null): p is MenuProduct => {
    return !!p && 'name' in p && 'price' in p;
  };

  const getDisplayName = (product: Product | MenuProduct | null): string => {
    if (!product) return '';
    if (isMenuProduct(product)) return product.name;
    return product.branch_setting?.branch_product_name || product.product_name || '';
  };

  const getDisplayPrice = (product: Product | MenuProduct | null): number => {
    if (!product) return 0;
    if (isMenuProduct(product)) return Number(product.price);
    return product.branch_setting?.sale_price || product.base_price || 0;
  };

  const getDisplayImage = (product: Product | MenuProduct | null): string => {
    if (!product) return '';
    if (isMenuProduct(product)) return getImageUrl(product.image_url);
    return getImageUrl(product.branch_setting?.branch_image_url || product.image_url);
  };

  const getDisplayCategory = (product: Product | MenuProduct | null): string => {
    if (!product) return 'Tanpa Kategori';
    if (isMenuProduct(product)) return product.category;
    return product.category?.category_name || 'Tanpa Kategori';
  };

  const isOverridden = (product: Product | MenuProduct | null): boolean => {
    if (!product) return false;
    if (isMenuProduct(product)) return false;
    return !!product.branch_setting?.branch_product_setting_id;
  };

  // --- Effects ---
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopeFilter, showArchived]);

  useEffect(() => {
    setCurrentPage(1);
  }, [scopeFilter, showArchived]);

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      let response;

      if (scopeFilter === 'overridden') {
        // FETCH DARI /cashier/menu (Menu Kasir)
        try {
            const res = await cashierMenuAPI.getMenu(); 
            const data = res.data.data || res.data;
            
            // Store semua data tanpa filter
            setAllProducts(Array.isArray(data) ? data : []);
        } catch (e) {
            throw e;
        }

      } else {
        // FETCH DARI /product (Management)
        let typeParam: string | undefined = undefined;
        if (scopeFilter === 'local') typeParam = 'local';
        if (scopeFilter === 'general') typeParam = 'general';

        // Load SEMUA data dengan limit besar
        response = await branchProductAPI.getAll({
          page: 1,
          limit: 1000,
          search: '',
          type: typeParam,
          status: showArchived ? 'archived' : 'active' 
        });
        
        setAllProducts(response.items || []);
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal memuat data produk');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Navigation Handlers ---
  const handleDetailClick = (product: Product | MenuProduct) => {
    router.push(`/branch/products/${product.product_id}`);
  };

  const handleEditClick = (product: Product | MenuProduct) => {
    if (!isMenuProduct(product) && product.branch_id) {
      // ✅ Navigasi ke halaman edit terpisah
      router.push(`/branch/products/${product.product_id}/edit`);
    }
  };

  const handleOverrideClick = (product: Product | MenuProduct) => {
    router.push(`/branch/products/${product.product_id}/override`);
  };

  // --- Delete/Restore Handlers ---
  const handleSoftDelete = async () => {
    if (!selectedProduct || isMenuProduct(selectedProduct)) return;
    setIsSubmitting(true);
    try {
      await delay(2000);
      await branchProductAPI.softDelete(selectedProduct.product_id);
      await loadData();
      setIsSoftDeleteOpen(false);
      setSelectedProduct(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menonaktifkan produk');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestore = async () => {
    if (!selectedProduct || isMenuProduct(selectedProduct)) return;
    setIsSubmitting(true);
    try {
      await delay(2000);
      await branchProductAPI.update(selectedProduct.product_id, {
        is_active: true,
        product_name: selectedProduct.product_name,
        base_price: selectedProduct.base_price,
        category_id: selectedProduct.category_id,
      });
      await loadData();
      setIsRestoreOpen(false);
      setSelectedProduct(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal mengaktifkan produk');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHardDelete = async () => {
    if (!selectedProduct || isMenuProduct(selectedProduct)) return;
    setIsSubmitting(true);
    try {
      await delay(2000);
      await branchProductAPI.hardDelete(selectedProduct.product_id);
      await loadData();
      setIsHardDeleteOpen(false);
      setSelectedProduct(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus produk permanen');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Client-side filtering
  const filteredProducts = useMemo(() => {
    if (!searchTerm || searchTerm.trim() === '') {
      return allProducts;
    }

    const query = searchTerm.toLowerCase().trim();
    return allProducts.filter(product => {
      const name = getDisplayName(product).toLowerCase();
      const category = getDisplayCategory(product).toLowerCase();
      
      return name.includes(query) || category.includes(query);
    });
  }, [allProducts, searchTerm]);

  // Client-side pagination
  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(filteredProducts.length / 10);
    const startIndex = (currentPage - 1) * 10;
    const endIndex = startIndex + 10;
    const itemsToShow = filteredProducts.slice(startIndex, endIndex);
    
    return {
      itemsToShow,
      currentTotalPages: totalPages || 1,
      hasPrevPage: currentPage > 1,
      hasNextPage: currentPage < totalPages,
      totalItems: filteredProducts.length
    };
  }, [filteredProducts, currentPage]);

  const { itemsToShow, currentTotalPages, hasPrevPage, hasNextPage, totalItems } = paginationData;

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= currentTotalPages) {
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
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
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
          <h1 className="text-3xl font-bold tracking-tight">Produk Cabang</h1>
          <p className="text-muted-foreground">Kelola produk lokal & override produk general</p>
        </div>
        <div className="grid grid-cols-2 gap-2 @md:flex">
          <Button 
            variant={showArchived ? 'default' : 'outline'} 
            onClick={() => setShowArchived(!showArchived)}
          >
            <Archive className="mr-2 h-4 w-4" />
            {showArchived ? 'Sembunyikan Arsip' : `Tampilkan Arsip`}
          </Button>
          {/* ✅ Navigasi ke halaman create terpisah */}
          <Button onClick={() => router.push('/branch/products/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Produk Lokal
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
          {showArchived ? (
            <>
              <strong>Mode Arsip:</strong> Menampilkan produk yang diarsipkan (tidak tampil di menu kasir).
            </>
          ) : (
            <>
              <strong>Produk Aktif:</strong> Produk yang Anda buat hanya berlaku untuk cabang ini. Produk General dari pusat
              dapat di-override harga/ketersediaannya.
            </>
          )}
        </AlertDescription>
      </Alert>

      {/* Filter & Search */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium whitespace-nowrap">Filter Scope:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            
            <Button
              variant={scopeFilter === 'overridden' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setScopeFilter('overridden')}
              className={scopeFilter === 'overridden' ? 'bg-black text-white shadow-lg' : ''}
            >
              <Settings className="mr-2 h-3 w-3" />
              Menu Kasir {scopeFilter === 'overridden' && `(${totalItems})`}
            </Button>

            <Button
              variant={scopeFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setScopeFilter('all')}
            >
              Semua {scopeFilter === 'all' && `(${totalItems})`}
            </Button>

            <Button
              variant={scopeFilter === 'general' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setScopeFilter('general')}
            >
              <Globe className="mr-2 h-3 w-3" />
              General {scopeFilter === 'general' && `(${totalItems})`}
            </Button>
            <Button
              variant={scopeFilter === 'local' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setScopeFilter('local')}
            >
              <Building2 className="mr-2 h-3 w-3" />
              Lokal {scopeFilter === 'local' && `(${totalItems})`}
            </Button>
          </div>
          
          <div className="relative w-full md:w-72">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Cari produk atau kategori..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Products Grid */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {itemsToShow.length === 0 ? (
          <Card className="col-span-full p-12">
            <div className="text-center">
              <Package className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                {searchTerm
                  ? `Tidak ada hasil untuk "${searchTerm}"`
                  : showArchived ? 'Tidak ada produk di arsip' : 'Tidak ada produk'}
              </p>
            </div>
          </Card>
        ) : (
          itemsToShow.map((product) => {
            const isActive = isMenuProduct(product) 
               ? product.is_available 
               : (product.is_active !== false && (!product.branch_setting || product.branch_setting.is_available_at_branch));
            
            if (scopeFilter !== 'overridden') {
                 // Logic render langsung
            } else {
                 if (showArchived && isActive) return null;
            }

            return (
            <Card
              key={product.product_id}
              className={`overflow-hidden p-0 gap-0 border relative group ${!isActive ? 'opacity-75 bg-muted/40' : ''}`}
            >
              {/* Product Image */}
              <div className="aspect-[4/3] bg-muted relative">
                {getDisplayImage(product) ? (
                  <Image
                    src={getDisplayImage(product)}
                    alt={getDisplayName(product)}
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

                {getDisplayImage(product) && (
                   <div className="hidden flex items-center justify-center h-full absolute inset-0 bg-muted -z-10">
                     <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
                   </div>
                )}

                {isMenuProduct(product) && !showArchived && (
                  <div className="absolute top-2 left-2 z-10">
                    <Badge variant="default" className="bg-black text-white text-[10px] px-2 py-0.5">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Menu Kasir
                    </Badge>
                  </div>
                )}

                {!isMenuProduct(product) && isOverridden(product) && !showArchived && (
                  <div className="absolute top-2 left-2 z-10">
                    <Badge variant="default" className="bg-black text-white text-[10px] px-2 py-0.5">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Override
                    </Badge>
                  </div>
                )}

                {showArchived && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                    <Badge variant="secondary" className="bg-white/90 text-black">
                      Diarsipkan
                    </Badge>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-3 space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm line-clamp-1" title={getDisplayName(product)}>
                      {getDisplayName(product)}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {getDisplayCategory(product)}
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

                      {/* ✅ Menu Detail - Navigasi ke halaman terpisah */}
                      <DropdownMenuItem onClick={() => handleDetailClick(product)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Detail
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />

                      {!showArchived ? (
                        <>
                          {!isMenuProduct(product) && product.branch_id ? (
                            // ✅ Produk Lokal - Edit (Navigasi ke halaman edit)
                            <DropdownMenuItem onClick={() => handleEditClick(product)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          ) : (
                            // ✅ Produk General - Override (Navigasi ke halaman override)
                            <DropdownMenuItem onClick={() => handleOverrideClick(product)}>
                              <Settings className="mr-2 h-4 w-4" />
                              {isOverridden(product) ? 'Edit Override' : 'Override Setting'}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {!isMenuProduct(product) && product.branch_id && (
                            <>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedProduct(product);
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
                                  setSelectedProduct(product);
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
                        !isMenuProduct(product) && product.branch_id && (
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedProduct(product);
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
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-primary truncate">
                      {formatRupiah(getDisplayPrice(product))}
                    </p>
                    {!isMenuProduct(product) && isOverridden(product) && product.branch_setting && product.branch_setting.sale_price !== product.base_price && (
                       <p className="text-xs text-muted-foreground line-through">
                         {formatRupiah(product.base_price)}
                       </p>
                    )}
                  </div>
                  <Badge variant={!isMenuProduct(product) && product.branch_id ? 'secondary' : 'default'} className="text-[10px] h-5 px-1.5 shrink-0">
                    {isMenuProduct(product) ? (
                        <CheckCircle2 className="h-3 w-3" />
                    ) : product.branch_id ? (
                      <Building2 className="h-3 w-3" />
                    ) : (
                      <Globe className="h-3 w-3" />
                    )}
                  </Badge>
                </div>
              </div>
            </Card>
          )})
        )}
      </div>

      {/* Pagination */}
      {currentTotalPages > 1 && (
        <div className="py-4 flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }}
                  className={!hasPrevPage ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
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
                  onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }}
                  className={!hasNextPage ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* --- MODALS --- */}
      
      {/* Soft Delete Modal */}
      <Dialog open={isSoftDeleteOpen} onOpenChange={setIsSoftDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Arsipkan Produk?</DialogTitle>
            <DialogDescription>
              Produk <strong>{getDisplayName(selectedProduct)}</strong> akan dinonaktifkan dan tidak muncul di menu kasir.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSoftDeleteOpen(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button onClick={handleSoftDelete} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
              Produk <strong>{getDisplayName(selectedProduct)}</strong> akan diaktifkan kembali dan muncul di menu kasir.
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

      {/* Hard Delete Modal */}
      <Dialog open={isHardDeleteOpen} onOpenChange={setIsHardDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Permanen?</DialogTitle>
            <DialogDescription>
              Produk <strong>{getDisplayName(selectedProduct)}</strong> akan dihapus permanen. 
              Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHardDeleteOpen(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleHardDelete} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Hapus Permanen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
