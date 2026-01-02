'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchWithAuth } from '@/lib/api';
import { Partner } from '@/types';
import { TableSkeleton } from '@/components/skeletons/TableSkeleton';
// ✅ GANTI: Import AlertDialog standar
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, MoreHorizontal, Ban, CheckCircle, Eye } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function PartnerListPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isSuspendOpen, setIsSuspendOpen] = useState(false);
  const [isActivateOpen, setIsActivateOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      setIsLoading(true);
      const data = await fetchWithAuth('/partner');
      setPartners(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching partners:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!selectedPartner) return;
    try {
      await fetchWithAuth(`/partner/${selectedPartner.partner_id}`, { method: 'DELETE' });
      alert('Mitra berhasil dinonaktifkan (Suspend)!');
      setIsSuspendOpen(false);
      fetchPartners();
    } catch (error: any) {
      alert(error.message || 'Gagal suspend mitra');
    }
  };

  const handleActivate = async () => {
    if (!selectedPartner) return;
    try {
      await fetchWithAuth(`/partner/${selectedPartner.partner_id}`, {
        method: 'PUT',
        body: JSON.stringify({ 
          business_name: selectedPartner.business_name,
          business_phone: selectedPartner.business_phone,
          status: 'Active' 
        }),
      });
      alert('Mitra diaktifkan kembali!');
      setIsActivateOpen(false);
      fetchPartners();
    } catch (error: any) {
      alert(error.message || 'Gagal aktivasi');
    }
  };

  const filteredPartners = partners.filter(p =>
    p.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.business_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return <TableSkeleton rows={8} showSearch showButton />;

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8 @container">
      {/* Header */}
      <div className="flex flex-col gap-4 @md:flex-row @md:items-center @md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Manajemen Mitra</h2>
          <p className="text-sm text-muted-foreground">Kelola data mitra dan akses sistem</p>
        </div>
        <Button asChild>
          <Link href="/platform/partners/new">
            <Plus className="mr-2 h-4 w-4" /> Tambah Mitra
          </Link>
        </Button>
      </div>

      {/* Table Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 @md:flex-row @md:items-center @md:justify-between">
            <CardTitle>Daftar Mitra</CardTitle>
            <div className="relative w-full @md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari mitra..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Bisnis</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telepon</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPartners.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? 'Tidak ada mitra yang ditemukan' : 'Belum ada mitra'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPartners.map((partner) => (
                    <TableRow key={partner.partner_id}>
                      <TableCell className="font-medium">{partner.business_name}</TableCell>
                      <TableCell>{partner.business_email}</TableCell>
                      <TableCell>{partner.business_phone}</TableCell>
                      <TableCell>
                        <Badge variant={partner.status === 'Active' ? 'default' : 'secondary'}>
                          {partner.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <Link href={`/platform/partners/${partner.partner_id}`}>
                                <Eye className="mr-2 h-4 w-4" /> Lihat Detail
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {partner.status === 'Active' ? (
                              <DropdownMenuItem 
                                onClick={() => { 
                                  setSelectedPartner(partner); 
                                  setIsSuspendOpen(true); 
                                }} 
                                className="text-destructive"
                              >
                                <Ban className="mr-2 h-4 w-4" /> Suspend Mitra
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem 
                                onClick={() => { 
                                  setSelectedPartner(partner); 
                                  setIsActivateOpen(true); 
                                }} 
                                className="text-green-600"
                              >
                                <CheckCircle className="mr-2 h-4 w-4" /> Aktifkan Kembali
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ✅ DIALOG SUSPEND - Gunakan AlertDialog standar */}
      <AlertDialog open={isSuspendOpen} onOpenChange={setIsSuspendOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend Mitra?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menonaktifkan <strong>{selectedPartner?.business_name}</strong>? 
              Mitra tidak akan dapat login. Data tetap aman.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleSuspend}
              className="bg-black text-white hover:bg-gray-800" // ✅ Tombol hitam
            >
              Suspend
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ✅ DIALOG AKTIVASI - Gunakan AlertDialog standar */}
      <AlertDialog open={isActivateOpen} onOpenChange={setIsActivateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aktifkan Mitra?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin mengaktifkan kembali <strong>{selectedPartner?.business_name}</strong>? 
              Mitra dapat mengakses layanan kembali.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleActivate}>
              Aktifkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
