'use client';

import { useEffect, useState } from 'react';
import { fetchWithAuth } from '@/lib/api';
import { Partner, License } from '@/types';
import { Search, ChevronRight, Smartphone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";

export default function PlatformLicensesPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [partnerLicenses, setPartnerLicenses] = useState<License[]>([]);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [loadingLicenses, setLoadingLicenses] = useState(false);

  useEffect(() => {
    const loadPartners = async () => {
      try {
        setIsLoading(true);
        const data = await fetchWithAuth('/partner');
        setPartners(Array.isArray(data) ? data : []);
      } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };
    loadPartners();
  }, []);

  const handleViewLicenses = async (partner: Partner) => {
    setSelectedPartner(partner);
    setIsDetailOpen(true);
    setLoadingLicenses(true);
    try {
      const data = await fetchWithAuth(`/license/partner/${partner.partner_id}`);
      setPartnerLicenses(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setPartnerLicenses([]);
    } finally {
      setLoadingLicenses(false);
    }
  };

  const filteredPartners = partners.filter(p => p.business_name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (isLoading) return <TableSkeleton rows={8} showSearch />;

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8 @container">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold">Lisensi Mitra</h2>
        <p className="text-muted-foreground">Pilih mitra untuk melihat lisensi perangkat mereka</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Daftar Mitra</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Cari mitra..." className="pl-8" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Nama Bisnis</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow></TableHeader>
            <TableBody>
              {filteredPartners.map(p => (
                <TableRow key={p.partner_id}>
                  <TableCell className="font-medium">{p.business_name}</TableCell>
                  <TableCell><Badge variant={p.status === 'Active' ? 'default' : 'secondary'}>{p.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => handleViewLicenses(p)}>
                      Lihat Lisensi <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Lisensi: {selectedPartner?.business_name}</DialogTitle>
          </DialogHeader>
          
          {loadingLicenses ? <div className="py-8 text-center">Loading...</div> : (
            <div className="max-h-[60vh] overflow-y-auto">
              {partnerLicenses.length === 0 ? <p className="text-center text-muted-foreground py-4">Tidak ada lisensi.</p> : (
                <Table>
                  <TableHeader><TableRow><TableHead>Kode</TableHead><TableHead>Device</TableHead><TableHead>Cabang</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {partnerLicenses.map(l => (
                      <TableRow key={l.license_id}>
                        <TableCell className="font-mono">{l.activation_code}</TableCell>
                        <TableCell><div className="flex items-center gap-2"><Smartphone className="h-4 w-4"/> {l.device_name || '-'}</div></TableCell>
                        <TableCell>{l.branch?.branch_name || '-'}</TableCell>
                        <TableCell><Badge variant={l.license_status === 'Active' ? 'default' : 'outline'}>{l.license_status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}