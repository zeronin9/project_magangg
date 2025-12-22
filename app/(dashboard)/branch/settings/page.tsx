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
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Loader2, Save, Trash2, AlertCircle, Receipt, Percent, CreditCard,
  Building2, MapPin, Phone, Power, CheckCircle2, XCircle, User, Clock
} from 'lucide-react';

// Interface Data Struk Sesuai Response Backend
interface ReceiptData {
  partner_name: string;
  branch_name: string;
  address: string;
  phone_number: string;
  receipt_header: string;
  receipt_footer: string;
  tax_name?: string;
  tax_percentage?: number;
  current_operator?: { name: string };
  current_shift?: { shift_name: string; start_time: string };
}

interface PaymentMethod {
  payment_method_id: string; 
  method_name: string;       
  is_active: boolean;        
}

export default function BranchSettingsPage() {
  const [activeTab, setActiveTab] = useState('receipt');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // State Data
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [taxSettings, setTaxSettings] = useState({ tax_name: '', tax_percentage: '' });
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  // Modals
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);
  const [isDeleteTaxDialogOpen, setIsDeleteTaxDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError('');

      const [receiptRes, taxRes, paymentRes] = await Promise.all([
        branchSettingsAPI.getReceipt().catch(e => { console.error("Receipt Error:", e); return null; }),
        branchSettingsAPI.getTax().catch(e => { console.error("Tax Error:", e); return null; }),
        branchSettingsAPI.getPaymentMethods().catch(e => { console.error("Payment Error:", e); return null; })
      ]);

      if (receiptRes?.data) {
        setReceiptData(receiptRes.data);
      }

      const taxData = taxRes?.data?.data || taxRes?.data;
      if (taxData && taxData.tax_name) {
        setTaxSettings({
          tax_name: taxData.tax_name,
          tax_percentage: taxData.tax_percentage?.toString() || '0',
        });
      } else if (receiptRes?.data?.tax_name) {
         setTaxSettings({
          tax_name: receiptRes.data.tax_name,
          tax_percentage: receiptRes.data.tax_percentage?.toString() || '0',
        });
      }

      const rawPaymentData = paymentRes?.data?.data || paymentRes?.data;
      if (Array.isArray(rawPaymentData)) {
        const mappedPaymentData: PaymentMethod[] = rawPaymentData.map((item: any) => ({
          payment_method_id: item.payment_method_id || item.id || item.uuid, 
          method_name: item.method_name || item.name || 'Unknown',
          is_active: item.is_active ?? item.isActive ?? false
        }));
        setPaymentMethods(mappedPaymentData.filter(p => p.payment_method_id));
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

  // ✅ HANDLER: Simpan Struk
  const handleReceiptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptData) return;

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await branchSettingsAPI.updateReceipt({
        receipt_header: receiptData.receipt_header,
        receipt_footer: receiptData.receipt_footer,
      });
      setSuccess('Tampilan struk berhasil diperbarui.');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Gagal menyimpan profil.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Handler Lainnya ---
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
      const res = await branchSettingsAPI.getReceipt();
      if(res?.data) setReceiptData(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyimpan pajak.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTax = async () => {
    setIsSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await branchSettingsAPI.deleteTax();
      setTaxSettings({ tax_name: '', tax_percentage: '0' });
      setSuccess('Pajak berhasil dihapus.');
      setIsDeleteTaxDialogOpen(false);
      const res = await branchSettingsAPI.getReceipt();
      if(res?.data) setReceiptData(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menghapus pajak.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenPaymentDialog = (method: PaymentMethod) => {
    setSelectedPayment(method);
    setIsPaymentDialogOpen(true);
  };

  const handleUpdatePaymentStatus = async () => {
    if (!selectedPayment) return;
    setIsSubmitting(true);
    const newStatus = !selectedPayment.is_active;
    try {
      await branchSettingsAPI.updatePaymentMethod({
        payment_method_id: selectedPayment.payment_method_id,
        is_active: newStatus
      });
      setPaymentMethods(prev => prev.map(p => p.payment_method_id === selectedPayment.payment_method_id ? { ...p, is_active: newStatus } : p));
      setSuccess(`Metode pembayaran berhasil ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}.`);
      setIsPaymentDialogOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal update pembayaran.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="p-8"><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Pengaturan</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="receipt" className="gap-2"><Receipt className="h-4 w-4"/> Struk & Profil</TabsTrigger>
          <TabsTrigger value="tax" className="gap-2"><Percent className="h-4 w-4"/> Pajak</TabsTrigger>
          <TabsTrigger value="payment" className="gap-2"><CreditCard className="h-4 w-4"/> Pembayaran</TabsTrigger>
        </TabsList>

        {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4"/><AlertDescription>{error}</AlertDescription></Alert>}
        {success && <Alert className="bg-green-50 text-green-900 border-green-200"><CheckCircle2 className="h-4 w-4"/><AlertDescription>{success}</AlertDescription></Alert>}

        {/* TAB STRUK */}
        <TabsContent value="receipt" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Profil Struk</CardTitle>
                <CardDescription>Edit pesan header dan footer struk.</CardDescription>
              </CardHeader>
              <form onSubmit={handleReceiptSubmit}>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg space-y-3 mb-6 text-sm">
                    <div className="flex justify-between font-medium"><span>Mitra</span><span>{receiptData?.partner_name}</span></div>
                    <Separator/>
                    <div className="flex justify-between"><span>Cabang</span><span>{receiptData?.branch_name}</span></div>
                    <div className="flex justify-between text-muted-foreground"><span>Alamat</span><span className="text-right w-1/2">{receiptData?.address}</span></div>
                  </div>
                  <div className="space-y-2">
                    <Label>Pesan Pembuka</Label>
                    <Input value={receiptData?.receipt_header || ''} onChange={e => setReceiptData(prev => prev ? {...prev, receipt_header: e.target.value} : null)} placeholder="Contoh: Selamat Datang" />
                  </div>
                  <div className="space-y-2">
                    <Label>Pesan Penutup</Label>
                    <Input value={receiptData?.receipt_footer || ''} onChange={e => setReceiptData(prev => prev ? {...prev, receipt_footer: e.target.value} : null)} placeholder="Contoh: Terima Kasih" />
                  </div>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                  <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Simpan</Button>
                </CardFooter>
              </form>
            </Card>

            {/* PREVIEW STRUK */}
            <Card className="bg-slate-50 border-dashed">
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center pb-8">
                <div className="w-[300px] bg-white shadow-xl p-5 text-xs font-mono border border-gray-200 flex flex-col items-center">
                  
                  {/* HEADER */}
                  <div className="text-center mb-4 space-y-1 w-full">
                    <div className="font-extrabold text-base uppercase">{receiptData?.partner_name || 'NAMA MITRA'}</div>
                    <div className="font-bold">{receiptData?.branch_name || 'Nama Cabang'}</div>
                    <div className="text-gray-500 px-4">Alamat: {receiptData?.address}</div>
                    <div className="text-gray-500">Telp: {receiptData?.phone_number}</div>
                  </div>

                  {/* PESAN PEMBUKA */}
                  {receiptData?.receipt_header && (
                    <div className="text-center mb-3 pb-3 border-b border-dashed border-gray-300 w-full italic">
                      "{receiptData.receipt_header}"
                    </div>
                  )}
                  
                  {/* ✅ INFO TRANSAKSI (DITAMBAHKAN) */}
                  <div className="w-full mb-3 pb-3 border-b border-dashed border-gray-300 space-y-1">
                    <div className="flex justify-between">
                      <span>Kasir : {receiptData?.current_operator?.name || 'Kasir'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shift : {receiptData?.current_shift?.shift_name || 'Shift Pagi'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Waktu : {new Date().toLocaleString('id-ID', { 
                          day: '2-digit', 
                          month: '2-digit', 
                          year: 'numeric', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>No. Trans : TRX-001</span>
                    </div>
                  </div>
                  
                  {/* LIST ITEM */}
                  <div className="w-full space-y-1 mb-4 border-b border-dashed border-gray-300 pb-3">
                    <div className="flex justify-between"><span>Kopi Susu</span><span>18.000</span></div>
                    <div className="flex justify-between"><span>Croissant</span><span>22.000</span></div>
                  </div>

                  {/* TOTAL & PAJAK */}
                  <div className="w-full space-y-1">
                    <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>40.000</span></div>
                    {Number(taxSettings.tax_percentage) > 0 && (
                      <div className="flex justify-between text-gray-500">
                        <span>{taxSettings.tax_name} ({taxSettings.tax_percentage}%)</span>
                        <span>{Math.round(40000 * (Number(taxSettings.tax_percentage)/100)).toLocaleString('id-ID')}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold mt-2 pt-2 border-t border-dashed border-gray-300">
                      <span>TOTAL</span>
                      <span>{(40000 + Math.round(40000 * (Number(taxSettings.tax_percentage)/100))).toLocaleString('id-ID')}</span>
                    </div>
                  </div>

                  {/* FOOTER */}
                  <div className="text-center text-gray-500 w-full pt-4 mt-2 border-t border-dashed border-gray-300 whitespace-pre-wrap">
                    {receiptData?.receipt_footer || 'Terima Kasih'}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab Tax & Payment sama seperti sebelumnya (saya persingkat untuk fokus pada solusi) */}
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
                  <p className="text-xs text-muted-foreground">Isi 0 untuk menonaktifkan pajak.</p>
                </div>
              </CardContent>
              <CardFooter className="border-t px-6 py-4 flex justify-between items-center">
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={() => setIsDeleteTaxDialogOpen(true)}
                  disabled={isSubmitting || (!taxSettings.tax_name && !taxSettings.tax_percentage)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Hapus Pengaturan
                </Button>

                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Simpan Pengaturan
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="payment">
            <Card>
            <CardHeader>
              <CardTitle>Metode Pembayaran</CardTitle>
              <CardDescription>Aktifkan atau nonaktifkan metode pembayaran yang tersedia di kasir.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paymentMethods.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Tidak ada metode pembayaran tersedia.</p>
                ) : (
                  paymentMethods.map((method, index) => (
                    <div 
                      key={method.payment_method_id || index} 
                      className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/10 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2.5 rounded-full border ${
                          method.is_active 
                            ? 'bg-green-50 border-green-100 text-green-600' 
                            : 'bg-muted border-muted-foreground/20 text-muted-foreground'
                        }`}>
                          <CreditCard className="h-5 w-5" />
                        </div>
                        
                        <div>
                          <div className="font-medium text-base">{method.method_name}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {method.is_active ? (
                              <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700 text-[10px] px-2 py-0 h-5">
                                Aktif
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground text-[10px] px-2 py-0 h-5">
                                Nonaktif
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleOpenPaymentDialog(method)}
                        className={`min-w-[100px] rounded-full font-medium transition-all shadow-sm ${
                          method.is_active 
                            ? 'border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200' 
                            : 'border-green-600 text-green-600 hover:bg-green-50 hover:text-green-700'
                        }`}
                      >
                        <Power className={`mr-2 h-3.5 w-3.5 ${method.is_active}`} />
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

      {/* Dialogs */}
      <Dialog open={isDeleteTaxDialogOpen} onOpenChange={setIsDeleteTaxDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Hapus Pajak?</DialogTitle><DialogDescription>Pajak akan menjadi 0%.</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteTaxDialogOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleDeleteTax}>Hapus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Pembayaran</DialogTitle>
            <DialogDescription>Ubah status pembayaran {selectedPayment?.method_name}?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>Batal</Button>
            <Button onClick={handleUpdatePaymentStatus}>Ya, Ubah</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}