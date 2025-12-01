'use client';

import { useState, useEffect } from 'react';
import { subscriptionAPI } from '@/lib/api/mitra';
import { SubscriptionPlan, SubscriptionOrder, SubscriptionOrderResponse } from '@/types/mitra';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  CreditCard,
  Check,
  Building2,
  Smartphone,
  AlertCircle,
  Loader2,
  Info,
  Sparkles,
  Server
} from 'lucide-react';

// Mock data sebagai fallback
const MOCK_PLANS: SubscriptionPlan[] = [
  {
    plan_id: '1',
    plan_name: 'Starter',
    price: '99000',
    description: 'Cocok untuk usaha kecil yang baru memulai',
    branch_limit: 1,
    device_limit: 2,
    features: ['1 Cabang', '2 Perangkat', 'Support 24/7', 'Cloud Backup', 'Update Gratis']
  },
  {
    plan_id: '2',
    plan_name: 'Professional',
    price: '299000',
    description: 'Ideal untuk bisnis yang sedang berkembang',
    branch_limit: 5,
    device_limit: 10,
    features: ['5 Cabang', '10 Perangkat', 'Support Priority', 'Cloud Backup', 'Update Gratis', 'Analytics']
  },
  {
    plan_id: '3',
    plan_name: 'Enterprise',
    price: '999000',
    description: 'Solusi lengkap untuk bisnis berskala besar',
    branch_limit: -1,
    device_limit: -1,
    features: ['Unlimited Cabang', 'Unlimited Perangkat', 'Dedicated Support', 'Cloud Backup', 'Update Gratis', 'Advanced Analytics', 'Custom Features']
  },
];

