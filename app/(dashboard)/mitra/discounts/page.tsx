'use client';

import { useState, useEffect } from 'react';
import { discountAPI, productAPI, categoryAPI } from '@/lib/api';
import TableSkeleton from '@/components/skeletons/TableSkeleton';
import { DiscountRule, Product, Category } from '@/types/mitra';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Loader2, 
  AlertCircle,
  Tag,
  Percent,
  Calendar,
  X
} from 'lucide-react';

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<DiscountRule[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState<DiscountRule | null>(null);
  const [formData, setFormData] = useState({
    discount_name: '',
    discount_code: '',
    discount_type: 'PERCENTAGE',
    value: '',
    applies_to: 'ENTIRE_TRANSACTION',
    min_transaction_amount: '',
    max_transaction_amount: '',
    min_item_quantity: '',
    max_item_quantity: '',
    max_discount_amount: '',
    start_date: '',
    end_date: '',
    product_ids: [] as string[],
    category_ids: [] as string[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [discountsData, productsData, categoriesData] = await Promise.all([
        discountAPI.getAll(),
        productAPI.getAll(),
        categoryAPI.getAll(),
      ]);
      setDiscounts(Array.isArray(discountsData) ? discountsData : []);
      setProducts(Array.isArray(productsData) ? productsData : []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data diskon');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (discount?: DiscountRule) => {
    if (discount) {
      setSelectedDiscount(discount);
      setFormData({
        discount_name: discount.discount_name,
        discount_code: discount.discount_code || '',
        discount_type: discount.discount_type,
        value: discount.value,
        applies_to: discount.applies_to,
        min_transaction_amount: discount.min_transaction_amount || '',
        max_transaction_amount: discount.max_transaction_amount || '',
        min_item_quantity: discount.min_item_quantity?.toString() || '',
        max_item_quantity: discount.max_item_quantity?.toString() || '',
        max_discount_amount: discount.max_discount_amount || '',
        start_date: discount.start_date ? new Date(discount.start_date).toISOString().slice(0, 16) : '',
        end_date: discount.end_date ? new Date(discount.end_date).toISOString().slice(0, 16) : '',
        product_ids: discount.product_ids || [],
        category_ids: discount.category_ids || [],
      });
    } else {
      setSelectedDiscount(null);
      setFormData({
        discount_name: '',
        discount_code: '',
        discount_type: 'PERCENTAGE',
        value: '',
        applies_to: 'ENTIRE_TRANSACTION',
        min_transaction_amount: '',
        max_transaction_amount: '',
        min_item_quantity: '',
        max_item_quantity: '',
        max_discount_amount: '',
        start_date: '',
        end_date: '',
        product_ids: [],
        category_ids: [],
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDiscount(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const dataToSend: any = {
        discount_name: formData.discount_name,
        discount_code: formData.discount_code || null,
        discount_type: formData.discount_type,
        value: parseInt(formData.value),
        applies_to: formData.applies_to,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString(),
        product_ids: formData.product_ids,
        category_ids: formData.category_ids,
      };

      // Optional fields
      if (formData.min_transaction_amount) {
        dataToSend.min_transaction_amount = parseInt(formData.min_transaction_amount);
      }
      if (formData.max_transaction_amount) {
        dataToSend.max_transaction_amount = parseInt(formData.max_transaction_amount);
      }
      if (formData.min_item_quantity) {
        dataToSend.min_item_quantity = parseInt(formData.min_item_quantity);
      }
      if (formData.max_item_quantity) {
        dataToSend.max_item_quantity = parseInt(formData.max_item_quantity);
      }
      if (formData.max_discount_amount) {
        dataToSend.max_discount_amount = parseInt(formData.max_discount_amount);
      }

      if (selectedDiscount) {
        await discountAPI.update(selectedDiscount.discount_rule_id, dataToSend);
      } else {
        await discountAPI.create(dataToSend);
      }
      
      await loadData();
      handleCloseModal();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan diskon');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDiscount) return;
    
    setIsSubmitting(true);
    try {
      await discountAPI.delete(selectedDiscount.discount_rule_id);
      await loadData();
      setIsDeleteModalOpen(false);
      setSelectedDiscount(null);
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus diskon');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteModal = (discount: DiscountRule) => {
    setSelectedDiscount(discount);
    setIsDeleteModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getDiscountDisplay = (discount: DiscountRule) => {
    if (discount.discount_type === 'PERCENTAGE') {
      return `${discount.value}%`;
    } else {
      return `Rp ${parseInt(discount.value).toLocaleString('id-ID')}`;
    }
  };

  const isDiscountActive = (discount: DiscountRule) => {
    const now = new Date();
    const start = new Date(discount.start_date);
    const end = new Date(discount.end_date);
    return now >= start && now <= end;
  };

  // Filter discounts: General (branch_id = null) dan Local
  const generalDiscounts = discounts.filter(disc => disc.branch_id === null);
  const localDiscounts = discounts.filter(disc => disc.branch_id !== null);

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
      <div className="h-24 w-full bg-gray-200 rounded-xl animate-pulse"></div>
      <TableSkeleton rows={5} columns={6} />
    </div>
  );
}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manajemen Diskon</h1>
          <p className="text-gray-600 mt-1">Kelola aturan diskon general untuk semua cabang</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-colors font-medium shadow-sm"
        >
          <Plus size={20} />
          Tambah Diskon
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
            <p className="font-medium text-blue-900">Diskon General</p>
            <p className="text-sm text-blue-700 mt-1">
              Diskon yang Anda buat di sini akan tersedia untuk semua cabang. 
              Admin cabang dapat mengaktifkan/menonaktifkan atau mengubah nilai diskon sesuai kebutuhan cabang mereka.
            </p>
          </div>
        </div>
      </div>

      {/* General Discounts */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">Diskon General</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                  Nama Diskon
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                  Kode
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                  Nilai
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                  Periode
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                  Status
                </th>
                <th className="text-center py-4 px-6 text-sm font-semibold text-gray-700">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {generalDiscounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">
                    <Tag size={48} className="mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">Belum ada diskon general</p>
                    <p className="text-sm">Tambahkan diskon pertama Anda</p>
                  </td>
                </tr>
              ) : (
                generalDiscounts.map((discount) => (
                  <tr key={discount.discount_rule_id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                          <Tag size={20} className="text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{discount.discount_name}</p>
                          <p className="text-xs text-gray-500 capitalize">
                            {discount.applies_to.replace(/_/g, ' ').toLowerCase()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {discount.discount_code ? (
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-mono font-semibold">
                          {discount.discount_code}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">Otomatis</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <Percent size={16} className="text-green-600" />
                        <span className="font-semibold text-green-600">
                          {getDiscountDisplay(discount)}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar size={16} />
                        <div>
                          <p>{formatDate(discount.start_date)}</p>
                          <p>{formatDate(discount.end_date)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {isDiscountActive(discount) ? (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          Aktif
                        </span>
                      ) : new Date() < new Date(discount.start_date) ? (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                          Terjadwal
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                          Berakhir
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenModal(discount)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => openDeleteModal(discount)}
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

      {/* Local Discounts (Read Only) */}
      {localDiscounts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Diskon Lokal Cabang</h2>
            <p className="text-sm text-gray-600 mt-1">Diskon yang dibuat oleh admin cabang</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                    Nama Diskon
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                    Cabang
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                    Nilai
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {localDiscounts.map((discount) => (
                  <tr key={discount.discount_rule_id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                          <Tag size={20} className="text-orange-600" />
                        </div>
                        <span className="font-medium text-gray-900">{discount.discount_name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-gray-600">Cabang Lokal</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-semibold text-green-600">
                        {getDiscountDisplay(discount)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {isDiscountActive(discount) ? (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          Aktif
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                          Tidak Aktif
                        </span>
                      )}
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
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedDiscount ? 'Edit Diskon' : 'Tambah Diskon'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Diskon *
                  </label>
                  <input
                    type="text"
                    value={formData.discount_name}
                    onChange={(e) => setFormData({ ...formData, discount_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Contoh: Promo Akhir Tahun"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kode Diskon (Opsional)
                  </label>
                  <input
                    type="text"
                    value={formData.discount_code}
                    onChange={(e) => setFormData({ ...formData, discount_code: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="GAJIAN25"
                  />
                  <p className="text-xs text-gray-500 mt-1">Kosongkan untuk diskon otomatis</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipe Diskon *
                  </label>
                  <select
                    value={formData.discount_type}
                    onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="PERCENTAGE">Persentase (%)</option>
                    <option value="FIXED_AMOUNT">Nominal (Rp)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nilai Diskon *
                  </label>
                  <input
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder={formData.discount_type === 'PERCENTAGE' ? '20' : '50000'}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Berlaku Untuk *
                  </label>
                  <select
                    value={formData.applies_to}
                    onChange={(e) => setFormData({ ...formData, applies_to: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="ENTIRE_TRANSACTION">Seluruh Transaksi</option>
                    <option value="SPECIFIC_PRODUCTS">Produk Tertentu</option>
                    <option value="SPECIFIC_CATEGORIES">Kategori Tertentu</option>
                  </select>
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tanggal Mulai *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tanggal Berakhir *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Conditions */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="font-semibold text-gray-900 mb-3">Syarat & Ketentuan (Opsional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Min. Total Transaksi
                    </label>
                    <input
                      type="number"
                      value={formData.min_transaction_amount}
                      onChange={(e) => setFormData({ ...formData, min_transaction_amount: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="50000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max. Total Transaksi
                    </label>
                    <input
                      type="number"
                      value={formData.max_transaction_amount}
                      onChange={(e) => setFormData({ ...formData, max_transaction_amount: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="200000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Min. Jumlah Item
                    </label>
                    <input
                      type="number"
                      value={formData.min_item_quantity}
                      onChange={(e) => setFormData({ ...formData, min_item_quantity: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max. Jumlah Item
                    </label>
                    <input
                      type="number"
                      value={formData.max_item_quantity}
                      onChange={(e) => setFormData({ ...formData, max_item_quantity: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="10"
                    />
                  </div>

                  {formData.discount_type === 'PERCENTAGE' && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max. Potongan Harga
                      </label>
                      <input
                        type="number"
                        value={formData.max_discount_amount}
                        onChange={(e) => setFormData({ ...formData, max_discount_amount: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="50000"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Catatan:</strong> Diskon ini akan tersedia untuk semua cabang. 
                  Admin cabang dapat mengaktifkan/menonaktifkan atau mengubah nilai diskon.
                </p>
              </div>

              <div className="flex gap-3 pt-4 sticky bottom-0 bg-white pb-2">
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
                  {selectedDiscount ? 'Update' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedDiscount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={32} className="text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Hapus Diskon?</h2>
              <p className="text-gray-600 mb-6">
                Apakah Anda yakin ingin menghapus diskon <strong>{selectedDiscount.discount_name}</strong>? 
                Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setSelectedDiscount(null);
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
