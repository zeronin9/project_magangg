'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchWithAuth } from '@/lib/api';
import { Partner } from '@/types';
import { TableSkeleton } from '@/components/skeletons/TableSkeleton';
import { CustomAlertDialog } from '@/components/ui/custom-alert-dialog';
import { Users, Plus, Search, Mail, Phone, MoreHorizontal, Ban, CheckCircle, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function PartnerListPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSuspendOpen, setIsSuspendOpen] = useState(false);
  const [isActivateOpen, setIsActivateOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);

  const [formData, setFormData] = useState({
    business_name: '',
    business_email: '',
    business_phone: '',
    username: '', 
    password: ''  
  });

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

  const handleAddPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchWithAuth('/partner', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      alert('Mitra berhasil ditambahkan!');
      setIsAddOpen(false);
      fetchPartners();
      setFormData({ business_name: '', business_email: '', business_phone: '', username: '', password: '' });
    } catch (error: any) {
      alert(error.message || 'Gagal menambahkan mitra');
    }
  };

  const handleSuspend = async () => {
    if (!selectedPartner) return;
    try {
      // Doc 2.4 Soft Delete
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
      // Doc 2.3 Edit untuk mengaktifkan
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
      <div className="flex flex-col gap-4 @md:flex-row @md:items-center @md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Manajemen Mitra</h2>
          <p className="text-sm text-muted-foreground">Kelola data mitra dan akses sistem</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Tambah Mitra
        </Button>
      </div>

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
                {filteredPartners.map((partner) => (
                  <TableRow key={partner.partner_id}>
                    <TableCell className="font-medium">{partner.business_name}</TableCell>
                    <TableCell>{partner.business_email}</TableCell>
                    <TableCell>{partner.business_phone}</TableCell>
                    <TableCell>
                      <Badge variant={partner.status === 'Active' ? 'default' : 'destructive'}>
                        {partner.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
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
                            <DropdownMenuItem onClick={() => { setSelectedPartner(partner); setIsSuspendOpen(true); }} className="text-destructive">
                              <Ban className="mr-2 h-4 w-4" /> Suspend Mitra
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => { setSelectedPartner(partner); setIsActivateOpen(true); }} className="text-green-600">
                              <CheckCircle className="mr-2 h-4 w-4" /> Aktifkan Kembali
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleAddPartner}>
            <DialogHeader><DialogTitle>Tambah Mitra Baru</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2"><Label>Nama Bisnis</Label><Input required value={formData.business_name} onChange={e => setFormData({...formData, business_name: e.target.value})} /></div>
              <div className="grid gap-2"><Label>Email</Label><Input type="email" required value={formData.business_email} onChange={e => setFormData({...formData, business_email: e.target.value})} /></div>
              <div className="grid gap-2"><Label>Telepon</Label><Input required value={formData.business_phone} onChange={e => setFormData({...formData, business_phone: e.target.value})} /></div>
              <div className="bg-muted p-3 rounded space-y-3">
                <p className="text-sm font-semibold">Akun Super Admin</p>
                <div className="grid gap-2"><Label>Username</Label><Input required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} /></div>
                <div className="grid gap-2"><Label>Password</Label><Input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} /></div>
              </div>
            </div>
            <DialogFooter><Button type="submit">Simpan</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <CustomAlertDialog open={isSuspendOpen} onOpenChange={setIsSuspendOpen} title="Suspend Mitra?" description="Mitra tidak akan dapat login. Data aman." onConfirm={handleSuspend} confirmText="Suspend" variant="destructive" />
      <CustomAlertDialog open={isActivateOpen} onOpenChange={setIsActivateOpen} title="Aktifkan Mitra?" description="Mitra dapat mengakses layanan kembali." onConfirm={handleActivate} confirmText="Aktifkan" variant="default" />
    </div>
  );
}