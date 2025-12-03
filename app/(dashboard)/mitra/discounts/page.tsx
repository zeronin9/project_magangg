'use client';

import { useState, useEffect } from 'react';
import { discountAPI, categoryAPI, productAPI, branchAPI } from '@/lib/api/mitra';
import { DiscountRule, Category, Product, Branch } from '@/types/mitra';
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
  Plus, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Percent,
  Building2,
  Globe,
  AlertCircle,
  Loader2,
  Filter,
  Calendar,
  Tag
} from 'lucide-react';

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<DiscountRule[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState<DiscountRule | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scopeFilter, setScopeFilter] = useState<'all' | 'general' | 'local'>('all');
  const [formData, setFormData] = useState({
    discount_name: '',
    discount_type: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED_AMOUNT',
    value: '',
    start_date: '',
    end_date: '',
    applies_to: 'ENTIRE_TRANSACTION' as 'ENTIRE_TRANSACTION' | 'SPECIFIC_CATEGORY' | 'SPECIFIC_PRODUCT',
    target_id: '',
    min_transaction: '',
    max_discount: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [discountsData, categoriesData, productsData, branchesData] = await Promise.all([
        discountAPI.getAll(),
        categoryAPI.getAll(),
        productAPI.getAll(),
        branchAPI.getAll(),
      ]);
      
      const branchesList = Array.isArray(branchesData) ? branchesData : [];
      const discountsList = Array.isArray(discountsData) ? discountsData : [];
      
      const discountsWithBranch = discountsList.map(discount => {
        const branch = discount.branch_id 
          ? branchesList.find(b => b.branch_id === discount.branch_id)
          : null;
        return {
          ...discount,
          branch: branch || null
        };
      });
      
      setDiscounts(discountsWithBranch);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      setProducts(Array.isArray(productsData) ? productsData : []);
      setBranches(branchesList);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data diskon');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (discount?: DiscountRule) => {
    if (discount) {
      setSelectedDiscount(discount);
      setFormData({
        discount_name: discount.discount_name,
        discount_type: discount.discount_type,
        value: discount.value.toString(),
        start_date: discount.start_date.split('T')[0],
        end_date: discount.end_date.split('T')[0],
        applies_to: discount.applies_to,
        target_id: discount.target_id || '',
        min_transaction: discount.min_transaction?.toString() || '',
        max_discount: discount.max_discount?.toString() || '',
      });
    } else {
      setSelectedDiscount(null);
      setFormData({
        discount_name: '',
        discount_type: 'PERCENTAGE',
        value: '',
        start_date: '',
        end_date: '',
        applies_to: 'ENTIRE_TRANSACTION',
        target_id: '',
        min_transaction: '',
        max_discount: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDiscount(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const dataToSend: any = {
        discount_name: formData.discount_name,
        discount_type: formData.discount_type,
        value: parseFloat(formData.value),
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString(),
        applies_to: formData.applies_to,
      };

      if (formData.applies_to !== 'ENTIRE_TRANSACTION' && formData.target_id) {
        dataToSend.target_id = formData.target_id;
      }
      if (formData.min_transaction) {
        dataToSend.min_transaction = parseFloat(formData.min_transaction);
      }
      if (formData.max_discount) {
        dataToSend.max_discount = parseFloat(formData.max_discount);
      }

      if (selectedDiscount) {
        await discountAPI.update(selectedDiscount.discount_rule_id, dataToSend);
      } else {
        await discountAPI.create(dataToSend);
      }
      await loadData();
      handleCloseModal();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menyimpan diskon');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDiscount) return;
    
    setIsSubmitting(true);
    try {
      await discountAPI.softDelete(selectedDiscount.discount_rule_id);
      await loadData();
      setIsDeleteModalOpen(false);
      setSelectedDiscount(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus diskon');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredDiscounts = discounts.filter(disc => {
    if (scopeFilter === 'general') return !disc.branch_id;
    if (scopeFilter === 'local') return !!disc.branch_id;
    return true;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
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

  const generalCount = discounts.filter(d => !d.branch_id).length;
  const localCount = discounts.filter(d => d.branch_id).length;

  return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8 @container">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Diskon</h1>
          <p className="text-muted-foreground">
            Kelola aturan diskon (General & Lokal)
          </p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Diskon
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
          <strong>Hybrid Scope:</strong> Diskon yang Anda buat akan otomatis menjadi{' '}
          <strong>General</strong> (berlaku untuk semua cabang). Total: {generalCount} General, {localCount} Lokal
        </AlertDescription>
      </Alert>

      {/* Filter */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium whitespace-nowrap">Filter Status:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={scopeFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setScopeFilter('all')}
            >
              Semua ({discounts.length})
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
              <TableHead>Nama Diskon</TableHead>
              <TableHead>Tipe</TableHead>
              <TableHead>Nilai</TableHead>
              <TableHead>Periode</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDiscounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <Percent className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">Tidak ada diskon</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredDiscounts.map((discount) => (
                <TableRow key={discount.discount_rule_id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      {discount.discount_name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {discount.discount_type === 'PERCENTAGE' ? 'Persentase' : 'Nominal'}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold">
                    {discount.discount_type === 'PERCENTAGE' 
                      ? `${discount.value}%`
                      : `Rp ${discount.value.toLocaleString('id-ID')}`
                    }
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(discount.start_date)} - {formatDate(discount.end_date)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={discount.branch_id ? 'secondary' : 'default'}>
                      {discount.branch_id ? (
                        <Building2 className="mr-1 h-3 w-3" />
                      ) : (
                        <Globe className="mr-1 h-3 w-3" />
                      )}
                      {discount.branch_id ? 'Lokal' : 'General'}
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
                        <DropdownMenuItem onClick={() => handleOpenModal(discount)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedDiscount(discount);
                            setIsDeleteModalOpen(true);
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Form Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedDiscount ? 'Edit Diskon' : 'Tambah Diskon Baru'}
            </DialogTitle>
            <DialogDescription>
              {selectedDiscount 
                ? 'Perbarui informasi diskon'
                : 'Diskon akan dibuat sebagai General (berlaku untuk semua cabang)'
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                <Label htmlFor="discount_name">Nama Diskon *</Label>
                <Input
                  id="discount_name"
                  value={formData.discount_name}
                  onChange={(e) => setFormData({ ...formData, discount_name: e.target.value })}
                  placeholder="Contoh: Promo Kemerdekaan"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discount_type">Tipe Diskon *</Label>
                  <Select
                    value={formData.discount_type}
                    onValueChange={(value: any) => setFormData({ ...formData, discount_type: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">Persentase (%)</SelectItem>
                      <SelectItem value="FIXED_AMOUNT">Nominal (Rp)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="value">
                    Nilai * {formData.discount_type === 'PERCENTAGE' ? '(%)' : '(Rp)'}
                  </Label>
                  <Input
                    id="value"
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    placeholder={formData.discount_type === 'PERCENTAGE' ? '10' : '5000'}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Tanggal Mulai *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_date">Tanggal Selesai *</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="applies_to">Berlaku Untuk *</Label>
                <Select
                  value={formData.applies_to}
                  onValueChange={(value: any) => setFormData({ ...formData, applies_to: value, target_id: '' })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ENTIRE_TRANSACTION">Seluruh Transaksi</SelectItem>
                    <SelectItem value="SPECIFIC_CATEGORY">Kategori Tertentu</SelectItem>
                    <SelectItem value="SPECIFIC_PRODUCT">Produk Tertentu</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.applies_to === 'SPECIFIC_CATEGORY' && (
                <div className="space-y-2">
                  <Label htmlFor="target_id">Pilih Kategori *</Label>
                  <Select
                    value={formData.target_id}
                    onValueChange={(value) => setFormData({ ...formData, target_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.category_id} value={cat.category_id}>
                          {cat.category_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.applies_to === 'SPECIFIC_PRODUCT' && (
                <div className="space-y-2">
                  <Label htmlFor="target_id">Pilih Produk *</Label>
                  <Select
                    value={formData.target_id}
                    onValueChange={(value) => setFormData({ ...formData, target_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Produk" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((prod) => (
                        <SelectItem key={prod.product_id} value={prod.product_id}>
                          {prod.product_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min_transaction">Min. Transaksi (Opsional)</Label>
                  <Input
                    id="min_transaction"
                    type="number"
                    value={formData.min_transaction}
                    onChange={(e) => setFormData({ ...formData, min_transaction: e.target.value })}
                    placeholder="50000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_discount">Maks. Diskon (Opsional)</Label>
                  <Input
                    id="max_discount"
                    type="number"
                    value={formData.max_discount}
                    onChange={(e) => setFormData({ ...formData, max_discount: e.target.value })}
                    placeholder="10000"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseModal}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selectedDiscount ? 'Update' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Diskon?</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus diskon <strong>{selectedDiscount?.discount_name}</strong>?
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
