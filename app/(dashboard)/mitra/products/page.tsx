'use client';

import { useState, useEffect } from 'react';
import { productAPI, categoryAPI, branchAPI } from '@/lib/api/mitra';
import { Product, Category, Branch } from '@/types/mitra';
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
  const [products, setProducts] = useState<Product[]>([]);
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
    image_url: null as File | null,  // ✅ PERBAIKAN: Ubah dari product_image ke image_url
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
      const [productsData, categoriesData, branchesData] = await Promise.all([
        productAPI.getAll(showArchived),
        categoryAPI.getAll(),
        branchAPI.getAll(),
      ]);
      
      const branchesList = Array.isArray(branchesData) ? branchesData : [];
      const categoriesList = Array.isArray(categoriesData) ? categoriesData : [];
      const productsList = Array.isArray(productsData) ? productsData : [];
      
      const filteredList = showArchived 
        ? productsList.filter((p: any) => p.is_active === false)
        : productsList.filter((p: any) => p.is_active !== false);

      const productsWithRelations = filteredList.map((product: any) => {
        const branch = product.branch_id 
          ? branchesList.find(b => b.branch_id === product.branch_id)
          : null;
        const category = categoriesList.find(c => c.category_id === product.category_id);
        
        // ✅ PERBAIKAN: Gunakan image_url sesuai response API
        return {
          ...product,
          image_url: product.image_url,  
          branch: branch || null,
          category: category || null
        };
      });
      
      setProducts(productsWithRelations);
      setCategories(categoriesList);
      setBranches(branchesList);
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
        category_id: product.category_id ,
        image_url: null,  // ✅ PERBAIKAN: Ubah dari product_image ke image_url
      });
      // ✅ PERBAIKAN: Gunakan image_url
      setImagePreview(getImageUrl(product.image_url) || '');
    } else {
      setSelectedProduct(null);
      setFormData({
        product_name: '',
        base_price: '',
        category_id: '',
        image_url: null,  // ✅ PERBAIKAN
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
      image_url: null,  // ✅ PERBAIKAN
    });
    setImagePreview('');
    setImageError('');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    // ✅ Validasi MIME type di frontend juga
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

    // ✅ Log untuk debugging
    console.log('File selected:', {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: new Date(file.lastModified)
    });

    setImageError('');
    setFormData({ ...formData, image_url: file });
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }
};

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setFormData({ ...formData, base_price: value });
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
      // ✅ Log file info sebelum kirim
      console.log('Uploading file:', {
        name: formData.image_url.name,
        type: formData.image_url.type,
        size: formData.image_url.size
      });
      
      formDataToSend.append('product_image', formData.image_url);
    }

    if (selectedProduct) {
      await productAPI.update(selectedProduct.product_id, formDataToSend);
    } else {
      await productAPI.create(formDataToSend);
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


  const handleSoftDelete = async () => {
    if (!selectedProduct) return;
    
    setIsSubmitting(true);
    try {
      await delay(3000); 

      await productAPI.softDelete(selectedProduct.product_id);
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
      await delay(3000); 

      // ✅ PERBAIKAN: Untuk restore, kirim JSON (tidak perlu FormData)
      const payload = {
        is_active: true,
        product_name: selectedProduct.product_name,
        base_price: selectedProduct.base_price,
        category_id: selectedProduct.category_id
      };

      await productAPI.update(selectedProduct.product_id, payload);
      
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
      await delay(3000); 

      await productAPI.hardDelete(selectedProduct.product_id);
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

  // 1. Filter Logic
  const filteredProducts = products.filter(prod => {
    if (scopeFilter === 'general') return !prod.branch_id;
    if (scopeFilter === 'local') return !!prod.branch_id;
    return true; 
  });

  const generalCount = products.filter(p => !p.branch_id).length;
  const localCount = products.filter(p => p.branch_id).length;

  // 2. Pagination Logic
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
          <Button onClick={() => handleOpenModal()}>
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
          <strong>General</strong> (berlaku untuk semua cabang). Total: {generalCount} General, {localCount} Lokal
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
            <Card key={product.product_id} className={`overflow-hidden p-0 gap-0 border relative group ${showArchived ? 'opacity-75 bg-muted/40' : ''}`}>
              {/* Product Image */}
              <div className="aspect-[4/3] bg-muted relative">
                {/* ✅ PERBAIKAN: Gunakan image_url */}
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
                          <DropdownMenuItem onClick={() => handleOpenModal(product)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => {
                            setSelectedProduct(product);
                            setIsSoftDeleteOpen(true);
                          }} className="text-orange-600">
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
      {totalPages > 1 && (
        <div className="py-4 flex justify-center">
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

      {/* Form Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
            </DialogTitle>
            <DialogDescription>
              {selectedProduct 
                ? 'Perbarui informasi produk'
                : 'Produk akan dibuat sebagai General (berlaku untuk semua cabang)'
              }
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
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        fill
                        className="object-cover"
                        unoptimized={true}
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    {/* ✅ PERBAIKAN: Ubah id dari product_image ke image_url */}
                    <Input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif"
                      onChange={handleImageChange}
                      className="hidden"
                      id="image_url"
                    />
                    <Label
                      htmlFor="image_url"
                      className="flex-1 cursor-pointer"
                    >
                      <div className={`flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-4 transition-colors ${imageError ? 'border-destructive bg-destructive/5' : 'hover:bg-muted/50'}`}>
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
    {categories.filter((category) => !category.branch_id).length > 0 ? (
      categories
        .filter((category) => !category.branch_id)
        .map((category) => (
          <SelectItem key={category.category_id} value={category.category_id}>
            {category.category_name}
          </SelectItem>
        ))
    ) : (
      <div className="px-2 py-6 text-center text-sm text-muted-foreground">
        Tidak ada kategori general tersedia
      </div>
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
              className="bg-orange-600 hover:bg-orange-700 text-white"
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
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Hapus Permanen?
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus <strong>{selectedProduct?.product_name}</strong> secara permanen?
              <br/>
              <span className="bg-destructive/10 text-destructive p-1 rounded mt-2 block text-xs">
                PERINGATAN: Tindakan ini tidak dapat dibatalkan. Gagal jika produk memiliki riwayat transaksi.
              </span>
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
