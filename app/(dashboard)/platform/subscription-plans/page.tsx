'use client';

import { useEffect, useState } from 'react';
import { fetchWithAuth } from '@/lib/api';
import { SubscriptionPlan } from '@/types';
import { Package, Plus, Edit2, Trash2, Calendar, Building2, Smartphone } from 'lucide-react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CardGridSkeleton } from '@/components/skeletons/CardGridSkeleton';

// ✅ Format Rupiah Helper
const formatRupiah = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function SubscriptionPlansPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  
  const [formData, setFormData] = useState({
    plan_name: '',
    description: '',
    price: '',
    duration_months: '',
    max_branches: '',
    max_devices: ''
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setIsLoading(true);
      const data = await fetchWithAuth('/subscription-plan');
      setPlans(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchWithAuth('/subscription-plan', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          duration_months: parseInt(formData.duration_months),
          max_branches: parseInt(formData.max_branches),
          max_devices: parseInt(formData.max_devices)
        }),
      });
      alert('Paket langganan berhasil dibuat!');
      setIsCreateModalOpen(false);
      fetchPlans();
      resetForm();
    } catch (error: any) {
      alert(error.message || 'Gagal membuat paket langganan');
    }
  };

  const handleOpenEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setFormData({
      plan_name: plan.plan_name,
      description: plan.description || '',
      price: plan.price.toString(),
      duration_months: plan.duration_months.toString(),
      max_branches: plan.max_branches.toString(),
      max_devices: plan.max_devices.toString()
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    
    try {
      await fetchWithAuth(`/subscription-plan/${editingPlan.plan_id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          duration_months: parseInt(formData.duration_months),
          max_branches: parseInt(formData.max_branches),
          max_devices: parseInt(formData.max_devices)
        }),
      });
      alert('Paket langganan berhasil diperbarui!');
      setIsEditModalOpen(false);
      fetchPlans();
      resetForm();
    } catch (error: any) {
      alert(error.message || 'Gagal memperbarui paket langganan');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus paket ini?')) return;
    try {
      await fetchWithAuth(`/subscription-plan/${id}`, {
        method: 'DELETE',
      });
      alert('Paket langganan berhasil dihapus!');
      fetchPlans();
    } catch (error: any) {
      alert(error.message || 'Gagal menghapus paket langganan');
    }
  };

  const resetForm = () => {
    setFormData({
      plan_name: '',
      description: '',
      price: '',
      duration_months: '',
      max_branches: '',
      max_devices: ''
    });
    setEditingPlan(null);
  };

  if (isLoading) {
    return <CardGridSkeleton cards={6} />;
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8 @container">
      {/* Header - Responsive */}
      <div className="flex flex-col gap-4 @md:flex-row @md:items-center @md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight @md:text-3xl">Paket Langganan</h2>
          <p className="text-sm text-muted-foreground @md:text-base">
            Kelola paket langganan yang tersedia untuk mitra
          </p>
        </div>
        
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="w-full @md:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden @sm:inline">Buat Paket Baru</span>
              <span className="@sm:hidden">Tambah Paket</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Buat Paket Langganan Baru</DialogTitle>
                <DialogDescription>
                  Tentukan detail paket langganan yang akan ditawarkan
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="plan_name">Nama Paket <span className="text-destructive">*</span></Label>
                  <Input
                    id="plan_name"
                    required
                    value={formData.plan_name}
                    onChange={(e) => setFormData({...formData, plan_name: e.target.value})}
                    placeholder="Contoh: Paket Basic"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Deskripsi</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Deskripsi paket (opsional)"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="price">Harga (Rp) <span className="text-destructive">*</span></Label>
                    <Input
                      id="price"
                      type="number"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      placeholder="500000"
                      min="0"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="duration_months">Durasi (Bulan) <span className="text-destructive">*</span></Label>
                    <Input
                      id="duration_months"
                      type="number"
                      required
                      value={formData.duration_months}
                      onChange={(e) => setFormData({...formData, duration_months: e.target.value})}
                      placeholder="12"
                      min="1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="max_branches">Maks. Cabang <span className="text-destructive">*</span></Label>
                    <Input
                      id="max_branches"
                      type="number"
                      required
                      value={formData.max_branches}
                      onChange={(e) => setFormData({...formData, max_branches: e.target.value})}
                      placeholder="5"
                      min="1"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="max_devices">Maks. Perangkat <span className="text-destructive">*</span></Label>
                    <Input
                      id="max_devices"
                      type="number"
                      required
                      value={formData.max_devices}
                      onChange={(e) => setFormData({...formData, max_devices: e.target.value})}
                      placeholder="10"
                      min="1"
                    />
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" onClick={resetForm}>Batal</Button>
                </DialogClose>
                <Button type="submit">Buat Paket</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Plans Grid - Responsive & Compact */}
      {plans.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">Belum ada paket langganan</h3>
              <p className="text-sm text-muted-foreground">
                Mulai dengan membuat paket langganan pertama
              </p>
              <Button className="mt-4" onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Buat Paket Pertama
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 grid-cols-1 @sm:grid-cols-2 @xl:grid-cols-3 @3xl:grid-cols-4">
          {plans.map((plan) => (
            <Card key={plan.plan_id} className="relative overflow-hidden hover:shadow-md transition-shadow">
              {/* ✅ Compact Header */}
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 flex-1 min-w-0">
                    <CardTitle className="text-base font-bold truncate">{plan.plan_name}</CardTitle>
                    {plan.description && (
                      <CardDescription className="line-clamp-1 text-xs">
                        {plan.description}
                      </CardDescription>
                    )}
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0">
                        <Package className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleOpenEdit(plan)}>
                        <Edit2 className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDelete(plan.plan_id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Hapus
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              {/* ✅ Compact Content */}
              <CardContent className="space-y-3 pb-3">
                {/* ✅ Price with Rupiah Format */}
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold text-primary">
                    {formatRupiah(plan.price)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    / {plan.duration_months} bln
                  </span>
                </div>

                {/* ✅ Compact Features */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Building2 className="h-3.5 w-3.5" />
                      <span>Cabang</span>
                    </div>
                    <Badge variant="secondary" className="text-xs h-5">
                      {plan.max_branches}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Smartphone className="h-3.5 w-3.5" />
                      <span>Perangkat</span>
                    </div>
                    <Badge variant="secondary" className="text-xs h-5">
                      {plan.max_devices}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Durasi</span>
                    </div>
                    <Badge variant="outline" className="text-xs h-5">
                      {plan.duration_months} bulan
                    </Badge>
                  </div>
                </div>
              </CardContent>

              {/* ✅ Compact Footer */}
              <CardFooter className="pt-3 pb-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full h-8 text-xs"
                  onClick={() => handleOpenEdit(plan)}
                >
                  <Edit2 className="mr-1.5 h-3 w-3" />
                  Edit Paket
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Plan Dialog */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleUpdate}>
            <DialogHeader>
              <DialogTitle>Edit Paket Langganan</DialogTitle>
              <DialogDescription>
                Perbarui detail paket langganan
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit_plan_name">Nama Paket <span className="text-destructive">*</span></Label>
                <Input
                  id="edit_plan_name"
                  required
                  value={formData.plan_name}
                  onChange={(e) => setFormData({...formData, plan_name: e.target.value})}
                  placeholder="Contoh: Paket Basic"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit_description">Deskripsi</Label>
                <Textarea
                  id="edit_description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Deskripsi paket (opsional)"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit_price">Harga (Rp) <span className="text-destructive">*</span></Label>
                  <Input
                    id="edit_price"
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    placeholder="500000"
                    min="0"
                  />
                  {/* ✅ Preview Rupiah */}
                  {formData.price && (
                    <p className="text-xs text-muted-foreground">
                      Preview: {formatRupiah(parseFloat(formData.price) || 0)}
                    </p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit_duration_months">Durasi (Bulan) <span className="text-destructive">*</span></Label>
                  <Input
                    id="edit_duration_months"
                    type="number"
                    required
                    value={formData.duration_months}
                    onChange={(e) => setFormData({...formData, duration_months: e.target.value})}
                    placeholder="12"
                    min="1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit_max_branches">Maks. Cabang <span className="text-destructive">*</span></Label>
                  <Input
                    id="edit_max_branches"
                    type="number"
                    required
                    value={formData.max_branches}
                    onChange={(e) => setFormData({...formData, max_branches: e.target.value})}
                    placeholder="5"
                    min="1"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit_max_devices">Maks. Perangkat <span className="text-destructive">*</span></Label>
                  <Input
                    id="edit_max_devices"
                    type="number"
                    required
                    value={formData.max_devices}
                    onChange={(e) => setFormData({...formData, max_devices: e.target.value})}
                    placeholder="10"
                    min="1"
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" onClick={resetForm}>Batal</Button>
              </DialogClose>
              <Button type="submit">Simpan Perubahan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
