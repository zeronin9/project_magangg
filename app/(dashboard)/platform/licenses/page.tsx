'use client';

import { useEffect, useState } from 'react';
import { fetchWithAuth } from '@/lib/api';
import { License } from '@/types';
import { Key, Plus, MoreHorizontal, Search, RotateCcw, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";
import { CustomAlertDialog } from '@/components/ui/custom-alert-dialog';

export default function LicensesPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Alert Dialog States
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [regenerateDialogOpen, setRegenerateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);

  useEffect(() => {
    fetchLicenses();
  }, []);

  const fetchLicenses = async () => {
    try {
      setIsLoading(true);
      const data = await fetchWithAuth('/license');
      setLicenses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching licenses:', error);
      setLicenses([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenRevoke = (license: License) => {
    setSelectedLicense(license);
    setRevokeDialogOpen(true);
  };

  const handleRevokeLicense = async () => {
    if (!selectedLicense) return;
    
    try {
      await fetchWithAuth(`/license/${selectedLicense.license_id}/revoke`, {
        method: 'PUT',
      });
      
      alert('Lisensi berhasil dicabut!');
      setRevokeDialogOpen(false);
      setSelectedLicense(null);
      fetchLicenses();
    } catch (error: any) {
      alert(error.message || 'Gagal mencabut lisensi');
    }
  };

  const handleOpenRegenerate = (license: License) => {
    setSelectedLicense(license);
    setRegenerateDialogOpen(true);
  };

  const handleRegenerateLicense = async () => {
    if (!selectedLicense) return;
    
    try {
      await fetchWithAuth(`/license/${selectedLicense.license_id}/regenerate`, {
        method: 'PUT',
      });
      
      alert('Kode aktivasi berhasil digenerate ulang!');
      setRegenerateDialogOpen(false);
      setSelectedLicense(null);
      fetchLicenses();
    } catch (error: any) {
      alert(error.message || 'Gagal generate ulang kode aktivasi');
    }
  };

  const handleOpenDelete = (license: License) => {
    setSelectedLicense(license);
    setDeleteDialogOpen(true);
  };

  const handleDeleteLicense = async () => {
    if (!selectedLicense) return;
    
    try {
      await fetchWithAuth(`/license/${selectedLicense.license_id}`, {
        method: 'DELETE',
      });
      
      alert('Lisensi berhasil dihapus!');
      setDeleteDialogOpen(false);
      setSelectedLicense(null);
      fetchLicenses();
    } catch (error: any) {
      alert(error.message || 'Gagal menghapus lisensi');
    }
  };

  const filteredLicenses = licenses.filter(license => 
    license.activation_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    license.device_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    license.partner?.business_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <TableSkeleton rows={5} showSearch showButton />;
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8 @container">
      {/* Header */}
      <div className="flex flex-col gap-4 @md:flex-row @md:items-center @md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight @md:text-3xl">Lisensi</h2>
          <p className="text-sm text-muted-foreground @md:text-base">
            Kelola semua lisensi perangkat mitra
          </p>
        </div>
        
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Buat Lisensi
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 @md:flex-row @md:items-center @md:justify-between">
            <div className="space-y-1 flex-1">
              <CardTitle>Daftar Lisensi</CardTitle>
              <CardDescription>Semua lisensi perangkat yang telah dibuat</CardDescription>
            </div>
            <div className="flex flex-col gap-2 @md:flex-row @md:items-center">
              <div className="relative w-full @md:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari lisensi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filteredLicenses.length === 0 ? (
            <div className="text-center py-12">
              <Key className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">{searchTerm ? 'Tidak ada hasil' : 'Belum ada lisensi'}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {searchTerm ? 'Coba ubah kata kunci pencarian' : 'Mulai dengan membuat lisensi pertama'}
              </p>
              {!searchTerm && (
                <Button className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />Buat Lisensi
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE */}
              <div className="hidden @lg:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kode Aktivasi</TableHead>
                      <TableHead>Mitra</TableHead>
                      <TableHead>Perangkat</TableHead>
                      <TableHead>Cabang</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLicenses.map((license) => (
                      <TableRow key={license.license_id}>
                        <TableCell>
                          <code className="relative rounded bg-muted px-2 py-1 font-mono text-sm font-semibold">
                            {license.activation_code}
                          </code>
                        </TableCell>
                        <TableCell className="font-medium">
                          {license.partner?.business_name || '-'}
                        </TableCell>
                        <TableCell>
                          {license.device_name || '-'}
                          {license.device_id && (
                            <div className="text-xs text-muted-foreground">
                              {license.device_id}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {license.branch?.branch_name || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              license.license_status === 'Active' ? 'default' :
                              license.license_status === 'Assigned' ? 'secondary' : 'outline'
                            }
                          >
                            {license.license_status === 'Active' ? (
                              <><CheckCircle className="mr-1 h-3 w-3" /> Aktif</>
                            ) : license.license_status === 'Assigned' ? (
                              <><CheckCircle className="mr-1 h-3 w-3" /> Terpakai</>
                            ) : (
                              <><XCircle className="mr-1 h-3 w-3" /> Dicabut</>
                            )}
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
                              {license.license_status === 'Active' && (
                                <DropdownMenuItem onClick={() => handleOpenRevoke(license)} className="text-orange-600">
                                  <XCircle className="mr-2 h-4 w-4" />Cabut Lisensi
                                </DropdownMenuItem>
                              )}
                              {license.license_status === 'Revoked' && (
                                <DropdownMenuItem onClick={() => handleOpenRegenerate(license)} className="text-green-600">
                                  <RotateCcw className="mr-2 h-4 w-4" />Generate Ulang
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleOpenDelete(license)} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />Hapus
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* MOBILE CARDS */}
              <div className="@lg:hidden space-y-4">
                {filteredLicenses.map((license) => (
                  <Card key={license.license_id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <code className="text-xs font-mono font-semibold bg-muted px-2 py-1 rounded">
                              {license.activation_code}
                            </code>
                            <Badge 
                              variant={
                                license.license_status === 'Active' ? 'default' :
                                license.license_status === 'Assigned' ? 'secondary' : 'outline'
                              }
                            >
                              {license.license_status === 'Active' ? 'Aktif' : 
                               license.license_status === 'Assigned' ? 'Terpakai' : 'Dicabut'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {license.partner?.business_name || 'Tidak ada mitra'}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                            {license.license_status === 'Active' && (
                              <DropdownMenuItem onClick={() => handleOpenRevoke(license)} className="text-orange-600">
                                <XCircle className="mr-2 h-4 w-4" />Cabut Lisensi
                              </DropdownMenuItem>
                            )}
                            {license.license_status === 'Revoked' && (
                              <DropdownMenuItem onClick={() => handleOpenRegenerate(license)} className="text-green-600">
                                <RotateCcw className="mr-2 h-4 w-4" />Generate Ulang
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleOpenDelete(license)} className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Perangkat:</span>
                        <span className="font-medium">{license.device_name || '-'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Device ID:</span>
                        <span className="font-medium text-xs">{license.device_id || '-'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Cabang:</span>
                        <span className="font-medium">{license.branch?.branch_name || '-'}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Alert Dialogs */}
      <CustomAlertDialog
        open={revokeDialogOpen}
        onOpenChange={setRevokeDialogOpen}
        title="Cabut Lisensi"
        description={
          <div className="space-y-2">
            <p>
              Apakah Anda yakin ingin mencabut lisensi <code className="bg-muted px-1 rounded">{selectedLicense?.activation_code}</code>?
            </p>
            <p className="text-sm text-muted-foreground">
              Perangkat tidak akan dapat menggunakan aplikasi lagi dengan kode ini.
            </p>
          </div>
        }
        onConfirm={handleRevokeLicense}
        confirmText="Cabut Lisensi"
        variant="warning"
      />

      <CustomAlertDialog
        open={regenerateDialogOpen}
        onOpenChange={setRegenerateDialogOpen}
        title="Generate Ulang Kode"
        description={
          <div className="space-y-2">
            <p>
              Apakah Anda yakin ingin generate ulang kode aktivasi untuk lisensi ini?
            </p>
            <p className="text-sm text-muted-foreground">
              Kode lama akan tidak berlaku dan kode baru akan dibuat.
            </p>
          </div>
        }
        onConfirm={handleRegenerateLicense}
        confirmText="Generate Ulang"
        variant="default"
      />

      <CustomAlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Hapus Lisensi"
        description={
          <div className="space-y-3">
            <p>
              Apakah Anda yakin ingin menghapus lisensi <code className="bg-muted px-1 rounded">{selectedLicense?.activation_code}</code>?
            </p>
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm">
              <div className="font-medium text-destructive">⚠️ Permanen!</div>
              <div className="text-destructive/80 mt-1">
                Tindakan ini tidak dapat dibatalkan. Lisensi akan dihapus permanen.
              </div>
            </div>
          </div>
        }
        onConfirm={handleDeleteLicense}
        confirmText="Hapus Lisensi"
        variant="destructive"
      />
    </div>
  );
}