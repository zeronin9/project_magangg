'use client';

import { useState, useEffect } from 'react';
import { branchAdminAPI, branchAPI } from '@/lib/api';
import { BranchAdmin, Branch } from '@/types/mitra';
import TableSkeleton from '@/components/skeletons/TableSkeleton';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Loader2, 
  AlertCircle,
  Users,
  Building2,
  User,
  X
} from 'lucide-react';

export default function BranchAdminsPage() {
  const [admins, setAdmins] = useState<BranchAdmin[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<BranchAdmin | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    password: '',
    branch_id: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [adminsData, branchesData] = await Promise.all([
        branchAdminAPI.getAll(),
        branchAPI.getAll(),
      ]);
      
      const branchesList = Array.isArray(branchesData) ? branchesData : [];
      const adminsList = Array.isArray(adminsData) ? adminsData : [];
      
      // Map admins dengan branch data
      const adminsWithBranch = adminsList.map(admin => {
        const branch = branchesList.find(b => b.branch_id === admin.branch_id);
        return {
          ...admin,
          branch: branch || null
        };
      });
      
      setAdmins(adminsWithBranch);
      setBranches(branchesList);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data admin cabang');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (admin?: BranchAdmin) => {
    if (admin) {
      setSelectedAdmin(admin);
      setFormData({
        full_name: admin.full_name,
        username: admin.username,
        password: '',
        branch_id: admin.branch_id,
      });
    } else {
      setSelectedAdmin(null);
      setFormData({
        full_name: '',
        username: '',
        password: '',
        branch_id: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAdmin(null);
    setFormData({
      full_name: '',
      username: '',
      password: '',
      branch_id: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (selectedAdmin) {
        const updateData: any = {
          full_name: formData.full_name,
          username: formData.username,
        };
        if (formData.password) {
          updateData.password = formData.password;
        }
        await branchAdminAPI.update(selectedAdmin.user_id, updateData);
      } else {
        await branchAdminAPI.create(formData);
      }
      await loadData();
      handleCloseModal();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan admin cabang');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAdmin) return;
    
    setIsSubmitting(true);
    try {
      await branchAdminAPI.delete(selectedAdmin.user_id);
      await loadData();
      setIsDeleteModalOpen(false);
      setSelectedAdmin(null);
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus admin cabang');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteModal = (admin: BranchAdmin) => {
    setSelectedAdmin(admin);
    setIsDeleteModalOpen(true);
  };

  // Helper function untuk mendapatkan nama cabang
  const getBranchName = (branchId: string) => {
    const branch = branches.find(b => b.branch_id === branchId);
    return branch ? branch.branch_name : 'Tidak ada cabang';
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
        <TableSkeleton rows={5} columns={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Cabang</h1>
          <p className="text-gray-600 mt-1">Kelola admin untuk setiap cabang</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-colors font-medium shadow-sm"
        >
          <Plus size={20} />
          Tambah Admin
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                  Nama Lengkap
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                  Username
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                  Cabang
                </th>
                <th className="text-center py-4 px-6 text-sm font-semibold text-gray-700">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {admins.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-gray-500">
                    <Users size={48} className="mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">Belum ada admin cabang</p>
                    <p className="text-sm">Tambahkan admin pertama Anda</p>
                  </td>
                </tr>
              ) : (
                admins.map((admin) => {
                  const branchName = admin.branch?.branch_name || getBranchName(admin.branch_id);
                  
                  return (
                    <tr key={admin.user_id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <User size={20} className="text-blue-600" />
                          </div>
                          <span className="font-medium text-gray-900">{admin.full_name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-sm text-gray-600">{admin.username}</span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          
                            <Building2 size={20} className={
                              branchName === 'Tidak ada cabang' ? 'text-gray-400' : 'text-gray-500'
                            } />
                          
                          <span className={`text-sm font-medium ${
                            branchName === 'Tidak ada cabang' ? 'text-gray-400 italic' : 'text-gray-900'
                          }`}>
                            {branchName}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenModal(admin)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => openDeleteModal(admin)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus"
                          >
                            <Trash2 size={18} />
                          </button>
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

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedAdmin ? 'Edit Admin Cabang' : 'Tambah Admin Cabang'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username *
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password {selectedAdmin && '(Kosongkan jika tidak ingin mengubah)'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required={!selectedAdmin}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cabang *
                </label>
                <select
                  value={formData.branch_id}
                  onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                  disabled={!!selectedAdmin}
                >
                  <option value="">Pilih Cabang</option>
                  {branches.map((branch) => (
                    <option key={branch.branch_id} value={branch.branch_id}>
                      {branch.branch_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                  {selectedAdmin ? 'Update' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={32} className="text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Hapus Admin?</h2>
              <p className="text-gray-600 mb-6">
                Apakah Anda yakin ingin menghapus admin <strong>{selectedAdmin.full_name}</strong>? 
                Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setSelectedAdmin(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Batal
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                  Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
