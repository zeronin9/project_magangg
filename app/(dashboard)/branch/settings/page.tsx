'use client';

import { useState, useEffect } from 'react';
import { branchSettingsAPI } from '@/lib/api/branch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
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
  Loader2,
  Save,
  AlertCircle,
  Receipt,
  Percent,
  CreditCard,
  Building2,
  MapPin,
  Phone,
  Power,     
  CheckCircle2,
  XCircle
} from 'lucide-react';

// --- Interface Data ---
interface BranchProfile {
  branch_name: string;
  address: string;
  phone_number: string;
  receipt_header: string;
  receipt_footer: string;
  tax_name?: string;
  tax_percentage?: number;
}

// Interface Payment disesuaikan dengan respon Backend terbaru
interface PaymentMethod {
  payment_method_id: string; // ID dari backend
  method_name: string;       // Nama metode pembayaran
  is_active: boolean;        // Status aktif/tidak
}

export default function BranchSettingsPage() {
  const [activeTab, setActiveTab] = useState('receipt');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // State Data
  const [profile, setProfile] = useState<BranchProfile | null>(null);
  const [taxSettings, setTaxSettings] = useState({
    tax_name: '',
    tax_percentage: '',
  });
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  // State Modal Konfirmasi Pembayaran
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Fetch semua data secara paralel
      const [profileRes, taxRes, paymentRes] = await Promise.all([
        branchSettingsAPI.getMe().catch(() => null),
        branchSettingsAPI.getTax().catch(() => null),
        branchSettingsAPI.getPaymentMethods().catch(() => null)
      ]);

      // 1. Set Profil
      if (profileRes?.data) setProfile(profileRes.data);

      // 2. Set Pajak
      const taxData = taxRes?.data?.data || taxRes?.data;
      if (taxData) {
        setTaxSettings({
          tax_name: taxData.tax_name || '',
          tax_percentage: taxData.tax_percentage?.toString() || '',
        });
      } else if (profileRes?.data) {
         setTaxSettings({
          tax_name: profileRes.data.tax_name || '',
          tax_percentage: profileRes.data.tax_percentage?.toString() || '',
        });
      }

      // 3. Set Metode Pembayaran
      // Pastikan membaca data array dengan benar dari response
      const paymentData = paymentRes?.data?.data || paymentRes?.data;
      if (Array.isArray(paymentData)) {
        setPaymentMethods(paymentData);
      } else {
        setPaymentMethods([]);
      }

    } catch (err: any) {
      console.error(err);
      setError('Gagal memuat pengaturan.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Handler Simpan Pajak ---
  const handleTaxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await branchSettingsAPI.updateTax({
        tax_name: taxSettings.tax_name,
        tax_percentage: Number(taxSettings.tax_percentage),
      });
      setSuccess('Pengaturan pajak berhasil disimpan.');
      
      // Refresh data profil agar preview struk terupdate
      const newProfile = await branchSettingsAPI.getMe();
      if(newProfile?.data) setProfile(newProfile.data);
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyimpan pajak.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Handlers Pembayaran (Dialog) ---
  const handleOpenPaymentDialog = (method: PaymentMethod) => {
    setSelectedPayment(method);
    setIsPaymentDialogOpen(true);
  };

  const handleUpdatePaymentStatus = async () => {
    if (!selectedPayment) return;

    setIsSubmitting(true);
    const newStatus = !selectedPayment.is_active; // Toggle status (True <-> False)

    try {
      // Panggil API sesuai dokumentasi: POST /payment/setting
      await branchSettingsAPI.updatePaymentMethod({
        payment_method_id: selectedPayment.payment_method_id,
        is_active: newStatus
      });

      // Update state lokal secara langsung (Optimistic UI Update)
      setPaymentMethods(prev => 
        prev.map(p => p.payment_method_id === selectedPayment.payment_method_id 
          ? { ...p, is_active: newStatus } 
          : p
        )
      );

      setIsPaymentDialogOpen(false);
      setSelectedPayment(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal mengubah status pembayaran');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-10 w-full mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Pengaturan</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="receipt" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Struk & Profil
          </TabsTrigger>
          <TabsTrigger value="tax" className="flex items-center gap-2">
            <Percent className="h-4 w-4" />
            Pajak
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Pembayaran
          </TabsTrigger>
        </TabsList>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 text-green-900 border-green-200">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* ================= TAB STRUK & PROFIL ================= */}
        <TabsContent value="receipt" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Profil Cabang</CardTitle>
                <CardDescription>Informasi ini dikelola oleh Admin Pusat</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">Nama Cabang</Label>
                  <div className="flex items-center gap-2 font-medium">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    {profile?.branch_name || '-'}
                  </div>
                </div>
                <Separator />
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">Alamat</Label>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{profile?.address || '-'}</span>
                  </div>
                </div>
                <Separator />
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">Telepon</Label>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{profile?.phone_number || '-'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-50 border-dashed">
              <CardHeader>
                <CardTitle>Preview Struk</CardTitle>
                <CardDescription>Tampilan pada printer termal kasir</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center pb-8">
                <div className="w-[280px] bg-white shadow-md p-4 text-xs font-mono border border-gray-200">
                  <div className="text-center mb-4 space-y-1">
                    <div className="font-bold text-sm uppercase">{profile?.receipt_header || 'HEADER STRUK'}</div>
                    <div className="font-bold">{profile?.branch_name}</div>
                    <div className="text-gray-500">{profile?.address}</div>
                    <div className="text-gray-500">{profile?.phone_number}</div>
                  </div>
                  <div className="mb-2 pb-2 border-b border-dashed border-gray-300">
                    <div className="flex justify-between"><span>No: TRX-SAMPLE</span><span>10:30</span></div>
                    <div className="flex justify-between"><span>Kasir: Admin</span><span>20/12/23</span></div>
                  </div>
                  <div className="space-y-1 mb-2 pb-2 border-b border-dashed border-gray-300">
                    <div className="flex justify-between"><span>1x Kopi Susu</span><span>18.000</span></div>
                    <div className="flex justify-between"><span>1x Croissant</span><span>22.000</span></div>
                  </div>
                  <div className="space-y-1 mb-4">
                    <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>40.000</span></div>
                    {Number(taxSettings.tax_percentage) > 0 && (
                      <div className="flex justify-between text-gray-500">
                        <span>{taxSettings.tax_name || 'Pajak'} ({taxSettings.tax_percentage}%)</span>
                        <span>{Math.round(40000 * (Number(taxSettings.tax_percentage)/100)).toLocaleString('id-ID')}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-sm mt-2 pt-2 border-t border-dashed border-gray-300">
                      <span>TOTAL</span>
                      <span>{(40000 + Math.round(40000 * (Number(taxSettings.tax_percentage)/100))).toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                  <div className="text-center text-gray-500 pt-2 border-t border-dashed border-gray-300">
                    {profile?.receipt_footer || 'Terima Kasih'}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ================= TAB PAJAK ================= */}
        <TabsContent value="tax">
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Pajak</CardTitle>
              <CardDescription>Tentukan besaran pajak (PB1/PPN) yang dibebankan ke pelanggan.</CardDescription>
            </CardHeader>
            <form onSubmit={handleTaxSubmit}>
              <CardContent className="space-y-4">
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="tax_name">Nama Pajak</Label>
                  <Input 
                    id="tax_name" 
                    placeholder="Contoh: PB1 atau PPN" 
                    value={taxSettings.tax_name}
                    onChange={(e) => setTaxSettings({...taxSettings, tax_name: e.target.value})}
                    required
                  />
                </div>
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="tax_percentage">Persentase (%)</Label>
                  <Input 
                    id="tax_percentage" 
                    type="number" 
                    placeholder="10" 
                    min="0"
                    max="100"
                    value={taxSettings.tax_percentage}
                    onChange={(e) => setTaxSettings({...taxSettings, tax_percentage: e.target.value})}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter className="border-t px-6 py-4">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Simpan Pengaturan
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {/* ================= TAB PEMBAYARAN (FIXED KEY & DIALOG) ================= */}
        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle>Metode Pembayaran</CardTitle>
              <CardDescription>Atur metode pembayaran yang tersedia di kasir.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paymentMethods.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Tidak ada metode pembayaran tersedia.</p>
                ) : (
                  paymentMethods.map((method) => (
                    // ✅ KEY PROP HARUS DI ELEMEN TERLUAR
                    <div 
                      key={method.payment_method_id} 
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/20 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${method.is_active ? 'bg-green-100' : 'bg-gray-100'}`}>
                          <CreditCard className={`h-5 w-5 ${method.is_active ? 'text-green-600' : 'text-gray-500'}`} />
                        </div>
                        <div>
                          <div className="font-medium">{method.method_name}</div>
                          <div className="flex items-center gap-2 mt-1">
                            {method.is_active ? (
                              <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-xs">Aktif</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">Nonaktif</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Tombol Aksi (Memicu Dialog) */}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleOpenPaymentDialog(method)}
                        className={method.is_active ? 'border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700' : 'border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700'}
                      >
                        <Power className="mr-2 h-3 w-3" />
                        {method.is_active ? 'Matikan' : 'Aktifkan'}
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Konfirmasi Status Pembayaran */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedPayment?.is_active ? (
                <XCircle className="h-5 w-5 text-destructive" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              )}
              {selectedPayment?.is_active ? 'Nonaktifkan Pembayaran?' : 'Aktifkan Pembayaran?'}
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin {selectedPayment?.is_active ? 'menonaktifkan' : 'mengaktifkan'} metode pembayaran <strong>{selectedPayment?.method_name}</strong>?
              {selectedPayment?.is_active 
                ? ' Metode ini tidak akan muncul di halaman kasir.' 
                : ' Metode ini akan tersedia untuk transaksi kasir.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)} disabled={isSubmitting}>Batal</Button>
            <Button 
              variant={selectedPayment?.is_active ? 'destructive' : 'default'}
              className={!selectedPayment?.is_active ? 'bg-green-600 hover:bg-green-700' : ''}
              onClick={handleUpdatePaymentStatus}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {selectedPayment?.is_active ? 'Nonaktifkan' : 'Aktifkan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}