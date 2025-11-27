'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchWithAuth } from '@/lib/api';
import { formatRupiah } from '@/lib/formatters';
import { Partner, PartnerSubscription, License, SubscriptionPlan } from '@/types';
import { Edit2, Plus, CheckCircle, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function PartnerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const partnerId = params.id as string;

  // State Data
  const [partner, setPartner] = useState<Partner | null>(null);
  const [subscriptions, setSubscriptions] = useState<PartnerSubscription[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  const [allPlans, setAllPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State Modal Subscription
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [subForm, setSubForm] = useState({
    plan_id: '',
    start_date: new Date().toISOString().split('T')[0],
    payment_status: 'Paid'
  });

  // State Modal Edit Partner
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    business_name: '',
    business_email: '',
    business_phone: ''
  });

  // Helper function untuk mendapatkan nama plan
  const getPlanName = (subscription: PartnerSubscription) => {
    if (subscription.plan_snapshot?.plan_name) {
      return subscription.plan_snapshot.plan_name;
    }
    const plan = allPlans.find(p => p.plan_id === subscription.plan_id);
    if (plan) {
      return plan.plan_name;
    }
    return 'Paket tidak tersedia';
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

  // Fetch Data Awal
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

  // Handle Submit Subscription Baru
  const handleAddSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        partner_id: partnerId,
        plan_id: subForm.plan_id,
        start_date: new Date(subForm.start_date).toISOString(),
        payment_status: subForm.payment_status
      };

      await fetchWithAuth('/partner-subscription', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      
      alert('Paket langganan berhasil ditambahkan!');
      setIsSubModalOpen(false);
      
      try {
        const subsData = await fetchWithAuth(`/partner-subscription/partner/${partnerId}`);
        setSubscriptions(Array.isArray(subsData) ? subsData : []);
      } catch (error) {
        setSubscriptions([]);
      }

      setSubForm({
        plan_id: '',
        start_date: new Date().toISOString().split('T')[0],
        payment_status: 'Paid'
      });
      
    } catch (error: any) {
      alert(error.message || 'Gagal menambahkan langganan');
    }
  };

  // Handle Open Edit Modal
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

  // Handle Submit Edit Partner
  const handleEditPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        business_name: editForm.business_name,
        business_email: editForm.business_email,
        business_phone: editForm.business_phone
      };

      await fetchWithAuth(`/partner/${partnerId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      alert('Data mitra berhasil diperbarui!');
      setIsEditModalOpen(false);

      // Refresh partner data
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
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm sm:text-base">Memuat data mitra...</p>
        </div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="p-4 sm:p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Mitra tidak ditemukan
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-6 sm:pb-10 px-4 sm:px-0">
      {/* Back Button */}
      <button
        onClick={() => router.push('/platform/partners')}
        className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center space-x-2 text-sm sm:text-base"
      >
        <span>←</span>
        <span>Kembali ke Daftar Mitra</span>
      </button>

      {/* Header Detail */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2 break-words">{partner.business_name}</h1>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                partner.status === 'Active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {partner.status === 'Active' ? 'Aktif' : 'Ditangguhkan'}
              </span>
            </div>
          </div>
          
          {/* Edit Button with Dialog */}
          <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                onClick={handleOpenEdit}
                className="bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-400 font-semibold w-full sm:w-auto text-sm"
                size="sm"
              >
                <Edit2 size={14} className="mr-2" />
                Edit Data Mitra
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto mx-4">
              <form onSubmit={handleEditPartner}>
                <DialogHeader>
                  <DialogTitle className="text-lg sm:text-xl">Edit Data Mitra</DialogTitle>
                  <DialogDescription className="text-sm">
                    Perbarui informasi data mitra. Klik simpan untuk menyimpan perubahan.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-business-name" className="text-sm">
                      Nama Bisnis <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="edit-business-name"
                      type="text"
                      required
                      value={editForm.business_name}
                      onChange={(e) => setEditForm({...editForm, business_name: e.target.value})}
                      placeholder="Nama bisnis mitra"
                      className="text-sm"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-business-email" className="text-sm">
                      Email Bisnis <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="edit-business-email"
                      type="email"
                      required
                      value={editForm.business_email}
                      onChange={(e) => setEditForm({...editForm, business_email: e.target.value})}
                      placeholder="email@bisnis.com"
                      className="text-sm"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-business-phone" className="text-sm">
                      Nomor Telepon <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="edit-business-phone"
                      type="text"
                      required
                      value={editForm.business_phone}
                      onChange={(e) => setEditForm({...editForm, business_phone: e.target.value})}
                      placeholder="08123456789"
                      className="text-sm"
                    />
                  </div>
                  <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                    <p className="text-xs sm:text-sm text-blue-800">
                      <strong>Catatan:</strong> Perubahan data akan langsung diterapkan setelah disimpan.
                    </p>
                  </div>
                </div>
                <DialogFooter className="flex-col sm:flex-row gap-2">
                  <DialogClose asChild>
                    <Button type="button" variant="outline" className="w-full sm:w-auto text-sm">
                      Batal
                    </Button>
                  </DialogClose>
                  <Button type="submit" className="w-full sm:w-auto text-sm">Simpan Perubahan</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="flex items-center space-x-3 min-w-0">
            <span className="text-xl sm:text-2xl flex-shrink-0">📧</span>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-500">Email</p>
              <p className="font-medium text-gray-800 text-sm truncate" title={partner.business_email}>
                {partner.business_email}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3 min-w-0">
            <span className="text-xl sm:text-2xl flex-shrink-0">📞</span>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-500">Telepon</p>
              <p className="font-medium text-gray-800 text-sm">{partner.business_phone}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 min-w-0 sm:col-span-2 lg:col-span-1">
            <span className="text-xl sm:text-2xl flex-shrink-0">📅</span>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-500">Bergabung</p>
              <p className="font-medium text-gray-800 text-sm">
                {new Date(partner.joined_date).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Section Langganan */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Riwayat Langganan</h2>
          
          {/* Add Subscription Dialog */}
          <Dialog open={isSubModalOpen} onOpenChange={setIsSubModalOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-400 font-semibold w-full sm:w-auto text-sm"
                size="sm"
              >
                <Plus size={14} className="mr-2" />
                Tetapkan Paket Baru
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto mx-4">
              <form onSubmit={handleAddSubscription}>
                <DialogHeader>
                  <DialogTitle className="text-lg sm:text-xl">Tetapkan Paket Langganan</DialogTitle>
                  <DialogDescription className="text-sm">
                    Pilih paket langganan untuk mitra ini. Tanggal selesai akan dihitung otomatis.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="plan-select" className="text-sm">
                      Pilih Paket <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="plan-select"
                      required
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={subForm.plan_id}
                      onChange={(e) => setSubForm({...subForm, plan_id: e.target.value})}
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
                    <Label htmlFor="start-date" className="text-sm">
                      Tanggal Mulai <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="start-date"
                      type="date"
                      required
                      value={subForm.start_date}
                      onChange={(e) => setSubForm({...subForm, start_date: e.target.value})}
                      className="text-sm"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="payment-status" className="text-sm">
                      Status Pembayaran <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="payment-status"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={subForm.payment_status}
                      onChange={(e) => setSubForm({...subForm, payment_status: e.target.value})}
                    >
                      <option value="Paid">Lunas</option>
                      <option value="Pending">Menunggu</option>
                    </select>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                    <p className="text-xs sm:text-sm text-blue-800">
                      <strong>Catatan:</strong> Tanggal selesai akan dihitung otomatis berdasarkan durasi paket yang dipilih.
                    </p>
                  </div>
                </div>
                <DialogFooter className="flex-col sm:flex-row gap-2">
                  <DialogClose asChild>
                    <Button type="button" variant="outline" className="w-full sm:w-auto text-sm">
                      Batal
                    </Button>
                  </DialogClose>
                  <Button type="submit" className="w-full sm:w-auto text-sm">Simpan Transaksi</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Nama Paket
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Harga & Durasi
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider hidden md:table-cell">
                      Tanggal Mulai
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider hidden md:table-cell">
                      Tanggal Selesai
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Pembayaran
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider hidden lg:table-cell">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {subscriptions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 sm:px-6 py-8 text-center text-gray-500 text-sm">
                        Belum ada riwayat langganan
                      </td>
                    </tr>
                  ) : (
                    subscriptions.map((sub) => {
                      const planDetails = getPlanDetails(sub);
                      return (
                        <tr key={sub.subscription_id} className="hover:bg-gray-50 transition">
                          <td className="px-3 sm:px-6 py-4">
                            <div className="font-bold text-gray-900 text-sm break-words">
                              {getPlanName(sub)}
                            </div>
                            {/* Mobile: Show dates */}
                            <div className="md:hidden mt-2 space-y-1">
                              <div className="text-xs text-gray-500">
                                Mulai: {new Date(sub.start_date).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </div>
                              <div className="text-xs text-gray-500">
                                Selesai: {new Date(sub.end_date).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-4">
                            <div className="text-sm">
                              <div className="font-semibold text-gray-900 text-xs sm:text-sm break-words">
                                {formatRupiah(planDetails.price)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {planDetails.duration} bulan
                              </div>
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-4 text-sm text-gray-600 hidden md:table-cell">
                            {new Date(sub.start_date).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="px-3 sm:px-6 py-4 text-sm text-gray-600 hidden md:table-cell">
                            {new Date(sub.end_date).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="px-3 sm:px-6 py-4">
                            <div className="flex flex-col gap-2">
                              <span className={`inline-flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-1 sm:py-2 rounded-full text-xs font-bold ${
                                sub.payment_status === 'Paid' 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {sub.payment_status === 'Paid' ? <CheckCircle size={12} /> : <Clock size={12} />}
                                <span>{sub.payment_status === 'Paid' ? 'Lunas' : 'Pending'}</span>
                              </span>
                              {/* Mobile: Show status badge */}
                              <span className={`lg:hidden inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-bold ${
                                sub.payment_status === 'Paid' 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {sub.payment_status === 'Paid' ? 'Aktif' : 'Tidak Aktif'}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-4 hidden lg:table-cell">
                            <span className={`inline-flex px-4 py-2 rounded-full text-xs font-bold ${
                              sub.payment_status === 'Paid' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {sub.payment_status === 'Paid' ? 'Aktif' : 'Tidak Aktif'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Section Lisensi */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Pemantauan Lisensi Perangkat</h2>
        
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Kode Aktivasi
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider hidden md:table-cell">
                      ID Perangkat
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Nama Perangkat
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider hidden lg:table-cell">
                      Cabang
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {licenses.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 sm:px-6 py-8 text-center text-gray-500 text-sm">
                        Belum ada lisensi perangkat
                      </td>
                    </tr>
                  ) : (
                    licenses.map((lic) => {
                      // Helper function untuk menentukan status lisensi berdasarkan kondisi
                      const getLicenseStatus = () => {
                        const hasBranchName = lic.branch?.branch_name && lic.branch.branch_name !== '-';
                        const hasDeviceId = lic.device_id && lic.device_id !== '-';
                        const hasDeviceName = lic.device_name && lic.device_name !== '-';
                        
                        if (hasDeviceId && hasDeviceName) {
                          return {
                            status: 'Active',
                            label: 'Aktif',
                            className: 'bg-green-100 text-green-800'
                          };
                        }
                        
                        if (hasBranchName && !hasDeviceId && !hasDeviceName) {
                          return {
                            status: 'Assigned',
                            label: 'Dialokasikan',
                            className: 'bg-blue-100 text-blue-800'
                          };
                        }
                        
                        return {
                          status: 'Pending',
                          label: 'Menunggu',
                          className: 'bg-yellow-100 text-yellow-800'
                        };
                      };
                      
                      const licenseStatus = getLicenseStatus();
                      
                      return (
                        <tr key={lic.license_id} className="hover:bg-gray-50 transition">
                          <td className="px-3 sm:px-6 py-4">
                            <span className="font-mono text-xs sm:text-sm font-semibold text-indigo-600 bg-indigo-50 px-2 sm:px-3 py-1 rounded-lg break-all inline-block">
                              {lic.activation_code}
                            </span>
                          </td>
                          <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm text-gray-600 hidden md:table-cell">
                            {lic.device_id || '-'}
                          </td>
                          <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm font-medium text-gray-900">
                            <div className="break-words">{lic.device_name || '-'}</div>
                            {/* Mobile: Show additional info */}
                            <div className="md:hidden mt-1 text-xs text-gray-500">
                              ID: {lic.device_id || '-'}
                            </div>
                            <div className="lg:hidden mt-1 text-xs text-gray-500 break-words">
                              Cabang: {lic.branch?.branch_name || '-'}
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm text-gray-600 hidden lg:table-cell">
                            <div className="break-words">{lic.branch?.branch_name || '-'}</div>
                          </td>
                          <td className="px-3 sm:px-6 py-4">
                            <span className={`inline-flex px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${licenseStatus.className}`}>
                              {licenseStatus.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
