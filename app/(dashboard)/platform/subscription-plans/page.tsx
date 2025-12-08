'use client';

import { useEffect, useState } from 'react';
import { fetchWithAuth } from '@/lib/api';
import { SubscriptionPlan } from '@/types';
import { formatRupiah } from '@/lib/utils';
import { Package, Plus, Edit2, Trash2, MoreHorizontal, Search, Archive, RotateCcw } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";
import { CustomAlertDialog } from "@/components/ui/custom-alert-dialog";

export default function SubscriptionPlansPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isReactivateOpen, setIsReactivateOpen] = useState(false);
  const [isHardDeleteOpen, setIsHardDeleteOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  const [formData, setFormData] = useState({
    plan_name: '', price: '', branch_limit: '', device_limit: '', duration_months: '', description: ''
  });

  useEffect(() => { fetchPlans(); }, []);

  const fetchPlans = async () => {
    try {
      setIsLoading(true);
      const data = await fetchWithAuth('/subscription-plan');
      setPlans(Array.isArray(data) ? data : []);
    } catch (error) { console.error(error); } finally { setIsLoading(false); }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchWithAuth('/subscription-plan', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          price: Number(formData.price),
          branch_limit: Number(formData.branch_limit),
          device_limit: Number(formData.device_limit),
          duration_months: Number(formData.duration_months)
        }),
      });
      alert('Paket dibuat!');
      setIsAddOpen(false);
      fetchPlans();
      setFormData({ plan_name: '', price: '', branch_limit: '', device_limit: '', duration_months: '', description: '' });
    } catch (err: any) { alert(err.message); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;
    try {
      await fetchWithAuth(`/subscription-plan/${selectedPlan.plan_id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...formData,
          price: Number(formData.price),
          branch_limit: Number(formData.branch_limit),
          device_limit: Number(formData.device_limit),
          duration_months: Number(formData.duration_months),
          is_active: true
        }),
      });
      alert('Paket diupdate!');
      setIsEditOpen(false);
      fetchPlans();
    } catch (err: any) { alert(err.message); }
  };

  const handleArchive = async () => {
    if (!selectedPlan) return;
    try {
      await fetchWithAuth(`/subscription-plan/${selectedPlan.plan_id}`, { method: 'DELETE' });
      alert('Paket diarsipkan!');
      setIsArchiveOpen(false);
      fetchPlans();
    } catch (err: any) { alert(err.message); }
  };

  const handleReactivate = async () => {
    if (!selectedPlan) return;
    try {
      await fetchWithAuth(`/subscription-plan/${selectedPlan.plan_id}`, { 
        method: 'PUT',
        body: JSON.stringify({ is_active: true })
      });
      alert('Paket diaktifkan kembali!');
      setIsReactivateOpen(false);
      fetchPlans();
    } catch (err: any) { alert(err.message); }
  };

  const handleHardDelete = async () => {
    if (!selectedPlan) return;
    try {
      await fetchWithAuth(`/subscription-plan/permanent/${selectedPlan.plan_id}`, { method: 'DELETE' });
      alert('Paket dihapus permanen!');
      setIsHardDeleteOpen(false);
      fetchPlans();
    } catch (err: any) { alert(err.message); }
  };

  const openEdit = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setFormData({
      plan_name: plan.plan_name,
      price: String(plan.price),
      branch_limit: String(plan.branch_limit),
      device_limit: String(plan.device_limit),
      duration_months: String(plan.duration_months),
      description: plan.description
    });
    setIsEditOpen(true);
  };

  if (isLoading) return <TableSkeleton rows={5} showButton />;

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8 @container">
      <div className="flex justify-between items-center">
        <div><h2 className="text-2xl font-bold">Paket Langganan</h2><p className="text-muted-foreground">Atur paket harga</p></div>
        <Button onClick={() => setIsAddOpen(true)}><Plus className="mr-2 h-4 w-4" /> Buat Paket</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Nama</TableHead><TableHead>Harga</TableHead><TableHead>Limit</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow></TableHeader>
            <TableBody>
              {plans.map(plan => (
                <TableRow key={plan.plan_id} className={!plan.is_active ? 'opacity-60' : ''}>
                  <TableCell className="font-medium">{plan.plan_name}</TableCell>
                  <TableCell>{formatRupiah(plan.price)} / {plan.duration_months} bln</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{plan.branch_limit} Cabang, {plan.device_limit} Device</TableCell>
                  <TableCell><Badge variant={plan.is_active ? 'default' : 'secondary'}>{plan.is_active ? 'Aktif' : 'Arsip'}</Badge></TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4"/></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(plan)}><Edit2 className="mr-2 h-4 w-4"/> Edit Detail</DropdownMenuItem>
                        {plan.is_active ? (
                          <DropdownMenuItem onClick={() => { setSelectedPlan(plan); setIsArchiveOpen(true); }} className="text-orange-600">
                            <Archive className="mr-2 h-4 w-4"/> Arsipkan
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => { setSelectedPlan(plan); setIsReactivateOpen(true); }} className="text-green-600">
                            <RotateCcw className="mr-2 h-4 w-4"/> Aktifkan Kembali
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => { setSelectedPlan(plan); setIsHardDeleteOpen(true); }} className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4"/> Hapus Permanen
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <form onSubmit={handleAdd}>
            <DialogHeader><DialogTitle>Buat Paket Baru</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2"><Label>Nama Paket</Label><Input required value={formData.plan_name} onChange={e => setFormData({...formData, plan_name: e.target.value})} /></div>
              <div className="grid gap-2"><Label>Harga</Label><Input type="number" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} /></div>
              <div className="grid grid-cols-3 gap-2">
                <div><Label>Cabang</Label><Input type="number" required value={formData.branch_limit} onChange={e => setFormData({...formData, branch_limit: e.target.value})} /></div>
                <div><Label>Device</Label><Input type="number" required value={formData.device_limit} onChange={e => setFormData({...formData, device_limit: e.target.value})} /></div>
                <div><Label>Bulan</Label><Input type="number" required value={formData.duration_months} onChange={e => setFormData({...formData, duration_months: e.target.value})} /></div>
              </div>
              <div className="grid gap-2"><Label>Deskripsi</Label><Input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
            </div>
            <DialogFooter><Button type="submit">Simpan</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <form onSubmit={handleEdit}>
            <DialogHeader><DialogTitle>Edit Paket</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2"><Label>Nama Paket</Label><Input required value={formData.plan_name} onChange={e => setFormData({...formData, plan_name: e.target.value})} /></div>
              <div className="grid gap-2"><Label>Harga</Label><Input type="number" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} /></div>
              <div className="grid grid-cols-3 gap-2">
                <div><Label>Cabang</Label><Input type="number" required value={formData.branch_limit} onChange={e => setFormData({...formData, branch_limit: e.target.value})} /></div>
                <div><Label>Device</Label><Input type="number" required value={formData.device_limit} onChange={e => setFormData({...formData, device_limit: e.target.value})} /></div>
                <div><Label>Bulan</Label><Input type="number" required value={formData.duration_months} onChange={e => setFormData({...formData, duration_months: e.target.value})} /></div>
              </div>
              <div className="grid gap-2"><Label>Deskripsi</Label><Input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
            </div>
            <DialogFooter><Button type="submit">Update</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <CustomAlertDialog open={isArchiveOpen} onOpenChange={setIsArchiveOpen} title="Arsipkan?" description="Paket tidak akan muncul lagi di pilihan mitra." onConfirm={handleArchive} confirmText="Arsipkan" variant="warning" />
      <CustomAlertDialog open={isReactivateOpen} onOpenChange={setIsReactivateOpen} title="Aktifkan Kembali?" description="Paket akan muncul lagi di pilihan mitra." onConfirm={handleReactivate} confirmText="Aktifkan" variant="default" />
      <CustomAlertDialog open={isHardDeleteOpen} onOpenChange={setIsHardDeleteOpen} title="Hapus Permanen?" description="Data akan hilang selamanya. Gagal jika sudah ada transaksi." onConfirm={handleHardDelete} confirmText="Hapus" variant="destructive" />
    </div>
  );
}