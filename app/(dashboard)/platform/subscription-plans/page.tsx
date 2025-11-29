'use client';

import { useEffect, useState } from 'react';
import { fetchWithAuth } from '@/lib/api';
import { SubscriptionPlan } from '@/types';
import { Package, Plus, Edit2, Trash2, MoreHorizontal, Search, Archive, RotateCcw, AlertTriangle } from 'lucide-react';
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";

const formatRupiah = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const StatusBadge = ({ isActive }: { isActive: boolean }) => {
  return isActive ? (
    <Badge variant="default">Aktif</Badge>
  ) : (
    <Badge variant="secondary">Arsip</Badge>
  );
};

// Custom Alert Dialog Component menggunakan Dialog biasa
const CustomAlertDialog = ({ 
  open, 
  onOpenChange, 
  title, 
  description, 
  onConfirm, 
  confirmText = "Lanjutkan",
  cancelText = "Batal",
  variant = "default"
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive" | "warning";
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "destructive":
        return "bg-destructive text-destructive-foreground hover:bg-destructive/90";
      case "warning":
        return "bg-orange-600 text-white hover:bg-orange-700";
      default:
        return "bg-primary text-primary-foreground hover:bg-primary/90";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {variant === "destructive" && <AlertTriangle className="h-5 w-5 text-destructive" />}
            {variant === "warning" && <AlertTriangle className="h-5 w-5 text-orange-600" />}
            {title}
          </DialogTitle>
          <DialogDescription className="text-left">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
          <DialogClose asChild>
            <Button variant="outline" className="w-full sm:w-auto">
              {cancelText}
            </Button>
          </DialogClose>
          <Button 
            onClick={onConfirm}
            className={`w-full sm:w-auto ${getVariantStyles()}`}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function SubscriptionPlansPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    plan_name: '',
    price: '',
    duration_months: '',
    device_limit: '',
    branch_limit: '',
    description: ''
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [editForm, setEditForm] = useState({
    plan_name: '',
    price: '',
    duration_months: '',
    device_limit: '',
    branch_limit: '',
    description: '',
  });

  // Alert Dialog States
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [reactivateDialogOpen, setReactivateDialogOpen] = useState(false);
  const [hardDeleteDialogOpen, setHardDeleteDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

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
      setPlans([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchWithAuth('/subscription-plan', {
        method: 'POST',
        body: JSON.stringify({
          plan_name: addForm.plan_name,
          price: parseFloat(addForm.price),
          duration_months: parseInt(addForm.duration_months),
          device_limit: parseInt(addForm.device_limit),
          branch_limit: parseInt(addForm.branch_limit),
          description: addForm.description
        }),
      });
      
      alert('Paket berhasil ditambahkan!');
      setIsAddModalOpen(false);
      fetchPlans();
      setAddForm({
        plan_name: '',
        price: '',
        duration_months: '',
        device_limit: '',
        branch_limit: '',
        description: ''
      });
    } catch (error: any) {
      alert(error.message || 'Gagal menambahkan paket');
    }
  };

  const handleOpenEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setEditForm({
      plan_name: plan.plan_name,
      price: plan.price.toString(),
      duration_months: plan.duration_months.toString(),
      device_limit: plan.device_limit.toString(),
      branch_limit: plan.branch_limit?.toString() || '',
      description: plan.description || '',
    });
    setIsEditModalOpen(true);
  };

  const handleEditPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    try {
      await fetchWithAuth(`/subscription-plan/${editingPlan.plan_id}`, {
        method: 'PUT',
        body: JSON.stringify({
          plan_name: editForm.plan_name,
          price: parseFloat(editForm.price),
          duration_months: parseInt(editForm.duration_months),
          device_limit: parseInt(editForm.device_limit),
          branch_limit: parseInt(editForm.branch_limit),
          description: editForm.description,
        }),
      });
      
      alert('Paket berhasil diperbarui!');
      setIsEditModalOpen(false);
      setEditingPlan(null);
      fetchPlans();
    } catch (error: any) {
      alert(error.message || 'Gagal memperbarui paket');
    }
  };

  // Alert Dialog Handlers
  const handleOpenDeactivate = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setDeactivateDialogOpen(true);
  };

  const handleDeactivatePlan = async () => {
    if (!selectedPlan) return;
    
    try {
      const response = await fetchWithAuth(`/subscription-plan/${selectedPlan.plan_id}`, {
        method: 'DELETE',
      });
      alert(response?.message || 'Paket berhasil dinonaktifkan!');
      setDeactivateDialogOpen(false);
      setSelectedPlan(null);
      fetchPlans();
    } catch (error: any) {
      console.error('Deactivate error:', error);
      alert(error.message || 'Gagal menonaktifkan paket');
    }
  };

  const handleOpenReactivate = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setReactivateDialogOpen(true);
  };

  const handleReactivatePlan = async () => {
    if (!selectedPlan) return;
    
    try {
      await fetchWithAuth(`/subscription-plan/${selectedPlan.plan_id}`, {
        method: 'PUT',
        body: JSON.stringify({
          is_active: true
        }),
      });
      
      alert('Paket berhasil diaktifkan kembali!');
      setReactivateDialogOpen(false);
      setSelectedPlan(null);
      fetchPlans();
    } catch (error: any) {
      console.error('Reactivate error:', error);
      alert(error.message || 'Gagal mengaktifkan paket');
    }
  };

  const handleOpenHardDelete = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setHardDeleteDialogOpen(true);
  };

  const handleHardDelete = async () => {
    if (!selectedPlan) return;
    
    try {
      const response = await fetchWithAuth(`/subscription-plan/permanent/${selectedPlan.plan_id}`, {
        method: 'DELETE',
      });
      alert(response?.message || 'Paket berhasil dihapus permanen!');
      setHardDeleteDialogOpen(false);
      setSelectedPlan(null);
      fetchPlans();
    } catch (error: any) {
      console.error('Hard delete error:', error);
      if (error.message?.includes('Mitra') || error.message?.includes('digunakan')) {
        alert(`❌ ${error.message}`);
      } else {
        alert(error.message || 'Gagal menghapus paket permanen');
      }
    }
  };

  const filteredPlans = plans.filter(plan => 
    plan.plan_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <TableSkeleton rows={5} showSearch showButton />;
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8 @container">
      {/* Header */}
      <div className="flex flex-col gap-4 @md:flex-row @md:items-center @md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight @md:text-3xl">Paket Langganan</h2>
          <p className="text-sm text-muted-foreground @md:text-base">
            Kelola paket langganan yang tersedia untuk mitra
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 @md:flex-row @md:items-center @md:justify-between">
            <div className="space-y-1 flex-1">
              <CardTitle>Daftar Paket</CardTitle>
              <CardDescription>Kelola harga, durasi, dan limit perangkat</CardDescription>
            </div>
            <div className="flex flex-col gap-2 @md:flex-row @md:items-center">
              <div className="relative w-full @md:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari paket..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full @md:w-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah Paket
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <form onSubmit={handleAddPlan}>
                    <DialogHeader>
                      <DialogTitle>Tambah Paket Baru</DialogTitle>
                      <DialogDescription>Buat paket langganan baru</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="add_plan_name">Nama Paket <span className="text-destructive">*</span></Label>
                        <Input 
                          id="add_plan_name" 
                          required 
                          placeholder="Basic, Pro, Enterprise"
                          value={addForm.plan_name} 
                          onChange={(e) => setAddForm({...addForm, plan_name: e.target.value})} 
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="add_price">Harga (Rp) <span className="text-destructive">*</span></Label>
                        <Input 
                          id="add_price" 
                          type="number" 
                          required 
                          min="0" 
                          step="1000" 
                          placeholder="500000"
                          value={addForm.price} 
                          onChange={(e) => setAddForm({...addForm, price: e.target.value})} 
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="add_duration">Durasi (Bulan) <span className="text-destructive">*</span></Label>
                          <Input 
                            id="add_duration" 
                            type="number" 
                            required 
                            min="1" 
                            placeholder="12"
                            value={addForm.duration_months} 
                            onChange={(e) => setAddForm({...addForm, duration_months: e.target.value})} 
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="add_device_limit">Limit Perangkat <span className="text-destructive">*</span></Label>
                          <Input 
                            id="add_device_limit" 
                            type="number" 
                            required 
                            min="1" 
                            placeholder="5"
                            value={addForm.device_limit} 
                            onChange={(e) => setAddForm({...addForm, device_limit: e.target.value})} 
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="add_branch_limit">Limit Cabang</Label>
                        <Input 
                          id="add_branch_limit" 
                          type="number" 
                          min="0" 
                          placeholder="3"
                          value={addForm.branch_limit} 
                          onChange={(e) => setAddForm({...addForm, branch_limit: e.target.value})} 
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="add_description">Deskripsi</Label>
                        <Input 
                          id="add_description" 
                          placeholder="Fitur dan benefit paket"
                          value={addForm.description} 
                          onChange={(e) => setAddForm({...addForm, description: e.target.value})} 
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild><Button variant="outline">Batal</Button></DialogClose>
                      <Button type="submit">Simpan Paket</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filteredPlans.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">{searchTerm ? 'Tidak ada hasil' : 'Belum ada paket'}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {searchTerm ? 'Coba ubah kata kunci pencarian' : 'Mulai dengan menambahkan paket pertama'}
              </p>
              {!searchTerm && (
                <Button className="mt-4" onClick={() => setIsAddModalOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />Tambah Paket
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE */}
              <div className="hidden @lg:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Nama Paket</TableHead>
                      <TableHead>Harga</TableHead>
                      <TableHead>Durasi</TableHead>
                      <TableHead>Limit Perangkat</TableHead>
                      <TableHead>Limit Cabang</TableHead>
                      <TableHead>Deskripsi</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPlans.map((plan) => (
                      <TableRow key={plan.plan_id}>
                        <TableCell><StatusBadge isActive={plan.is_active} /></TableCell>
                        <TableCell className="font-medium">{plan.plan_name}</TableCell>
                        <TableCell><span className="font-semibold text-primary">{formatRupiah(plan.price)}</span></TableCell>
                        <TableCell><Badge variant="secondary">{plan.duration_months} bulan</Badge></TableCell>
                        <TableCell><Badge variant="outline">{plan.device_limit} perangkat</Badge></TableCell>
                        <TableCell><Badge variant="outline">{plan.branch_limit || 0} cabang</Badge></TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{plan.description || '-'}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleOpenEdit(plan)}>
                                <Edit2 className="mr-2 h-4 w-4" />Edit
                              </DropdownMenuItem>
                              {plan.is_active ? (
                                <DropdownMenuItem onClick={() => handleOpenDeactivate(plan)} className="text-orange-600">
                                  <Archive className="mr-2 h-4 w-4" />Non-aktifkan
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleOpenReactivate(plan)} className="text-green-600">
                                  <RotateCcw className="mr-2 h-4 w-4" />Aktifkan Kembali
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleOpenHardDelete(plan)} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />Hapus Permanen
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* MOBILE CARDS */}
              <div className="@lg:hidden space-y-4">
                {filteredPlans.map((plan) => (
                  <Card key={plan.plan_id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-base truncate">{plan.plan_name}</CardTitle>
                            <StatusBadge isActive={plan.is_active} />
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{plan.description || 'Tidak ada deskripsi'}</p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleOpenEdit(plan)}>
                              <Edit2 className="mr-2 h-4 w-4" />Edit
                            </DropdownMenuItem>
                            {plan.is_active ? (
                              <DropdownMenuItem onClick={() => handleOpenDeactivate(plan)} className="text-orange-600">
                                <Archive className="mr-2 h-4 w-4" />Non-aktifkan
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleOpenReactivate(plan)} className="text-green-600">
                                <RotateCcw className="mr-2 h-4 w-4" />Aktifkan Kembali
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleOpenHardDelete(plan)} className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />Hapus Permanen
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Harga:</span>
                        <span className="font-semibold text-primary text-base">{formatRupiah(plan.price)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Durasi:</span>
                        <Badge variant="secondary">{plan.duration_months} bulan</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Limit Perangkat:</span>
                        <Badge variant="outline">{plan.device_limit} perangkat</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Limit Cabang:</span>
                        <Badge variant="outline">{plan.branch_limit || 0} cabang</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleEditPlan}>
            <DialogHeader>
              <DialogTitle>Edit Paket</DialogTitle>
              <DialogDescription>Perbarui "{editingPlan?.plan_name}"</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit_plan_name">Nama Paket <span className="text-destructive">*</span></Label>
                <Input 
                  id="edit_plan_name" 
                  required 
                  value={editForm.plan_name} 
                  onChange={(e) => setEditForm({...editForm, plan_name: e.target.value})} 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_price">Harga (Rp) <span className="text-destructive">*</span></Label>
                <Input 
                  id="edit_price" 
                  type="number" 
                  required 
                  min="0" 
                  step="1000" 
                  value={editForm.price} 
                  onChange={(e) => setEditForm({...editForm, price: e.target.value})} 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit_duration">Durasi <span className="text-destructive">*</span></Label>
                  <Input 
                    id="edit_duration" 
                    type="number" 
                    required 
                    min="1" 
                    value={editForm.duration_months} 
                    onChange={(e) => setEditForm({...editForm, duration_months: e.target.value})} 
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit_device_limit">Limit Perangkat <span className="text-destructive">*</span></Label>
                  <Input 
                    id="edit_device_limit" 
                    type="number" 
                    required 
                    min="1" 
                    value={editForm.device_limit} 
                    onChange={(e) => setEditForm({...editForm, device_limit: e.target.value})} 
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_branch_limit">Limit Cabang</Label>
                <Input 
                  id="edit_branch_limit" 
                  type="number" 
                  min="0" 
                  value={editForm.branch_limit} 
                  onChange={(e) => setEditForm({...editForm, branch_limit: e.target.value})} 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_description">Deskripsi</Label>
                <Input 
                  id="edit_description" 
                  value={editForm.description} 
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})} 
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Batal</Button></DialogClose>
              <Button type="submit">Simpan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ✅ FIXED: Custom Alert Dialogs menggunakan Dialog biasa */}
      {/* Deactivate Alert Dialog */}
      <CustomAlertDialog
        open={deactivateDialogOpen}
        onOpenChange={setDeactivateDialogOpen}
        title="Non-aktifkan Paket"
        description={
          <div className="space-y-2">
            <p>
              Apakah Anda yakin ingin menonaktifkan paket <strong>"{selectedPlan?.plan_name}"</strong>?
            </p>
            <p className="text-sm text-muted-foreground">
              Paket akan disembunyikan dari pilihan mitra tetapi data tetap tersimpan.
            </p>
          </div>
        }
        onConfirm={handleDeactivatePlan}
        confirmText="Non-aktifkan"
        variant="warning"
      />

      {/* Reactivate Alert Dialog */}
      <CustomAlertDialog
        open={reactivateDialogOpen}
        onOpenChange={setReactivateDialogOpen}
        title="Aktifkan Kembali Paket"
        description={
          <div className="space-y-2">
            <p>
              Apakah Anda yakin ingin mengaktifkan kembali paket <strong>"{selectedPlan?.plan_name}"</strong>?
            </p>
            <p className="text-sm text-muted-foreground">
              Paket akan tersedia lagi untuk dipilih mitra.
            </p>
          </div>
        }
        onConfirm={handleReactivatePlan}
        confirmText="Aktifkan Kembali"
        variant="default"
      />

      {/* Hard Delete Alert Dialog */}
      <CustomAlertDialog
        open={hardDeleteDialogOpen}
        onOpenChange={setHardDeleteDialogOpen}
        title="Hapus Permanen"
        description={
          <div className="space-y-3">
            <p>
              Apakah Anda yakin ingin menghapus permanen paket <strong>"{selectedPlan?.plan_name}"</strong>?
            </p>
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm">
              <div className="font-medium text-destructive">⚠️ Permanen!</div>
              <div className="text-destructive/80 mt-1">
                Tindakan ini tidak dapat dibatalkan. Gagal jika paket sudah digunakan mitra.
              </div>
            </div>
          </div>
        }
        onConfirm={handleHardDelete}
        confirmText="Hapus Permanen"
        variant="destructive"
      />
    </div>
  );
}