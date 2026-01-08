'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchWithAuth } from '@/lib/api';
import { Partner, License } from '@/types';
import { ArrowLeft, Smartphone, Building2, Key, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DetailSkeleton } from "@/components/skeletons/DetailSkeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function PartnerLicenseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const partnerId = params.partnerId as string;

  const [partner, setPartner] = useState<Partner | null>(null);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // 1. Ambil detail mitra (Untuk Header)
        // Kita ambil dari list semua partner lalu cari manual karena endpoint detail belum tentu ada
        const allPartners = await fetchWithAuth('/partner');
        const foundPartner = Array.isArray(allPartners) 
          ? allPartners.find((p: any) => p.partner_id === partnerId) 
          : null;

        if (!foundPartner) throw new Error('Mitra tidak ditemukan');
        setPartner(foundPartner);

        // 2. Ambil list lisensi
        const licensesData = await fetchWithAuth(`/license/partner/${partnerId}`);
        setLicenses(Array.isArray(licensesData) ? licensesData : []);

      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Gagal memuat data');
      } finally {
        setIsLoading(false);
      }
    };

    if (partnerId) fetchData();
  }, [partnerId]);

  if (isLoading) return <DetailSkeleton />;

  if (error) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => router.back()}>Kembali</Button>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8 @container">
      {/* Header & Back Button */}
      <div className="flex flex-col gap-2">
        <Button variant="ghost" className="w-fit -ml-4" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Daftar Mitra
        </Button>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{partner?.business_name}</h2>
            <p className="text-muted-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Manajemen Lisensi Perangkat
            </p>
          </div>
          <Badge variant={partner?.status === 'Active' ? 'default' : 'secondary'} className="text-sm px-4 py-1">
            {partner?.status}
          </Badge>
        </div>
      </div>

      {/* License List Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" /> Daftar Lisensi Aktif
          </CardTitle>
          <CardDescription>
            Total {licenses.length} lisensi terdaftar untuk mitra ini.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode Aktivasi</TableHead>
                  <TableHead>Perangkat</TableHead>
                  <TableHead>Cabang</TableHead>
                  <TableHead>Status Lisensi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {licenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Key className="h-8 w-8 opacity-20" />
                        <p>Belum ada lisensi yang dibuat untuk mitra ini.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  licenses.map((license) => (
                    <TableRow key={license.license_id}>
                      <TableCell className="font-mono font-medium text-primary">
                        {license.activation_code}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4 text-muted-foreground" />
                          <span className={!license.device_name ? "text-muted-foreground italic" : ""}>
                            {license.device_name || 'Belum diaktivasi'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {license.branch ? (
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            {license.branch.branch_name}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={license.license_status === 'Active' ? 'default' : 'outline'}>
                          {license.license_status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}