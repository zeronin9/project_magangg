'use client';

import { useEffect, useState } from 'react';
import { fetchWithAuth } from '@/lib/api';

import { Partner, PartnerSubscription, SubscriptionPlan } from '@/types';
import { ShoppingBag, Plus, Edit2, Trash2, Calendar, DollarSign, CheckCircle, Clock, User, MoreHorizontal, Search } from 'lucide-react';
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
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";

// ✅ Format Rupiah Helper
const formatRupiah = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<PartnerSubscription[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<PartnerSubscription | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    partner_id: '',
    plan_id: '',
    start_date: new Date().toISOString().split('T')[0],
    payment_status: 'Paid'
  });

  const [editFormData, setEditFormData] = useState({
    start_date: '',
    payment_status: 'Paid'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      const [subsData, partnersData, plansData] = await Promise.allSettled([
        fetchWithAuth('/partner-subscription'),
        fetchWithAuth('/partner'),
        fetchWithAuth('/subscription-plan')
      ]);

      if (subsData.status === 'fulfilled') {
        const subs = subsData.value?.data || [];
        setSubscriptions(Array.isArray(subs) ? subs : []);
      }

      if (partnersData.status === 'fulfilled') {
        setPartners(Array.isArray(partnersData.value) ? partnersData.value : []);
      }

      if (plansData.status === 'fulfilled') {
        setPlans(Array.isArray(plansData.value) ? plansData.value : []);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchWithAuth('/partner-subscription', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          start_date: new Date(formData.start_date).toISOString()
        }),
      });
      alert('Langganan berhasil ditambahkan!');
      setIsModalOpen(false);
      fetchData();
      setFormData({
        partner_id: '',
        plan_id: '',
        start_date: new Date().toISOString().split('T')[0],
        payment_status: 'Paid'
      });
    } catch (error: any) {
      alert(error.message || 'Gagal menambahkan langganan');
    }
  };

  const handleOpenEdit = (subscription: PartnerSubscription) => {
    setEditingSubscription(subscription);
    setEditFormData({
      start_date: subscription.start_date ? new Date(subscription.start_date).toISOString().split('T')[0] : '',
      payment_status: subscription.payment_status || 'Paid'
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubscription) return;

    try {
      await fetchWithAuth(`/partner-subscription/${editingSubscription.subscription_id}`, {
        method: 'PUT',
        body: JSON.stringify({
          start_date: new Date(editFormData.start_date).toISOString(),
          payment_status: editFormData.payment_status
        }),
      });
      alert('Langganan berhasil diperbarui!');
      setIsEditModalOpen(false);
      fetchData();
      setEditingSubscription(null);
    } catch (error: any) {
      alert(error.message || 'Gagal memperbarui langganan');
    }
  };

  const handleDeleteSubscription = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus langganan ini?')) return;
    
    try {
      await fetchWithAuth(`/partner-subscription/${id}`, {
        method: 'DELETE',
      });
      alert('Langganan berhasil dihapus!');
      fetchData();
    } catch (error: any) {
      alert(error.message || 'Gagal menghapus langganan');
    }
  };

  const getPartnerName = (partnerId: string) => {
    const partner = partners.find(p => p.partner_id === partnerId);
    return partner?.business_name || 'Unknown';
  };

  const getPlanName = (sub: PartnerSubscription) => {
    if (sub.plan_snapshot?.plan_name) {
      return sub.plan_snapshot.plan_name;
    }
    const plan = plans.find(p => p.plan_id === sub.plan_id);
    return plan?.plan_name || 'Unknown Plan';
  };

  const getPlanDetails = (sub: PartnerSubscription) => {
    if (sub.plan_snapshot) {
      return {
        price: sub.plan_snapshot.price,
        duration: sub.plan_snapshot.duration_months
      };
    }
    const plan = plans.find(p => p.plan_id === sub.plan_id);
    return {
      price: plan?.price || 0,
      duration: plan?.duration_months || 0
    };
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const partnerName = getPartnerName(sub.partner_id).toLowerCase();
    const planName = getPlanName(sub).toLowerCase();
    const search = searchTerm.toLowerCase();
    return partnerName.includes(search) || planName.includes(search);
  });

  if (isLoading) {
    return <TableSkeleton rows={10} showSearch showButton />;
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8 @container">
      {/* Header - Responsive */}
      <div className="flex flex-col gap-4 @md:flex-row @md:items-center @md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight @md:text-3xl">Langganan Mitra</h2>
          <p className="text-sm text-muted-foreground @md:text-base">
            Kelola dan pantau semua langganan mitra
          </p>
        </div>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 @md:flex-row @md:items-center @md:justify-between">
            <div className="space-y-1 flex-1">
              <CardTitle>Riwayat Langganan</CardTitle>
              <CardDescription>
                Daftar semua langganan yang pernah atau sedang aktif
              </CardDescription>
            </div>
            
            <div className="flex flex-col gap-2 @md:flex-row @md:items-center">
              {/* Search */}
              <div className="relative w-full @md:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari langganan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>

              {/* Add Subscription Dialog */}
              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full @md:w-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    <span className="hidden @sm:inline">Tetapkan Langganan Baru</span>
                    <span className="@sm:hidden">Tambah</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <form onSubmit={handleSubmit}>
                    <DialogHeader>
                      <DialogTitle>Tetapkan Langganan Baru</DialogTitle>
                      <DialogDescription>
                        Pilih mitra dan paket langganan yang akan ditetapkan
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="partner_id">Pilih Mitra <span className="text-destructive">*</span></Label>
                        <select
                          id="partner_id"
                          required
                          value={formData.partner_id}
                          onChange={(e) => setFormData({...formData, partner_id: e.target.value})}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="">-- Pilih Mitra --</option>
                          {partners
                            .filter(p => p.status === 'Active')
                            .map(partner => (
                              <option key={partner.partner_id} value={partner.partner_id}>
                                {partner.business_name}
                              </option>
                            ))
                          }
                        </select>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="plan_id">Pilih Paket <span className="text-destructive">*</span></Label>
                        <select
                          id="plan_id"
                          required
                          value={formData.plan_id}
                          onChange={(e) => setFormData({...formData, plan_id: e.target.value})}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="">-- Pilih Paket --</option>
                          {plans.map(plan => (
                            <option key={plan.plan_id} value={plan.plan_id}>
                              {plan.plan_name} - {formatRupiah(plan.price)} ({plan.duration_months} bulan)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="start_date">Tanggal Mulai <span className="text-destructive">*</span></Label>
                        <Input
                          id="start_date"
                          type="date"
                          required
                          value={formData.start_date}
                          onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="payment_status">Status Pembayaran <span className="text-destructive">*</span></Label>
                        <select
                          id="payment_status"
                          value={formData.payment_status}
                          onChange={(e) => setFormData({...formData, payment_status: e.target.value})}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="Paid">Lunas</option>
                          <option value="Pending">Menunggu</option>
                        </select>
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Batal</Button>
                      </DialogClose>
                      <Button type="submit">Simpan Langganan</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filteredSubscriptions.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">
                {searchTerm ? 'Tidak ada hasil' : 'Belum ada langganan'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {searchTerm 
                  ? 'Coba ubah kata kunci pencarian' 
                  : 'Mulai dengan menetapkan langganan pertama untuk mitra'}
              </p>
              {!searchTerm && (
                <Button className="mt-4" onClick={() => setIsModalOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Tetapkan Langganan Pertama
                </Button>
              )}
            </div>
          ) : (
            <div className="@container/subs">
              {/* Desktop Table - ✅ Rupiah Format */}
              <div className="hidden @2xl/subs:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mitra</TableHead>
                      <TableHead>Paket Langganan</TableHead>
                      <TableHead>Harga</TableHead>
                      <TableHead>Durasi</TableHead>
                      <TableHead>Periode</TableHead>
                      <TableHead>Pembayaran</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubscriptions.map((sub) => {
                      const planDetails = getPlanDetails(sub);
                      return (
                        <TableRow key={sub.subscription_id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                {getPartnerName(sub.partner_id)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {getPlanName(sub)}
                          </TableCell>
                          <TableCell className="font-semibold text-primary">
                            {formatRupiah(planDetails.price)}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {planDetails.duration} bulan
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>
                                {sub.start_date && new Date(sub.start_date).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </div>
                              <div className="text-xs text-muted-foreground">s/d</div>
                              <div>
                                {sub.end_date && new Date(sub.end_date).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={sub.payment_status === 'Paid' ? 'default' : 'secondary'}>
                              {sub.payment_status === 'Paid' ? (
                                <><CheckCircle className="mr-1 h-3 w-3" /> Lunas</>
                              ) : (
                                <><Clock className="mr-1 h-3 w-3" /> Upgrade</>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={sub.payment_status === 'Paid' ? 'default' : 'outline'}>
                              {sub.payment_status === 'Paid' ? 'Aktif' : 'Tidak Aktif'}
                            </Badge>
                          </TableCell>
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
                                <DropdownMenuItem onClick={() => handleOpenEdit(sub)}>
                                  <Edit2 className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteSubscription(sub.subscription_id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Hapus
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile/Tablet Card List - ✅ Rupiah Format */}
              <div className="@2xl/subs:hidden space-y-4">
                {filteredSubscriptions.map((sub) => {
                  const planDetails = getPlanDetails(sub);
                  return (
                    <Card key={sub.subscription_id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1 min-w-0">
                            <CardTitle className="text-base truncate">{getPartnerName(sub.partner_id)}</CardTitle>
                            <p className="text-sm text-muted-foreground truncate">{getPlanName(sub)}</p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleOpenEdit(sub)}>
                                <Edit2 className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDeleteSubscription(sub.subscription_id)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Hapus
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm">
                        {/* ✅ Rupiah Price dengan Icon */}
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-muted-foreground">Harga:</span>
                          <div className="flex items-baseline gap-1 font-semibold">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span>{formatRupiah(planDetails.price)}</span>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Durasi:</span>
                          <Badge variant="outline" className="h-6 text-xs">
                            {planDetails.duration} bulan
                          </Badge>
                        </div>
                        
                        <Separator />
                        
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Periode:</span>
                          <span className="text-xs">
                            {sub.start_date && new Date(sub.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            {' - '}
                            {sub.end_date && new Date(sub.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        
                        <Separator />
                        
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-muted-foreground">Pembayaran:</span>
                          <Badge variant={sub.payment_status === 'Paid' ? 'default' : 'secondary'} className="h-6 text-xs">
                            {sub.payment_status === 'Paid' ? 'Lunas' : 'Menunggu'}
                          </Badge>
                        </div>
                        
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-muted-foreground">Status:</span>
                          <Badge variant={sub.status === 'Active' ? 'default' : 'outline'} className="h-6 text-xs">
                            {sub.status === 'Active' ? 'Aktif' : 'Tidak Aktif'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleUpdateSubscription}>
            <DialogHeader>
              <DialogTitle>Edit Langganan</DialogTitle>
              <DialogDescription>
                Perbarui detail langganan mitra
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Mitra:</span>
                  <span className="font-semibold">
                    {editingSubscription && getPartnerName(editingSubscription.partner_id)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Paket:</span>
                  <span className="font-semibold">
                    {editingSubscription && getPlanName(editingSubscription)}
                  </span>
                </div>
                {editingSubscription && (
                  <div className="flex justify-between text-sm pt-2 border-t">
                    <span className="text-muted-foreground">Harga:</span>
                    <span className="font-bold text-primary">
                      {formatRupiah(getPlanDetails(editingSubscription).price)}
                    </span>
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit_start_date">Tanggal Mulai <span className="text-destructive">*</span></Label>
                <Input
                  id="edit_start_date"
                  type="date"
                  required
                  value={editFormData.start_date}
                  onChange={(e) => setEditFormData({...editFormData, start_date: e.target.value})}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit_payment_status">Status Pembayaran <span className="text-destructive">*</span></Label>
                <select
                  id="edit_payment_status"
                  value={editFormData.payment_status}
                  onChange={(e) => setEditFormData({...editFormData, payment_status: e.target.value})}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="Paid">Lunas</option>
                  <option value="Pending">Menunggu</option>
                </select>
              </div>
            </div>
            
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" onClick={() => setEditingSubscription(null)}>Batal</Button>
              </DialogClose>
              <Button type="submit">Simpan Perubahan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
