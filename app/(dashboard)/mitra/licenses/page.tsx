'use client';

import { useState, useEffect } from 'react';
import { licenseAPI, branchAPI } from '@/lib/api';
import CardSkeleton from '@/components/skeletons/CardSkeleton';
import TableSkeleton from '@/components/skeletons/TableSkeleton';
import { License, Branch } from '@/types/mitra';
import { 
  Plus, 
  Loader2, 
  AlertCircle,
  Key,
  CheckCircle,
  Clock,
  XCircle,
  RotateCcw,
  Building2,
  Smartphone,
  X
} from 'lucide-react';

export default function LicensesPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [generateQuantity, setGenerateQuantity] = useState('1');
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [licensesData, branchesData] = await Promise.all([
        licenseAPI.getAll(),
        branchAPI.getAll(),
      ]);
      
      const branchesList = Array.isArray(branchesData) ? branchesData : [];
      const licensesList = Array.isArray(licensesData) ? licensesData : [];
      
      // Map licenses dengan branch data dan calculated status
      const licensesWithBranch = licensesList.map(license => {
        const branch = branchesList.find(b => b.branch_id === license.branch_id);
        
        // Calculate actual status based on conditions
        let actualStatus = 'Pending';
        
        if (license.device_name && license.device_id) {
          // Jika perangkat sudah ada, status = Aktif
          actualStatus = 'Active';
        } else if (branch || license.branch_id) {
          // Jika cabang sudah ada tapi perangkat belum, status = Dialokasikan
          actualStatus = 'Assigned';
        } else {
          // Jika cabang belum ada, status = Pending
          actualStatus = 'Pending';
        }
        
        return {
          ...license,
          branch: branch || null,
          license_status: actualStatus as any
        };
      });
      
      setLicenses(licensesWithBranch);
      setBranches(branchesList);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data lisensi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateLicense = async () => {
    setIsSubmitting(true);
    try {
      await licenseAPI.generate(parseInt(generateQuantity));
      await loadData();
      setIsGenerateModalOpen(false);
      setGenerateQuantity('1');
      alert(`Berhasil generate ${generateQuantity} lisensi baru!`);
    } catch (err: any) {
      alert(err.message || 'Gagal generate lisensi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignBranch = async () => {
    if (!selectedLicense || !selectedBranchId) return;
    
    setIsSubmitting(true);
    try {
      await licenseAPI.assignBranch(selectedLicense.activation_code, selectedBranchId);
      await loadData();
      setIsAssignModalOpen(false);
      setSelectedLicense(null);
      setSelectedBranchId('');
      alert('Berhasil mengalokasikan lisensi ke cabang!');
    } catch (err: any) {
      alert(err.message || 'Gagal mengalokasikan lisensi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetDevice = async () => {
    if (!selectedLicense) return;
    
    setIsSubmitting(true);
    try {
      await licenseAPI.resetDevice(selectedLicense.activation_code);
      await loadData();
      setIsResetModalOpen(false);
      setSelectedLicense(null);
      alert('Berhasil reset perangkat! Lisensi dapat diaktifkan kembali.');
    } catch (err: any) {
      alert(err.message || 'Gagal reset perangkat');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAssignModal = (license: License) => {
    setSelectedLicense(license);
    setIsAssignModalOpen(true);
  };

  const openResetModal = (license: License) => {
    setSelectedLicense(license);
    setIsResetModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            <CheckCircle size={14} />
            Aktif
          </span>
        );
      case 'Assigned':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
            <Building2 size={14} />
            Dialokasikan
          </span>
        );
      case 'Pending':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
            <Clock size={14} />
            Pending
          </span>
        );
      case 'Inactive':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
            <XCircle size={14} />
            Tidak Aktif
          </span>
        );
      default:
        return <span className="text-sm text-gray-600">{status}</span>;
    }
  };

  // Helper function to get branch name
  const getBranchName = (license: License) => {
    if (license.branch) {
      return license.branch.branch_name;
    }
    if (license.branch_id) {
      const branch = branches.find(b => b.branch_id === license.branch_id);
      return branch ? branch.branch_name : 'Cabang tidak ditemukan';
    }
    return null;
  };

  const filteredLicenses = filterStatus === 'all' 
    ? licenses 
    : licenses.filter(l => l.license_status === filterStatus);

  const stats = {
    total: licenses.length,
    active: licenses.filter(l => l.license_status === 'Active').length,
    assigned: licenses.filter(l => l.license_status === 'Assigned').length,
    pending: licenses.filter(l => l.license_status === 'Pending').length,
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-9 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-5 w-80 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="h-12 w-40 bg-gray-200 rounded-xl animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <div className="h-16 w-full bg-gray-200 rounded-xl animate-pulse"></div>
        <TableSkeleton rows={5} columns={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manajemen Lisensi</h1>
          <p className="text-gray-600 mt-1">Kelola lisensi perangkat untuk cabang Anda</p>
        </div>
        <button
          onClick={() => setIsGenerateModalOpen(true)}
          className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-colors font-medium shadow-sm"
        >
          <Plus size={20} />
          Generate Lisensi
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Lisensi</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
            </div>
            <div className="bg-gray-100 p-3 rounded-lg">
              <Key className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Aktif</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.active}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Dialokasikan</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{stats.assigned}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Tersedia</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.pending}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-700">Filter:</span>
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === 'all'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setFilterStatus('Active')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === 'Active'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Aktif
          </button>
          <button
            onClick={() => setFilterStatus('Assigned')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === 'Assigned'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Dialokasikan
          </button>
          <button
            onClick={() => setFilterStatus('Pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === 'Pending'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pending
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                  Kode Aktivasi
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                  Status
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                  Cabang
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                  Perangkat
                </th>
                <th className="text-center py-4 px-6 text-sm font-semibold text-gray-700">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLicenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-500">
                    <Key size={48} className="mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">Tidak ada lisensi</p>
                    <p className="text-sm">
                      {filterStatus === 'all' 
                        ? 'Generate lisensi baru untuk memulai'
                        : `Tidak ada lisensi dengan status ${filterStatus}`
                      }
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLicenses.map((license) => {
                  const branchName = getBranchName(license);
                  
                  return (
                    <tr key={license.license_id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <Key size={20} className="text-indigo-600" />
                          </div>
                          <span className="font-mono font-semibold text-gray-900">
                            {license.activation_code}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {getStatusBadge(license.license_status)}
                      </td>
                      <td className="py-4 px-6">
                        {branchName ? (
                          <div className="flex items-center gap-2">
                            
                              <Building2 size={20} className="text-green-600" />
                           
                            <span className="text-sm font-medium text-gray-900">{branchName}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            
                              <Building2 size={20} className="text-gray-400" />
                            
                            <span className="text-sm text-gray-400 ">Belum dialokasikan</span>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        {license.device_name ? (
                          <div className="flex items-center gap-2">
                            
                              <Smartphone size={20} className="text-blue-600" />
                            
                            <div>
                              <p className="text-sm font-medium text-gray-900">{license.device_name}</p>
                              <p className="text-xs text-gray-500 font-mono">{license.device_id}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                           
                              <Smartphone size={20} className="text-gray-400" />
                           
                            <span className="text-sm text-gray-400 ">Belum diaktifkan</span>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-2">
                          {license.license_status === 'Pending' && (
                            <button
                              onClick={() => openAssignModal(license)}
                              className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                            >
                              Alokasikan
                            </button>
                          )}
                          {license.license_status === 'Active' && (
                            <button
                              onClick={() => openResetModal(license)}
                              className="px-3 py-1.5 text-sm bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors font-medium flex items-center gap-1"
                            >
                              <RotateCcw size={14} />
                              Reset
                            </button>
                          )}
                          {license.license_status === 'Assigned' && (
                            <span className="text-xs text-gray-500 italic">Menunggu aktivasi</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Modal */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Generate Lisensi Baru</h2>
              <button
                onClick={() => setIsGenerateModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jumlah Lisensi *
                </label>
                <input
                  type="number"
                  min="1"
                  value={generateQuantity}
                  onChange={(e) => setGenerateQuantity(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="1"
                />
              </div>
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  Lisensi yang dibuat akan berstatus <strong>Pending</strong> dan perlu dialokasikan ke cabang.
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setIsGenerateModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Batal
                </button>
                <button
                  onClick={handleGenerateLicense}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                  Generate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {isAssignModalOpen && selectedLicense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Alokasikan ke Cabang</h2>
              <button
                onClick={() => {
                  setIsAssignModalOpen(false);
                  setSelectedLicense(null);
                  setSelectedBranchId('');
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">Kode Aktivasi:</p>
                <p className="font-mono font-bold text-gray-900">{selectedLicense.activation_code}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pilih Cabang *
                </label>
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Pilih Cabang</option>
                  {branches.map((branch) => (
                    <option key={branch.branch_id} value={branch.branch_id}>
                      {branch.branch_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                <p className="text-sm text-yellow-800">
                  Setelah dialokasikan, status akan berubah menjadi <strong>Dialokasikan</strong> dan menunggu aktivasi perangkat.
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setIsAssignModalOpen(false);
                    setSelectedLicense(null);
                    setSelectedBranchId('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Batal
                </button>
                <button
                  onClick={handleAssignBranch}
                  disabled={isSubmitting || !selectedBranchId}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                  Alokasikan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {isResetModalOpen && selectedLicense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <RotateCcw size={32} className="text-orange-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Reset Perangkat?</h2>
              <p className="text-gray-600 mb-4">
                Kode: <strong className="font-mono">{selectedLicense.activation_code}</strong>
              </p>
              <p className="text-gray-600 mb-6">
                Perangkat yang terhubung akan diputus dan lisensi akan kembali ke status <strong>Dialokasikan</strong>, menunggu aktivasi perangkat baru.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIsResetModalOpen(false);
                    setSelectedLicense(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Batal
                </button>
                <button
                  onClick={handleResetDevice}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
