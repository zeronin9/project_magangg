'use client';

import { useState, useEffect } from 'react';
import { branchAdminAPI, branchAPI } from '@/lib/api/mitra';
import { BranchAdmin, Branch } from '@/types/mitra';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Users,
  Building2,
  User,
  AlertCircle,
  Loader2,
  Archive,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

export default function BranchAdminsPage() {
  const [admins, setAdmins] = useState<BranchAdmin[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSoftDeleteOpen, setIsSoftDeleteOpen] = useState(false);
  const [isHardDeleteOpen, setIsHardDeleteOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<BranchAdmin | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    password: '',
    branch_id: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [adminsData, branchesData] = await Promise.all([
        branchAdminAPI.getAll(),
        branchAPI.getAll(),
      ]);
      
      const branchesList = Array.isArray(branchesData) ? branchesData : [];
      const adminsList = Array.isArray(adminsData) ? adminsData : [];
      
      // Map admins dengan branch data
      const adminsWithBranch = adminsList.map(admin => {
        const branch = branchesList.find(b => b.branch_id === admin.branch_id);
        return {
          ...admin,
          branch: branch || null
        };
      });
      
      setAdmins(adminsWithBranch);
      setBranches(branchesList);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data admin cabang');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (admin?: BranchAdmin) => {
    if (admin) {
      setSelectedAdmin(admin);
      setFormData({
        full_name: admin.full_name,
        username: admin.username,
        password: '',
        branch_id: admin.branch_id,
      });
    } else {
      setSelectedAdmin(null);
      setFormData({
        full_name: '',
        username: '',
        password: '',
        branch_id: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAdmin(null);
    setFormData({
      full_name: '',
      username: '',
      password: '',
      branch_id: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (selectedAdmin) {
        // Edit Mode (3.3 Edit Admin Cabang)
        const updateData: any = {
          full_name: formData.full_name,
          branch_id: formData.branch_id // Opsional: Pindah cabang
        };
        
        // Include username jika berubah (opsional, tergantung backend)
        if (formData.username !== selectedAdmin.username) {
          updateData.username = formData.username;
        }

        // Include password hanya jika diisi
        if (formData.password) {
          updateData.password = formData.password;
        }
        await branchAdminAPI.update(selectedAdmin.user_id, updateData);
      } else {
        // Create Mode (3.1 Buat Admin Cabang)
        await branchAdminAPI.create(formData);
      }
      await loadData();
      handleCloseModal();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menyimpan admin cabang');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3.4 Soft Delete Handler
  const handleSoftDelete = async () => {
    if (!selectedAdmin) return;
    
    setIsSubmitting(true);
    try {
      await branchAdminAPI.softDelete(selectedAdmin.user_id);
      await loadData();
      setIsSoftDeleteOpen(false);
      setSelectedAdmin(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menonaktifkan admin cabang');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3.5 Hard Delete Handler
  const handleHardDelete = async () => {
    if (!selectedAdmin) return;
    
    setIsSubmitting(true);
    try {
      await branchAdminAPI.hardDelete(selectedAdmin.user_id);
      await loadData();
      setIsHardDeleteOpen(false);
      setSelectedAdmin(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus permanen admin cabang');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getBranchName = (branchId: string) => {
    const branch = branches.find(b => b.branch_id === branchId);
    return branch ? branch.branch_name : 'Tidak ada cabang';
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
          <h1 className="text-3xl font-bold tracking-tight">Admin Cabang</h1>
          <p className="text-muted-foreground">Kelola admin untuk setiap cabang</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Admin
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
              <TableHead>Nama Lengkap</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Cabang</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {admins.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">Belum ada admin cabang</p>
                </TableCell>
              </TableRow>
            ) : (
              admins.map((admin) => {
                const branchName = admin.branch?.branch_name || getBranchName(admin.branch_id);
                
                return (
                  <TableRow key={admin.user_id} className={!admin.is_active ? 'opacity-75 bg-muted/30' : ''}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {admin.full_name}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {admin.username}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{branchName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={admin.is_active ? "default" : "secondary"}>
                        {admin.is_active ? 'Aktif' : 'Non-aktif'}
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
                          <DropdownMenuItem onClick={() => handleOpenModal(admin)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          
                          {admin.is_active ? (
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedAdmin(admin);
                                setIsSoftDeleteOpen(true);
                              }}
                              className="text-orange-600"
                            >
                              <Archive className="mr-2 h-4 w-4" />
                              Non-aktifkan
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem disabled className="text-muted-foreground">
                              <Archive className="mr-2 h-4 w-4" />
                              Sudah Non-aktif
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedAdmin(admin);
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
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Form Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedAdmin ? 'Edit Admin Cabang' : 'Tambah Admin Cabang'}
            </DialogTitle>
            <DialogDescription>
              Lengkapi informasi admin cabang di bawah ini
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nama Lengkap *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">
                  Password {selectedAdmin && '(Kosongkan jika tidak ingin mengubah)'}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!selectedAdmin}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="branch_id">Cabang *</Label>
                <Select
                  value={formData.branch_id}
                  onValueChange={(value) => setFormData({ ...formData, branch_id: value })}
                  // Enable branch change on edit mode
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Cabang" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.branch_id} value={branch.branch_id}>
                        {branch.branch_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseModal}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selectedAdmin ? 'Update' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Soft Delete Confirmation */}
      <CustomAlertDialog
        open={isSoftDeleteOpen}
        onOpenChange={setIsSoftDeleteOpen}
        title="Non-aktifkan Admin?"
        description={
          <div className="space-y-2">
            <p>
              Apakah Anda yakin ingin menonaktifkan admin <strong>{selectedAdmin?.full_name}</strong>?
            </p>
            <p className="text-sm text-muted-foreground">
              User tidak akan bisa login, tetapi data tidak hilang.
            </p>
          </div>
        }
        onConfirm={handleSoftDelete}
        confirmText="Non-aktifkan"
        variant="warning"
      />

      {/* Hard Delete Confirmation */}
      <CustomAlertDialog
        open={isHardDeleteOpen}
        onOpenChange={setIsHardDeleteOpen}
        title="Hapus Permanen?"
        description={
          <div className="space-y-3">
            <p>
              Apakah Anda yakin ingin menghapus admin <strong>{selectedAdmin?.full_name}</strong> secara permanen?
            </p>
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm">
              <div className="flex items-center gap-2 font-medium text-destructive mb-1">
                <AlertTriangle className="h-4 w-4" />
                PERINGATAN
              </div>
              <div className="text-destructive/80">
                Tindakan ini <strong>tidak dapat dibatalkan</strong>. Data admin akan hilang selamanya.
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