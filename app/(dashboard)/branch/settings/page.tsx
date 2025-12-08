'use client';

import { useState, useEffect } from 'react';
import { branchPageAPI } from '@/lib/api/branch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Percent, CreditCard, Key, Smartphone, RotateCcw } from 'lucide-react';

export default function BranchSettingsPage() {
  const [licenses, setLicenses] = useState<any[]>([]);
  const [taxForm, setTaxForm] = useState({ tax_name: 'Pajak', tax_percentage: '0' });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load initial data if needed
    loadLicenses();
  }, []);

  const loadLicenses = async () => {
    try {
      const data = await branchPageAPI.getMyLicenses();
      setLicenses(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
  };

  const handleSaveTax = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await branchPageAPI.updateTaxSetting({
        tax_name: taxForm.tax_name,
        tax_percentage: Number(taxForm.tax_percentage)
      });
      alert('Pengaturan pajak disimpan!');
    } catch (e: any) { alert(e.message); }
    finally { setIsLoading(false); }
  };

  const handlePaymentToggle = async (methodId: string, isActive: boolean) => {
    // Logic untuk toggle pembayaran (simulasi)
    try {
      await branchPageAPI.updatePaymentSetting({ payment_method_id: methodId, is_active: isActive });
      alert('Metode pembayaran diupdate');
    } catch (e: any) { alert(e.message); }
  };

  const handleResetLicense = async (code: string) => {
    if(!confirm("Reset lisensi ini? Device lama akan ter-logout.")) return;
    try {
      await branchPageAPI.resetLicense(code);
      alert('Lisensi di-reset. Silakan login di device baru.');
      loadLicenses();
    } catch (e: any) { alert(e.message); }
  };

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8 @container">
      <div>
        <h2 className="text-2xl font-bold">Pengaturan Cabang</h2>
        <p className="text-muted-foreground">Konfigurasi operasional dan perangkat</p>
      </div>

      <Tabs defaultValue="tax" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tax"><Percent className="mr-2 h-4 w-4"/> Pajak</TabsTrigger>
          <TabsTrigger value="payment"><CreditCard className="mr-2 h-4 w-4"/> Pembayaran</TabsTrigger>
          <TabsTrigger value="licenses"><Key className="mr-2 h-4 w-4"/> Lisensi Device</TabsTrigger>
        </TabsList>

        <TabsContent value="tax">
          <Card>
            <CardHeader><CardTitle>Pajak & Biaya Layanan</CardTitle><CardDescription>Atur pajak yang dikenakan pada transaksi</CardDescription></CardHeader>
            <CardContent>
              <form onSubmit={handleSaveTax} className="space-y-4 max-w-md">
                <div className="grid gap-2">
                  <Label>Nama Pajak (Struk)</Label>
                  <Input value={taxForm.tax_name} onChange={e => setTaxForm({...taxForm, tax_name: e.target.value})} placeholder="PB1 / PPN" />
                </div>
                <div className="grid gap-2">
                  <Label>Persentase (%)</Label>
                  <Input type="number" value={taxForm.tax_percentage} onChange={e => setTaxForm({...taxForm, tax_percentage: e.target.value})} placeholder="10" />
                </div>
                <Button type="submit" disabled={isLoading}>Simpan Pengaturan</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment">
          <Card>
            <CardHeader><CardTitle>Metode Pembayaran</CardTitle><CardDescription>Aktifkan metode pembayaran yang diterima</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              {['Tunai', 'QRIS', 'Debit Card', 'Credit Card'].map((method, idx) => (
                <div key={idx} className="flex items-center justify-between border p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-muted-foreground"/>
                    <span className="font-medium">{method}</span>
                  </div>
                  <Switch defaultChecked onCheckedChange={(c) => handlePaymentToggle(`method-${idx}`, c)} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="licenses">
          <Card>
            <CardHeader><CardTitle>Perangkat Terdaftar</CardTitle><CardDescription>Kelola lisensi tablet kasir</CardDescription></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {licenses.map(lic => (
                  <div key={lic.activation_code} className="flex items-center justify-between border p-4 rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-muted-foreground"/>
                        <span className="font-medium">{lic.device_name || 'Belum ada device'}</span>
                      </div>
                      <p className="text-sm text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded w-fit">{lic.activation_code}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={lic.license_status === 'Active' ? 'default' : 'secondary'}>{lic.license_status}</Badge>
                      <Button variant="outline" size="sm" onClick={() => handleResetLicense(lic.activation_code)}>
                        <RotateCcw className="mr-2 h-3 w-3"/> Reset Device
                      </Button>
                    </div>
                  </div>
                ))}
                {licenses.length === 0 && <p className="text-center text-muted-foreground py-4">Belum ada lisensi yang dialokasikan ke cabang ini.</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}