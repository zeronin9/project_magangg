'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchWithAuth } from '@/lib/api';
import { Partner, PartnerSubscription, License } from '@/types';
import { 
  ArrowLeft, 
  Building2, 
  Mail, 
  Phone, 
  Ban, 
  CheckCircle, 
  CreditCard,
  Smartphone,
  Key,
  AlertCircle
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CustomAlertDialog } from "@/components/ui/custom-alert-dialog";
import { DetailSkeleton } from '@/components/skeletons/DetailSkeleton';
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function PartnerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [partner, setPartner] = useState<Partner | null>(null);
  const [subscriptions, setSubscriptions] = useState<PartnerSubscription[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Alert States
  const [isSuspendOpen, setIsSuspendOpen] = useState(false);
  const [isActivateOpen, setIsActivateOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // ✅ 1. Fetch Partner Detail dengan Error Handling Lebih Baik
      let partnerData = null;
      
      try {
        // Coba fetch langsung by ID
        partnerData = await fetchWithAuth(`/partner/${id}`);
      } catch (directError: any) {
        // Jika gagal, coba dari list semua partner
        console.warn(`⚠️ Direct fetch /partner/${id} failed, trying fallback...`);
        
        try {
          const allPartners = await fetchWithAuth('/partner');
          const partnersList = Array.isArray(allPartners) ? allPartners : [];
          partnerData = partnersList.find((p: Partner) => p.partner_id === id);
          
          if (!partnerData) {
            throw new Error('Mitra tidak ditemukan dalam daftar');
          }
        } catch (listError: any) {
          console.error('❌ Fallback fetch also failed:', listError);
          throw new Error('Tidak dapat memuat data mitra. Endpoint mungkin belum tersedia.');
        }
      }

      if (!partnerData) {
        throw new Error('Mitra tidak ditemukan');
      }
      
      setPartner(partnerData);

      // ✅ 2. Fetch Riwayat Langganan (Silent Fail - tidak crash jika 404)
      try {
        const subsData = await fetchWithAuth(`/partner-subscription/partner/${id}`);
        setSubscriptions(Array.isArray(subsData) ? subsData : []);
      } catch (subsError: any) {
        // 404 adalah normal jika belum ada langganan
        if (subsError.message?.includes('404')) {
          console.info('ℹ️ No subscriptions found (404 - expected for new partner)');
        } else {
          console.warn('⚠️ Error fetching subscriptions:', subsError.message);
        }
        setSubscriptions([]);
      }

      // ✅ 3. Fetch Lisensi (Silent Fail - tidak crash jika 404)
      try {
        const licData = await fetchWithAuth(`/license/partner/${id}`);
        setLicenses(Array.isArray(licData) ? licData : []);
      } catch (licError: any) {
        // 404 adalah normal jika belum ada lisensi
        if (licError.message?.includes('404')) {
          console.info('ℹ️ No licenses found (404 - expected for new partner)');
        } else {
          console.warn('⚠️ Error fetching licenses:', licError.message);
        }
        setLicenses([]);
      }

    } catch (criticalError: any) {
      console.error('❌ Critical Error:', criticalError);
      setError(criticalError.message || 'Gagal memuat detail mitra');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuspend = async () => {
    try {
      await fetchWithAuth(`/partner/${id}`, { method: 'DELETE' });
      alert('Mitra berhasil disuspend.');
      setIsSuspendOpen(false);
      fetchData();
    } catch (error: any) {
      alert(error.message || 'Gagal suspend mitra');
    }
  };

  const handleActivate = async () => {
    if (!partner) return;
    
    try {
      await fetchWithAuth(`/partner/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ 
          business_name: partner.business_name,
          business_phone: partner.business_phone,
          status: 'Active' 
        })
      });
      alert('Mitra berhasil diaktifkan kembali.');
      setIsActivateOpen(false);
      fetchData();
    } catch (error: any) {
      alert(error.message || 'Gagal aktivasi mitra');
    }
  };

  // Loading State
  if (isLoading) return <DetailSkeleton />;

  // Error State
  if (error) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Error:</strong> {error}
          </AlertDescription>
        </Alert>
        <Card className="p-12">
          <div className="text-center space-y-4">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">Data Tidak Dapat Dimuat</h3>
              <p className="text-sm text-muted-foreground mt-2">{error}</p>
            </div>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => router.back()}>
                Kembali ke Daftar
              </Button>
              <Button onClick={fetchData}>
                Coba Lagi
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Not Found State
  if (!partner) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
        <Card className="p-12">
          <div className="text-center space-y-4">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">Mitra Tidak Ditemukan</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Mitra dengan ID <code className="bg-muted px-1 rounded">{id}</code> tidak ditemukan.
              </p>
            </div>
            <Button onClick={() => router.push('/platform/partners')}>
              Kembali ke Daftar Mitra
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8 @container">
      {/* Header & Navigation */}
      <div className="flex flex-col gap-4 @md:flex-row @md:items-center @md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">{partner.business_name}</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant={partner.status === 'Active' ? 'default' : 'destructive'}>
                {partner.status}
              </Badge>
              <span>•</span>
              <span>Bergabung sejak {new Date(partner.joined_date).toLocaleDateString('id-ID')}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {partner.status === 'Active' ? (
            <Button variant="destructive" onClick={() => setIsSuspendOpen(true)}>
              <Ban className="mr-2 h-4 w-4" />
              Suspend Mitra
            </Button>
          ) : (
            <Button className="bg-green-600 hover:bg-green-700" onClick={() => setIsActivateOpen(true)}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Aktifkan Kembali
            </Button>
          )}
        </div>
      </div>

      {/* Info Card */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Informasi Kontak</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <Building2 className="h-4 w-4" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Nama Bisnis</p>
                <p className="text-sm text-muted-foreground">{partner.business_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <Mail className="h-4 w-4" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{partner.business_email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <Phone className="h-4 w-4" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Telepon</p>
                <p className="text-sm text-muted-foreground">{partner.business_phone}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Summary */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Ringkasan Akun</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border rounded-lg flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">Total Langganan</p>
                <p className="text-2xl font-bold">{subscriptions.length}</p>
              </div>
              <CreditCard className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <div className="p-4 border rounded-lg flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">Total Lisensi</p>
                <p className="text-2xl font-bold">{licenses.length}</p>
              </div>
              <Key className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Data */}
      <Tabs defaultValue="subscriptions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="subscriptions">Riwayat Langganan</TabsTrigger>
          <TabsTrigger value="licenses">Daftar Lisensi</TabsTrigger>
        </TabsList>

        <TabsContent value="subscriptions">
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Langganan</CardTitle>
            </CardHeader>
            <CardContent>
              {subscriptions.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">Belum ada riwayat langganan</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Langganan akan muncul setelah mitra melakukan pembelian paket
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Paket</TableHead>
                      <TableHead>Periode</TableHead>
                      <TableHead>Status Pembayaran</TableHead>
                      <TableHead>Status Aktif</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions.map((sub) => (
                      <TableRow key={sub.subscription_id}>
                        <TableCell className="font-medium">
                          {sub.plan_snapshot?.plan_name || 'Paket Lama'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(sub.start_date).toLocaleDateString('id-ID')} - {new Date(sub.end_date).toLocaleDateString('id-ID')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={sub.payment_status === 'Paid' ? 'default' : 'secondary'}>
                            {sub.payment_status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{sub.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="licenses">
          <Card>
            <CardHeader>
              <CardTitle>Lisensi Perangkat</CardTitle>
            </CardHeader>
            <CardContent>
              {licenses.length === 0 ? (
                <div className="text-center py-12">
                  <Key className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">Belum ada lisensi perangkat</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Lisensi akan muncul setelah mitra mengaktifkan perangkat
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kode Aktivasi</TableHead>
                      <TableHead>Perangkat</TableHead>
                      <TableHead>Cabang</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {licenses.map((lic) => (
                      <TableRow key={lic.license_id}>
                        <TableCell className="font-mono text-xs">{lic.activation_code}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Smartphone className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{lic.device_name || '-'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{lic.branch?.branch_name || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={lic.license_status === 'Active' ? 'default' : 'outline'}>
                            {lic.license_status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialogs */}
      <CustomAlertDialog
        open={isSuspendOpen}
        onOpenChange={setIsSuspendOpen}
        title="Suspend Mitra?"
        description={`Apakah Anda yakin ingin menonaktifkan ${partner.business_name}? Semua akses login dan layanan akan dihentikan sementara.`}
        onConfirm={handleSuspend}
        confirmText="Suspend"
        variant="destructive"
      />

      <CustomAlertDialog
        open={isActivateOpen}
        onOpenChange={setIsActivateOpen}
        title="Aktifkan Mitra?"
        description={`Apakah Anda yakin ingin mengaktifkan kembali ${partner.business_name}? Mitra akan dapat mengakses kembali dashboard dan layanan mereka.`}
        onConfirm={handleActivate}
        confirmText="Aktifkan"
        variant="default"
      />
    </div>
  );
}
