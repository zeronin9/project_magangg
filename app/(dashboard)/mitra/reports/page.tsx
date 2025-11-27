'use client';

import { useState, useEffect } from 'react';
import { reportAPI, branchAPI } from '@/lib/api';
import TableSkeleton from '@/components/skeletons/TableSkeleton';
import CardSkeleton from '@/components/skeletons/CardSkeleton';
import { Branch } from '@/types/mitra';
import { 
  Loader2, 
  AlertCircle,
  FileText,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Calendar,
  Download,
  Filter
} from 'lucide-react';

export default function ReportsPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [reportType, setReportType] = useState<'sales' | 'expenses' | 'items'>('sales');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: '',
  });
  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadBranches();
    
    // Set default date range (current month)
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    setDateRange({
      start: firstDay.toISOString().split('T')[0],
      end: lastDay.toISOString().split('T')[0],
    });
  }, []);

  const loadBranches = async () => {
    try {
      const data = await branchAPI.getAll();
      setBranches(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error loading branches:', err);
    }
  };

  const handleGenerateReport = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const params: any = {};
      
      if (selectedBranchId) {
        params.branchId = selectedBranchId;
      }
      if (dateRange.start) {
        params.tanggalMulai = dateRange.start;
      }
      if (dateRange.end) {
        params.tanggalSelesai = dateRange.end;
      }

      let data;
      switch (reportType) {
        case 'sales':
          data = await reportAPI.getSales(params);
          break;
        case 'expenses':
          data = await reportAPI.getExpenses(params);
          break;
        case 'items':
          data = await reportAPI.getItems(params);
          break;
        default:
          data = await reportAPI.getSales(params);
      }
      
      setReportData(data);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat laporan');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: string | number) => {
    return 'Rp ' + parseInt(value.toString()).toLocaleString('id-ID');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Laporan</h1>
        <p className="text-gray-600 mt-1">Lihat laporan penjualan, pengeluaran, dan item terlaris</p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} className="text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Filter Laporan</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipe Laporan
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="sales">Penjualan</option>
              <option value="expenses">Pengeluaran</option>
              <option value="items">Item Terlaris</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cabang
            </label>
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Semua Cabang</option>
              {branches.map((branch) => (
                <option key={branch.branch_id} value={branch.branch_id}>
                  {branch.branch_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tanggal Mulai
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tanggal Selesai
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleGenerateReport}
            disabled={isLoading}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Memuat...
              </>
            ) : (
              <>
                <FileText size={18} />
                Generate Laporan
              </>
            )}
          </button>
        </div>
      </div>

      {/* Report Content */}
      {reportData && (
        <div className="space-y-6">
          {/* Summary Cards */}
          {reportType === 'sales' && reportData.summary && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Penjualan</p>
                    <p className="text-2xl font-bold text-green-600 mt-2">
                      {formatCurrency(reportData.summary.total_sales || 0)}
                    </p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-lg">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Jumlah Transaksi</p>
                    <p className="text-2xl font-bold text-blue-600 mt-2">
                      {reportData.summary.transaction_count || 0}
                    </p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <ShoppingCart className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Diskon</p>
                    <p className="text-2xl font-bold text-orange-600 mt-2">
                      {formatCurrency(reportData.summary.total_discount || 0)}
                    </p>
                  </div>
                  <div className="bg-orange-100 p-3 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Pajak</p>
                    <p className="text-2xl font-bold text-purple-600 mt-2">
                      {formatCurrency(reportData.summary.total_tax || 0)}
                    </p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <FileText className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Data Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Detail Laporan</h2>
              <button
                onClick={() => alert('Fitur export akan segera hadir')}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                <Download size={16} />
                Export
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {reportType === 'sales' && (
                      <>
                        <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Tanggal</th>
                        <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Cabang</th>
                        <th className="text-right py-3 px-6 text-sm font-semibold text-gray-700">Total</th>
                        <th className="text-right py-3 px-6 text-sm font-semibold text-gray-700">Diskon</th>
                        <th className="text-right py-3 px-6 text-sm font-semibold text-gray-700">Pajak</th>
                      </>
                    )}
                    {reportType === 'items' && (
                      <>
                        <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Produk</th>
                        <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Kategori</th>
                        <th className="text-right py-3 px-6 text-sm font-semibold text-gray-700">Terjual</th>
                        <th className="text-right py-3 px-6 text-sm font-semibold text-gray-700">Total</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {Array.isArray(reportData.data) && reportData.data.length > 0 ? (
                    reportData.data.slice(0, 20).map((item: any, index: number) => (
                      <tr key={index} className="hover:bg-gray-50">
                        {reportType === 'sales' && (
                          <>
                            <td className="py-3 px-6 text-sm text-gray-900">
                              {item.created_at ? formatDate(item.created_at) : '-'}
                            </td>
                            <td className="py-3 px-6 text-sm text-gray-600">
                              {item.branch_name || 'N/A'}
                            </td>
                            <td className="py-3 px-6 text-sm text-right font-semibold text-gray-900">
                              {formatCurrency(item.final_total || 0)}
                            </td>
                            <td className="py-3 px-6 text-sm text-right text-orange-600">
                              {formatCurrency(item.discount_amount || 0)}
                            </td>
                            <td className="py-3 px-6 text-sm text-right text-purple-600">
                              {formatCurrency(item.tax_amount || 0)}
                            </td>
                          </>
                        )}
                        {reportType === 'items' && (
                          <>
                            <td className="py-3 px-6 text-sm font-medium text-gray-900">
                              {item.product_name || item.name || '-'}
                            </td>
                            <td className="py-3 px-6 text-sm text-gray-600">
                              {item.category_name || '-'}
                            </td>
                            <td className="py-3 px-6 text-sm text-right font-semibold text-blue-600">
                              {item.quantity_sold || item.total_sold || 0}
                            </td>
                            <td className="py-3 px-6 text-sm text-right font-semibold text-green-600">
                              {formatCurrency(item.total_revenue || item.revenue || 0)}
                            </td>
                          </>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-gray-500">
                        <FileText size={48} className="mx-auto mb-3 text-gray-300" />
                        <p className="font-medium">Tidak ada data</p>
                        <p className="text-sm">Ubah filter untuk melihat data lainnya</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!reportData && !isLoading && (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
    <TableSkeleton rows={10} columns={5} />
  </div>
)}
    </div>
  );
}
