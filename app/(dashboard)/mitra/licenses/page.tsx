'use client';

import { useState, useEffect } from 'react';
import { licenseAPI, branchAPI } from '@/lib/api/mitra';
import { License, Branch } from '@/types/mitra';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { 
  Plus, 
  MoreHorizontal, 
  Key,
  Building2,
  Smartphone,
  AlertCircle,
  Loader2,
  RotateCcw,
  CheckCircle,
  Clock,
  XCircle,
  Trash2,
  Filter
} from 'lucide-react';

// Konfigurasi Pagination
const ITEMS_PER_PAGE = 10;

export default function LicensesPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal States
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generateQuantity, setGenerateQuantity] = useState('1');
  const [selectedBranchId, setSelectedBranchId] = useState('');
  
  // Filter & Pagination State
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pending' | 'Assigned' | 'Active'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadData();
  }, []);

  // Reset halaman ke 1 saat filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  // Helper Delay
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [licensesData, branchesData] = await Promise.all([
        licenseAPI.getAll(),
        branchAPI.getAll(),
      ]);
      
      const branchesList = Array.isArray(branchesData) ? branchesData : [];
      const licensesList = Array.isArray(licensesData) ? licensesData : [];
      
      const licensesWithBranch = licensesList.map(license => {
        const branch = branchesList.find(b => b.branch_id === license.branch_id);
        
        let actualStatus: 'Pending' | 'Assigned' | 'Active' | 'Inactive' = 'Pending';
        
        if (license.device_name && license.device_id) {
          actualStatus = 'Active';
        } else if (branch || license.branch_id) {
          actualStatus = 'Assigned';
        } else {
          actualStatus = 'Pending';
        }
        
        return {
          ...license,
          branch: branch || null,
          license_status: actualStatus
        };
      });
      
      setLicenses(licensesWithBranch);
      setBranches(branchesList);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data lisensi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateLicense = async () => {
    setIsSubmitting(true);
    try {
      await delay(3000); 
      await licenseAPI.generate(parseInt(generateQuantity));
      await loadData();
      setIsGenerateModalOpen(false);
      setGenerateQuantity('1');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal generate lisensi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignBranch = async () => {
    if (!selectedLicense || !selectedBranchId) return;
    
    setIsSubmitting(true);
    try {
      await delay(3000); 
      await licenseAPI.assignBranch(selectedLicense.activation_code, selectedBranchId);
      await loadData();
      setIsAssignModalOpen(false);
      setSelectedLicense(null);
      setSelectedBranchId('');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal mengalokasikan lisensi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetDevice = async () => {
    if (!selectedLicense) return;
    
    setIsSubmitting(true);
    try {
      await delay(3000); 
      await licenseAPI.resetDevice(selectedLicense.activation_code);
      await loadData();
      setIsResetModalOpen(false);
      setSelectedLicense(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal reset perangkat');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePending = async () => {
    if (!selectedLicense) return;
    
    setIsSubmitting(true);
    try {
      await delay(3000); 
      await licenseAPI.delete(selectedLicense.activation_code);
      await loadData();
      setIsDeleteModalOpen(false);
      setSelectedLicense(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus lisensi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return (
          <Badge className="bg-green-600">
            <CheckCircle className="mr-1 h-3 w-3" />
            Aktif
          </Badge>
        );
      case 'Assigned':
        return (
          <Badge className="bg-black">
            <Building2 className="mr-1 h-3 w-3" />
            Dialokasikan
          </Badge>
        );
      case 'Pending':
        return (
          <Badge variant="secondary">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <XCircle className="mr-1 h-3 w-3" />
            {status}
          </Badge>
        );
    }
  };

  const getBranchName = (license: License) => {
    if (license.branch) {
      return license.branch.branch_name;
    }
    if (license.branch_id) {
      const branch = branches.find(b => b.branch_id === license.branch_id);
      return branch ? branch.branch_name : 'Cabang tidak ditemukan';
    }
    return null;
  };

  // 1. Filter Logic
  const filteredLicenses = statusFilter === 'all' 
    ? licenses 
    : licenses.filter(l => l.license_status === statusFilter);

  const stats = {
    total: licenses.length,
    active: licenses.filter(l => l.license_status === 'Active').length,
    assigned: licenses.filter(l => l.license_status === 'Assigned').length,
    pending: licenses.filter(l => l.license_status === 'Pending').length,
  };

  // 2. Pagination Logic
  const totalItems = filteredLicenses.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedLicenses = filteredLicenses.slice(startIndex, endIndex);

  const handlePageChange = (page: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
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
      <div className="flex flex-col gap-4 @md:flex-row @md:items-center @md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manajemen Lisensi</h1>
          <p className="text-muted-foreground">Kelola lisensi perangkat untuk cabang Anda</p>
        </div>
        <Button onClick={() => setIsGenerateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Generate Lisensi
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filter */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium whitespace-nowrap">Filter Status:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('all')}
            >
              Semua ({licenses.length})
            </Button>
            <Button
              variant={statusFilter === 'Active' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('Active')}
            >
              Aktif ({stats.active})
            </Button>
            <Button
              variant={statusFilter === 'Assigned' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('Assigned')}
            >
              Dialokasikan ({stats.assigned})
            </Button>
            <Button
              variant={statusFilter === 'Pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('Pending')}
            >
              Pending ({stats.pending})
            </Button>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kode Aktivasi</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Cabang</TableHead>
              <TableHead>Perangkat</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedLicenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <Key className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">
                    {statusFilter === 'all' 
                      ? 'Tidak ada lisensi'
                      : `Tidak ada lisensi dengan status ${statusFilter}`
                    }
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              paginatedLicenses.map((license) => {
                const branchName = getBranchName(license);
                
                return (
                  <TableRow key={license.license_id}>
                    <TableCell className="font-mono font-semibold">
                      {license.activation_code}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(license.license_status)}
                    </TableCell>
                    <TableCell>
                      {branchName ? (
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{branchName}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">
                          Belum dialokasikan
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {license.device_name ? (
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{license.device_name}</p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {license.device_id}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">
                          Belum diaktifkan
                        </span>
                      )}
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
                          {license.license_status === 'Pending' && (
                            <>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedLicense(license);
                                  setIsAssignModalOpen(true);
                                }}
                              >
                                <Building2 className="mr-2 h-4 w-4" />
                                Alokasikan ke Cabang
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedLicense(license);
                                  setIsDeleteModalOpen(true);
                                }}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Hapus
                              </DropdownMenuItem>
                            </>
                          )}
                          {license.license_status === 'Active' && (
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedLicense(license);
                                setIsResetModalOpen(true);
                              }}
                            >
                              <RotateCcw className="mr-2 h-4 w-4" />
                              Reset Perangkat
                            </DropdownMenuItem>
                          )}
                          {license.license_status === 'Assigned' && (
                            <DropdownMenuItem disabled>
                              <Clock className="mr-2 h-4 w-4" />
                              Menunggu Aktivasi
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="py-4 flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    href="#" 
                    onClick={(e) => handlePageChange(currentPage - 1, e)}
                    className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                
                {Array.from({ length: totalPages }).map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink 
                      href="#" 
                      isActive={currentPage === i + 1}
                      onClick={(e) => handlePageChange(i + 1, e)}
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext 
                    href="#" 
                    onClick={(e) => handlePageChange(currentPage + 1, e)}
                    className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </Card>

      {/* Generate Modal */}
      <Dialog open={isGenerateModalOpen} onOpenChange={setIsGenerateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Lisensi Baru</DialogTitle>
            <DialogDescription>
              Masukkan jumlah lisensi yang ingin dibuat
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Jumlah Lisensi *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={generateQuantity}
                onChange={(e) => setGenerateQuantity(e.target.value)}
                placeholder="1"
              />
            </div>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Lisensi yang dibuat akan berstatus <strong>Pending</strong> dan perlu 
                dialokasikan ke cabang sebelum bisa digunakan.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGenerateModalOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleGenerateLicense} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Modal */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alokasikan ke Cabang</DialogTitle>
            <DialogDescription>
              Pilih cabang untuk lisensi ini
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">Kode Aktivasi:</p>
              <p className="font-mono font-bold">{selectedLicense?.activation_code}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="branch_id">Pilih Cabang *</Label>
              <Select
                value={selectedBranchId}
                onValueChange={setSelectedBranchId}
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
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Setelah dialokasikan, status akan berubah menjadi <strong>Dialokasikan</strong> 
                dan menunggu aktivasi perangkat.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAssignModalOpen(false);
                setSelectedLicense(null);
                setSelectedBranchId('');
              }}
            >
              Batal
            </Button>
            <Button
              onClick={handleAssignBranch}
              disabled={isSubmitting || !selectedBranchId}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Alokasikan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Confirmation */}
      <Dialog open={isResetModalOpen} onOpenChange={setIsResetModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Perangkat?</DialogTitle>
            <DialogDescription>
              Perangkat yang terhubung akan diputus dan lisensi akan kembali ke status{' '}
              <strong>Dialokasikan</strong>, menunggu aktivasi perangkat baru.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted p-3 rounded-lg my-4">
            <p className="text-sm text-muted-foreground mb-1">Kode:</p>
            <p className="font-mono font-bold">{selectedLicense?.activation_code}</p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsResetModalOpen(false);
                setSelectedLicense(null);
              }}
            >
              Batal
            </Button>
            <Button className='bg-black hover:bg-gray-800' variant="destructive" onClick={handleResetDevice} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Pending Confirmation */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Lisensi Pending?</DialogTitle>
            <DialogDescription>
              Lisensi ini akan dihapus dan kuota akan dikembalikan.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted p-3 rounded-lg my-4">
            <p className="text-sm text-muted-foreground mb-1">Kode:</p>
            <p className="font-mono font-bold">{selectedLicense?.activation_code}</p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSelectedLicense(null);
              }}
            >
              Batal
            </Button>
            <Button className='bg-black hover:bg-gray-800' variant="destructive" onClick={handleDeletePending} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}