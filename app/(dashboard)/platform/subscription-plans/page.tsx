'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchWithAuth } from '@/lib/api';
import { TableSkeleton } from '@/components/skeletons/TableSkeleton';
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
import { Plus, Search, MoreHorizontal, Archive, CheckCircle, Edit, Package, Trash2, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface SubscriptionPlan {
  plan_id: string;
  plan_name: string;
  price: number;
  branch_limit: number;
  device_limit: number;
  duration_months: number;
  is_active: boolean;
  created_at: string;
}

export default function SubscriptionPlanListPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal States
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
  const [isActivateOpen, setIsActivateOpen] = useState(false);
  const [isHardDeleteOpen, setIsHardDeleteOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  // State untuk mencegah double click
  const [isProcessing, setIsProcessing] = useState(false);

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

  const formatRupiah = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  // 1. Non-aktifkan Paket (Soft Delete)
  const handleDeactivate = async (e: React.MouseEvent) => {
    e.preventDefault(); // Mencegah modal tertutup otomatis
    if (!selectedPlan || isProcessing) return;

    setIsProcessing(true);

    try {
      await Promise.all([
        fetchWithAuth(`/subscription-plan/${selectedPlan.plan_id}`, { method: 'DELETE' }),
        new Promise(resolve => setTimeout(resolve, 3000)) // Delay 3 detik
      ]);
      
      // Alert dihapus
      setIsDeactivateOpen(false);
      fetchPlans();
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Gagal menonaktifkan paket');
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Aktifkan Kembali Paket
  const handleActivate = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!selectedPlan || isProcessing) return;

    setIsProcessing(true);

    try {
      await Promise.all([
        fetchWithAuth(`/subscription-plan/${selectedPlan.plan_id}`, {
          method: 'PUT',
          body: { is_active: true }
        }),
        new Promise(resolve => setTimeout(resolve, 3000))
      ]);

      // Alert dihapus
      setIsActivateOpen(false);
      fetchPlans();
    } catch (error: any) {
      console.error('Error activating plan:', error);
      alert(error.message || 'Gagal mengaktifkan paket');
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. Hapus Permanen (Hard Delete)
  const handleHardDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!selectedPlan || isProcessing) return;

    setIsProcessing(true);

    try {
      await Promise.all([
        fetchWithAuth(`/subscription-plan/permanent/${selectedPlan.plan_id}`, { 
          method: 'DELETE' 
        }),
        new Promise(resolve => setTimeout(resolve, 3000))
      ]);

      // Alert dihapus
      setIsHardDeleteOpen(false);
      fetchPlans();
    } catch (error: any) {
      console.error('Error hard deleting plan:', error);
      alert(error.message || 'Gagal menghapus paket. Paket mungkin sedang digunakan oleh Mitra.');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredPlans = plans.filter(p =>
    p.plan_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return <TableSkeleton rows={5} showSearch showButton />;

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8 @container">
      <div className="flex flex-col gap-4 @md:flex-row @md:items-center @md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Paket Langganan</h2>
          <p className="text-sm text-muted-foreground">Atur paket harga dan fitur untuk mitra</p>
        </div>
        <Button asChild>
          <Link href="/platform/subscription-plans/new">
            <Plus className="mr-2 h-4 w-4" /> Buat Paket Baru
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 @md:flex-row @md:items-center @md:justify-between">
            <CardTitle>Daftar Paket</CardTitle>
            <div className="relative w-full @md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari paket..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Paket</TableHead>
                  <TableHead>Harga</TableHead>
                  <TableHead>Durasi</TableHead>
                  <TableHead>Limit (Cabang/Device)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? 'Tidak ada paket yang ditemukan' : 'Belum ada paket langganan'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPlans.map((plan) => (
                    <TableRow key={plan.plan_id}>
                      <TableCell className="font-medium flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        {plan.plan_name}
                      </TableCell>
                      <TableCell>{formatRupiah(Number(plan.price))}</TableCell>
                      <TableCell>{plan.duration_months} Bulan</TableCell>
                      <TableCell>
                        <span className="text-xs bg-secondary px-2 py-1 rounded-md">
                          {plan.branch_limit} Cabang / {plan.device_limit} Device
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={plan.is_active ? 'default' : 'secondary'}
                          className={!plan.is_active ? 'bg-gray-100 text-black' : ''}
                        >
                          {plan.is_active ? 'Aktif' : 'Diarsipkan'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                            
                            <DropdownMenuItem asChild>
                              <Link href={`/platform/subscription-plans/${plan.plan_id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" /> Edit Paket
                              </Link>
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            
                            {plan.is_active ? (
                              <DropdownMenuItem 
                                onClick={() => { 
                                  setSelectedPlan(plan); 
                                  setIsDeactivateOpen(true); 
                                }} 
                                className="text-destructive focus:text-destructive"
                              >
                                <Archive className="mr-2 h-4 w-4" /> Arsipkan (Non-aktif)
                              </DropdownMenuItem>
                            ) : (
                              <>
                                <DropdownMenuItem 
                                  onClick={() => { 
                                    setSelectedPlan(plan); 
                                    setIsActivateOpen(true); 
                                  }} 
                                  className="text-green-600 focus:text-green-600"
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" /> Aktifkan Kembali
                                </DropdownMenuItem>
                                
                                <DropdownMenuSeparator />
                                
                                <DropdownMenuItem 
                                  onClick={() => { 
                                    setSelectedPlan(plan); 
                                    setIsHardDeleteOpen(true); 
                                  }} 
                                  className="text-destructive focus:text-destructive bg-red-50 focus:bg-red-100"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Hapus Permanen
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* DIALOG DEACTIVATE (Arsipkan) */}
      <AlertDialog open={isDeactivateOpen} onOpenChange={setIsDeactivateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arsipkan Paket?</AlertDialogTitle>
            <AlertDialogDescription>
              Paket <strong>{selectedPlan?.plan_name}</strong> tidak akan muncul lagi di daftar pembelian Mitra. 
              Data paket tetap aman dan bisa diaktifkan kembali nanti.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeactivate}
              disabled={isProcessing}
              className="bg-black text-white"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mengarsipkan...
                </>
              ) : 'Arsipkan'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* DIALOG ACTIVATE (Aktifkan Kembali) */}
      <AlertDialog open={isActivateOpen} onOpenChange={setIsActivateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aktifkan Paket Kembali?</AlertDialogTitle>
            <AlertDialogDescription>
              Paket <strong>{selectedPlan?.plan_name}</strong> akan muncul kembali di daftar pembelian dan dapat dibeli oleh Mitra baru.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleActivate}
              disabled={isProcessing}
              className="bg-black"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mengaktifkan...
                </>
              ) : 'Aktifkan'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* DIALOG HARD DELETE (Hapus Permanen) */}
      <AlertDialog open={isHardDeleteOpen} onOpenChange={setIsHardDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-black font-bold flex items-center gap-2">
              <Trash2 className="text-black h-5 w-5" />
              Hapus Permanen?
            </AlertDialogTitle>
            
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                Anda akan menghapus paket <strong>{selectedPlan?.plan_name}</strong> secara permanen dari database.
              </p>
            </div>

          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleHardDelete}
              disabled={isProcessing}
              className="bg-black text-white "
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menghapus...
                </>
              ) : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}