export default function SubscriptionPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState<SubscriptionOrder | null>(null);
  const [useMockData, setUseMockData] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // ✅ Try API silently
      try {
        const response: any = await subscriptionAPI.getPlans();
        
        let plansList: SubscriptionPlan[] = [];
        
        if (Array.isArray(response)) {
          plansList = response;
        } else if (response?.data && Array.isArray(response.data)) {
          plansList = response.data;
        } else if (response?.plans && Array.isArray(response.plans)) {
          plansList = response.plans;
        }
        
        if (plansList.length > 0) {
          setPlans(plansList);
          setUseMockData(false);
          console.log('✅ Loaded plans from API:', plansList.length);
          return;
        }
      } catch (apiError: any) {
        // ✅ Silent fallback for 404
        if (apiError.response?.status === 404) {
          console.log('ℹ️ API endpoint not found, using mock data');
          setPlans(MOCK_PLANS);
          setUseMockData(true);
          return;
        }
        // Re-throw other errors
        throw apiError;
      }
      
    } catch (err: any) {
      console.error('❌ Error loading plans:', err.message);
      
      // Fallback to mock data on any error
      setPlans(MOCK_PLANS);
      setUseMockData(true);
      
      // Only show error for non-404
      if (err.response?.status !== 404) {
        if (err.response?.status === 401) {
          setError('Session expired. Silakan login kembali.');
        } else {
          setError('Menggunakan data demo. Koneksi ke server bermasalah.');
        }
      }
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
      if (useMockData) {
        // ✅ Mock response
        console.log('ℹ️ Using mock order (API not available)');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockOrder: SubscriptionOrder = {
          order_id: `ORD-DEMO-${Date.now()}`,
          plan_id: selectedPlan.plan_id,
          status: 'WAITING_TRANSFER',
          total_amount: selectedPlan.price,
          bank_info: {
            bank_name: 'Bank Mandiri',
            account_number: '1234567890',
            account_name: 'PT Horeka Indonesia'
          },
          created_at: new Date().toISOString(),
        };
        
        setOrderResult(mockOrder);
        return;
      }
      
      // ✅ Real API call
      const result = await subscriptionAPI.createOrder(selectedPlan.plan_id) as SubscriptionOrderResponse;
      
      const orderData: SubscriptionOrder = {
        status: result.status,
        total_amount: result.total_amount,
        bank_info: result.bank_info,
        plan_id: selectedPlan.plan_id,
        order_id: result.order_id,
        created_at: result.created_at || new Date().toISOString(),
      };
      
      setOrderResult(orderData);
      
    } catch (err: any) {
      console.error('❌ Error creating order:', err);
      
      let errorMessage = 'Gagal membuat pesanan';
      
      if (err.response?.status === 400) {
        errorMessage = err.response?.data?.message || 'Data tidak valid';
      } else if (err.response?.status === 401) {
        errorMessage = 'Session expired. Silakan login kembali.';
      } else if (err.response?.status === 404) {
        errorMessage = 'Endpoint belum tersedia. Hubungi administrator.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      alert(errorMessage);
      setIsOrderModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (price: string | number) => {
    const priceNum = typeof price === 'string' ? parseInt(price) : price;
    return 'Rp ' + priceNum.toLocaleString('id-ID');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-8 w-24" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((j) => (
                    <Skeleton key={j} className="h-6 w-full" />
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Paket Langganan</h1>
        <p className="text-muted-foreground">
          Pilih paket yang sesuai dengan kebutuhan bisnis Anda
        </p>
      </div>

      {/* Mock Data Info (tidak error, cuma info) */}
      {useMockData && (
        <Alert className="bg-blue-50 border-blue-200">
          <Server className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Mode Demo:</strong> Endpoint <code className="bg-blue-100 px-1 rounded">/api/partner-subscription/plans</code> belum tersedia.
            Menampilkan data contoh untuk development.
          </AlertDescription>
        </Alert>
      )}

      {/* Error Alert (only for non-404 errors) */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button onClick={loadPlans} variant="outline" size="sm" className="ml-4">
              Coba Lagi
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Info Card */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Informasi Langganan:</strong> Upgrade paket Anda untuk mendapatkan akses ke lebih 
          banyak cabang dan perangkat. Pembayaran dilakukan melalui transfer manual ke rekening yang tertera.
        </AlertDescription>
      </Alert>

      {/* Plans Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans.length === 0 ? (
          <Card className="col-span-full p-12">
            <div className="text-center">
              <CreditCard className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Tidak ada paket tersedia</p>
              <Button onClick={loadPlans} className="mt-4">
                Muat Ulang
              </Button>
            </div>
          </Card>
        ) : (
          plans.map((plan) => {
            const isPopular = plan.plan_name.toLowerCase().includes('pro');
            
            return (
              <Card 
                key={plan.plan_id} 
                className={`relative overflow-hidden ${
                  isPopular ? 'border-2 border-primary shadow-lg' : ''
                }`}
              >
                {isPopular && (
                  <div className="absolute top-0 right-0">
                    <Badge className="rounded-none rounded-bl-lg">
                      <Sparkles className="mr-1 h-3 w-3" />
                      Popular
                    </Badge>
                  </div>
                )}

                <CardHeader>
                  <CardTitle className="text-2xl">{plan.plan_name}</CardTitle>
                  <CardDescription>{plan.description || 'Paket langganan'}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold">
                        {formatPrice(plan.price)}
                      </span>
                      <span className="text-muted-foreground">/bulan</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                        <Check className="h-3 w-3 text-green-600" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {plan.branch_limit === -1 ? 'Unlimited' : plan.branch_limit} Cabang
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                        <Check className="h-3 w-3 text-green-600" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {plan.device_limit === -1 ? 'Unlimited' : plan.device_limit} Perangkat
                        </span>
                      </div>
                    </div>

                    {(plan.features || ['Support 24/7', 'Cloud Backup', 'Update Gratis']).slice(2).map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                          <Check className="h-3 w-3 text-green-600" />
                        </div>
                        <span className="font-medium">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>

                <CardFooter>
                  <Button
                    onClick={() => handleSelectPlan(plan)}
                    className="w-full"
                    variant={isPopular ? 'default' : 'outline'}
                  >
                    Pilih Paket
                  </Button>
                </CardFooter>
              </Card>
            );
          })
        )}
      </div>

      {/* Modals (tetap sama) */}
      <Dialog open={isOrderModalOpen && !orderResult} onOpenChange={setIsOrderModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Pesanan</DialogTitle>
            <DialogDescription>
              Periksa detail pesanan Anda sebelum melanjutkan
            </DialogDescription>
          </DialogHeader>
          
          {selectedPlan && (
            <div className="space-y-4 py-4">
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paket:</span>
                  <span className="font-semibold">{selectedPlan.plan_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cabang:</span>
                  <span className="font-semibold">
                    {selectedPlan.branch_limit === -1 ? 'Unlimited' : selectedPlan.branch_limit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Perangkat:</span>
                  <span className="font-semibold">
                    {selectedPlan.device_limit === -1 ? 'Unlimited' : selectedPlan.device_limit}
                  </span>
                </div>
                <div className="border-t pt-3 flex justify-between items-center">
                  <span className="font-medium">Total:</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatPrice(selectedPlan.price)}
                  </span>
                </div>
              </div>

              {useMockData && (
                <Alert className="bg-yellow-50 border-yellow-200">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800 text-sm">
                    <strong>Mode Demo:</strong> Order akan menggunakan simulasi data.
                  </AlertDescription>
                </Alert>
              )}

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Setelah konfirmasi, Anda akan mendapatkan instruksi pembayaran via transfer manual.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsOrderModalOpen(false);
                setSelectedPlan(null);
              }}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button onClick={handleCreateOrder} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Konfirmasi Pesanan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Result Modal */}
      <Dialog open={!!orderResult} onOpenChange={(open) => {
        if (!open) {
          setOrderResult(null);
          setIsOrderModalOpen(false);
          setSelectedPlan(null);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              Pesanan Berhasil!
            </DialogTitle>
            <DialogDescription>
              Silakan lakukan pembayaran ke rekening di bawah ini
            </DialogDescription>
          </DialogHeader>

          {orderResult && (
            <div className="space-y-4 py-4">
              <div className="bg-muted p-4 rounded-lg space-y-3">
                {orderResult.order_id && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Order ID:</p>
                    <p className="font-mono font-semibold">{orderResult.order_id}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Status:</p>
                  <Badge variant="outline" className="font-semibold">
                    {orderResult.status === 'WAITING_TRANSFER' ? 'Menunggu Transfer' : orderResult.status}
                  </Badge>
                </div>

                {orderResult.bank_info && (
                  <>
                    <div className="border-t pt-3">
                      <p className="text-sm text-muted-foreground mb-1">Bank:</p>
                      <p className="font-semibold">{orderResult.bank_info.bank_name}</p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Nomor Rekening:</p>
                      <p className="font-mono font-semibold text-lg">
                        {orderResult.bank_info.account_number}
                      </p>
                    </div>

                    {orderResult.bank_info.account_name && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Atas Nama:</p>
                        <p className="font-semibold">{orderResult.bank_info.account_name}</p>
                      </div>
                    )}
                  </>
                )}

                <div className="border-t pt-3">
                  <p className="text-sm text-muted-foreground mb-1">Total Pembayaran:</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatPrice(orderResult.total_amount)}
                  </p>
                </div>
              </div>

              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  <strong>Penting:</strong> Simpan informasi ini. Setelah melakukan pembayaran, 
                  hubungi admin untuk konfirmasi.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={() => {
                setOrderResult(null);
                setIsOrderModalOpen(false);
                setSelectedPlan(null);
              }}
              className="w-full"
            >
              Mengerti
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
