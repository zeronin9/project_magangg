'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchWithAuth } from '@/lib/api';
import { Partner } from '@/types';
import { TableSkeleton } from '@/components/skeletons/TableSkeleton';
import { Users, Plus, Search, Mail, Phone, Calendar, MoreHorizontal, Eye } from 'lucide-react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function PartnerListPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchWithAuth('/partner', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      alert('Akun Mitra dan Super Admin berhasil dibuat!');
      setIsModalOpen(false);
      fetchPartners();
      setFormData({ 
        business_name: '', 
        business_email: '', 
        business_phone: '', 
        username: '', 
        password: '' 
      });
    } catch (error: any) {
      alert(error.message || 'Gagal mendaftarkan mitra');
    }
  };

  const handleSuspend = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menonaktifkan mitra ini?')) return;
    try {
      await fetchWithAuth(`/partner/${id}`, {
        method: 'DELETE',
      });
      alert('Mitra berhasil dinonaktifkan');
      fetchPartners();
    } catch (error: any) {
      alert('Gagal menonaktifkan mitra');
    }
  };

  const handleActivate = async (id: string, partnerData: Partner) => {
    if (!confirm('Apakah Anda yakin ingin mengaktifkan kembali mitra ini?')) return;
    try {
      await fetchWithAuth(`/partner/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          business_name: partnerData.business_name,
          business_email: partnerData.business_email,
          business_phone: partnerData.business_phone,
          status: 'Active'
        }),
      });
      alert('Mitra berhasil diaktifkan kembali!');
      fetchPartners();
    } catch (error: any) {
      alert(error.message || 'Gagal mengaktifkan mitra');
    }
  };

  const filteredPartners = partners.filter(partner =>
    partner.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    partner.business_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    partner.business_phone.includes(searchTerm)
  );

  if (isLoading) {
    return <TableSkeleton rows={8} showSearch showButton />; // ✅ Use skeleton
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8 @container">
      {/* Header - Responsive */}
      <div className="flex flex-col gap-4 @md:flex-row @md:items-end @md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight @md:text-3xl">Manajemen Mitra</h2>
          <p className="text-sm text-muted-foreground @md:text-base">
            Kelola dan pantau semua mitra bisnis yang terdaftar
          </p>
        </div>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 @md:flex-row @md:items-center @md:justify-between">
            <div className="flex-1 max-w-full @md:max-w-md">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari mitra..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            {/* Add Partner Dialog */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button className="w-full @md:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  <span className="hidden @sm:inline">Daftarkan Mitra Baru</span>
                  <span className="@sm:hidden">Tambah Mitra</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>Daftarkan Mitra Baru</DialogTitle>
                    <DialogDescription>
                      Buat akun mitra baru beserta akun Super Admin pertama
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="business_name">Nama Bisnis <span className="text-destructive">*</span></Label>
                      <Input
                        id="business_name"
                        required
                        value={formData.business_name}
                        onChange={(e) => setFormData({...formData, business_name: e.target.value})}
                        placeholder="Contoh: Kopi Kenangan"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="business_email">Email Bisnis <span className="text-destructive">*</span></Label>
                      <Input
                        id="business_email"
                        type="email"
                        required
                        value={formData.business_email}
                        onChange={(e) => setFormData({...formData, business_email: e.target.value})}
                        placeholder="email@bisnis.com"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="business_phone">Nomor Telepon <span className="text-destructive">*</span></Label>
                      <Input
                        id="business_phone"
                        required
                        value={formData.business_phone}
                        onChange={(e) => setFormData({...formData, business_phone: e.target.value})}
                        placeholder="08123456789"
                      />
                    </div>

                    <div className="border-t pt-4">
                      <div className="bg-muted p-3 rounded-lg mb-4">
                        <p className="text-sm font-semibold">🔐 Akun Admin Mitra Pertama</p>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="grid gap-2">
                          <Label htmlFor="username">Username <span className="text-destructive">*</span></Label>
                          <Input
                            id="username"
                            required
                            value={formData.username}
                            onChange={(e) => setFormData({...formData, username: e.target.value})}
                            placeholder="admin_username"
                          />
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="password">Kata Sandi <span className="text-destructive">*</span></Label>
                          <Input
                            id="password"
                            type="password"
                            required
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                            placeholder="Minimal 6 karakter"
                            minLength={6}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Batal</Button>
                    </DialogClose>
                    <Button type="submit">Daftarkan Mitra</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent>
          {filteredPartners.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">Tidak ada mitra</h3>
              <p className="text-sm text-muted-foreground">
                {searchTerm ? 'Tidak ada mitra yang cocok dengan pencarian Anda' : 'Belum ada mitra yang terdaftar'}
              </p>
              {!searchTerm && (
                <Button className="mt-4" onClick={() => setIsModalOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Daftarkan Mitra Pertama
                </Button>
              )}
            </div>
          ) : (
            <div className="@container/table">
              {/* Desktop Table */}
              <div className="hidden @md/table:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Bisnis</TableHead>
                      <TableHead>Informasi Kontak</TableHead>
                      <TableHead>Tanggal Bergabung</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPartners.map((partner) => (
                      <TableRow key={partner.partner_id}>
                        <TableCell className="font-medium">
                          {partner.business_name}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {partner.business_email}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {partner.business_phone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(partner.joined_date).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={partner.status === 'Active' ? 'default' : 'destructive'}>
                            {partner.status === 'Active' ? 'Aktif' : 'Ditangguhkan'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                              <DropdownMenuItem asChild>
                                <Link href={`/platform/partners/${partner.partner_id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Lihat Detail
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {partner.status === 'Active' ? (
                                <DropdownMenuItem 
                                  onClick={() => handleSuspend(partner.partner_id)}
                                  className="text-destructive"
                                >
                                  Nonaktifkan
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleActivate(partner.partner_id, partner)}>
                                  Aktifkan Kembali
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

              {/* Mobile Card List */}
              <div className="@md/table:hidden space-y-4">
                {filteredPartners.map((partner) => (
                  <Card key={partner.partner_id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-base">{partner.business_name}</CardTitle>
                          <Badge variant={partner.status === 'Active' ? 'default' : 'destructive'} className="text-xs">
                            {partner.status === 'Active' ? 'Aktif' : 'Ditangguhkan'}
                          </Badge>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <Link href={`/platform/partners/${partner.partner_id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                Lihat Detail
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {partner.status === 'Active' ? (
                              <DropdownMenuItem 
                                onClick={() => handleSuspend(partner.partner_id)}
                                className="text-destructive"
                              >
                                Nonaktifkan
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleActivate(partner.partner_id, partner)}>
                                Aktifkan Kembali
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{partner.business_email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{partner.business_phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {new Date(partner.joined_date).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
