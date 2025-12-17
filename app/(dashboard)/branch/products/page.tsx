// app/(dashboard)/branch/products/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { branchProductAPI, branchCategoryAPI } from '@/lib/api/branch';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
  Package,
  Building2,
  Globe,
  AlertCircle,
  Loader2,
  Filter,
  Upload,
  Archive,
  AlertTriangle,
  RotateCcw,
  Image as ImageIcon,
  Settings,
} from 'lucide-react';
import Image from 'next/image';
import { formatRupiah } from '@/lib/utils';

interface Product {
  product_id: string;
  product_name: string;
  base_price: number;
  category_id: string;
  image_url?: string;
  branch_id?: string | null;
  is_active: boolean;
  category?: {
    category_name: string;
  };
  branch?: {
    branch_name: string;
  };
}

interface Category {
  category_id: string;
  category_name: string;
  branch_id?: string | null;
}

const getImageUrl = (path: string | null | undefined) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';
  const serverUrl = apiBaseUrl.replace(/\/api\/?$/, '');
  const cleanPath = path.replace(/\\/g, '/').replace(/^\//, '');
  return `${serverUrl}/${cleanPath}`;
};

const ITEMS_PER_PAGE = 12;

export default function BranchProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [showArchived, setShowArchived] = useState(false);
  const [scopeFilter, setScopeFilter] = useState<'all' | 'general' | 'local'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [isSoftDeleteOpen, setIsSoftDeleteOpen] = useState(false);
  const [isHardDeleteOpen, setIsHardDeleteOpen] = useState(false);
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageError, setImageError] = useState('');
  const [imagePreview, setImagePreview] = useState<string>('');

  const [formData, setFormData] = useState({
    product_name: '',
    base_price: '',
    category_id: '',
    image_url: null as File | null,
  });

  const [overrideData, setOverrideData] = useState({
    sale_price: '',
    branch_product_name: '',
    branch_description: '',
    is_available_at_branch: true,
    branch_product_image: null as File | null,
  });

  const [overrideImagePreview, setOverrideImagePreview] = useState<string>('');
  const [overrideImageError, setOverrideImageError] = useState('');

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
      const [productsData, categoriesData] = await Promise.all([
        branchProductAPI.getAll(),
        branchCategoryAPI.getAll(),
      ]);

      const categoriesList = Array.isArray(categoriesData.data) ? categoriesData.data : [];
      const productsList = Array.isArray(productsData.data) ? productsData.data : [];

      const filteredList = showArchived
        ? productsList.filter((p: any) => p.is_active === false)
        : productsList.filter((p: any) => p.is_active !== false);

      const productsWithRelations = filteredList.map((product: any) => {
        const category = categoriesList.find((c: any) => c.category_id === product.category_id);

        return {
          ...product,
          category: category || null,
        };
      });

      setProducts(productsWithRelations);
      setCategories(categoriesList);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data produk');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (product?: Product) => {
    setImageError('');
    if (product) {
      setSelectedProduct(product);
      setFormData({
        product_name: product.product_name,
        base_price: product.base_price.toString(),
        category_id: product.category_id,
        image_url: null,
      });
      setImagePreview(getImageUrl(product.image_url) || '');
    } else {
      setSelectedProduct(null);
      setFormData({
        product_name: '',
        base_price: '',
        category_id: '',
        image_url: null,
      });
      setImagePreview('');
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
    setFormData({
      product_name: '',
      base_price: '',
      category_id: '',
      image_url: null,
    });
    setImagePreview('');
    setImageError('');
  };

  const handleOpenOverrideModal = (product: Product) => {
    setSelectedProduct(product);
    setOverrideData({
      sale_price: product.base_price.toString(),
      branch_product_name: '',
      branch_description: '',
      is_available_at_branch: true,
      branch_product_image: null,
    });
    setOverrideImagePreview('');
    setOverrideImageError('');
    setIsOverrideModalOpen(true);
  };

  const handleCloseOverrideModal = () => {
    setIsOverrideModalOpen(false);
    setSelectedProduct(null);
    setOverrideData({
      sale_price: '',
      branch_product_name: '',
      branch_description: '',
      is_available_at_branch: true,
      branch_product_image: null,
    });
    setOverrideImagePreview('');
    setOverrideImageError('');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];

      if (!allowedTypes.includes(file.type)) {
        setImageError('Format file tidak valid! Gunakan JPEG, JPG, PNG, atau GIF.');
        e.target.value = '';
        setFormData({ ...formData, image_url: null });
        if (selectedProduct && selectedProduct.image_url) {
          setImagePreview(getImageUrl(selectedProduct.image_url) || '');
        } else {
          setImagePreview('');
        }
        return;
      }

      if (file.size > 1024 * 1024) {
        setImageError('Ukuran gambar terlalu besar! Maksimal 1MB.');
        e.target.value = '';
        setFormData({ ...formData, image_url: null });
        if (selectedProduct && selectedProduct.image_url) {
          setImagePreview(getImageUrl(selectedProduct.image_url) || '');
        } else {
          setImagePreview('');
        }
        return;
      }

      setImageError('');
      setFormData({ ...formData, image_url: file });

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOverrideImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];

      if (!allowedTypes.includes(file.type)) {
        setOverrideImageError('Format file tidak valid! Gunakan JPEG, JPG, PNG, atau GIF.');
        e.target.value = '';
        setOverrideData({ ...overrideData, branch_product_image: null });
        setOverrideImagePreview('');
        return;
      }

      if (file.size > 1024 * 1024) {
        setOverrideImageError('Ukuran gambar terlalu besar! Maksimal 1MB.');
        e.target.value = '';
        setOverrideData({ ...overrideData, branch_product_image: null });
        setOverrideImagePreview('');
        return;
      }

      setOverrideImageError('');
      setOverrideData({ ...overrideData, branch_product_image: file });

      const reader = new FileReader();
      reader.onloadend = () => {
        setOverrideImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setFormData({ ...formData, base_price: value });
  };

  const handleOverridePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setOverrideData({ ...overrideData, sale_price: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (imageError) return;

    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('product_name', formData.product_name);
      formDataToSend.append('base_price', formData.base_price);
      formDataToSend.append('category_id', formData.category_id);

      if (formData.image_url) {
        formDataToSend.append('product_image', formData.image_url);
      }

      if (selectedProduct) {
        await branchProductAPI.update(selectedProduct.product_id, formDataToSend);
      } else {
        await branchProductAPI.create(formDataToSend);
      }

      await loadData();
      handleCloseModal();
    } catch (err: any) {
      console.error('Error response:', err.response?.data);
      const errorMessage = err.response?.data?.message || err.message || 'Gagal menyimpan produk';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || overrideImageError) return;

    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      
      // ✅ Field wajib
      formDataToSend.append('sale_price', overrideData.sale_price);
      formDataToSend.append('is_available_at_branch', overrideData.is_available_at_branch.toString());

      // ✅ Field opsional - hanya kirim jika ada isinya
      if (overrideData.branch_product_name && overrideData.branch_product_name.trim() !== '') {
        formDataToSend.append('branch_product_name', overrideData.branch_product_name.trim());
      }

      if (overrideData.branch_description && overrideData.branch_description.trim() !== '') {
        formDataToSend.append('branch_description', overrideData.branch_description.trim());
      }

      if (overrideData.branch_product_image) {
        formDataToSend.append('branch_product_image', overrideData.branch_product_image);
      }

      console.log('🚀 Sending override request for product:', selectedProduct.product_id);

      await branchProductAPI.setOverride(selectedProduct.product_id, formDataToSend);

      console.log('✅ Override berhasil disimpan');
      
      await loadData();
      handleCloseOverrideModal();
      
      alert('Override produk berhasil disimpan!');
    } catch (err: any) {
      console.error('❌ Error override:', err);
      console.error('Response:', err.response?.data);
      const errorMessage = err.response?.data?.message || err.message || 'Gagal menyimpan override produk';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSoftDelete = async () => {
    if (!selectedProduct) return;

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
    if (!selectedProduct) return;

    setIsSubmitting(true);
    try {
      await delay(2000);

      const payload = {
        is_active: true,
        product_name: selectedProduct.product_name,
        base_price: selectedProduct.base_price,
        category_id: selectedProduct.category_id,
      };

      await branchProductAPI.update(selectedProduct.product_id, payload);

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
    if (!selectedProduct) return;

    setIsSubmitting(true);
    try {
      await delay(2000);
      await branchProductAPI.hardDelete(selectedProduct.product_id);
      await loadData();
      setIsHardDeleteOpen(false);
      setSelectedProduct(null);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Gagal menghapus produk permanen';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = products.filter((prod) => {
    if (scopeFilter === 'general') return !prod.branch_id;
    if (scopeFilter === 'local') return !!prod.branch_id;
    return true;
  });

  const generalCount = products.filter((p) => !p.branch_id).length;
  const localCount = products.filter((p) => p.branch_id).length;

  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

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
          <h1 className="text-3xl font-bold tracking-tight">Produk Cabang</h1>
          <p className="text-muted-foreground">Kelola produk lokal & override produk general</p>
        </div>
        <div className="grid grid-cols-2 gap-2 @md:flex">
          <Button variant={showArchived ? 'default' : 'outline'} onClick={() => setShowArchived(!showArchived)}>
            <Archive className="mr-2 h-4 w-4" />
            {showArchived ? 'Sembunyikan Arsip' : 'Tampilkan Arsip'}
          </Button>
          <Button onClick={() => handleOpenModal()}>
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
          <strong>Produk Lokal:</strong> Produk yang Anda buat hanya berlaku untuk cabang ini. Produk General dari pusat
          dapat di-override harga/ketersediaannya. Total: {generalCount} General, {localCount} Lokal
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

      {/* Products Grid */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {paginatedProducts.length === 0 ? (
          <Card className="col-span-full p-12">
            <div className="text-center">
              <Package className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                {showArchived ? 'Tidak ada produk di arsip' : 'Tidak ada produk'}
              </p>
            </div>
          </Card>
        ) : (
          paginatedProducts.map((product) => (
            <Card
              key={product.product_id}
              className={`overflow-hidden p-0 gap-0 border relative group ${showArchived ? 'opacity-75 bg-muted/40' : ''}`}
            >
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
                          {product.branch_id ? (
                            <DropdownMenuItem onClick={() => handleOpenModal(product)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleOpenOverrideModal(product)}>
                              <Settings className="mr-2 h-4 w-4" />
                              Override Setting
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {product.branch_id && (
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
                        product.branch_id && (
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
                  <p className="text-sm font-bold text-primary truncate">{formatRupiah(Number(product.base_price))}</p>
                  <Badge variant={product.branch_id ? 'secondary' : 'default'} className="text-[10px] h-5 px-1.5 shrink-0">
                    {product.branch_id ? <Building2 className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                  </Badge>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

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

      {/* Create/Edit Product Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedProduct ? 'Edit Produk Lokal' : 'Tambah Produk Lokal Baru'}</DialogTitle>
            <DialogDescription>
              {selectedProduct ? 'Perbarui informasi produk lokal' : 'Produk hanya berlaku untuk cabang Anda'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              {/* Image Upload */}
              <div className="space-y-2">
                <Label>Gambar Produk</Label>

                {imageError && (
                  <Alert variant="destructive" className="mb-2 py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs font-medium">{imageError}</AlertDescription>
                  </Alert>
                )}

                <div className="flex flex-col gap-4">
                  {imagePreview && (
                    <div className="relative aspect-video w-full rounded-lg overflow-hidden border">
                      <Image src={imagePreview} alt="Preview" fill className="object-cover" unoptimized={true} />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif"
                      onChange={handleImageChange}
                      className="hidden"
                      id="image_url"
                    />
                    <Label htmlFor="image_url" className="flex-1 cursor-pointer">
                      <div
                        className={`flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-4 transition-colors ${
                          imageError ? 'border-destructive bg-destructive/5' : 'hover:bg-muted/50'
                        }`}
                      >
                        <Upload className={`h-5 w-5 ${imageError ? 'text-destructive' : 'text-muted-foreground'}`} />
                        <span className={`text-sm ${imageError ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                          {imagePreview ? 'Ganti Gambar' : 'Upload Gambar (Max 1MB)'}
                        </span>
                      </div>
                    </Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="product_name">Nama Produk *</Label>
                <Input
                  id="product_name"
                  value={formData.product_name}
                  onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                  placeholder="Masukkan nama produk"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="base_price">Harga *</Label>
                <Input
                  id="base_price"
                  type="text"
                  value={formData.base_price ? `Rp. ${Number(formData.base_price).toLocaleString('id-ID')}` : ''}
                  onChange={handlePriceChange}
                  placeholder="Masukkan harga"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category_id">Kategori *</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.length > 0 ? (
                      categories.map((category) => (
                        <SelectItem key={category.category_id} value={category.category_id}>
                          {category.category_name}
                          {!category.branch_id && <Badge variant="outline" className="ml-2 text-[10px]">General</Badge>}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-6 text-center text-sm text-muted-foreground">Tidak ada kategori tersedia</div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseModal} disabled={isSubmitting}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting || !!imageError}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selectedProduct ? 'Update' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Override Product Modal */}
      <Dialog open={isOverrideModalOpen} onOpenChange={setIsOverrideModalOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Override Produk General</DialogTitle>
            <DialogDescription>
              Ubah harga, nama, deskripsi, gambar, atau ketersediaan produk{' '}
              <strong>{selectedProduct?.product_name}</strong> untuk cabang ini
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleOverrideSubmit}>
            <div className="space-y-4 py-4">
              {/* Image Upload Override */}
              <div className="space-y-2">
                <Label>Gambar Produk Override (Opsional)</Label>

                {overrideImageError && (
                  <Alert variant="destructive" className="mb-2 py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs font-medium">{overrideImageError}</AlertDescription>
                  </Alert>
                )}

                <div className="flex flex-col gap-4">
                  {overrideImagePreview && (
                    <div className="relative aspect-video w-full rounded-lg overflow-hidden border">
                      <Image src={overrideImagePreview} alt="Preview" fill className="object-cover" unoptimized={true} />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif"
                      onChange={handleOverrideImageChange}
                      className="hidden"
                      id="override_image"
                    />
                    <Label htmlFor="override_image" className="flex-1 cursor-pointer">
                      <div
                        className={`flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-4 transition-colors ${
                          overrideImageError ? 'border-destructive bg-destructive/5' : 'hover:bg-muted/50'
                        }`}
                      >
                        <Upload className={`h-5 w-5 ${overrideImageError ? 'text-destructive' : 'text-muted-foreground'}`} />
                        <span className={`text-sm ${overrideImageError ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                          {overrideImagePreview ? 'Ganti Gambar' : 'Upload Gambar Override (Max 1MB)'}
                        </span>
                      </div>
                    </Label>
                  </div>
                </div>
              </div>

              {/* Nama Produk Override */}
              <div className="space-y-2">
                <Label htmlFor="branch_product_name">Nama Produk Override (Opsional)</Label>
                <Input
                  id="branch_product_name"
                  value={overrideData.branch_product_name}
                  onChange={(e) => setOverrideData({ ...overrideData, branch_product_name: e.target.value })}
                  placeholder="Kosongkan jika tidak ingin override nama"
                />
                <p className="text-xs text-muted-foreground">
                  Nama asli: {selectedProduct?.product_name}
                </p>
              </div>

              {/* Deskripsi Override */}
              <div className="space-y-2">
                <Label htmlFor="branch_description">Deskripsi Cabang (Opsional)</Label>
                <Textarea
                  id="branch_description"
                  value={overrideData.branch_description}
                  onChange={(e) => setOverrideData({ ...overrideData, branch_description: e.target.value })}
                  placeholder="Tambahkan deskripsi khusus untuk cabang"
                  rows={3}
                />
              </div>

              {/* Harga Override */}
              <div className="space-y-2">
                <Label htmlFor="sale_price">Harga Override *</Label>
                <Input
                  id="sale_price"
                  type="text"
                  value={overrideData.sale_price ? `Rp. ${Number(overrideData.sale_price).toLocaleString('id-ID')}` : ''}
                  onChange={handleOverridePriceChange}
                  placeholder="Masukkan harga baru"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Harga asli: {formatRupiah(Number(selectedProduct?.base_price || 0))}
                </p>
              </div>

              {/* Ketersediaan */}
              <div className="space-y-2">
                <Label htmlFor="is_available">Ketersediaan di Cabang</Label>
                <Select
                  value={overrideData.is_available_at_branch.toString()}
                  onValueChange={(value) =>
                    setOverrideData({ ...overrideData, is_available_at_branch: value === 'true' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Tersedia</SelectItem>
                    <SelectItem value="false">Tidak Tersedia (Stok Habis)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseOverrideModal} disabled={isSubmitting}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting || !!overrideImageError}>
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
            <DialogTitle>Arsipkan Produk?</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin mengarsipkan <strong>{selectedProduct?.product_name}</strong>?
              <br />
              Produk akan dinonaktifkan (Soft Delete) dan tidak muncul di menu kasir.
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
              Apakah Anda yakin ingin mengaktifkan kembali produk <strong>{selectedProduct?.product_name}</strong>?
              <br />
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
              <br />
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
