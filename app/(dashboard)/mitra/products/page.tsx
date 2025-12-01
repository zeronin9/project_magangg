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
  Image as ImageIcon
} from 'lucide-react';
import Image from 'next/image';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scopeFilter, setScopeFilter] = useState<'all' | 'general' | 'local'>('all');
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
      
      // Map products dengan branch & category data
      const productsWithRelations = productsList.map(product => {
        const branch = product.branch_id 
          ? branchesList.find(b => b.branch_id === product.branch_id)
          : null;
        const category = categoriesList.find(c => c.category_id === product.category_id);
        return {
          ...product,
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
      setImagePreview(product.product_image_url || '');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
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

  const handleDelete = async () => {
    if (!selectedProduct) return;
    
    setIsSubmitting(true);
    try {
      await productAPI.softDelete(selectedProduct.product_id);
      await loadData();
      setIsDeleteModalOpen(false);
      setSelectedProduct(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus produk');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = products.filter(prod => {
    if (scopeFilter === 'general') return !prod.branch_id;
    if (scopeFilter === 'local') return !!prod.branch_id;
    return true;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
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

  const generalCount = products.filter(p => !p.branch_id).length;
  const localCount = products.filter(p => p.branch_id).length;

  return (
    <div className="space-y-6">
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
        <div className="flex items-center gap-4">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filter Scope:</span>
          <div className="flex gap-2">
            <Button
              variant={scopeFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setScopeFilter('all')}
            >
              Semua ({products.length})
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredProducts.length === 0 ? (
          <Card className="col-span-full p-12">
            <div className="text-center">
              <Package className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Tidak ada produk</p>
            </div>
          </Card>
        ) : (
          filteredProducts.map((product) => (
            <Card key={product.product_id} className="overflow-hidden">
              {/* Product Image */}
              <div className="aspect-square bg-muted relative">
                {product.product_image_url ? (
                  <Image
                    src={product.product_image_url}
                    alt={product.product_name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <ImageIcon className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold line-clamp-2">{product.product_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {product.category?.category_name || 'Tanpa Kategori'}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-lg font-bold text-primary">
                    Rp {product.base_price.toLocaleString('id-ID')}
                  </p>
                  <Badge variant={product.branch_id ? 'secondary' : 'default'}>
                    {product.branch_id ? (
                      <Building2 className="mr-1 h-3 w-3" />
                    ) : (
                      <Globe className="mr-1 h-3 w-3" />
                    )}
                    {product.branch_id ? 'Lokal' : 'General'}
                  </Badge>
                </div>

                {product.branch && (
                  <p className="text-xs text-muted-foreground">
                    {product.branch.branch_name}
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleOpenModal(product)}
                  >
                    <Pencil className="mr-2 h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setSelectedProduct(product);
                      setIsDeleteModalOpen(true);
                    }}
                  >
                    <Trash2 className="mr-2 h-3 w-3" />
                    Hapus
                  </Button>
                </div>
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
                    <div className="relative aspect-square w-full rounded-lg overflow-hidden border">
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        fill
                        className="object-cover"
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
                  type="number"
                  value={formData.base_price}
                  onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                  placeholder="18000"
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
              <Button type="button" variant="outline" onClick={handleCloseModal}>
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

      {/* Delete Confirmation */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Produk?</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus produk <strong>{selectedProduct?.product_name}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
