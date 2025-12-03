'use client';

import { useState, useEffect } from 'react';
import { branchAPI } from '@/lib/api/mitra';
import { Branch } from '@/types/mitra';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CustomAlertDialog } from '@/components/ui/custom-alert-dialog';
import { 
  Plus, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Building2,
  Phone,
  MapPin,
  AlertCircle,
  Loader2,
  Archive,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSoftDeleteOpen, setIsSoftDeleteOpen] = useState(false);
  const [isHardDeleteOpen, setIsHardDeleteOpen] = useState(false);
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [formData, setFormData] = useState({
    branch_name: '',
    address: '',
    phone_number: '',
  });

  useEffect(() => {
    loadBranches();
  }, [showArchived]);

  const loadBranches = async () => {
    try {
      setIsLoading(true);
      setError('');
      // 2.2 Lihat Semua Cabang (?show_all=true jika showArchived true)
      const data = await branchAPI.getAll(showArchived);
      setBranches(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data cabang');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (branch?: Branch) => {
    if (branch) {
      setSelectedBranch(branch);
      setFormData({
        branch_name: branch.branch_name,
        address: branch.address || '',
        phone_number: branch.phone_number || '',
      });
    } else {
      setSelectedBranch(null);
      setFormData({
        branch_name: '',
        address: '',
        phone_number: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBranch(null);
    setFormData({
      branch_name: '',
      address: '',
      phone_number: '',
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      if (selectedBranch) {
        // 2.3 Edit Cabang
        await branchAPI.update(selectedBranch.branch_id, formData);
      } else {
        // 2.1 Tambah Cabang Baru
        await branchAPI.create(formData);
      }
      await loadBranches();
      handleCloseModal();
    } catch (err: any) {
      // Handle Error 403 Limit
      if (err.response?.status === 403) {
        setError('Gagal: Anda telah mencapai batas jumlah cabang untuk paket ini. Silakan upgrade paket Anda.');
        // Tutup modal agar user melihat pesan error
        setIsModalOpen(false);
      } else {
        alert(err.response?.data?.message || 'Gagal menyimpan cabang');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2.4 Soft Delete Cabang
  const handleSoftDelete = async () => {
    if (!selectedBranch) return;
    
    setIsSubmitting(true);
    try {
      await branchAPI.softDelete(selectedBranch.branch_id);
      await loadBranches();
      setIsSoftDeleteOpen(false);
      setSelectedBranch(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal mengarsipkan cabang');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2.3 Restore/Aktifkan Kembali (Update is_active=true)
  const handleRestore = async () => {
    if (!selectedBranch) return;
    
    setIsSubmitting(true);
    try {
      await branchAPI.update(selectedBranch.branch_id, { is_active: true });
      await loadBranches();
      setIsRestoreOpen(false);
      setSelectedBranch(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal mengaktifkan kembali cabang');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2.5 Hard Delete Cabang
  const handleHardDelete = async () => {
    if (!selectedBranch) return;
    
    setIsSubmitting(true);
    try {
      await branchAPI.hardDelete(selectedBranch.branch_id);
      await loadBranches();
      setIsHardDeleteOpen(false);
      setSelectedBranch(null);
    } catch (err: any) {
      // Handle error jika cabang masih memiliki data terkait
      if (err.response?.status === 400) {
        alert('Gagal: Cabang tidak dapat dihapus karena masih memiliki data transaksi atau user.');
      } else {
        alert(err.response?.data?.message || 'Gagal menghapus permanen cabang');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8 @container">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8 @container">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manajemen Cabang</h1>
          <p className="text-muted-foreground">Kelola cabang bisnis Anda</p>
        </div>
      </div>
      <div className="flex gap-2">
          <Button
            variant={showArchived ? "default" : "outline"}
            onClick={() => setShowArchived(!showArchived)}
          >
            <Archive className="mr-2 h-4 w-4" />
            {showArchived ? 'Sembunyikan Arsip' : 'Tampilkan Arsip'}
          </Button>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Cabang
          </Button>
        </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Cabang</TableHead>
              <TableHead>Alamat</TableHead>
              <TableHead>Telepon</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {branches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">Tidak ada cabang</p>
                </TableCell>
              </TableRow>
            ) : (
              branches.map((branch) => (
                <TableRow key={branch.branch_id} className={!branch.is_active ? 'opacity-75 bg-muted/30' : ''}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      {branch.branch_name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {branch.address || '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {branch.phone_number || '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={branch.is_active ? "default" : "secondary"}>
                      {branch.is_active ? 'Aktif' : 'Diarsipkan'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleOpenModal(branch)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        
                        {branch.is_active ? (
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedBranch(branch);
                              setIsSoftDeleteOpen(true);
                            }}
                            className="text-orange-600"
                          >
                            <Archive className="mr-2 h-4 w-4" />
                            Arsipkan
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedBranch(branch);
                              setIsRestoreOpen(true);
                            }}
                            className="text-green-600"
                          >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Aktifkan Kembali
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedBranch(branch);
                            setIsHardDeleteOpen(true);
                          }}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Hapus Permanen
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Form Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedBranch ? 'Edit Cabang' : 'Tambah Cabang Baru'}
            </DialogTitle>
            <DialogDescription>
              Lengkapi informasi cabang di bawah ini
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="branch_name">Nama Cabang *</Label>
                <Input
                  id="branch_name"
                  value={formData.branch_name}
                  onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
                  placeholder="Contoh: Cabang Jakarta Selatan"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Alamat</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Jl. Contoh No. 123"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone_number">Nomor Telepon</Label>
                <Input
                  id="phone_number"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  placeholder="021-12345678"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseModal}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selectedBranch ? 'Update' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Soft Delete (Archive) Confirmation */}
      <CustomAlertDialog
        open={isSoftDeleteOpen}
        onOpenChange={setIsSoftDeleteOpen}
        title="Arsipkan Cabang?"
        description={
          <div className="space-y-2">
            <p>
              Apakah Anda yakin ingin mengarsipkan cabang <strong>{selectedBranch?.branch_name}</strong>?
            </p>
            <p className="text-sm text-muted-foreground">
              Cabang akan dinonaktifkan namun data tetap tersimpan. Anda dapat melihatnya kembali dengan filter "Tampilkan Arsip".
            </p>
          </div>
        }
        onConfirm={handleSoftDelete}
        confirmText="Arsipkan"
        variant="warning"
      />

      {/* Restore Confirmation */}
      <CustomAlertDialog
        open={isRestoreOpen}
        onOpenChange={setIsRestoreOpen}
        title="Aktifkan Kembali?"
        description={
          <div className="space-y-2">
            <p>
              Apakah Anda yakin ingin mengaktifkan kembali cabang <strong>{selectedBranch?.branch_name}</strong>?
            </p>
            <p className="text-sm text-muted-foreground">
              Cabang akan muncul kembali di daftar aktif dan dapat digunakan.
            </p>
          </div>
        }
        onConfirm={handleRestore}
        confirmText="Aktifkan"
        variant="default"
      />

      {/* Hard Delete Confirmation */}
      <CustomAlertDialog
        open={isHardDeleteOpen}
        onOpenChange={setIsHardDeleteOpen}
        title="Hapus Permanen?"
        description={
          <div className="space-y-3">
            <p>
              Apakah Anda yakin ingin menghapus cabang <strong>{selectedBranch?.branch_name}</strong> secara permanen?
            </p>
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm">
              <div className="flex items-center gap-2 font-medium text-destructive mb-1">
                <AlertTriangle className="h-4 w-4" />
                PERINGATAN
              </div>
              <div className="text-destructive/80">
                Tindakan ini <strong>tidak dapat dibatalkan</strong>. Cabang hanya bisa dihapus jika tidak memiliki data transaksi atau user terkait.
              </div>
            </div>
          </div>
        }
        onConfirm={handleHardDelete}
        confirmText="Hapus Permanen"
        variant="destructive"
      />
    </div>
  );
}