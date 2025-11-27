'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchWithAuth } from '@/lib/api';
import { Partner, PartnerSubscription, License, SubscriptionPlan } from '@/types';
import { Edit2 } from 'lucide-react';
import { ShoppingBag, Plus, Search, Loader2, DollarSign, Users, Calendar, CheckCircle, Clock } from 'lucide-react';

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data mitra...</p>
        </div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Mitra tidak ditemukan
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Back Button */}
      <button
        onClick={() => router.push('/platform/partners')}
        className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center space-x-2"
      >
        <span>←</span>
        <span>Kembali ke Daftar Mitra</span>
      </button>

      {/* Header Detail */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{partner.business_name}</h1>
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
          
          {/* Edit Button */}
          <button
            onClick={handleOpenEdit}
            className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-200  transition font-semibold flex items-center gap-2 border border-gray-400"
          >
            <Edit2 size={16} />
            Edit Data Mitra
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">📧</span>
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="font-medium text-gray-800">{partner.business_email}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-2xl">📞</span>
            <div>
              <p className="text-xs text-gray-500">Telepon</p>
              <p className="font-medium text-gray-800">{partner.business_phone}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-2xl">📅</span>
            <div>
              <p className="text-xs text-gray-500">Bergabung</p>
              <p className="font-medium text-gray-800">
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
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Riwayat Langganan</h2>
          <button 
            onClick={() => setIsSubModalOpen(true)}
            className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-200  transition font-semibold border border-gray-400"
          >
            + Tetapkan Paket Baru
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Nama Paket
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Harga & Durasi
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Tanggal Mulai
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Tanggal Selesai
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Pembayaran
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Belum ada riwayat langganan
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => {
                  const planDetails = getPlanDetails(sub);
                  return (
                    <tr key={sub.subscription_id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-gray-900">
                          {getPlanName(sub)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="font-semibold text-gray-900">
                            Rp {planDetails.price.toLocaleString('id-ID')}
                          </div>
                          <div className="text-xs text-gray-500">
                            {planDetails.duration} bulan
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(sub.start_date).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(sub.end_date).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold ${
                          sub.payment_status === 'Paid' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {sub.payment_status === 'Paid' ? <CheckCircle size={14} /> : <Clock size={14} />}
                          {sub.payment_status === 'Paid' ? 'Lunas' : 'Upgraded'}
                        </span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className={`px-4 py-2 rounded-full text-xs font-bold ${
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

      {/* Section Lisensi */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Pemantauan Lisensi Perangkat</h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Kode Aktivasi
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  ID Perangkat
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Nama Perangkat
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Cabang
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {licenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Belum ada lisensi perangkat
                  </td>
                </tr>
              ) : (
                licenses.map((lic) => (
                  <tr key={lic.license_id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
                        {lic.activation_code}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {lic.device_id || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {lic.device_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {lic.branch?.branch_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        lic.license_status === 'Active' 
                          ? 'bg-green-100 text-green-800' 
                          : lic.license_status === 'Assigned' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {lic.license_status === 'Active' ? 'Aktif' : 
                         lic.license_status === 'Assigned' ? 'Dialokasikan' : 'Menunggu'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Edit Partner */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-8 py-6 flex justify-between items-center rounded-t-2xl">
              <h2 className="text-2xl font-bold text-gray-800">Edit Data Mitra</h2>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition text-3xl leading-none"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleEditPartner} className="p-8 space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Nama Bisnis <span className="text-red-500">*</span>
                </label>
                <input 
                  required 
                  type="text"
                  value={editForm.business_name}
                  onChange={(e) => setEditForm({...editForm, business_name: e.target.value})}
                  className="w-full border border-gray-300 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="Nama bisnis mitra"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Email Bisnis <span className="text-red-500">*</span>
                </label>
                <input 
                  required 
                  type="email"
                  value={editForm.business_email}
                  onChange={(e) => setEditForm({...editForm, business_email: e.target.value})}
                  className="w-full border border-gray-300 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="email@bisnis.com"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Nomor Telepon <span className="text-red-500">*</span>
                </label>
                <input 
                  required 
                  type="text"
                  value={editForm.business_phone}
                  onChange={(e) => setEditForm({...editForm, business_phone: e.target.value})}
                  className="w-full border border-gray-300 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="08123456789"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Catatan:</strong> Perubahan data akan langsung diterapkan setelah disimpan.
                </p>
              </div>

              <div className="flex space-x-3 pt-5">
                <button 
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 px-6 py-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-bold border border-gray-400"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-6 py-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-bold border border-gray-400"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah Subscription */}
      {isSubModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-8 py-6 flex justify-between items-center rounded-t-2xl">
              <h2 className="text-2xl font-bold text-gray-800">Tetapkan Paket Langganan</h2>
              <button 
                onClick={() => setIsSubModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition text-3xl leading-none"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleAddSubscription} className="p-8 space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Pilih Paket <span className="text-red-500">*</span>
                </label>
                <select 
                  required 
                  className="w-full border border-gray-300 p-4 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  value={subForm.plan_id}
                  onChange={(e) => setSubForm({...subForm, plan_id: e.target.value})}
                >
                  <option value="">-- Pilih Paket --</option>
                  {availablePlans.map(plan => (
                    <option key={plan.plan_id} value={plan.plan_id}>
                      {plan.plan_name} - Rp {plan.price.toLocaleString('id-ID')} ({plan.duration_months} bulan)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Tanggal Mulai <span className="text-red-500">*</span>
                </label>
                <input 
                  type="date" 
                  required 
                  value={subForm.start_date}
                  onChange={(e) => setSubForm({...subForm, start_date: e.target.value})}
                  className="w-full border border-gray-300 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" 
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Status Pembayaran <span className="text-red-500">*</span>
                </label>
                <select 
                  value={subForm.payment_status}
                  onChange={(e) => setSubForm({...subForm, payment_status: e.target.value})}
                  className="w-full border border-gray-300 p-4 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                >
                  <option value="Paid">Lunas</option>
                  <option value="Pending">Menunggu</option>
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Catatan:</strong> Tanggal selesai akan dihitung otomatis berdasarkan durasi paket yang dipilih.
                </p>
              </div>

              <div className="flex space-x-3 pt-5">
                <button 
                  type="button"
                  onClick={() => setIsSubModalOpen(false)}
                  className="flex-1 px-6 py-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-bold border border-gray-400"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-6 py-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-bold border border-gray-400"
                >
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
