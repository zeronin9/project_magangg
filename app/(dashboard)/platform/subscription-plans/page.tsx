'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchWithAuth } from '@/lib/api';
import { SubscriptionPlan } from '@/types';
import { formatRupiah } from '@/lib/utils';
import { Plus, Edit2, Trash2, MoreHorizontal, Archive, RotateCcw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function SubscriptionPlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isReactivateOpen, setIsReactivateOpen] = useState(false);
  const [isHardDeleteOpen, setIsHardDeleteOpen] = useState(false);
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
      console.error(error); 
    } finally { 
      setIsLoading(false); 
    }
  };

  const handleArchive = async () => {
    if (!selectedPlan) return;
    try {
      await fetchWithAuth(`/subscription-plan/${selectedPlan.plan_id}`, { method: 'DELETE' });
      alert('Paket berhasil diarsipkan!');
      setIsArchiveOpen(false);
      fetchPlans();
    } catch (err: any) { 
      alert(err.message || 'Gagal mengarsipkan paket'); 
    }
  };

  const handleReactivate = async () => {
    if (!selectedPlan) return;
    try {
      await fetchWithAuth(`/subscription-plan/${selectedPlan.plan_id}`, { 
        method: 'PUT',
        body: JSON.stringify({ 
          plan_name: selectedPlan.plan_name,
          price: selectedPlan.price,
          branch_limit: selectedPlan.branch_limit,
          device_limit: selectedPlan.device_limit,
          duration_months: selectedPlan.duration_months,
          is_active: true 
        })
      });
      alert('Paket berhasil diaktifkan kembali!');
      setIsReactivateOpen(false);
      fetchPlans();
    } catch (err: any) { 
      alert(err.message || 'Gagal mengaktifkan paket'); 
    }
  };

  const handleHardDelete = async () => {
    if (!selectedPlan) return;
    try {
      await fetchWithAuth(`/subscription-plan/permanent/${selectedPlan.plan_id}`, { method: 'DELETE' });
      alert('Paket berhasil dihapus permanen!');
      setIsHardDeleteOpen(false);
      fetchPlans();
    } catch (err: any) { 
      alert(err.message || 'Gagal menghapus paket'); 
    }
  };

  if (isLoading) return <TableSkeleton rows={5} showButton />;

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8 @container">
      {/* Header */}
      <div className="flex flex-col gap-4 @md:flex-row @md:items-center @md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Paket Langganan</h2>
          <p className="text-sm text-muted-foreground">Kelola paket harga dan fitur untuk mitra</p>
        </div>
        <Button asChild>
          <Link href="/platform/subscription-plans/new">
            <Plus className="mr-2 h-4 w-4" /> Buat Paket
          </Link>
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Paket</TableHead>
                <TableHead>Harga</TableHead>
                <TableHead>Limit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Belum ada paket langganan
                  </TableCell>
                </TableRow>
              ) : (
                plans.map(plan => (
                  <TableRow key={plan.plan_id} className={!plan.is_active ? 'opacity-60' : ''}>
                    <TableCell className="font-medium">{plan.plan_name}</TableCell>
                    <TableCell>{formatRupiah(plan.price)} / {plan.duration_months} bln</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {plan.branch_limit} Cabang, {plan.device_limit} Device
                    </TableCell>
                    <TableCell>
                      <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                        {plan.is_active ? 'Aktif' : 'Arsip'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4"/>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/platform/subscription-plans/${plan.plan_id}/edit`}>
                              <Edit2 className="mr-2 h-4 w-4"/> Edit Detail
                            </Link>
                          </DropdownMenuItem>
                          {plan.is_active ? (
                            <DropdownMenuItem 
                              onClick={() => { setSelectedPlan(plan); setIsArchiveOpen(true); }} 
                              className="text-orange-600"
                            >
                              <Archive className="mr-2 h-4 w-4"/> Arsipkan
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem 
                              onClick={() => { setSelectedPlan(plan); setIsReactivateOpen(true); }} 
                              className="text-green-600"
                            >
                              <RotateCcw className="mr-2 h-4 w-4"/> Aktifkan Kembali
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => { setSelectedPlan(plan); setIsHardDeleteOpen(true); }} 
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4"/> Hapus Permanen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ✅ DIALOG ARSIPKAN - Tombol Hitam dengan Teks Putih */}
      <AlertDialog open={isArchiveOpen} onOpenChange={setIsArchiveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arsipkan Paket?</AlertDialogTitle>
            <AlertDialogDescription>
              Paket <strong>{selectedPlan?.plan_name}</strong> tidak akan muncul lagi di pilihan mitra.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleArchive}
              className="bg-black text-white hover:bg-gray-800"
            >
              Arsipkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ✅ DIALOG AKTIFKAN - Tombol Hitam dengan Teks Putih */}
      <AlertDialog open={isReactivateOpen} onOpenChange={setIsReactivateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aktifkan Kembali?</AlertDialogTitle>
            <AlertDialogDescription>
              Paket <strong>{selectedPlan?.plan_name}</strong> akan muncul lagi di pilihan mitra.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleReactivate}
              className="bg-black text-white hover:bg-gray-800"
            >
              Aktifkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ✅ DIALOG HAPUS PERMANEN - Tombol Hitam dengan Teks Putih */}
      <AlertDialog open={isHardDeleteOpen} onOpenChange={setIsHardDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Permanen?</AlertDialogTitle>
            <AlertDialogDescription>
              Data paket <strong>{selectedPlan?.plan_name}</strong> akan hilang selamanya. 
              Penghapusan akan gagal jika sudah ada transaksi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleHardDelete}
              className="bg-black text-white hover:bg-gray-800"
            >
              Hapus Permanen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
