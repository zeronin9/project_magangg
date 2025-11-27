'use client';

import { useState, useEffect } from 'react';
import { subscriptionAPI } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { SubscriptionPlan } from '@/types/mitra';
import { 
  Loader2, 
  AlertCircle,
  CreditCard,
  Check,
  Building2,
  Smartphone,
  Calendar,
  DollarSign,
  Info
} from 'lucide-react';

export default function SubscriptionPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState<any>(null);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setIsLoading(true);
      const data = await subscriptionAPI.getPlans();
      setPlans(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data paket langganan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setIsOrderModalOpen(true);
  };

  const handleCreateOrder = async () => {
    if (!selectedPlan) return;
    
    setIsSubmitting(true);
    try {
      const result = await subscriptionAPI.createOrder(selectedPlan.plan_id);
      setOrderResult(result);
    } catch (err: any) {
      alert(err.message || 'Gagal membuat pesanan');
      setIsOrderModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (price: string) => {
    return 'Rp ' + parseInt(price).toLocaleString('id-ID');
  };

  if (isLoading) {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-64 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>
      <Skeleton className="h-24 w-full rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 overflow-hidden">
            <div className="p-6 space-y-3">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-4 w-full" />
            </div>
            <div className="p-6 space-y-3">
              {Array.from({ length: 4 }).map((_, j) => (
                <Skeleton key={j} className="h-8 w-full" />
              ))}
              <Skeleton className="h-12 w-full rounded-xl mt-6" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Paket Langganan</h1>
        <p className="text-gray-600 mt-1">Pilih paket yang sesuai dengan kebutuhan bisnis Anda</p>
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
          <Info className="text-blue-600 mt-0.5" size={20} />
          <div>
            <p className="font-medium text-blue-900">Informasi Langganan</p>
            <p className="text-sm text-blue-700 mt-1">
              Upgrade paket Anda untuk mendapatkan akses ke lebih banyak cabang dan perangkat. 
              Pembayaran dilakukan melalui transfer manual ke rekening yang tertera.
            </p>
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            <CreditCard size={48} className="mx-auto mb-3 text-gray-300" />
            <p className="font-medium">Tidak ada paket tersedia</p>
          </div>
        ) : (
          plans.map((plan) => (
            <div 
              key={plan.plan_id} 
              className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 hover:border-green-500 hover:shadow-lg transition-all overflow-hidden"
            >
              <div className="p-6 bg-gradient-to-br from-green-50 to-white">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.plan_name}</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl font-bold text-green-600">
                    {formatPrice(plan.price)}
                  </span>
                  <span className="text-gray-600">/bulan</span>
                </div>
                {plan.description && (
                  <p className="text-sm text-gray-600">{plan.description}</p>
                )}
              </div>

              <div className="p-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check size={16} className="text-green-600" />
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Building2 size={18} className="text-gray-400" />
                      <span className="font-medium">
                        {plan.branch_limit === -1 ? 'Unlimited' : plan.branch_limit} Cabang
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check size={16} className="text-green-600" />
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Smartphone size={18} className="text-gray-400" />
                      <span className="font-medium">
                        {plan.device_limit === -1 ? 'Unlimited' : plan.device_limit} Perangkat
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check size={16} className="text-green-600" />
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Calendar size={18} className="text-gray-400" />
                      <span className="font-medium">Support 24/7</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check size={16} className="text-green-600" />
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <CreditCard size={18} className="text-gray-400" />
                      <span className="font-medium">Cloud Backup</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleSelectPlan(plan)}
                  className="w-full mt-6 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-semibold shadow-sm"
                >
                  Pilih Paket
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Order Modal */}
      {isOrderModalOpen && selectedPlan && !orderResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Konfirmasi Pesanan</h2>
            
            <div className="bg-gray-50 p-4 rounded-xl mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Paket:</span>
                <span className="font-semibold text-gray-900">{selectedPlan.plan_name}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Cabang:</span>
                <span className="font-semibold text-gray-900">
                  {selectedPlan.branch_limit === -1 ? 'Unlimited' : selectedPlan.branch_limit}
                </span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Perangkat:</span>
                <span className="font-semibold text-gray-900">
                  {selectedPlan.device_limit === -1 ? 'Unlimited' : selectedPlan.device_limit}
                </span>
              </div>
              <div className="border-t border-gray-200 mt-3 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-900 font-medium">Total:</span>
                  <span className="text-2xl font-bold text-green-600">
                    {formatPrice(selectedPlan.price)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mb-6">
              <p className="text-sm text-blue-800">
                Setelah konfirmasi, Anda akan mendapatkan instruksi pembayaran via transfer manual.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsOrderModalOpen(false);
                  setSelectedPlan(null);
                }}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleCreateOrder}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                Konfirmasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Result Modal */}
      {orderResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check size={32} className="text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Pesanan Berhasil Dibuat!</h2>
              <p className="text-gray-600">
                Silakan lakukan pembayaran ke rekening di bawah ini
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl mb-6 space-y-3">
              <div>
                <p className="text-sm text-gray-600 mb-1">Order ID:</p>
                <p className="font-mono font-semibold text-gray-900">{orderResult.order_id}</p>
              </div>
              
              {orderResult.bank_info && (
                <>
                  <div className="border-t border-gray-200 pt-3">
                    <p className="text-sm text-gray-600 mb-1">Bank:</p>
                    <p className="font-semibold text-gray-900">{orderResult.bank_info.bank_name}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Nomor Rekening:</p>
                    <p className="font-mono font-semibold text-gray-900 text-lg">
                      {orderResult.bank_info.account_number}
                    </p>
                  </div>
                  
                  {orderResult.bank_info.account_name && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Atas Nama:</p>
                      <p className="font-semibold text-gray-900">{orderResult.bank_info.account_name}</p>
                    </div>
                  )}
                </>
              )}

              <div className="border-t border-gray-200 pt-3">
                <p className="text-sm text-gray-600 mb-1">Total Pembayaran:</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatPrice(selectedPlan?.price || '0')}
                </p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg mb-6">
              <p className="text-sm text-yellow-800">
                <strong>Penting:</strong> Simpan informasi ini. Setelah melakukan pembayaran, 
                hubungi admin untuk konfirmasi.
              </p>
            </div>

            <button
              onClick={() => {
                setOrderResult(null);
                setIsOrderModalOpen(false);
                setSelectedPlan(null);
              }}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
