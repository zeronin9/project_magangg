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
  Key
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CustomAlertDialog } from "@/components/ui/custom-alert-dialog";
import { DetailSkeleton } from '@/components/skeletons/DetailSkeleton';

export default function PartnerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [partner, setPartner] = useState<Partner | null>(null);
  const [subscriptions, setSubscriptions] = useState<PartnerSubscription[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      
      // 1. Fetch Partner Detail (Prioritas Utama)
      // Gunakan logika fallback jika endpoint single ID belum tersedia
      let partnerData;
      try {
        partnerData = await fetchWithAuth(`/partner/${id}`);
      } catch (e: any) {
        // Jika 404 atau error lain, coba cari dari list semua partner
        console.warn("Direct fetch failed, trying fallback list...");
        try {
          const allPartners = await fetchWithAuth('/partner');
          partnerData = allPartners.find((p: Partner) => p.partner_id === id);
        } catch (listError) {
          console.error("Fallback fetch failed", listError);
        }
      }

      if (!partnerData) {
        throw new Error('Mitra tidak ditemukan');
      }
      setPartner(partnerData);

      // 2. Fetch Riwayat Langganan (Dengan Error Handling Khusus)
      // Agar jika 404 (data kosong), halaman tidak crash
      try {
        const subsData = await fetchWithAuth(`/partner-subscription/partner/${id}`);
        setSubscriptions(Array.isArray(subsData) ? subsData : []);
      } catch (e) {
        console.warn("Subscription history not found or empty (404 expected if new)", e);
        setSubscriptions([]); // Set kosong jika error/404
      }

      // 3. Fetch Lisensi (Dengan Error Handling Khusus)
      try {
        const licData = await fetchWithAuth(`/license/partner/${id}`);
        setLicenses(Array.isArray(licData) ? licData : []);
      } catch (e) {
        console.warn("Licenses not found or empty (404 expected if new)", e);
        setLicenses([]); // Set kosong jika error/404
      }

    } catch (error) {
      console.error('Critical Error loading detail:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuspend = async () => {
    try {
      await fetchWithAuth(`/partner/${id}`, { method: 'DELETE' });
      alert('Mitra berhasil disuspend.');
      setIsSuspendOpen(false);
      fetchData(); // Refresh data
    } catch (error: any) {
      alert(error.message || 'Gagal suspend mitra');
    }
  };

  const handleActivate = async () => {
    try {
      // Menggunakan endpoint edit untuk update status
      await fetchWithAuth(`/partner/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ 
          // Kirim data existing agar tidak blank (jika backend require)
          business_name: partner?.business_name,
          business_phone: partner?.business_phone,
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

  if (isLoading) return <DetailSkeleton />;
  if (!partner) return <div className="p-8 text-center">Data tidak ditemukan</div>;

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

        {/* Actions (Suspend/Activate Only) */}
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
                <div className="text-center py-8 text-muted-foreground">Belum ada riwayat langganan.</div>
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
                          {new Date(sub.start_date).toLocaleDateString()} - {new Date(sub.end_date).toLocaleDateString()}
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
                <div className="text-center py-8 text-muted-foreground">Belum ada lisensi.</div>
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
                        <TableCell className="font-mono">{lic.activation_code}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Smartphone className="h-4 w-4 text-muted-foreground" />
                            {lic.device_name || '-'}
                          </div>
                        </TableCell>
                        <TableCell>{lic.branch?.branch_name || '-'}</TableCell>
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
        description="Mitra ini akan dinonaktifkan. Semua akses login dan layanan akan dihentikan sementara."
        onConfirm={handleSuspend}
        confirmText="Suspend"
        variant="destructive"
      />

      <CustomAlertDialog
        open={isActivateOpen}
        onOpenChange={setIsActivateOpen}
        title="Aktifkan Mitra?"
        description="Mitra akan dapat mengakses kembali dashboard dan layanan mereka."
        onConfirm={handleActivate}
        confirmText="Aktifkan"
        variant="default"
      />
    </div>
  );
}