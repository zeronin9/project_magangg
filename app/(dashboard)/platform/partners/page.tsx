'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchWithAuth } from '@/lib/api';
import { Partner } from '@/types';
import { Users, Plus, Search, Loader2, Mail, Phone, Calendar, Building2 } from 'lucide-react';

export default function PartnerListPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    business_name: '',
    business_email: '',
    business_phone: '',
    username: '',
    password: ''
  });

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      setIsLoading(true);
      const data = await fetchWithAuth('/partner');
      setPartners(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching partners:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchWithAuth('/partner', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      alert('Akun Mitra dan Super Admin berhasil dibuat!');
      setIsModalOpen(false);
      fetchPartners();
      setFormData({ 
        business_name: '', 
        business_email: '', 
        business_phone: '', 
        username: '', 
        password: '' 
      });
    } catch (error: any) {
      alert(error.message || 'Gagal mendaftarkan mitra');
    }
  };

  // ✅ Handle Delete/Suspend
  const handleSuspend = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menonaktifkan mitra ini?')) return;
    try {
      await fetchWithAuth(`/partner/${id}`, {
        method: 'DELETE',
      });
      alert('Mitra berhasil dinonaktifkan');
      fetchPartners();
    } catch (error: any) {
      alert('Gagal menonaktifkan mitra');
    }
  };

  // ✅ NEW: Handle Activate (Reactivate suspended account)
  const handleActivate = async (id: string, partnerData: Partner) => {
    if (!confirm('Apakah Anda yakin ingin mengaktifkan kembali mitra ini?')) return;
    try {
      // Update status menjadi Active
      await fetchWithAuth(`/partner/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          business_name: partnerData.business_name,
          business_email: partnerData.business_email,
          business_phone: partnerData.business_phone,
          status: 'Active'  // Set status ke Active
        }),
      });
      alert('Mitra berhasil diaktifkan kembali!');
      fetchPartners();
    } catch (error: any) {
      alert(error.message || 'Gagal mengaktifkan mitra');
      console.error('Activation error:', error);
    }
  };

  const activePartners = partners.filter(p => p.status === 'Active').length;
  const suspendedPartners = partners.filter(p => p.status === 'Suspended').length;

  const filteredPartners = partners.filter(partner =>
    partner.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    partner.business_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    partner.business_phone.includes(searchTerm)
  );

  return (
    <div className="pb-10">
      
      {/* HEADER */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manajemen Mitra</h1>
          <p className="text-gray-600 mt-2 text-base">
            Kelola dan pantau semua mitra bisnis yang terdaftar
          </p>
        </div>
      </div>

      {/* PARTNERS TABLE */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Bar */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Cari mitra..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-gradient-to-r from-gray-100 to-gray-100 text-gray-800 px-6 py-3 rounded-xl hover:from-gray-400 hover:to-gray-400 hover:text-white transition font-semibold border border-gray-300 flex items-center gap-2 justify-center"
            >
              <Plus size={20} />
              Daftarkan Mitra Baru
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 size={40} className="animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-500">Memuat data mitra...</p>
            </div>
          </div>
        ) : filteredPartners.length === 0 ? (
          <div className="text-center py-20">
            <Users size={60} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg mb-4">
              {searchTerm ? 'Tidak ada mitra yang cocok dengan pencarian Anda' : 'Belum ada mitra yang terdaftar'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-gray-100 text-gray-800 px-6 py-3 rounded-xl hover:bg-gray-400 hover:text-white border border-gray-300 transition"
              >
                Daftarkan Mitra Pertama
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Nama Bisnis
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Informasi Kontak
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Tanggal Bergabung
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPartners.map((partner) => (
                  <tr key={partner.partner_id} className="hover:bg-gray-50 transition group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        
                        <span className="font-semibold text-gray-900">{partner.business_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail size={14} />
                          {partner.business_email}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone size={14} />
                          {partner.business_phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar size={14} />
                        {new Date(partner.joined_date).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className={`px-4 py-2 rounded-full text-xs font-bold ${
                        partner.status === 'Active' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {partner.status === 'Active' ? 'Aktif' : 'Ditangguhkan'}
                      </span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-3">
                        <Link 
                          href={`/platform/partners/${partner.partner_id}`} 
                          className="text-blue-600 hover:text-blue-800 font-semibold transition"
                        >
                          Lihat Detail
                        </Link>
                        <span className="text-gray-300">|</span>
                        
                        {/* ✅ Conditional buttons based on status */}
                        {partner.status === 'Active' ? (
                          <button 
                            onClick={() => handleSuspend(partner.partner_id)} 
                            className="text-red-600 hover:text-red-800 font-semibold transition"
                          >
                            Nonaktifkan
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleActivate(partner.partner_id, partner)} 
                            className="text-green-600 hover:text-green-800 font-semibold transition"
                          >
                            Aktifkan Kembali
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-8 py-6 flex justify-between items-center rounded-t-2xl">
              <h2 className="text-2xl font-bold text-gray-800">Daftarkan Mitra Baru</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition text-3xl leading-none"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Nama Bisnis <span className="text-red-500">*</span>
                </label>
                <input 
                  required 
                  type="text" 
                  value={formData.business_name} 
                  onChange={(e) => setFormData({...formData, business_name: e.target.value})} 
                  className="w-full border border-gray-300 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="Contoh: Kopi Kenangan"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Email Bisnis <span className="text-red-500">*</span>
                </label>
                <input 
                  required 
                  type="email" 
                  value={formData.business_email} 
                  onChange={(e) => setFormData({...formData, business_email: e.target.value})} 
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
                  value={formData.business_phone} 
                  onChange={(e) => setFormData({...formData, business_phone: e.target.value})} 
                  className="w-full border border-gray-300 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="08123456789"
                />
              </div>

              <div className="border-t pt-5 mt-5">
                
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Username <span className="text-red-500">*</span>
                    </label>
                    <input 
                      required 
                      type="text" 
                      value={formData.username} 
                      onChange={(e) => setFormData({...formData, username: e.target.value})} 
                      className="w-full border border-gray-300 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      placeholder="admin_username"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Kata Sandi <span className="text-red-500">*</span>
                    </label>
                    <input 
                      required 
                      type="password" 
                      value={formData.password} 
                      onChange={(e) => setFormData({...formData, password: e.target.value})} 
                      className="w-full border border-gray-300 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      placeholder="Minimal 6 karakter"
                      minLength={6}
                    />
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-5">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-bold border border-gray-300"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-6 py-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-bold border border-gray-300"
                >
                  Daftarkan Mitra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
