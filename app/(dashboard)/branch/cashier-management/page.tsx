// app/(dashboard)/branch/cashier-management/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { cashierAccountAPI, pinOperatorAPI } from '@/lib/api/branch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Users,
  UserCog,
  AlertCircle,
  Loader2,
  Archive,
  AlertTriangle,
  RotateCcw,
  Eye,
  EyeOff,
} from 'lucide-react';

// Interfaces
interface CashierAccount {
  user_id: string;
  full_name: string;
  username: string;
  is_active: boolean;
  created_at?: string;
}

interface PinOperator {
  cashier_id: string;
  full_name: string;
  is_active: boolean;
  created_at?: string;
}

const ITEMS_PER_PAGE = 10;

export default function CashierManagementPage() {
  const [activeTab, setActiveTab] = useState('accounts');

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8 @container">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Manajemen Kasir</h1>
        <p className="text-muted-foreground">Kelola akun login dan operator PIN untuk sistem kasir</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="accounts" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Akun Login
          </TabsTrigger>
          <TabsTrigger value="operators" className="flex items-center gap-2">
            <UserCog className="h-4 w-4" />
            Operator PIN
          </TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-4">
          <CashierAccountsTab />
        </TabsContent>

        <TabsContent value="operators" className="space-y-4">
          <PinOperatorsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ==================== CASHIER ACCOUNTS TAB ====================
function CashierAccountsTab() {
  const [accounts, setAccounts] = useState<CashierAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter & Pagination
  const [showArchived, setShowArchived] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSoftDeleteOpen, setIsSoftDeleteOpen] = useState(false);
  const [isHardDeleteOpen, setIsHardDeleteOpen] = useState(false);
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<CashierAccount | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    password: '',
  });

  useEffect(() => {
    loadData();
  }, [showArchived]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, showArchived]);

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const loadData = async () => {
    try {
      setIsLoading(true);
      const response = await cashierAccountAPI.getAll(true);
      const accountsData = Array.isArray(response.data) ? response.data : [];

      const filteredList = showArchived
        ? accountsData.filter((a: any) => a.is_active === false)
        : accountsData.filter((a: any) => a.is_active !== false);

      setAccounts(filteredList);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data akun kasir');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (account?: CashierAccount) => {
    if (account) {
      setSelectedAccount(account);
      setFormData({
        full_name: account.full_name,
        username: account.username,
        password: '',
      });
    } else {
      setSelectedAccount(null);
      setFormData({
        full_name: '',
        username: '',
        password: '',
      });
    }
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAccount(null);
    setFormData({
      full_name: '',
      username: '',
      password: '',
    });
    setShowPassword(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (selectedAccount) {
        // ✅ EDIT: Kirim full_name, username (jika berubah), dan password (opsional)
        const payload: any = { 
          full_name: formData.full_name,
        };
        
        // ✅ KIRIM username jika berbeda dari yang lama
        if (formData.username !== selectedAccount.username) {
          payload.username = formData.username;
        }
        
        // ✅ KIRIM password jika diisi
        if (formData.password && formData.password.trim() !== '') {
          payload.password = formData.password;
        }

        console.log('📤 UPDATE Payload:', payload);
        await cashierAccountAPI.update(selectedAccount.user_id, payload);
      } else {
        // ✅ CREATE: Validasi password wajib
        if (!formData.password || formData.password.trim() === '') {
          alert('Password wajib diisi untuk akun baru');
          setIsSubmitting(false);
          return;
        }
        
        console.log('📤 CREATE Payload:', formData);
        await cashierAccountAPI.create(formData);
      }

      await loadData();
      handleCloseModal();
    } catch (err: any) {
      console.error('❌ Error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Gagal menyimpan akun kasir';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSoftDelete = async () => {
    if (!selectedAccount) return;

    setIsSubmitting(true);
    try {
      await delay(1000);
      console.log('🗑️ Soft Delete:', selectedAccount.user_id);
      await cashierAccountAPI.softDelete(selectedAccount.user_id);
      await loadData();
      setIsSoftDeleteOpen(false);
      setSelectedAccount(null);
    } catch (err: any) {
      console.error('❌ Soft Delete Error:', err);
      alert(err.response?.data?.message || 'Gagal menonaktifkan akun kasir');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestore = async () => {
    if (!selectedAccount) return;

    setIsSubmitting(true);
    try {
      await delay(1000);
      
      // ✅ KIRIM UPDATE untuk mengaktifkan kembali
      // Backend akan otomatis set is_active=true saat update
      const payload = {
        full_name: selectedAccount.full_name,
        username: selectedAccount.username,
      };
      
      console.log('🔄 RESTORE Payload:', payload);
      await cashierAccountAPI.restore(selectedAccount.user_id, payload);

      await loadData();
      setIsRestoreOpen(false);
      setSelectedAccount(null);
    } catch (err: any) {
      console.error('❌ Restore Error:', err);
      alert(err.response?.data?.message || 'Gagal mengaktifkan akun kasir');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHardDelete = async () => {
    if (!selectedAccount) return;

    setIsSubmitting(true);
    try {
      await delay(1000);
      console.log('💀 Hard Delete:', selectedAccount.user_id);
      await cashierAccountAPI.hardDelete(selectedAccount.user_id);
      await loadData();
      setIsHardDeleteOpen(false);
      setSelectedAccount(null);
    } catch (err: any) {
      console.error('❌ Hard Delete Error:', err);
      const errorMessage = err.response?.data?.message || 'Gagal menghapus akun kasir permanen';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter berdasarkan search
  const filteredAccounts = accounts.filter((account) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      account.full_name.toLowerCase().includes(searchLower) ||
      account.username.toLowerCase().includes(searchLower)
    );
  });

  // Pagination
  const totalItems = filteredAccounts.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedAccounts = filteredAccounts.slice(startIndex, endIndex);

  const handlePageChange = (page: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Info Alert */}
      <Alert>
        <Users className="h-4 w-4" />
        <AlertDescription>
          <strong>Akun Login Kasir:</strong> Digunakan untuk login di tablet POS. Setiap tablet memerlukan 1 akun
          login.
        </AlertDescription>
      </Alert>

      {/* Actions Bar */}
      <div className="flex flex-col gap-2 @sm:flex-row @sm:items-center @sm:justify-between">
        <Input
          placeholder="Cari nama atau username..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex gap-2">
          <Button variant={showArchived ? 'default' : 'outline'} onClick={() => setShowArchived(!showArchived)}>
            <Archive className="mr-2 h-4 w-4" />
            {showArchived ? 'Sembunyikan Arsip' : 'Tampilkan Arsip'}
          </Button>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Akun
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Akun Kasir</CardTitle>
          <CardDescription>
            Total {filteredAccounts.length} akun {showArchived ? 'diarsipkan' : 'aktif'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {paginatedAccounts.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                {searchQuery ? 'Tidak ada hasil pencarian' : showArchived ? 'Tidak ada akun di arsip' : 'Belum ada akun kasir'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Lengkap</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedAccounts.map((account) => (
                    <TableRow key={account.user_id} className={showArchived ? 'opacity-60' : ''}>
                      <TableCell className="font-medium">{account.full_name}</TableCell>
                      <TableCell className="font-mono text-sm">{account.username}</TableCell>
                      <TableCell>
                        {showArchived ? (
                          <Badge variant="secondary">Diarsipkan</Badge>
                        ) : (
                          <Badge variant="default" className="bg-green-600">
                            Aktif
                          </Badge>
                        )}
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

                            {!showArchived ? (
                              <>
                                <DropdownMenuItem onClick={() => handleOpenModal(account)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedAccount(account);
                                    setIsSoftDeleteOpen(true);
                                  }}
                                  className="text-black"
                                >
                                  <Archive className="mr-2 h-4 w-4" />
                                  Arsipkan
                                </DropdownMenuItem>
                              </>
                            ) : (
                              <>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedAccount(account);
                                    setIsRestoreOpen(true);
                                  }}
                                  className="text-green-600 font-medium"
                                >
                                  <RotateCcw className="mr-2 h-4 w-4" />
                                  Aktifkan Kembali
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}

                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedAccount(account);
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
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="py-4 flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => handlePageChange(currentPage - 1, e)}
                  className={currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>

              {Array.from({ length: totalPages }).map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink href="#" isActive={currentPage === i + 1} onClick={(e) => handlePageChange(i + 1, e)}>
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => handlePageChange(currentPage + 1, e)}
                  className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Form Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedAccount ? 'Edit Akun Kasir' : 'Tambah Akun Kasir Baru'}</DialogTitle>
            <DialogDescription>
              {selectedAccount
                ? 'Perbarui informasi akun kasir. Username dan password boleh dikosongkan jika tidak ingin diubah.'
                : 'Buat akun login baru untuk tablet kasir'}
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
                  placeholder="Contoh: Tablet Kasir Depan"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Contoh: kasir_melawai_1"
                  required
                  className="font-mono"
                />
                {selectedAccount && (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Hati-hati saat mengubah username, pastikan tidak bentrok dengan akun lain
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  Password {selectedAccount ? '(Kosongkan jika tidak ingin diubah)' : '*'}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={selectedAccount ? 'Masukkan password baru (opsional)' : 'Masukkan password'}
                    required={!selectedAccount}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseModal} disabled={isSubmitting}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selectedAccount ? 'Update' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Soft Delete Confirmation */}
      <Dialog open={isSoftDeleteOpen} onOpenChange={setIsSoftDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Arsipkan Akun?</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin mengarsipkan akun <strong>{selectedAccount?.full_name}</strong>?
              <br />
              Akun tidak akan bisa digunakan untuk login (Soft Delete).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSoftDeleteOpen(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button className="bg-black text-white hover:bg-gray-800" onClick={handleSoftDelete} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Arsipkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Confirmation */}
      <Dialog open={isRestoreOpen} onOpenChange={setIsRestoreOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <RotateCcw className="h-5 w-5" />
              Aktifkan Kembali?
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin mengaktifkan kembali akun <strong>{selectedAccount?.full_name}</strong> ({selectedAccount?.username})?
              <br />
              Akun akan bisa digunakan untuk login kembali.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRestoreOpen(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleRestore} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Aktifkan Kembali
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hard Delete Confirmation */}
      <Dialog open={isHardDeleteOpen} onOpenChange={setIsHardDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Hapus Permanen?
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus <strong>{selectedAccount?.full_name}</strong> secara permanen?
              <br />
              <strong className="text-destructive">Aksi ini tidak dapat dibatalkan!</strong>
              <br />
              {selectedAccount && (
                <span className="text-xs text-muted-foreground mt-2 block">
                  Note: Jika akun memiliki history, gunakan Arsipkan saja.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHardDeleteOpen(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleHardDelete} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Hapus Permanen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ==================== PIN OPERATORS TAB ====================
function PinOperatorsTab() {
  const [operators, setOperators] = useState<PinOperator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter & Pagination
  const [showArchived, setShowArchived] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSoftDeleteOpen, setIsSoftDeleteOpen] = useState(false);
  const [isHardDeleteOpen, setIsHardDeleteOpen] = useState(false);
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState<PinOperator | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPin, setShowPin] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    pin: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, showArchived]);

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const loadData = async () => {
    try {
      setIsLoading(true);
      const response = await pinOperatorAPI.getAll();
      const operatorsData = Array.isArray(response.data) ? response.data : [];

      setOperators(operatorsData);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data operator PIN');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (operator?: PinOperator) => {
    if (operator) {
      setSelectedOperator(operator);
      setFormData({
        full_name: operator.full_name,
        pin: '',
      });
    } else {
      setSelectedOperator(null);
      setFormData({
        full_name: '',
        pin: '',
      });
    }
    setShowPin(false);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOperator(null);
    setFormData({
      full_name: '',
      pin: '',
    });
    setShowPin(false);
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
    setFormData({ ...formData, pin: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.pin && (formData.pin.length < 4 || formData.pin.length > 6)) {
      alert('PIN harus 4-6 digit');
      return;
    }

    setIsSubmitting(true);

    try {
      if (selectedOperator) {
        const payload: any = { full_name: formData.full_name };
        if (formData.pin) {
          payload.pin = formData.pin;
        }
        await pinOperatorAPI.update(selectedOperator.cashier_id, payload);
      } else {
        if (!formData.pin) {
          alert('PIN wajib diisi untuk operator baru');
          setIsSubmitting(false);
          return;
        }
        await pinOperatorAPI.create(formData);
      }

      await loadData();
      handleCloseModal();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Gagal menyimpan operator PIN';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSoftDelete = async () => {
    if (!selectedOperator) return;

    setIsSubmitting(true);
    try {
      await delay(1000);
      await pinOperatorAPI.softDelete(selectedOperator.cashier_id);
      await loadData();
      setIsSoftDeleteOpen(false);
      setSelectedOperator(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menonaktifkan operator');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestore = async () => {
    if (!selectedOperator) return;

    setIsSubmitting(true);
    try {
      await delay(1000);
      await pinOperatorAPI.restore(selectedOperator.cashier_id, {
        full_name: selectedOperator.full_name,
      });

      await loadData();
      setIsRestoreOpen(false);
      setSelectedOperator(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal mengaktifkan operator');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHardDelete = async () => {
    if (!selectedOperator) return;

    setIsSubmitting(true);
    try {
      await delay(1000);
      await pinOperatorAPI.hardDelete(selectedOperator.cashier_id);
      await loadData();
      setIsHardDeleteOpen(false);
      setSelectedOperator(null);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Gagal menghapus operator permanen';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter
  const filteredOperators = operators.filter((operator) => {
    const matchesSearch = operator.full_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesArchive = showArchived ? !operator.is_active : operator.is_active !== false;
    return matchesSearch && matchesArchive;
  });

  // Pagination
  const totalItems = filteredOperators.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedOperators = filteredOperators.slice(startIndex, endIndex);

  const handlePageChange = (page: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Info Alert */}
      <Alert>
        <UserCog className="h-4 w-4" />
        <AlertDescription>
          <strong>Operator PIN:</strong> Setiap kasir memiliki PIN pribadi (4-6 digit) untuk membuka shift dan otorisasi
          transaksi tertentu.
        </AlertDescription>
      </Alert>

      {/* Actions Bar */}
      <div className="flex flex-col gap-2 @sm:flex-row @sm:items-center @sm:justify-between">
        <Input
          placeholder="Cari nama operator..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex gap-2">
          <Button variant={showArchived ? 'default' : 'outline'} onClick={() => setShowArchived(!showArchived)}>
            <Archive className="mr-2 h-4 w-4" />
            {showArchived ? 'Sembunyikan Arsip' : 'Tampilkan Arsip'}
          </Button>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Operator
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Operator PIN</CardTitle>
          <CardDescription>
            Total {filteredOperators.length} operator {showArchived ? 'diarsipkan' : 'aktif'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {paginatedOperators.length === 0 ? (
            <div className="text-center py-12">
              <UserCog className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                {searchQuery
                  ? 'Tidak ada hasil pencarian'
                  : showArchived
                  ? 'Tidak ada operator di arsip'
                  : 'Belum ada operator PIN'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Lengkap</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedOperators.map((operator) => (
                    <TableRow key={operator.cashier_id} className={showArchived ? 'opacity-60' : ''}>
                      <TableCell className="font-medium">{operator.full_name}</TableCell>
                      <TableCell>
                        {operator.is_active === false ? (
                          <Badge variant="secondary">Diarsipkan</Badge>
                        ) : (
                          <Badge variant="default" className="bg-green-600">
                            Aktif
                          </Badge>
                        )}
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

                            {operator.is_active !== false ? (
                              <>
                                <DropdownMenuItem onClick={() => handleOpenModal(operator)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedOperator(operator);
                                    setIsSoftDeleteOpen(true);
                                  }}
                                  className="text-black"
                                >
                                  <Archive className="mr-2 h-4 w-4" />
                                  Arsipkan
                                </DropdownMenuItem>
                              </>
                            ) : (
                              <>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedOperator(operator);
                                    setIsRestoreOpen(true);
                                  }}
                                  className="text-green-600 font-medium"
                                >
                                  <RotateCcw className="mr-2 h-4 w-4" />
                                  Aktifkan Kembali
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}

                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedOperator(operator);
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
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="py-4 flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => handlePageChange(currentPage - 1, e)}
                  className={currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>

              {Array.from({ length: totalPages }).map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink href="#" isActive={currentPage === i + 1} onClick={(e) => handlePageChange(i + 1, e)}>
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => handlePageChange(currentPage + 1, e)}
                  className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Form Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedOperator ? 'Edit Operator PIN' : 'Tambah Operator PIN Baru'}</DialogTitle>
            <DialogDescription>
              {selectedOperator
                ? 'Perbarui informasi operator. PIN boleh dikosongkan jika tidak ingin diubah.'
                : 'Buat operator PIN baru untuk staf kasir'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="operator_full_name">Nama Lengkap *</Label>
                <Input
                  id="operator_full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Contoh: Siti Kasir"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pin">
                  PIN (4-6 Digit) {selectedOperator ? '(Kosongkan jika tidak ingin diubah)' : '*'}
                </Label>
                <div className="relative">
                  <Input
                    id="pin"
                    type={showPin ? 'text' : 'password'}
                    value={formData.pin}
                    onChange={handlePinChange}
                    placeholder={selectedOperator ? 'Masukkan PIN baru (opsional)' : 'Masukkan PIN'}
                    maxLength={6}
                    required={!selectedOperator}
                    className="font-mono"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPin(!showPin)}
                  >
                    {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">PIN harus berisi 4-6 digit angka</p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseModal} disabled={isSubmitting}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selectedOperator ? 'Update' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Soft Delete Confirmation */}
      <Dialog open={isSoftDeleteOpen} onOpenChange={setIsSoftDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Arsipkan Operator?</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin mengarsipkan operator <strong>{selectedOperator?.full_name}</strong>?
              <br />
              Operator tidak akan bisa membuka shift (Soft Delete).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSoftDeleteOpen(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button className="bg-black text-white hover:bg-gray-800" onClick={handleSoftDelete} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Arsipkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Confirmation */}
      <Dialog open={isRestoreOpen} onOpenChange={setIsRestoreOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <RotateCcw className="h-5 w-5" />
              Aktifkan Kembali?
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin mengaktifkan kembali operator <strong>{selectedOperator?.full_name}</strong>?
              <br />
              Operator akan bisa membuka shift kembali.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRestoreOpen(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleRestore} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Aktifkan Kembali
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hard Delete Confirmation */}
      <Dialog open={isHardDeleteOpen} onOpenChange={setIsHardDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Hapus Permanen?
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus <strong>{selectedOperator?.full_name}</strong> secara permanen?
              <br />
              <strong className="text-destructive">Aksi ini tidak dapat dibatalkan!</strong>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHardDeleteOpen(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleHardDelete} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Hapus Permanen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
