'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchWithAuth } from '@/lib/api';
import { Partner } from '@/types';
import { Users, Plus, Search, Loader2, Mail, Phone, Calendar } from 'lucide-react';
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

  const handleActivate = async (id: string, partnerData: Partner) => {
    if (!confirm('Apakah Anda yakin ingin mengaktifkan kembali mitra ini?')) return;
    try {
      await fetchWithAuth(`/partner/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          business_name: partnerData.business_name,
          business_email: partnerData.business_email,
          business_phone: partnerData.business_phone,
          status: 'Active'
        }),
      });
      alert('Mitra berhasil diaktifkan kembali!');
      fetchPartners();
    } catch (error: any) {
      alert(error.message || 'Gagal mengaktifkan mitra');
      console.error('Activation error:', error);
    }
  };

  const filteredPartners = partners.filter(partner =>
    partner.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    partner.business_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    partner.business_phone.includes(searchTerm)
  );

  return (
    <div className="pb-6 sm:pb-10 px-4 sm:px-0">
      
      {/* HEADER */}
      <div className="mb-6 sm:mb-8 flex flex-col gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Manajemen Mitra</h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">
            Kelola dan pantau semua mitra bisnis yang terdaftar
          </p>
        </div>
      </div>

      {/* PARTNERS TABLE */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Search Bar */}
            <div className="relative w-full">
              <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Cari mitra..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 text-sm sm:text-base bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
            
            {/* Dialog Daftarkan Mitra Baru */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline"
                  className="bg-gradient-to-r from-gray-100 to-gray-100 text-gray-800 hover:from-gray-400 hover:to-gray-400 hover:text-white border-gray-300 font-semibold w-full sm:w-auto text-sm"
                  size="sm"
                >
                  <Plus size={18} className="mr-2" />
                  Daftarkan Mitra Baru
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto mx-4">
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle className="text-lg sm:text-xl">Daftarkan Mitra Baru</DialogTitle>
                    <DialogDescription className="text-sm">
                      Isi formulir di bawah untuk mendaftarkan mitra baru beserta akun super admin.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="business_name" className="text-sm">
                        Nama Bisnis <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="business_name"
                        type="text"
                        required
                        value={formData.business_name}
                        onChange={(e) => setFormData({...formData, business_name: e.target.value})}
                        placeholder="Contoh: Kopi Kenangan"
                        className="text-sm"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="business_email" className="text-sm">
                        Email Bisnis <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="business_email"
                        type="email"
                        required
                        value={formData.business_email}
                        onChange={(e) => setFormData({...formData, business_email: e.target.value})}
                        placeholder="email@bisnis.com"
                        className="text-sm"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="business_phone" className="text-sm">
                        Nomor Telepon <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="business_phone"
                        type="text"
                        required
                        value={formData.business_phone}
                        onChange={(e) => setFormData({...formData, business_phone: e.target.value})}
                        placeholder="08123456789"
                        className="text-sm"
                      />
                    </div>
                    
                    <div className="border-t pt-4 mt-2">
                      <p className="text-sm font-semibold text-gray-700 mb-3">Akun Super Admin</p>
                      <div className="space-y-4">
                        <div className="grid gap-2">
                          <Label htmlFor="username" className="text-sm">
                            Username <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="username"
                            type="text"
                            required
                            value={formData.username}
                            onChange={(e) => setFormData({...formData, username: e.target.value})}
                            placeholder="admin_username"
                            className="text-sm"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="password" className="text-sm">
                            Kata Sandi <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="password"
                            type="password"
                            required
                            minLength={6}
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                            placeholder="Minimal 6 karakter"
                            className="text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <DialogFooter className="flex-col sm:flex-row gap-2">
                    <DialogClose asChild>
                      <Button type="button" variant="outline" className="w-full sm:w-auto text-sm">
                        Batal
                      </Button>
                    </DialogClose>
                    <Button type="submit" className="w-full sm:w-auto text-sm">Daftarkan Mitra</Button>
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
              <p className="text-gray-500 text-sm">Memuat data mitra...</p>
            </div>
          </div>
        ) : filteredPartners.length === 0 ? (
          <div className="text-center py-16 sm:py-20 px-4">
            <Users size={48} className="sm:w-16 sm:h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-base sm:text-lg mb-4">
              {searchTerm ? 'Tidak ada mitra yang cocok dengan pencarian Anda' : 'Belum ada mitra yang terdaftar'}
            </p>
            {!searchTerm && (
              <Button
                onClick={() => setIsModalOpen(true)}
                variant="outline"
                className="bg-gray-100 text-gray-800 hover:bg-gray-400 hover:text-white border-gray-300 text-sm"
                size="sm"
              >
                Daftarkan Mitra Pertama
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Nama Bisnis
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider hidden md:table-cell">
                    Informasi Kontak
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider hidden lg:table-cell">
                    Tanggal Bergabung
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPartners.map((partner) => (
                  <tr key={partner.partner_id} className="hover:bg-gray-50 transition group">
                    <td className="px-4 sm:px-6 py-4 sm:py-5">
                      <div className="flex flex-col gap-2">
                        <span className="font-semibold text-gray-900 text-sm sm:text-base break-words">{partner.business_name}</span>
                        {/* Mobile: Show contact info */}
                        <div className="md:hidden space-y-1">
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Mail size={12} />
                            <span className="truncate">{partner.business_email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Phone size={12} />
                            {partner.business_phone}
                          </div>
                        </div>
                        {/* Mobile: Show join date */}
                        <div className="lg:hidden flex items-center gap-2 text-xs text-gray-500">
                          <Calendar size={12} />
                          {new Date(partner.joined_date).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 sm:py-5 hidden md:table-cell">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail size={14} />
                          <span className="truncate max-w-[200px]">{partner.business_email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone size={14} />
                          {partner.business_phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 sm:py-5 whitespace-nowrap hidden lg:table-cell">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar size={14} />
                        {new Date(partner.joined_date).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 sm:py-5 whitespace-nowrap">
                      <span className={`px-2 sm:px-4 py-1 sm:py-2 rounded-full text-xs font-bold ${
                        partner.status === 'Active' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {partner.status === 'Active' ? 'Aktif' : 'Ditangguhkan'}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 sm:py-5 whitespace-nowrap text-xs sm:text-sm font-medium">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                        <Link 
                          href={`/platform/partners/${partner.partner_id}`} 
                          className="text-blue-600 hover:text-blue-800 font-semibold transition"
                        >
                          Detail
                        </Link>
                        <span className="text-gray-300 hidden sm:inline">|</span>
                        
                        {partner.status === 'Active' ? (
                          <button 
                            onClick={() => handleSuspend(partner.partner_id)} 
                            className="text-red-600 hover:text-red-800 font-semibold transition text-left"
                          >
                            Nonaktifkan
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleActivate(partner.partner_id, partner)} 
                            className="text-green-600 hover:text-green-800 font-semibold transition text-left"
                          >
                            Aktifkan
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
    </div>
  );
}
