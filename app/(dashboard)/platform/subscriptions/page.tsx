'use client';

import { useEffect, useState } from 'react';
import { fetchWithAuth } from '@/lib/api';
import { formatRupiah } from '@/lib/formatters';
import { Partner, SubscriptionPlan } from '@/types';
import { ShoppingBag, Plus, Search, Loader2, Calendar, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SubscriptionData {
  subscription_id: string;
  partner_id: string;
  plan_id: string;
  start_date: string;
  end_date: string;
  payment_status: string;
  status: string;
  partner?: {
    business_name: string;
  };
  plan_snapshot?: {
    plan_name: string;
    price: number;
    duration_months: number;
  };
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [summary, setSummary] = useState({
    total_subscriptions_record: 0,
    currently_active_partners: 0,
    total_revenue: '0'
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    partner_id: '',
    plan_id: '',
    start_date: new Date().toISOString().split('T')[0],
    payment_status: 'Paid'
  });

  // Helper function untuk mendapatkan plan details
  const getPlanDetails = (subscription: SubscriptionData) => {
    if (subscription.plan_snapshot?.plan_name && subscription.plan_snapshot?.price) {
      return {
        plan_name: subscription.plan_snapshot.plan_name,
        price: subscription.plan_snapshot.price,
        duration_months: subscription.plan_snapshot.duration_months
      };
    }
    
    const plan = plans.find(p => p.plan_id === subscription.plan_id);
    if (plan) {
      return {
        plan_name: plan.plan_name,
        price: plan.price,
        duration_months: plan.duration_months
      };
    }
    
    return {
      plan_name: 'N/A',
      price: 0,
      duration_months: 0
    };
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      const plansData = await fetchWithAuth('/subscription-plan');
      const allPlans = Array.isArray(plansData) ? plansData : [];
      setPlans(allPlans);
      
      const [subsData, partnersData] = await Promise.all([
        fetchWithAuth('/partner-subscription'),
        fetchWithAuth('/partner'),
      ]);

      if (subsData && typeof subsData === 'object') {
        const subscriptionsArray = Array.isArray(subsData.data) ? subsData.data : [];
        
        if (subscriptionsArray.length > 0) {
          console.log('📊 Sample Subscription Data:', subscriptionsArray[0]);
          console.log('📦 Available Plans:', allPlans);
        }
        
        setSubscriptions(subscriptionsArray);
        setSummary(subsData.summary || { 
          total_subscriptions_record: 0, 
          currently_active_partners: 0, 
          total_revenue: '0' 
        });
      } else {
        setSubscriptions([]);
      }

      setPartners(Array.isArray(partnersData) ? partnersData : []);
      
    } catch (error) {
      console.error('Error loading subscriptions:', error);
      setSubscriptions([]);
      setPartners([]);
      setPlans([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const payload = {
        partner_id: formData.partner_id,
        plan_id: formData.plan_id,
        start_date: new Date(formData.start_date).toISOString(),
        payment_status: formData.payment_status
      };

      if (!payload.partner_id || !payload.plan_id || !payload.start_date) {
        alert('Partner ID, Plan ID, dan tanggal mulai wajib diisi');
        return;
      }

      const response = await fetchWithAuth('/partner-subscription', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (response) {
        alert('Langganan berhasil ditambahkan!');
        setIsModalOpen(false);
        loadData();
        resetForm();
      }
      
    } catch (error: any) {
      if (error.message) {
        alert(error.message);
      } else {
        alert('Gagal menambahkan langganan. Pastikan semua data terisi dengan benar.');
      }
      console.error('Subscription error:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      partner_id: '',
      plan_id: '',
      start_date: new Date().toISOString().split('T')[0],
      payment_status: 'Paid'
    });
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const planDetails = getPlanDetails(sub);
    return (
      sub.partner?.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      planDetails.plan_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="pb-6 sm:pb-10 px-4 sm:px-0">
      
      {/* HEADER */}
      <div className="mb-6 sm:mb-8 flex flex-col gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Langganan Mitra</h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">
            Kelola penugasan langganan dan lacak pendapatan
          </p>
        </div>
      </div>

      
      {/* SUBSCRIPTIONS TABLE */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex flex-col gap-3 sm:gap-4">
            
            {/* Search Bar */}
            <div className="relative w-full">
              <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Cari berdasarkan mitra atau paket..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 text-sm sm:text-base bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
            
            {/* Dialog Tetapkan Langganan Baru */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline"
                  className="bg-gradient-to-r from-gray-100 to-gray-100 text-gray-800 hover:from-gray-200 hover:to-gray-200 border-gray-400 font-semibold w-full sm:w-auto text-sm"
                  size="sm"
                >
                  <Plus size={18} className="mr-2" />
                  Tetapkan Langganan Baru
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto mx-4">
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle className="text-lg sm:text-xl">Tetapkan Langganan Baru</DialogTitle>
                    <DialogDescription className="text-sm">
                      Pilih mitra dan paket langganan. Tanggal selesai akan dihitung otomatis.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="partner-select" className="text-sm">
                        Pilih Mitra <span className="text-red-500">*</span>
                      </Label>
                      <select
                        id="partner-select"
                        required
                        value={formData.partner_id}
                        onChange={(e) => setFormData({...formData, partner_id: e.target.value})}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="">-- Pilih Mitra --</option>
                        {partners.filter(p => p.status === 'Active').map(partner => (
                          <option key={partner.partner_id} value={partner.partner_id}>
                            {partner.business_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="plan-select-sub" className="text-sm">
                        Pilih Paket <span className="text-red-500">*</span>
                      </Label>
                      <select
                        id="plan-select-sub"
                        required
                        value={formData.plan_id}
                        onChange={(e) => setFormData({...formData, plan_id: e.target.value})}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                      <Label htmlFor="start-date-sub" className="text-sm">
                        Tanggal Mulai <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="start-date-sub"
                        type="date"
                        required
                        value={formData.start_date}
                        onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                        className="text-sm"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="payment-status-sub" className="text-sm">
                        Status Pembayaran <span className="text-red-500">*</span>
                      </Label>
                      <select
                        id="payment-status-sub"
                        value={formData.payment_status}
                        onChange={(e) => setFormData({...formData, payment_status: e.target.value})}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                    <Button type="submit" className="w-full sm:w-auto text-sm">Tetapkan Langganan</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-16 sm:py-20">
            <div className="text-center">
              <Loader2 size={36} className="animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-500 text-sm">Memuat langganan...</p>
            </div>
          </div>
        ) : filteredSubscriptions.length === 0 ? (
          <div className="text-center py-16 sm:py-20 px-4">
            <ShoppingBag size={48} className="sm:w-16 sm:h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-base sm:text-lg mb-4">
              {searchTerm ? 'Tidak ada langganan yang ditemukan' : 'Belum ada transaksi langganan'}
            </p>
            {!searchTerm && (
              <Button
                onClick={() => setIsModalOpen(true)}
                variant="outline"
                className="bg-gray-100 text-gray-800 hover:bg-gray-400 hover:text-white border-gray-300 text-sm"
                size="sm"
              >
                <Plus size={18} className="mr-2" />
                Buat Langganan Pertama
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-600 uppercase">Mitra</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-600 uppercase">Paket</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-600 uppercase hidden md:table-cell">Harga</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-600 uppercase hidden lg:table-cell">Periode</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-600 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSubscriptions.map((sub) => {
                  const planDetails = getPlanDetails(sub);
                  
                  return (
                    <tr key={sub.subscription_id} className="hover:bg-gray-50 transition">
                      <td className="px-3 sm:px-6 py-4 sm:py-5 font-semibold text-gray-900 text-sm break-words">
                        {sub.partner?.business_name || 'N/A'}
                      </td>
                      <td className="px-3 sm:px-6 py-4 sm:py-5">
                        <div>
                          <div className="font-semibold text-gray-900 text-sm break-words">
                            {planDetails.plan_name}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <Calendar size={12} />
                            {planDetails.duration_months} bulan
                          </div>
                          {/* Mobile: Show price */}
                          <div className="md:hidden text-xs font-bold text-gray-900 mt-1">
                            {formatRupiah(planDetails.price)}
                          </div>
                          {/* Mobile/Tablet: Show dates */}
                          <div className="lg:hidden mt-2 space-y-1">
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
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 sm:py-5 font-bold text-gray-900 text-sm hidden md:table-cell">
                        {formatRupiah(planDetails.price)}
                      </td>
                      <td className="px-3 sm:px-6 py-4 sm:py-5 hidden lg:table-cell">
                        <div className="text-sm">
                          <div className="text-gray-900 font-medium">
                            {new Date(sub.start_date).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </div>
                          <div className="text-xs text-gray-500">
                            s/d {new Date(sub.end_date).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 sm:py-5">
                        <div className="space-y-2">
                          <span className={`inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1 sm:py-2 rounded-full text-xs font-bold ${
                            sub.payment_status === 'Paid' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {sub.payment_status === 'Paid' ? <CheckCircle size={12} /> : <Clock size={12} />}
                            <span className="hidden sm:inline">{sub.payment_status === 'Paid' ? 'Lunas' : 'Upgraded'}</span>
                          </span>
                          <div>
                            <span className={`inline-flex px-2 sm:px-4 py-1 sm:py-2 rounded-full text-xs font-bold ${
                              sub.payment_status === 'Paid' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {sub.payment_status === 'Paid' ? 'Aktif' : 'Tidak Aktif'}
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
