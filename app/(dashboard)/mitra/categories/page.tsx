'use client';

import { useState, useEffect } from 'react';
import { categoryAPI } from '@/lib/api';
import TableSkeleton from '@/components/skeletons/TableSkeleton';
import { Category } from '@/types/mitra';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Loader2, 
  AlertCircle,
  FolderTree,
  Tag,
  X
} from 'lucide-react';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    category_name: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      const data = await categoryAPI.getAll();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data kategori');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setSelectedCategory(category);
      setFormData({
        category_name: category.category_name,
      });
    } else {
      setSelectedCategory(null);
      setFormData({
        category_name: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCategory(null);
    setFormData({
      category_name: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (selectedCategory) {
        await categoryAPI.update(selectedCategory.category_id, formData);
      } else {
        await categoryAPI.create(formData);
      }
      await loadCategories();
      handleCloseModal();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan kategori');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;
    
    setIsSubmitting(true);
    try {
      await categoryAPI.delete(selectedCategory.category_id);
      await loadCategories();
      setIsDeleteModalOpen(false);
      setSelectedCategory(null);
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus kategori');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteModal = (category: Category) => {
    setSelectedCategory(category);
    setIsDeleteModalOpen(true);
  };

  // Filter categories: General (branch_id = null) dan Local
  const generalCategories = categories.filter(cat => cat.branch_id === null);
  const localCategories = categories.filter(cat => cat.branch_id !== null);

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
      <div className="h-24 w-full bg-gray-200 rounded-xl animate-pulse mb-6"></div>
      <TableSkeleton rows={5} columns={3} />
    </div>
  );
}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manajemen Kategori</h1>
          <p className="text-gray-600 mt-1">Kelola kategori produk general untuk semua cabang</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-colors font-medium shadow-sm"
        >
          <Plus size={20} />
          Tambah Kategori
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
        <div className="flex items-start gap-3">
          <Tag className="text-blue-600 mt-0.5" size={20} />
          <div>
            <p className="font-medium text-blue-900">Kategori General</p>
            <p className="text-sm text-blue-700 mt-1">
              Kategori yang Anda buat di sini akan tersedia untuk semua cabang. 
              Admin cabang juga dapat membuat kategori lokal khusus untuk cabang mereka.
            </p>
          </div>
        </div>
      </div>

      {/* General Categories */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">Kategori General</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                  Nama Kategori
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                  Tipe
                </th>
                <th className="text-center py-4 px-6 text-sm font-semibold text-gray-700">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {generalCategories.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-12 text-gray-500">
                    <FolderTree size={48} className="mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">Belum ada kategori general</p>
                    <p className="text-sm">Tambahkan kategori pertama Anda</p>
                  </td>
                </tr>
              ) : (
                generalCategories.map((category) => (
                  <tr key={category.category_id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <FolderTree size={20} className="text-purple-600" />
                        </div>
                        <span className="font-medium text-gray-900">{category.category_name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        General
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenModal(category)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => openDeleteModal(category)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Local Categories (Read Only) */}
      {localCategories.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Kategori Lokal Cabang</h2>
            <p className="text-sm text-gray-600 mt-1">Kategori yang dibuat oleh admin cabang</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                    Nama Kategori
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                    Cabang
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                    Tipe
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {localCategories.map((category) => (
                  <tr key={category.category_id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                          <FolderTree size={20} className="text-orange-600" />
                        </div>
                        <span className="font-medium text-gray-900">{category.category_name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-gray-600">
                        {category.branch?.branch_name || '-'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                        Lokal
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedCategory ? 'Edit Kategori' : 'Tambah Kategori'}
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
                  Nama Kategori *
                </label>
                <input
                  type="text"
                  value={formData.category_name}
                  onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Contoh: Minuman, Makanan, Snack"
                  required
                />
              </div>
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Catatan:</strong> Kategori ini akan tersedia untuk semua cabang Anda.
                </p>
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
                  {selectedCategory ? 'Update' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={32} className="text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Hapus Kategori?</h2>
              <p className="text-gray-600 mb-6">
                Apakah Anda yakin ingin menghapus kategori <strong>{selectedCategory.category_name}</strong>? 
                Tindakan ini tidak dapat dibatalkan dan akan mempengaruhi produk yang menggunakan kategori ini.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setSelectedCategory(null);
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
