'use client';

import { useState, useEffect } from 'react';
import { subscriptionAPI } from '@/lib/api/mitra';
import { SubscriptionPlan } from '@/types/mitra';
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
  Sparkles
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
      alert(err.response?.data?.message || 'Gagal membuat pesanan');
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

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
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
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Price */}
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold">
                        {formatPrice(plan.price)}
                      </span>
                      <span className="text-muted-foreground">/bulan</span>
                    </div>
                  </div>

                  {/* Features */}
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

                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                        <Check className="h-3 w-3 text-green-600" />
                      </div>
                      <span className="font-medium">Support 24/7</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                        <Check className="h-3 w-3 text-green-600" />
                      </div>
                      <span className="font-medium">Cloud Backup</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                        <Check className="h-3 w-3 text-green-600" />
                      </div>
                      <span className="font-medium">Update Gratis</span>
                    </div>
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

      {/* Order Confirmation Modal */}
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
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Order ID:</p>
                  <p className="font-mono font-semibold">{orderResult.order_id}</p>
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
                    {formatPrice(selectedPlan?.price || '0')}
                  </p>
                </div>
              </div>

              <Alert variant="default" className="bg-yellow-50 border-yellow-200">
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
