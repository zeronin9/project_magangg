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
import { CustomAlertDialog } from '@/components/ui/custom-alert-dialog';
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

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSoftDeleteOpen, setIsSoftDeleteOpen] = useState(false);
  const [isHardDeleteOpen, setIsHardDeleteOpen] = useState(false);
  const [isRestoreOpen, setIsRestoreOpen] = useState(false); // ✅ Restore Modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // ✅ Filter State: 'archived' added
  const [scopeFilter, setScopeFilter] = useState<'all' | 'general' | 'local' | 'archived'>('all');
  
  const [imagePreview, setImagePreview] = useState<string>('');
  const [formData, setFormData] = useState({
    product_name: '',
    base_price: '',
    category_id: '',
    product_image: null as File | null,
  });

  useEffect(() => {
    loadData();
  }, []);

  // Helper Delay 3 Detik
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [productsData, categoriesData, branchesData] = await Promise.all([
        productAPI.getAll(), 
        categoryAPI.getAll(),
        branchAPI.getAll(),
      ]);
      
      const branchesList = Array.isArray(branchesData) ? branchesData : [];
      const categoriesList = Array.isArray(categoriesData) ? categoriesData : [];
      const productsList = Array.isArray(productsData) ? productsData : [];
      
      const productsWithRelations = productsList.map((product: any) => {
        const branch = product.branch_id 
          ? branchesList.find(b => b.branch_id === product.branch_id)
          : null;
        const category = categoriesList.find(c => c.category_id === product.category_id);
        
        return {
          ...product,
          product_image_url: product.image_url || product.product_image_url || null,
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
    if (product) {
      setSelectedProduct(product);
      setFormData({
        product_name: product.product_name,
        base_price: product.base_price.toString(),
        category_id: product.category_id,
        product_image: null,
      });
      setImagePreview(getImageUrl(product.product_image_url) || '');
    } else {
      setSelectedProduct(null);
      setFormData({
        product_name: '',
        base_price: '',
        category_id: '',
        product_image: null,
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
      product_image: null,
    });
    setImagePreview('');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, product_image: file });
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
    setIsSubmitting(true);

    try {
      await delay(3000); // ✅ Delay

      const formDataToSend = new FormData();
      formDataToSend.append('product_name', formData.product_name);
      formDataToSend.append('base_price', formData.base_price);
      formDataToSend.append('category_id', formData.category_id);
      
      if (formData.product_image) {
        formDataToSend.append('product_image', formData.product_image);
      }

      if (selectedProduct) {
        await productAPI.update(selectedProduct.product_id, formDataToSend);
      } else {
        await productAPI.create(formDataToSend);
      }
      await loadData();
      handleCloseModal();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menyimpan produk');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSoftDelete = async () => {
    if (!selectedProduct) return;
    
    setIsSubmitting(true);
    try {
      await delay(3000); // ✅ Delay

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

  // ✅ HANDLER BARU: Restore Produk
  const handleRestore = async () => {
    if (!selectedProduct) return;
    
    setIsSubmitting(true);
    try {
      await delay(3000); // ✅ Delay

      // Menggunakan endpoint update untuk set is_active: true
      // Kita kirim FormData karena endpoint update mengharapkan multipart/form-data
      const formDataToSend = new FormData();
      formDataToSend.append('is_active', 'true');
      // Kirim data wajib lain jika diperlukan oleh backend, biasanya partial update cukup
      formDataToSend.append('product_name', selectedProduct.product_name);
      formDataToSend.append('base_price', String(selectedProduct.base_price));
      formDataToSend.append('category_id', selectedProduct.category_id);

      await productAPI.update(selectedProduct.product_id, formDataToSend);
      
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
      await delay(3000); // ✅ Delay

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

  const filteredProducts = products.filter(prod => {
    // 1. Filter Arsip
    if (scopeFilter === 'archived') return !prod.is_active;
    
    // 2. Filter Aktif (Default) - Hanya tampilkan yang aktif jika bukan mode arsip
    if (!prod.is_active) return false; 

    // 3. Filter Scope (General/Lokal)
    if (scopeFilter === 'general') return !prod.branch_id;
    if (scopeFilter === 'local') return !!prod.branch_id;
    
    return true; // scopeFilter === 'all'
  });

  const generalCount = products.filter(p => !p.branch_id && p.is_active).length;
  const localCount = products.filter(p => p.branch_id && p.is_active).length;
  const archivedCount = products.filter(p => !p.is_active).length;

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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Produk</h1>
          <p className="text-muted-foreground">
            Kelola produk (General & Lokal)
          </p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Produk
        </Button>
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
            {/* ✅ Tombol Arsip */}
            <Button
              variant={scopeFilter === 'archived' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setScopeFilter('archived')}
              className={scopeFilter === 'archived' ? "bg-orange-600 hover:bg-orange-700 text-white" : "text-orange-600 border-orange-200 hover:bg-orange-50"}
            >
              <Archive className="mr-2 h-3 w-3" />
              Arsip ({archivedCount})
            </Button>
          </div>
        </div>
      </Card>

      {/* Products Grid */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {filteredProducts.length === 0 ? (
          <Card className="col-span-full p-12">
            <div className="text-center">
              <Package className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                {scopeFilter === 'archived' ? 'Tidak ada produk di arsip' : 'Tidak ada produk'}
              </p>
            </div>
          </Card>
        ) : (
          filteredProducts.map((product) => (
            <Card key={product.product_id} className={`overflow-hidden p-0 gap-0 border relative group ${!product.is_active ? 'opacity-75 bg-muted/40' : ''}`}>
              {/* Product Image */}
              <div className="aspect-[4/3] bg-muted relative">
                {product.product_image_url ? (
                  <Image
                    src={getImageUrl(product.product_image_url)}
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
                
                {product.product_image_url && (
                   <div className="hidden flex items-center justify-center h-full absolute inset-0 bg-muted -z-10">
                      <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
                   </div>
                )}

                {/* Status Badge */}
                {!product.is_active && (
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
                      
                      {/* Kondisi Menu: Jika Aktif vs Jika Arsip */}
                      {product.is_active ? (
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
                    {product.branch_id ? 'Lokal' : <Globe className="h-3 w-3" />}
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
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="product_image"
                    />
                    <Label
                      htmlFor="product_image"
                      className="flex-1 cursor-pointer"
                    >
                      <div className="flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <Upload className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {imagePreview ? 'Ganti Gambar' : 'Upload Gambar'}
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
                  placeholder="Contoh: Kopi Susu Gula Aren"
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
                    {categories.map((category) => (
                      <SelectItem key={category.category_id} value={category.category_id}>
                        {category.category_name}
                        {category.branch_id ? ' (Lokal)' : ' (General)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseModal} disabled={isSubmitting}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
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