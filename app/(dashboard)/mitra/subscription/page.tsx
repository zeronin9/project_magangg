'use client';

import { useState, useEffect } from 'react';
import { subscriptionAPI } from '@/lib/api/mitra';
import { fetchWithAuth } from '@/lib/api'; // ✅ FIX: Import dari lib/api
import { SubscriptionPlan, SubscriptionOrderResponse, PartnerSubscriptionHistory } from '@/types/mitra';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
  Building2,
  Smartphone,
  AlertCircle,
  Loader2,
  Info,
  Sparkles,
  CheckCircle,
  Clock,
  History
} from 'lucide-react';
import { formatRupiah } from '@/lib/utils';

export default function SubscriptionPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [history, setHistory] = useState<PartnerSubscriptionHistory[]>([]);
  const [activeSubscription, setActiveSubscription] = useState<PartnerSubscriptionHistory | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState<SubscriptionOrderResponse | null>(null);

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    try {
      setIsLoading(true);
      
      // 1. Ambil User Data untuk Partner ID
      const userStr = localStorage.getItem('user');
      if (!userStr) throw new Error('User not found');
      const user = JSON.parse(userStr);
      // Fallback untuk berbagai format key partner_id
      const partnerId = user.partnerId || user.partner_id;

      if (!partnerId) {
        console.error('Partner ID not found in user session');
        return;
      }

      // 2. Fetch Plans & History
      const [plansData, historyData] = await Promise.allSettled([
        fetchWithAuth('/subscription-plan'), 
        subscriptionAPI.getHistory(partnerId)
      ]);

      // Handle Plans
      if (plansData.status === 'fulfilled') {
        const pData = plansData.value;
        setPlans(Array.isArray(pData) ? pData : []);
      }

      // Handle History & Active Subscription Logic
      if (historyData.status === 'fulfilled') {
        const hData = Array.isArray(historyData.value) ? historyData.value : [];
        setHistory(hData);

        // ✅ LOGIC 7.7: Filter Active Package
        const now = new Date();
        const active = hData.find((sub: PartnerSubscriptionHistory) => {
          const endDate = new Date(sub.end_date);
          return sub.payment_status === 'Paid' && endDate > now;
        });

        setActiveSubscription(active || null);
      }

    } catch (err) {
      console.error('Error initializing subscription page:', err);
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
      // ✅ DOC 7.6: Buat Pesanan
      const result = await subscriptionAPI.createOrder(selectedPlan.plan_id);
      setOrderResult(result as SubscriptionOrderResponse);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal membuat pesanan');
      setIsOrderModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8 @container">
      <Skeleton className="h-48 w-full" /><Skeleton className="h-96 w-full" /></div>;
  }

  return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8 @container">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Langganan & Tagihan</h1>
        <p className="text-muted-foreground">
          Kelola paket layanan Horeka Pos+ Anda
        </p>
      </div>

      {/* ✅ SECTION 1: ACTIVE PLAN BANNER */}
      {activeSubscription ? (
        <Card className="bg-white border-primary/20">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <Badge className="mb-2 bg-black hover:bg-green-500">Paket Aktif</Badge>
                <CardTitle className="text-2xl text-primary">
                  {activeSubscription.subscription_plan.plan_name}
                </CardTitle>
                <CardDescription>
                  Aktif hingga <span className="font-semibold text-foreground">{formatDate(activeSubscription.end_date)}</span>
                </CardDescription>
              </div>
              <div className="text-right hidden md:block">
                <p className="text-sm text-muted-foreground">Harga Paket</p>
                <p className="text-xl font-bold">{formatRupiah(Number(activeSubscription.subscription_plan.price))}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ">
              <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg border border-primary/20 shadow-sm">
                <Building2 className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Limit Cabang</p>
                  <p className="font-semibold">
                    {activeSubscription.subscription_plan.branch_limit === -1 ? 'Unlimited' : activeSubscription.subscription_plan.branch_limit} Unit
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg border border-primary/20 shadow-sm">
                <Smartphone className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Limit Perangkat</p>
                  <p className="font-semibold">
                    {activeSubscription.subscription_plan.device_limit === -1 ? 'Unlimited' : activeSubscription.subscription_plan.device_limit} Device
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg border border-primary/20 shadow-sm">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Durasi</p>
                  <p className="font-semibold">{activeSubscription.subscription_plan.duration_months} Bulan</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-900">
          <AlertCircle className="h-4 w-4 text-red-900" />
          <AlertTitle>Tidak Ada Paket Aktif</AlertTitle>
          <AlertDescription>
            Layanan Anda mungkin terbatas. Silakan beli paket langganan di bawah ini untuk mengakses semua fitur.
          </AlertDescription>
        </Alert>
      )}

      {/* ✅ SECTION 2: AVAILABLE PLANS */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-black" />
          Pilihan Paket
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.plan_id} className="flex flex-col relative overflow-hidden transition-all hover:shadow-md">
              <CardHeader>
                <CardTitle>{plan.plan_name}</CardTitle>
                <CardDescription>{plan.description || 'Paket bulanan'}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{formatRupiah(Number(plan.price))}</span>
                  <span className="text-muted-foreground text-sm">/{plan.duration_months} bln</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>{plan.branch_limit === -1 ? 'Unlimited' : plan.branch_limit} Cabang</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>{plan.device_limit === -1 ? 'Unlimited' : plan.device_limit} Perangkat</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={() => handleSelectPlan(plan)}>
                  Pilih Paket
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* ✅ SECTION 3: HISTORY LIST */}
      {history.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <History className="h-5 w-5" />
            Riwayat Pesanan
          </h2>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted text-muted-foreground border-b">
                  <tr>
                    <th className="px-4 py-3">Paket</th>
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3">Harga</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {history.map((sub) => (
                    <tr key={sub.subscription_id} className="hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium">
                        {sub.subscription_plan?.plan_name || 'Paket Lama'}
                      </td>
                      <td className="px-4 py-3">
                        {formatDate(sub.start_date)} - {formatDate(sub.end_date)}
                      </td>
                      <td className="px-4 py-3">
                        {sub.subscription_plan?.price ? formatRupiah(Number(sub.subscription_plan.price)) : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge 
                          variant={sub.payment_status === 'Paid' ? 'default' : 'secondary'}
                          className={
                            sub.payment_status === 'Paid' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
                            sub.payment_status === 'Pending' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' : ''
                          }
                        >
                          {sub.payment_status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      <Dialog open={isOrderModalOpen && !orderResult} onOpenChange={setIsOrderModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Pembelian</DialogTitle>
            <DialogDescription>
              Anda akan membeli paket <strong>{selectedPlan?.plan_name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex justify-between mb-2">
              <span>Harga Paket</span>
              <span className="font-bold">{selectedPlan && formatRupiah(Number(selectedPlan.price))}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Durasi</span>
              <span>{selectedPlan?.duration_months} Bulan</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOrderModalOpen(false)}>Batal</Button>
            <Button onClick={handleCreateOrder} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Buat Pesanan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SUCCESS / PAYMENT INFO MODAL */}
      <Dialog open={!!orderResult} onOpenChange={(open) => !open && setOrderResult(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <DialogTitle className="text-center mt-4">Pesanan Berhasil Dibuat!</DialogTitle>
            <DialogDescription className="text-center">
              Silakan lakukan transfer sesuai detail di bawah ini.
            </DialogDescription>
          </DialogHeader>
          
          {orderResult && (
            <div className="space-y-4 py-4">
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-sm text-muted-foreground">Total Pembayaran</span>
                  <span className="text-xl font-bold text-primary">{formatRupiah(Number(orderResult.total_amount))}</span>
                </div>
                
                <div>
                  <p className="text-xs text-muted-foreground uppercase mb-1">Bank Transfer</p>
                  <p className="font-semibold">{orderResult.bank_info.bank_name}</p>
                </div>
                
                <div>
                  <p className="text-xs text-muted-foreground uppercase mb-1">Nomor Rekening</p>
                  <div className="flex items-center justify-between bg-background p-2 rounded border">
                    <code className="font-mono text-lg">{orderResult.bank_info.account_number}</code>
                  </div>
                </div>

                {orderResult.bank_info.account_name && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase mb-1">Atas Nama</p>
                    <p className="font-medium">{orderResult.bank_info.account_name}</p>
                  </div>
                )}
                
                <div className="mt-4 pt-2 border-t text-xs text-center text-muted-foreground">
                  Status: <span className="font-bold text-yellow-600">{orderResult.status}</span>
                </div>
              </div>
              
              <Alert className="bg-blue-50 text-blue-900 border-blue-200">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-xs">
                  Harap simpan bukti transfer Anda. Admin akan memverifikasi pembayaran Anda secepatnya.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter>
            <Button className="w-full" onClick={() => {
              setOrderResult(null);
              setIsOrderModalOpen(false);
              setSelectedPlan(null);
              initializeData(); 
            }}>
              Saya Sudah Transfer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}