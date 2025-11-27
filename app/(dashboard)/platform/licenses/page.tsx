'use client';

import { useEffect, useState } from 'react';
import { fetchWithAuth } from '@/lib/api';
import { Partner, License } from '@/types';
import { Smartphone, Search, AlertCircle, Loader2, CheckCircle, Clock, Key } from 'lucide-react';

export default function LicensesPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');
  const [licenses, setLicenses] = useState<License[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadPartners();
  }, []);

  const loadPartners = async () => {
    try {
      const data = await fetchWithAuth('/partner');
      setPartners(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading partners:', error);
    }
  };

  const loadLicenses = async (partnerId: string) => {
    try {
      setIsLoading(true);
      const data = await fetchWithAuth(`/license/partner/${partnerId}`);
      setLicenses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading licenses:', error);
      setLicenses([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePartnerChange = (partnerId: string) => {
    setSelectedPartnerId(partnerId);
    if (partnerId) {
      loadLicenses(partnerId);
    } else {
      setLicenses([]);
    }
  };

  const determineStatus = (license: License): 'Active' | 'Assigned' | 'Pending' => {
    if (license.device_id && license.device_id.trim() !== '') {
      return 'Active';
    }
    if (license.branch_id && license.branch_id.trim() !== '') {
      return 'Assigned';
    }
    return 'Pending';
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      Active: { 
        color: 'text-green-600', 
        bg: 'bg-green-50', 
        border: 'border-green-200',
        icon: CheckCircle, 
        label: 'Aktif' 
      },
      Assigned: { 
        color: 'text-blue-600', 
        bg: 'bg-blue-50', 
        border: 'border-blue-200',
        icon: Clock, 
        label: 'Dialokasikan' 
      },
      Pending: { 
        color: 'text-yellow-600', 
        bg: 'bg-yellow-50', 
        border: 'border-yellow-200',
        icon: Key, 
        label: 'Pending' 
      },
    };
    return configs[status as keyof typeof configs] || configs.Pending;
  };

  const activeCount = licenses.filter(l => determineStatus(l) === 'Active').length;
  const assignedCount = licenses.filter(l => determineStatus(l) === 'Assigned').length;
  const pendingCount = licenses.filter(l => determineStatus(l) === 'Pending').length;

  const filteredLicenses = licenses.filter(license =>
    license.activation_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    license.device_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    license.branch?.branch_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    // Container utama - Padding konsisten
    <div className="pb-10">
      
      {/* HEADER - Margin bottom konsisten: mb-8 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Pemantauan Lisensi</h1>
        <p className="text-gray-600 mt-2 text-base">
          Lacak dan kelola lisensi perangkat di semua mitra
        </p>
      </div>

      {/* PARTNER SELECTOR - Padding konsisten: p-6, margin: mb-8 */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm mb-8">
        <label className="block text-sm font-bold text-gray-700 mb-3">
          Pilih Mitra untuk Melihat Lisensi
        </label>
        <div className="relative">
          <select
            value={selectedPartnerId}
            onChange={(e) => handlePartnerChange(e.target.value)}
            className="w-full md:w-1/2 border border-gray-300 p-4 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition appearance-none font-medium text-gray-700"
          >
            <option value="">-- Pilih Mitra --</option>
            {partners.map(partner => (
              <option key={partner.partner_id} value={partner.partner_id}>
                {partner.business_name} ({partner.status === 'Active' ? 'Aktif' : 'Ditangguhkan'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedPartnerId && (
        <>
          {/* LEGEND - Padding konsisten: p-6, margin: mb-8 */}
          <div className="mb-8 bg-gradient-to-r from-gray-100 to-gray-100 border border-gray-200 p-6 rounded-2xl">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle size={20} />
              Informasi Status Lisensi
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              
              {/* Card 1 - Padding konsisten: p-4 */}
              <div className="flex items-start gap-3 bg-white p-4 rounded-xl border border-green-200">
                <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                  <CheckCircle size={18} className="text-green-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 mb-1">Aktif</p>
                  <p className="text-gray-600 text-xs leading-relaxed">
                    Cabang sudah dialokasikan dan perangkat sudah diaktifkan (Device ID tersedia)
                  </p>
                </div>
              </div>
              
              {/* Card 2 - Padding konsisten: p-4 */}
              <div className="flex items-start gap-3 bg-white p-4 rounded-xl border border-blue-200">
                <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                  <Clock size={18} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 mb-1">Dialokasikan</p>
                  <p className="text-gray-600 text-xs leading-relaxed">
                    Sudah ditugaskan ke cabang tapi perangkat belum diaktifkan
                  </p>
                </div>
              </div>
              
              {/* Card 3 - Padding konsisten: p-4 */}
              <div className="flex items-start gap-3 bg-white p-4 rounded-xl border border-yellow-200">
                <div className="p-2 bg-yellow-100 rounded-lg flex-shrink-0">
                  <Key size={18} className="text-yellow-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 mb-1">Pending</p>
                  <p className="text-gray-600 text-xs leading-relaxed">
                    Belum dialokasikan ke cabang manapun, tersedia untuk ditugaskan
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* LICENSES TABLE */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            
            {/* Table Header Section - Padding konsisten: p-6 */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-gray-900">Detail Lisensi</h2>
                
                {/* Search Bar */}
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Cari berdasarkan kode, perangkat, atau cabang..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
              </div>
            </div>
            
            {/* Table Body */}
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <Loader2 size={40} className="animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-500">Memuat lisensi...</p>
                </div>
              </div>
            ) : filteredLicenses.length === 0 ? (
              <div className="text-center py-20">
                <Smartphone size={60} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg">
                  {searchTerm ? 'Tidak ada lisensi yang cocok dengan pencarian' : 'Tidak ada lisensi tersedia untuk mitra ini'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  
                  {/* Table Header - Padding konsisten: px-6 py-4 */}
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Kode Aktivasi
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Cabang
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Informasi Perangkat
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  
                  {/* Table Body - Padding konsisten: px-6 py-5 */}
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredLicenses.map((license) => {
                      const actualStatus = determineStatus(license);
                      const statusConfig = getStatusConfig(actualStatus);
                      const StatusIcon = statusConfig.icon;
                      
                      return (
                        <tr key={license.license_id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-5 whitespace-nowrap">
                            <span className="font-mono text-sm font-semibold text-indigo-600 bg-indigo-50 px-3 py-2 rounded-3xl border border-indigo-200">
                              {license.activation_code}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <div className="text-sm">
                              {license.branch?.branch_name ? (
                                <div className="font-semibold text-gray-900 flex items-center gap-2">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  {license.branch.branch_name}
                                </div>
                              ) : (
                                <span className="text-gray-400">Belum Dialokasikan</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="text-sm">
                              {license.device_id && license.device_id.trim() !== '' ? (
                                <>
                                  <div className="font-semibold text-gray-900">
                                    {license.device_name || 'Nama tidak tersedia'}
                                  </div>
                                  <div className="text-gray-500 text-xs mt-1 font-mono">
                                    ID: {license.device_id}
                                  </div>
                                </>
                              ) : (
                                <span className="text-gray-400">Belum Diaktifkan</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border ${statusConfig.bg} ${statusConfig.color} ${statusConfig.border}`}>
                              <StatusIcon size={16} />
                              {statusConfig.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </>
      )}
    </div>
  );
}
