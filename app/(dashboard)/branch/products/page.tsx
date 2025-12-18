// app/(dashboard)/branch/products/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { branchProductAPI, branchCategoryAPI, cashierMenuAPI } from '@/lib/api/branch';
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
  CheckCircle2,
} from 'lucide-react';
import Image from 'next/image';
import { formatRupiah } from '@/lib/utils';
import { MetaPagination } from '@/lib/services/fetchData';

// --- Interfaces ---

// Interface dari endpoint /cashier/menu (Tampilan Kasir)
interface MenuProduct {
  product_id: string;
  name: string;
  price: string | number; // Bisa string dari backend, kita convert
  image_url: string | null;
  category: string;
  description?: string;
  is_available: boolean;
  // Field tambahan untuk compatibility
  branch_setting?: any;
  product_name?: string; 
  base_price?: number;
  branch_id?: string;
  is_active?: boolean;
}

// Interface dari endpoint /product (Manajemen)
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
  // Field tambahan untuk compatibility
  name?: string;
  price?: string | number;
  is_available?: boolean;
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

export default function BranchProductsPage() {
  // State Data (Union Type untuk mengakomodasi kedua jenis data)
  const [products, setProducts] = useState<(Product | MenuProduct)[]>([]);
  const [meta, setMeta] = useState<MetaPagination | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // State UI
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter & Pagination States
  const [scopeFilter, setScopeFilter] = useState<'all' | 'general' | 'local' | 'overridden'>('overridden'); // Default ke Override/Menu Kasir
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [isSoftDeleteOpen, setIsSoftDeleteOpen] = useState(false);
  const [isHardDeleteOpen, setIsHardDeleteOpen] = useState(false);
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | MenuProduct | null>(null);

  // Form States
  const [imageError, setImageError] = useState('');
  const [imagePreview, setImagePreview] = useState<string>('');
  const [overrideImagePreview, setOverrideImagePreview] = useState<string>('');
  const [overrideImageError, setOverrideImageError] = useState('');

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

  // --- Helpers (Type Guards & Accessors) ---
  
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
    if (isMenuProduct(product)) return false; // MenuProduct is the result of override
    return !!product.branch_setting?.branch_product_setting_id;
  };

  // --- Effects ---
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await branchCategoryAPI.getAll({ limit: 100 });
        setCategories(res.items);
      } catch (err) {
        console.error("Gagal load kategori", err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, scopeFilter, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [scopeFilter, searchQuery]);

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  // ✅ LOGIKA LOAD DATA (Switch Endpoint)
  const loadData = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      let response;

      if (scopeFilter === 'overridden') {
        // ✅ FETCH DARI /cashier/menu
        // Asumsi backend support pagination di endpoint ini, atau kita kirim paramsnya
        // Jika API wrapper cashierMenuAPI belum update, gunakan axios langsung atau update wrapper
        // Di sini saya asumsikan structure response sama { items, meta } via fetchData
        // Jika tidak, Anda perlu menyesuaikan di sini.
        // Untuk amannya, kita fetch standard dan handle response.
        
        try {
            // Kita coba pakai fetchData pattern jika wrapper mendukung, 
            // atau panggil API wrapper yang sudah ada
            // Note: cashierMenuAPI.getMenu biasanya return axios response
            const res = await cashierMenuAPI.getMenu(); 
            
            // Handle jika backend return { meta, data } atau array langsung
            const data = res.data.data || res.data;
            const metaData = res.data.meta || null;

            // Client side filter/search if backend doesn't support params yet for menu
            let filtered = Array.isArray(data) ? data : [];
            if (searchQuery) {
               filtered = filtered.filter((p: any) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
            }

            // Pagination manual jika meta null (fallback)
            if (!metaData) {
               const start = (currentPage - 1) * 10;
               const end = start + 10;
               setProducts(filtered.slice(start, end));
               setMeta({
                 current_page: currentPage,
                 limit: 10,
                 total_items: filtered.length,
                 total_pages: Math.ceil(filtered.length / 10),
                 has_next_page: end < filtered.length,
                 has_prev_page: start > 0
               });
            } else {
               setProducts(data);
               setMeta(metaData);
            }
        } catch (e) {
            throw e;
        }

      } else {
        // ✅ FETCH DARI /product (Management)
        let typeParam: string | undefined = undefined;
        if (scopeFilter === 'local') typeParam = 'local';
        if (scopeFilter === 'general') typeParam = 'general';

        response = await branchProductAPI.getAll({
          page: currentPage,
          limit: 10,
          search: searchQuery,
          type: typeParam
        });
        
        setProducts(response.items);
        setMeta(response.meta);
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal memuat data produk');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Modal Handlers ---
  const handleOpenModal = (product?: Product | MenuProduct) => {
    setImageError('');
    if (product && !isMenuProduct(product)) {
      setSelectedProduct(product);
      setFormData({
        product_name: product.product_name || '',
        base_price: product.base_price?.toString() || '',
        category_id: product.category_id || '',
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
    setImagePreview('');
    setImageError('');
  };

  const handleOpenOverrideModal = (product: Product | MenuProduct) => {
    setSelectedProduct(product);
    
    // Logic untuk mengisi form override tergantung sumber data
    let price = '';
    let name = '';
    let description = '';
    let isAvailable = true;
    let imgUrl = '';

    if (isMenuProduct(product)) {
        price = product.price.toString();
        name = product.name;
        description = product.description || '';
        isAvailable = product.is_available;
        imgUrl = product.image_url || '';
    } else {
        const setting = product.branch_setting;
        price = setting?.sale_price?.toString() || product.base_price.toString();
        name = setting?.branch_product_name || product.product_name;
        description = setting?.branch_description || product.description || '';
        isAvailable = setting?.is_available_at_branch ?? true;
        imgUrl = setting?.branch_image_url || product.image_url || '';
    }

    setOverrideData({
      sale_price: price,
      branch_product_name: name,
      branch_description: description,
      is_available_at_branch: isAvailable,
      branch_product_image: null,
    });
    
    setOverrideImagePreview(getImageUrl(imgUrl));
    setOverrideImageError('');
    setIsOverrideModalOpen(true);
  };

  const handleCloseOverrideModal = () => {
    setIsOverrideModalOpen(false);
    setSelectedProduct(null);
    setOverrideImagePreview('');
    setOverrideImageError('');
  };

  // --- Form Handlers ---
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        setImageError('Ukuran gambar terlalu besar! Maksimal 1MB.');
        return;
      }
      setImageError('');
      setFormData({ ...formData, image_url: file });
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleOverrideImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        setOverrideImageError('Ukuran gambar terlalu besar! Maksimal 1MB.');
        return;
      }
      setOverrideImageError('');
      setOverrideData({ ...overrideData, branch_product_image: file });
      const reader = new FileReader();
      reader.onloadend = () => setOverrideImagePreview(reader.result as string);
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

  // --- Submit Handlers ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (imageError || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await delay(2000);
      const formDataToSend = new FormData();
      formDataToSend.append('product_name', formData.product_name);
      formDataToSend.append('base_price', formData.base_price.replace(/[^0-9]/g, ''));
      formDataToSend.append('category_id', formData.category_id);
      if (formData.image_url) formDataToSend.append('product_image', formData.image_url);

      if (selectedProduct && !isMenuProduct(selectedProduct)) {
        await branchProductAPI.update(selectedProduct.product_id, formDataToSend);
      } else {
        await branchProductAPI.create(formDataToSend);
      }
      await loadData();
      handleCloseModal();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menyimpan produk');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || overrideImageError || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await delay(2000);
      const formDataToSend = new FormData();
      formDataToSend.append('sale_price', overrideData.sale_price.replace(/[^0-9]/g, ''));
      formDataToSend.append('is_available_at_branch', overrideData.is_available_at_branch.toString());
      
      if (overrideData.branch_product_name) formDataToSend.append('branch_product_name', overrideData.branch_product_name);
      if (overrideData.branch_description) formDataToSend.append('branch_description', overrideData.branch_description);
      if (overrideData.branch_product_image) formDataToSend.append('branch_product_image', overrideData.branch_product_image);

      await branchProductAPI.setOverride(selectedProduct.product_id, formDataToSend);
      await loadData();
      handleCloseOverrideModal();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menyimpan override produk');
    } finally {
      setIsSubmitting(false);
    }
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

  const handlePageChange = (page: number) => {
    if (meta && page > 0 && page <= meta.total_pages) {
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
            
            {/* Tombol Override / Menu Kasir */}
            <Button
              variant={scopeFilter === 'overridden' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setScopeFilter('overridden')}
              className={scopeFilter === 'overridden' ? 'bg-black text-white shadow-lg' : ''}
            >
              <Settings className="mr-2 h-3 w-3" />
              Menu Kasir {scopeFilter === 'overridden' && meta && `(${meta.total_items})`}
            </Button>

            <Button
              variant={scopeFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setScopeFilter('all')}
            >
              Semua {scopeFilter === 'all' && meta && `(${meta.total_items})`}
            </Button>

            <Button
              variant={scopeFilter === 'general' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setScopeFilter('general')}
            >
              <Globe className="mr-2 h-3 w-3" />
              General {scopeFilter === 'general' && meta && `(${meta.total_items})`}
            </Button>
            <Button
              variant={scopeFilter === 'local' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setScopeFilter('local')}
            >
              <Building2 className="mr-2 h-3 w-3" />
              Lokal {scopeFilter === 'local' && meta && `(${meta.total_items})`}
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
                {searchQuery ? 'Tidak ada hasil pencarian' : 'Tidak ada produk'}
              </p>
            </div>
          </Card>
        ) : (
          products.map((product) => {
            // Check status aktif
            const isActive = isMenuProduct(product) 
               ? product.is_available 
               : (product.is_active !== false && (!product.branch_setting || product.branch_setting.is_available_at_branch));
            
            // Logic visual: jika showArchived true, tampilkan yang TIDAK aktif.
            // jika showArchived false, tampilkan yang AKTIF.
            if (showArchived && isActive) return null;
            if (!showArchived && !isActive) return null;

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

                {/* Overlay Image Fallback */}
                {getDisplayImage(product) && (
                   <div className="hidden flex items-center justify-center h-full absolute inset-0 bg-muted -z-10">
                     <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
                   </div>
                )}

                {/* ✅ Badge Menu Kasir */}
                {isMenuProduct(product) && !showArchived && (
                  <div className="absolute top-2 left-2 z-10">
                    <Badge variant="default" className="bg-black text-white text-[10px] px-2 py-0.5">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Menu Kasir
                    </Badge>
                  </div>
                )}

                {/* ✅ Badge Override (hanya muncul di tab manajemen jika produk ter-override) */}
                {!isMenuProduct(product) && isOverridden(product) && !showArchived && (
                  <div className="absolute top-2 left-2 z-10">
                    <Badge variant="default" className="bg-black text-white text-[10px] px-2 py-0.5">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Override
                    </Badge>
                  </div>
                )}

                {/* Archived Badge */}
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

                      {!showArchived ? (
                        <>
                          {!isMenuProduct(product) && product.branch_id ? (
                            <DropdownMenuItem onClick={() => handleOpenModal(product)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleOpenOverrideModal(product)}>
                              <Settings className="mr-2 h-4 w-4" />
                              {isOverridden(product) ? 'Edit Override' : 'Override Setting'}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {/* Hanya produk lokal yang bisa delete */}
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
                    {/* Tampilkan harga coret jika di override */}
                    {!isMenuProduct(product) && isOverridden(product) && product.branch_setting && product.branch_setting.sale_price !== product.base_price && (
                       <p className="text-xs text-muted-foreground line-through">
                         {formatRupiah(product.base_price)}
                       </p>
                    )}
                  </div>
                  {/* Badge Tipe */}
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
      {meta && meta.total_pages > 1 && (
        <div className="py-4 flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }}
                  className={!meta.has_prev_page ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
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
                  onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }}
                  className={!meta.has_next_page ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* --- MODALS (Create, Override, Delete, Restore) --- */}
      
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
              <div className="space-y-2">
                <Label>Gambar Produk</Label>
                {imageError && (
                  <Alert variant="destructive" className="mb-2 py-2">
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
                      <div className="flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-4 hover:bg-muted/50">
                        <Upload className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
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
                  onChange={(e) => setFormData({ ...formData, base_price: e.target.value.replace(/[^0-9]/g, '') })}
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
                    {categories.filter(cat => cat.branch_id).length > 0 ? (
                      categories.filter(cat => cat.branch_id).map((category) => (
                        <SelectItem key={category.category_id} value={category.category_id}>
                          {category.category_name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                        Belum ada kategori lokal.
                      </div>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Hanya kategori lokal yang dapat dipilih</p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseModal} disabled={isSubmitting}>Batal</Button>
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
              Ubah harga, nama, atau ketersediaan untuk cabang ini.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleOverrideSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Gambar Override (Opsional)</Label>
                {overrideImageError && (
                  <Alert variant="destructive" className="mb-2"><AlertDescription>{overrideImageError}</AlertDescription></Alert>
                )}
                <div className="flex flex-col gap-4">
                  {overrideImagePreview && (
                    <div className="relative aspect-video w-full rounded-lg overflow-hidden border">
                      <Image src={overrideImagePreview} alt="Preview" fill className="object-cover" unoptimized={true} />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Input type="file" accept="image/*" onChange={handleOverrideImageChange} className="hidden" id="override_image" />
                    <Label htmlFor="override_image" className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-4 hover:bg-muted/50">
                        <Upload className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Upload Gambar Override</span>
                      </div>
                    </Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Harga Override *</Label>
                <Input
                  value={overrideData.sale_price ? `Rp. ${Number(overrideData.sale_price).toLocaleString('id-ID')}` : ''}
                  onChange={(e) => setOverrideData({...overrideData, sale_price: e.target.value.replace(/[^0-9]/g, '')})}
                  placeholder="Harga baru cabang"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Status Ketersediaan</Label>
                <Select
                  value={overrideData.is_available_at_branch.toString()}
                  onValueChange={(val) => setOverrideData({...overrideData, is_available_at_branch: val === 'true'})}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Tersedia</SelectItem>
                    <SelectItem value="false">Tidak Tersedia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="branch_product_name">Nama Produk Override (Opsional)</Label>
                <Input
                  id="branch_product_name"
                  value={overrideData.branch_product_name || ''}
                  onChange={(e) => setOverrideData({ ...overrideData, branch_product_name: e.target.value })}
                  placeholder="Kosongkan jika tidak ingin override nama"
                />
                <p className="text-xs text-muted-foreground">
                  Nama asli: {getDisplayName(selectedProduct)}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="branch_description">Deskripsi Cabang (Opsional)</Label>
                <Textarea
                  id="branch_description"
                  value={overrideData.branch_description || ''}
                  onChange={(e) => setOverrideData({ ...overrideData, branch_description: e.target.value })}
                  placeholder="Tambahkan deskripsi khusus untuk cabang"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseOverrideModal} disabled={isSubmitting}>Batal</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan Override
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Soft Delete & Restore & Hard Delete Modals (Standard) */}
      <Dialog open={isSoftDeleteOpen} onOpenChange={setIsSoftDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Arsipkan Produk?</DialogTitle>
            <DialogDescription>Produk <strong>{getDisplayName(selectedProduct)}</strong> akan dinonaktifkan.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSoftDeleteOpen(false)}>Batal</Button>
            <Button onClick={handleSoftDelete} disabled={isSubmitting}>Arsipkan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isRestoreOpen} onOpenChange={setIsRestoreOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aktifkan Kembali?</DialogTitle>
            <DialogDescription>Produk <strong>{getDisplayName(selectedProduct)}</strong> akan diaktifkan kembali.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRestoreOpen(false)}>Batal</Button>
            <Button onClick={handleRestore} disabled={isSubmitting}>Aktifkan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isHardDeleteOpen} onOpenChange={setIsHardDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Permanen?</DialogTitle>
            <DialogDescription>Tindakan ini tidak dapat dibatalkan.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHardDeleteOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleHardDelete} disabled={isSubmitting}>Hapus Permanen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}