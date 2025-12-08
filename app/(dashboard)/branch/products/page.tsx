'use client';

import { useState, useEffect } from 'react';
import { branchPageAPI } from '@/lib/api/branch';
import { categoryAPI } from '@/lib/api/mitra'; // Reuse API kategori
import { Product, Category } from '@/types';
import { formatRupiah } from '@/lib/utils';
import { 
  Plus, Search, Edit2, Trash2, Settings2, Globe, Building2, 
  Image as ImageIcon, MoreHorizontal, AlertTriangle, CheckCircle 
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CustomAlertDialog } from "@/components/ui/custom-alert-dialog";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton"; // Bisa ganti dengan skeleton card jika ada
import Image from 'next/image';

// Helper URL Gambar
const getImageUrl = (path: string | null | undefined) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';
  const serverUrl = apiBaseUrl.replace(/\/api\/?$/, '');
  const cleanPath = path.replace(/\\/g, '/').replace(/^\//, '');
  return `${serverUrl}/${cleanPath}`;
};

export default function BranchProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'local' | 'general'>('all');

  // Modal States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isOverrideOpen, setIsOverrideOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Forms
  const [formData, setFormData] = useState({
    product_name: '', 
    base_price: '', 
    category_id: '', 
    product_image: null as File | null
  });
  
  const [imagePreview, setImagePreview] = useState<string>('');

  const [overrideForm, setOverrideForm] = useState({
    sale_price: '', 
    is_available: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [prodData, catData] = await Promise.all([
        branchPageAPI.getProducts(), // Mengambil semua (General + Lokal)
        categoryAPI.getAll()
      ]);
      setProducts(Array.isArray(prodData) ? prodData : []);
      setCategories(Array.isArray(catData) ? catData : []);
    } catch (e) { 
      console.error(e); 
    } finally { 
      setIsLoading(false); 
    }
  };

  // --- Handlers Produk Lokal ---

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, product_image: file });
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAddLocal = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData();
    data.append('product_name', formData.product_name);
    data.append('base_price', formData.base_price);
    data.append('category_id', formData.category_id);
    if (formData.product_image) data.append('product_image', formData.product_image);

    try {
      await branchPageAPI.createLocalProduct(data);
      alert('Menu lokal berhasil dibuat!');
      setIsAddOpen(false);
      resetForm();
      loadData();
    } catch (err: any) { alert(err.message || 'Gagal tambah produk'); }
  };

  const handleEditLocal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    const data = new FormData();
    data.append('product_name', formData.product_name);
    data.append('base_price', formData.base_price);
    data.append('category_id', formData.category_id);
    if (formData.product_image) data.append('product_image', formData.product_image);

    try {
      await branchPageAPI.updateLocalProduct(selectedProduct.product_id, data);
      alert('Menu lokal diperbarui!');
      setIsEditOpen(false);
      resetForm();
      loadData();
    } catch (err: any) { alert(err.message || 'Gagal update produk'); }
  };

  const handleDeleteLocal = async () => {
    if (!selectedProduct) return;
    try {
      await branchPageAPI.deleteLocalProduct(selectedProduct.product_id);
      alert('Menu lokal dihapus!');
      setIsDeleteOpen(false);
      loadData();
    } catch (err: any) { alert(err.message || 'Gagal hapus produk'); }
  };

  // --- Handlers Override General ---

  const handleOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    try {
      await branchPageAPI.overrideProduct(selectedProduct.product_id, {
        sale_price: overrideForm.sale_price ? Number(overrideForm.sale_price) : undefined,
        is_available_at_branch: overrideForm.is_available
      });
      alert('Pengaturan produk diperbarui!');
      setIsOverrideOpen(false);
      // Refresh data jika backend mengembalikan data yang sudah di-merge
      loadData();
    } catch (err: any) { alert(err.message || 'Gagal update setting'); }
  };

  // --- Helper Functions ---

  const openAdd = () => {
    resetForm();
    setIsAddOpen(true);
  };

  const openEdit = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      product_name: product.product_name,
      base_price: String(product.base_price),
      category_id: product.category?.category_id || '',
      product_image: null
    });
    setImagePreview(getImageUrl(product.image_url));
    setIsEditOpen(true);
  };

  const openOverride = (product: Product) => {
    setSelectedProduct(product);
    setOverrideForm({
      // Jika sudah ada harga override, gunakan itu (perlu disesuaikan dengan response API)
      // Asumsi: product.base_price adalah harga dasar, mungkin ada field 'sale_price' jika sudah di-override
      sale_price: String(product.base_price), 
      is_available: true // Default true, ambil dari data jika ada
    });
    setIsOverrideOpen(true);
  };

  const resetForm = () => {
    setFormData({ product_name: '', base_price: '', category_id: '', product_image: null });
    setImagePreview('');
    setSelectedProduct(null);
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.product_name.toLowerCase().includes(searchTerm.toLowerCase());
    const isLocal = !!p.branch_id;
    if (filterType === 'local') return matchesSearch && isLocal;
    if (filterType === 'general') return matchesSearch && !isLocal;
    return matchesSearch;
  });

  if (isLoading) return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8 @container">
      <div className="flex justify-between">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-10 w-32 bg-muted rounded animate-pulse" />
      </div>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3 lg:grid-cols-4">
        {[1,2,3,4].map(i => <div key={i} className="h-64 bg-muted rounded animate-pulse" />)}
      </div>
    </div>
  );

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8 @container">
      <div className="flex flex-col gap-4 @md:flex-row @md:items-center @md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Produk & Menu</h2>
          <p className="text-muted-foreground">Kelola menu lokal dan atur ketersediaan menu pusat</p>
        </div>
        <Button onClick={openAdd}><Plus className="mr-2 h-4 w-4"/> Menu Lokal Baru</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 @md:flex-row @md:items-center @md:justify-between">
            <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
              <Button 
                variant={filterType === 'all' ? 'default' : 'ghost'} 
                size="sm" 
                onClick={() => setFilterType('all')}
                className="h-8"
              >
                Semua
              </Button>
              <Button 
                variant={filterType === 'general' ? 'default' : 'ghost'} 
                size="sm" 
                onClick={() => setFilterType('general')}
                className="h-8 gap-2"
              >
                <Globe className="h-3 w-3"/> General
              </Button>
              <Button 
                variant={filterType === 'local' ? 'default' : 'ghost'} 
                size="sm" 
                onClick={() => setFilterType('local')}
                className="h-8 gap-2"
              >
                <Building2 className="h-3 w-3"/> Lokal
              </Button>
            </div>
            <div className="relative w-full @md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Cari produk..." 
                className="pl-8" 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">Tidak ada produk ditemukan.</div>
          ) : (
            <div className="grid gap-4 grid-cols-1 @sm:grid-cols-2 @lg:grid-cols-3 @xl:grid-cols-4">
              {filteredProducts.map(product => {
                const isLocal = !!product.branch_id;
                return (
                  <Card key={product.product_id} className="overflow-hidden flex flex-col group hover:shadow-md transition-all">
                    <div className="aspect-[4/3] bg-muted relative">
                      {product.image_url ? (
                        <Image 
                          src={getImageUrl(product.image_url)} 
                          alt={product.product_name} 
                          fill 
                          className="object-cover" 
                          unoptimized 
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <ImageIcon className="h-10 w-10 text-muted-foreground/50"/>
                        </div>
                      )}
                      <div className="absolute top-2 right-2 flex gap-1">
                        <Badge variant={isLocal ? 'secondary' : 'default'} className="shadow-sm">
                          {isLocal ? 'Lokal' : 'General'}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="p-4 flex-1 flex flex-col gap-2">
                      <div>
                        <div className="flex justify-between items-start">
                          <h3 className="font-semibold line-clamp-1" title={product.product_name}>{product.product_name}</h3>
                          {/* Menu Aksi */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 -mt-1 text-muted-foreground">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {isLocal ? (
                                <>
                                  <DropdownMenuItem onClick={() => openEdit(product)}>
                                    <Edit2 className="h-3 w-3 mr-2"/> Edit Detail
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => { setSelectedProduct(product); setIsDeleteOpen(true); }} className="text-destructive">
                                    <Trash2 className="h-3 w-3 mr-2"/> Hapus
                                  </DropdownMenuItem>
                                </>
                              ) : (
                                <DropdownMenuItem onClick={() => openOverride(product)}>
                                  <Settings2 className="h-3 w-3 mr-2"/> Atur Harga/Stok
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <p className="text-xs text-muted-foreground">{product.category?.category_name || 'Tanpa Kategori'}</p>
                      </div>

                      <div className="mt-auto pt-2 flex items-end justify-between border-t">
                        <div>
                          <p className="text-xs text-muted-foreground">Harga Jual</p>
                          <p className="font-bold text-primary text-lg">{formatRupiah(product.base_price)}</p>
                        </div>
                      </div>
                      
                      {!isLocal && (
                        <Button variant="secondary" size="sm" className="w-full mt-2" onClick={() => openOverride(product)}>
                          <Settings2 className="h-3 w-3 mr-2"/> Atur Cabang
                        </Button>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Local Product Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleAddLocal}>
            <DialogHeader><DialogTitle>Tambah Menu Lokal</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Image Upload */}
              <div className="flex flex-col gap-3 justify-center items-center border-2 border-dashed rounded-lg p-6 hover:bg-muted/50 transition cursor-pointer relative">
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageChange} accept="image/*" />
                {imagePreview ? (
                  <div className="relative w-full h-40">
                    <Image src={imagePreview} alt="Preview" fill className="object-contain" />
                  </div>
                ) : (
                  <>
                    <ImageIcon className="h-10 w-10 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Klik untuk upload gambar</span>
                  </>
                )}
              </div>

              <div className="grid gap-2"><Label>Nama Produk</Label><Input required value={formData.product_name} onChange={e => setFormData({...formData, product_name: e.target.value})} placeholder="Contoh: Paket Hemat" /></div>
              <div className="grid gap-2"><Label>Harga Dasar</Label><Input type="number" required value={formData.base_price} onChange={e => setFormData({...formData, base_price: e.target.value})} placeholder="15000" /></div>
              <div className="grid gap-2"><Label>Kategori</Label>
                <Select onValueChange={v => setFormData({...formData, category_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Pilih Kategori"/></SelectTrigger>
                  <SelectContent>{categories.map(c => <SelectItem key={c.category_id} value={c.category_id}>{c.category_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Batal</Button></DialogClose>
              <Button type="submit">Simpan Produk</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Local Product Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleEditLocal}>
            <DialogHeader><DialogTitle>Edit Menu Lokal</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex flex-col gap-3 justify-center items-center border-2 border-dashed rounded-lg p-6 relative">
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageChange} accept="image/*" />
                {imagePreview ? (
                  <div className="relative w-full h-40">
                    <Image src={imagePreview} alt="Preview" fill className="object-contain" />
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <ImageIcon className="h-10 w-10 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Ganti gambar</span>
                  </div>
                )}
              </div>
              <div className="grid gap-2"><Label>Nama Produk</Label><Input required value={formData.product_name} onChange={e => setFormData({...formData, product_name: e.target.value})} /></div>
              <div className="grid gap-2"><Label>Harga</Label><Input type="number" required value={formData.base_price} onChange={e => setFormData({...formData, base_price: e.target.value})} /></div>
              <div className="grid gap-2"><Label>Kategori</Label>
                <Select value={formData.category_id} onValueChange={v => setFormData({...formData, category_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Pilih Kategori"/></SelectTrigger>
                  <SelectContent>{categories.map(c => <SelectItem key={c.category_id} value={c.category_id}>{c.category_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Update Produk</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Override General Product Modal */}
      <Dialog open={isOverrideOpen} onOpenChange={setIsOverrideOpen}>
        <DialogContent>
          <form onSubmit={handleOverride}>
            <DialogHeader>
              <DialogTitle>Atur Menu Pusat</DialogTitle>
            </DialogHeader>
            <div className="bg-muted/50 p-4 rounded-lg flex gap-4 items-center mb-4">
              <div className="h-16 w-16 bg-background rounded border relative overflow-hidden flex-shrink-0">
                {selectedProduct?.image_url && <Image src={getImageUrl(selectedProduct.image_url)} alt="" fill className="object-cover" />}
              </div>
              <div>
                <h4 className="font-semibold">{selectedProduct?.product_name}</h4>
                <p className="text-sm text-muted-foreground">Harga Pusat: {selectedProduct && formatRupiah(selectedProduct.base_price)}</p>
              </div>
            </div>

            <div className="grid gap-4 py-2">
              <div className="flex items-center justify-between border p-4 rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="stock-switch" className="text-base">Tersedia di Cabang?</Label>
                  <p className="text-xs text-muted-foreground">Matikan jika stok habis di cabang ini</p>
                </div>
                <Switch id="stock-switch" checked={overrideForm.is_available} onCheckedChange={c => setOverrideForm({...overrideForm, is_available: c})} />
              </div>
              
              <div className="grid gap-2">
                <Label>Harga Jual Khusus Cabang (Opsional)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">Rp</span>
                  <Input 
                    type="number" 
                    className="pl-9"
                    value={overrideForm.sale_price} 
                    onChange={e => setOverrideForm({...overrideForm, sale_price: e.target.value})} 
                    placeholder={selectedProduct ? String(selectedProduct.base_price) : ''}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Biarkan kosong untuk mengikuti harga pusat.</p>
              </div>
            </div>
            <DialogFooter><Button type="submit">Simpan Pengaturan</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <CustomAlertDialog 
        open={isDeleteOpen} 
        onOpenChange={setIsDeleteOpen} 
        title="Hapus Menu Lokal?" 
        description={`Apakah Anda yakin ingin menghapus "${selectedProduct?.product_name}"?`}
        onConfirm={handleDeleteLocal} 
        confirmText="Hapus" 
        variant="destructive" 
      />
    </div>
  );
}