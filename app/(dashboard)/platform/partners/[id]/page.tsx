'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchWithAuth } from '@/lib/api';
import { DetailSkeleton } from '@/components/skeletons/DetailSkeleton';
import { Partner, PartnerSubscription, License, SubscriptionPlan } from '@/types';
import { Edit2, Plus, ArrowLeft, CheckCircle, Clock, Calendar, DollarSign, Key, Smartphone, Building2 } from 'lucide-react';
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

// Format Rupiah function
const formatRupiah = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function PartnerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const partnerId = params.id as string;

  const [partner, setPartner] = useState<Partner | null>(null);
  const [subscriptions, setSubscriptions] = useState<PartnerSubscription[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  const [allPlans, setAllPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [subForm, setSubForm] = useState({
    plan_id: '',
    start_date: new Date().toISOString().split('T')[0],
    payment_status: 'Paid'
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    business_name: '',
    business_email: '',
    business_phone: ''
  });

  const getPlanName = (subscription: PartnerSubscription) => {
    if (subscription.plan_snapshot?.plan_name) {
      return subscription.plan_snapshot.plan_name;
    }
    const plan = allPlans.find(p => p.plan_id === subscription.plan_id);
    return plan?.plan_name || 'Paket tidak tersedia';
  };

  const getPlanDetails = (subscription: PartnerSubscription) => {
    if (subscription.plan_snapshot) {
      return {
        price: subscription.plan_snapshot.price,
        duration: subscription.plan_snapshot.duration_months
      };
    }
    const plan = allPlans.find(p => p.plan_id === subscription.plan_id);
    if (plan) {
      return {
        price: plan.price,
        duration: plan.duration_months
      };
    }
    return { price: 0, duration: 0 };
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        const allPartnersData = await fetchWithAuth('/partner');
        const allPartners = Array.isArray(allPartnersData) ? allPartnersData : [];
        const foundPartner = allPartners.find((p: Partner) => p.partner_id === partnerId);
        
        if (!foundPartner) {
          alert('Mitra tidak ditemukan');
          router.push('/platform/partners');
          return;
        }
        setPartner(foundPartner);

        const plansData = await fetchWithAuth('/subscription-plan');
        const plans = Array.isArray(plansData) ? plansData : [];
        setAvailablePlans(plans);
        setAllPlans(plans);

        try {
          const subsData = await fetchWithAuth(`/partner-subscription/partner/${partnerId}`);
          setSubscriptions(Array.isArray(subsData) ? subsData : []);
        } catch (error) {
          setSubscriptions([]);
        }

        try {
          const licensesData = await fetchWithAuth(`/license/partner/${partnerId}`);
          setLicenses(Array.isArray(licensesData) ? licensesData : []);
        } catch (error) {
          setLicenses([]);
        }

      } catch (error) {
        console.error('Error fetching partner details:', error);
        alert('Gagal memuat data mitra');
      } finally {
        setIsLoading(false);
      }
    };

    if (partnerId) fetchData();
  }, [partnerId, router]);

  const handleAddSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchWithAuth('/partner-subscription', {
        method: 'POST',
        body: JSON.stringify({
          partner_id: partnerId,
          plan_id: subForm.plan_id,
          start_date: new Date(subForm.start_date).toISOString(),
          payment_status: subForm.payment_status
        }),
      });
      
      alert('Paket langganan berhasil ditambahkan!');
      setIsSubModalOpen(false);
      
      const subsData = await fetchWithAuth(`/partner-subscription/partner/${partnerId}`);
      setSubscriptions(Array.isArray(subsData) ? subsData : []);

      setSubForm({
        plan_id: '',
        start_date: new Date().toISOString().split('T')[0],
        payment_status: 'Paid'
      });
    } catch (error: any) {
      alert(error.message || 'Gagal menambahkan langganan');
    }
  };

  const handleOpenEdit = () => {
    if (partner) {
      setEditForm({
        business_name: partner.business_name,
        business_email: partner.business_email,
        business_phone: partner.business_phone
      });
      setIsEditModalOpen(true);
    }
  };

  const handleEditPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchWithAuth(`/partner/${partnerId}`, {
        method: 'PUT',
        body: JSON.stringify(editForm),
      });

      alert('Data mitra berhasil diperbarui!');
      setIsEditModalOpen(false);

      const allPartnersData = await fetchWithAuth('/partner');
      const allPartners = Array.isArray(allPartnersData) ? allPartnersData : [];
      const updatedPartner = allPartners.find((p: Partner) => p.partner_id === partnerId);
      if (updatedPartner) {
        setPartner(updatedPartner);
      }
    } catch (error: any) {
      alert(error.message || 'Gagal memperbarui data mitra');
    }
  };

  if (isLoading) {
    return <DetailSkeleton />; // ✅ Use skeleton
  }

  if (!partner) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">Mitra tidak ditemukan</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8 @container">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.push('/platform/partners')}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        <span className="hidden @sm:inline">Kembali ke Daftar Mitra</span>
        <span className="@sm:hidden">Kembali</span>
      </Button>

      {/* Partner Info Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 @md:flex-row @md:items-center @md:justify-between">
            <div>
              <CardTitle className="text-2xl @md:text-3xl">{partner.business_name}</CardTitle>
              <CardDescription className="mt-2">
                <Badge variant={partner.status === 'Active' ? 'default' : 'destructive'}>
                  {partner.status === 'Active' ? 'Aktif' : 'Ditangguhkan'}
                </Badge>
              </CardDescription>
            </div>
            
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" onClick={handleOpenEdit} className="w-full @md:w-auto">
                  <Edit2 className="mr-2 h-4 w-4" />
                  <span className="hidden @sm:inline">Edit Data Mitra</span>
                  <span className="@sm:hidden">Edit</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleEditPartner}>
                  <DialogHeader>
                    <DialogTitle>Edit Data Mitra</DialogTitle>
                    <DialogDescription>
                      Perubahan data akan langsung diterapkan setelah disimpan.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="business_name">Nama Bisnis <span className="text-destructive">*</span></Label>
                      <Input
                        id="business_name"
                        required
                        value={editForm.business_name}
                        onChange={(e) => setEditForm({...editForm, business_name: e.target.value})}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="business_email">Email Bisnis <span className="text-destructive">*</span></Label>
                      <Input
                        id="business_email"
                        type="email"
                        required
                        value={editForm.business_email}
                        onChange={(e) => setEditForm({...editForm, business_email: e.target.value})}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="business_phone">Nomor Telepon <span className="text-destructive">*</span></Label>
                      <Input
                        id="business_phone"
                        required
                        value={editForm.business_phone}
                        onChange={(e) => setEditForm({...editForm, business_phone: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Batal</Button>
                    </DialogClose>
                    <Button type="submit">Simpan Perubahan</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4 grid-cols-1 @md:grid-cols-3">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium text-sm @md:text-base break-all">{partner.business_email}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Telepon</p>
              <p className="font-medium text-sm @md:text-base">{partner.business_phone}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Bergabung</p>
              <p className="font-medium text-sm @md:text-base">
                {new Date(partner.joined_date).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 @md:flex-row @md:items-center @md:justify-between">
            <div>
              <CardTitle>Riwayat Langganan</CardTitle>
              <CardDescription>
                Daftar paket langganan yang pernah atau sedang aktif
              </CardDescription>
            </div>
            
            <Dialog open={isSubModalOpen} onOpenChange={setIsSubModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full @md:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  <span className="hidden @sm:inline">Tetapkan Paket Baru</span>
                  <span className="@sm:hidden">Tambah Paket</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleAddSubscription}>
                  <DialogHeader>
                    <DialogTitle>Tetapkan Paket Langganan</DialogTitle>
                    <DialogDescription>
                      Tanggal selesai akan dihitung otomatis berdasarkan durasi paket.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="plan_id">Pilih Paket <span className="text-destructive">*</span></Label>
                      <select
                        id="plan_id"
                        required
                        value={subForm.plan_id}
                        onChange={(e) => setSubForm({...subForm, plan_id: e.target.value})}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">-- Pilih Paket --</option>
                        {availablePlans.map(plan => (
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
                        value={subForm.start_date}
                        onChange={(e) => setSubForm({...subForm, start_date: e.target.value})}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="payment_status">Status Pembayaran <span className="text-destructive">*</span></Label>
                      <select
                        id="payment_status"
                        value={subForm.payment_status}
                        onChange={(e) => setSubForm({...subForm, payment_status: e.target.value})}
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
                    <Button type="submit">Simpan Transaksi</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent>
          {subscriptions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Belum ada riwayat langganan
            </div>
          ) : (
            <div className="@container/subs">
              {/* Desktop Table */}
              <div className="hidden @lg/subs:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Paket</TableHead>
                      <TableHead>Harga & Durasi</TableHead>
                      <TableHead>Tanggal Mulai</TableHead>
                      <TableHead>Tanggal Selesai</TableHead>
                      <TableHead>Pembayaran</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions.map((sub) => {
                      const planDetails = getPlanDetails(sub);
                      return (
                        <TableRow key={sub.subscription_id}>
                          <TableCell className="font-medium">
                            {getPlanName(sub)}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-semibold flex items-center gap-1">
                                {formatRupiah(planDetails.price)}
                              </div>
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {planDetails.duration} bulan
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {new Date(sub.start_date).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </TableCell>
                          <TableCell className="text-sm">
                            {new Date(sub.end_date).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </TableCell>
                          <TableCell>
                            <Badge variant={sub.payment_status === 'Paid' ? 'default' : 'secondary'}>
                              {sub.payment_status === 'Paid' ? (
                                <><CheckCircle className="mr-1 h-3 w-3" /> Lunas</>
                              ) : (
                                <><Clock className="mr-1 h-3 w-3" /> Menunggu</>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={sub.status === 'Active' ? 'default' : 'outline'}>
                              {sub.status === 'Active' ? 'Aktif' : 'Tidak Aktif'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card List */}
              <div className="@lg/subs:hidden space-y-4">
                {subscriptions.map((sub) => {
                  const planDetails = getPlanDetails(sub);
                  return (
                    <Card key={sub.subscription_id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-base">{getPlanName(sub)}</CardTitle>
                          <Badge variant={sub.status === 'Active' ? 'default' : 'outline'}>
                            {sub.status === 'Active' ? 'Aktif' : 'Tidak Aktif'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Harga:</span>
                          <span className="font-semibold">{formatRupiah(planDetails.price)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Durasi:</span>
                          <span className="font-medium">{planDetails.duration} bulan</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Mulai:</span>
                          <span>{new Date(sub.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Selesai:</span>
                          <span>{new Date(sub.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Pembayaran:</span>
                          <Badge variant={sub.payment_status === 'Paid' ? 'default' : 'secondary'}>
                            {sub.payment_status === 'Paid' ? 'Lunas' : 'Menunggu'}
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

      {/* Licenses Card */}
      <Card>
        <CardHeader>
          <CardTitle>Pemantauan Lisensi Perangkat</CardTitle>
          <CardDescription>
            Daftar perangkat yang terdaftar untuk mitra ini
          </CardDescription>
        </CardHeader>

        <CardContent>
          {licenses.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Belum ada lisensi perangkat
            </div>
          ) : (
            <div className="@container/license">
              {/* Desktop Table */}
              <div className="hidden @lg/license:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kode Aktivasi</TableHead>
                      <TableHead>ID Perangkat</TableHead>
                      <TableHead>Nama Perangkat</TableHead>
                      <TableHead>Cabang</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {licenses.map((lic) => (
                      <TableRow key={lic.license_id}>
                        <TableCell>
                          <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
                            {lic.activation_code}
                          </code>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {lic.device_id || '-'}
                        </TableCell>
                        <TableCell className="font-medium">
                          {lic.device_name || '-'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {lic.branch?.branch_name || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              lic.license_status === 'Active' ? 'default' :
                              lic.license_status === 'Assigned' ? 'secondary' : 'outline'
                            }
                          >
                            {lic.license_status === 'Active' ? 'Aktif' : 
                             lic.license_status === 'Assigned' ? 'Dialokasikan' : 'Menunggu'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card List */}
              <div className="@lg/license:hidden space-y-4">
                {licenses.map((lic) => (
                  <Card key={lic.license_id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Key className="h-4 w-4 text-muted-foreground" />
                            <code className="text-xs font-mono font-semibold bg-muted px-2 py-1 rounded">
                              {lic.activation_code}
                            </code>
                          </div>
                        </div>
                        <Badge 
                          variant={
                            lic.license_status === 'Active' ? 'default' :
                            lic.license_status === 'Assigned' ? 'secondary' : 'outline'
                          }
                        >
                          {lic.license_status === 'Active' ? 'Aktif' : 
                           lic.license_status === 'Assigned' ? 'Dialokasikan' : 'Menunggu'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Device ID:</span>
                        <span className="font-medium">{lic.device_id || '-'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Nama:</span>
                        <span className="font-medium">{lic.device_name || '-'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Cabang:</span>
                        <span className="font-medium">{lic.branch?.branch_name || '-'}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}