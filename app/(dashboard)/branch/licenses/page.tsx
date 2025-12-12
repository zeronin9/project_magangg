// app/(dashboard)/branch/licenses/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { branchLicenseAPI } from '@/lib/api/branch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { MoreHorizontal, Key, AlertCircle, Loader2, RotateCcw, Monitor, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface License {
  license_id: string;
  activation_code: string;
  license_status: string;
  device_name?: string;
  activated_at?: string;
  expires_at?: string;
}

const ITEMS_PER_PAGE = 10;

export default function LicensesPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [currentPage, setCurrentPage] = useState(1);

  const [isResetOpen, setIsResetOpen] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const loadData = async () => {
    try {
      setIsLoading(true);
      const response = await branchLicenseAPI.getMyBranch();
      const licensesData = Array.isArray(response.data) ? response.data : [];

      setLicenses(licensesData);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data lisensi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenReset = (license: License) => {
    setSelectedLicense(license);
    setIsResetOpen(true);
  };

  const handleCloseReset = () => {
    setIsResetOpen(false);
    setSelectedLicense(null);
  };

  const handleReset = async () => {
    if (!selectedLicense) return;

    setIsSubmitting(true);
    try {
      await delay(2000);
      await branchLicenseAPI.resetDevice(selectedLicense.activation_code);

      await loadData();
      handleCloseReset();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Gagal mereset lisensi';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Count statistics
  const activeLicenses = licenses.filter((l) => l.license_status === 'Active').length;
  const availableLicenses = licenses.filter((l) => l.license_status === 'Available').length;
  const expiredLicenses = licenses.filter((l) => l.license_status === 'Expired').length;

  // Pagination
  const totalItems = licenses.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedLicenses = licenses.slice(startIndex, endIndex);

  const handlePageChange = (page: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return (
          <Badge variant="default" className="bg-green-600">
            <CheckCircle className="mr-1 h-3 w-3" />
            Aktif
          </Badge>
        );
      case 'Available':
        return (
          <Badge variant="outline">
            <Key className="mr-1 h-3 w-3" />
            Tersedia
          </Badge>
        );
      case 'Expired':
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            Kadaluarsa
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
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
        </div>
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
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8 @container">
      {/* Header */}
      <div className="flex flex-col gap-4 @md:flex-row @md:items-center @md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lisensi Cabang</h1>
          <p className="text-muted-foreground">Kelola lisensi perangkat POS cabang Anda</p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Info Alert */}
      <Alert>
        <Key className="h-4 w-4" />
        <AlertDescription>
          <strong>Lisensi Perangkat:</strong> Setiap perangkat POS memerlukan lisensi aktif. Jika ingin mengganti
          perangkat, reset lisensi terlebih dahulu.
        </AlertDescription>
      </Alert>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lisensi Aktif</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeLicenses}</div>
            <p className="text-xs text-muted-foreground mt-1">Perangkat terdaftar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lisensi Tersedia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableLicenses}</div>
            <p className="text-xs text-muted-foreground mt-1">Siap diaktivasi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Lisensi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{licenses.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Lisensi dimiliki</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Lisensi</CardTitle>
          <CardDescription>Lisensi yang terdaftar untuk cabang ini</CardDescription>
        </CardHeader>
        <CardContent>
          {paginatedLicenses.length === 0 ? (
            <div className="text-center py-12">
              <Key className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Tidak ada lisensi tersedia</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode Aktivasi</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Nama Perangkat</TableHead>
                    <TableHead>Tanggal Aktivasi</TableHead>
                    <TableHead>Kadaluarsa</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedLicenses.map((license) => (
                    <TableRow key={license.license_id}>
                      <TableCell className="font-mono text-sm font-semibold">{license.activation_code}</TableCell>
                      <TableCell>{getStatusBadge(license.license_status)}</TableCell>
                      <TableCell>
                        {license.device_name ? (
                          <div className="flex items-center gap-1">
                            <Monitor className="h-3 w-3 text-muted-foreground" />
                            {license.device_name}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {license.activated_at
                          ? format(new Date(license.activated_at), 'dd MMM yyyy', { locale: id })
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {license.expires_at ? (
                          <span
                            className={
                              new Date(license.expires_at) < new Date()
                                ? 'text-destructive font-medium'
                                : 'text-muted-foreground'
                            }
                          >
                            {format(new Date(license.expires_at), 'dd MMM yyyy', { locale: id })}
                          </span>
                        ) : (
                          '-'
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

                            {license.license_status === 'Active' && (
                              <>
                                <DropdownMenuItem onClick={() => handleOpenReset(license)}>
                                  <RotateCcw className="mr-2 h-4 w-4" />
                                  Reset Perangkat
                                </DropdownMenuItem>
                              </>
                            )}

                            {license.license_status === 'Available' && (
                              <DropdownMenuItem disabled className="text-muted-foreground">
                                Belum diaktivasi
                              </DropdownMenuItem>
                            )}

                            {license.license_status === 'Expired' && (
                              <DropdownMenuItem disabled className="text-muted-foreground">
                                Lisensi kadaluarsa
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

      {/* Reset Confirmation */}
      <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              Reset Perangkat?
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin mereset lisensi <strong>{selectedLicense?.activation_code}</strong>?
              <br />
              <br />
              Perangkat saat ini (<strong>{selectedLicense?.device_name}</strong>) akan dilepaskan dan lisensi dapat
              digunakan untuk perangkat baru.
              <br />
              <br />
              <strong>Catatan:</strong> Pastikan perangkat lama sudah tidak digunakan sebelum mereset.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseReset} disabled={isSubmitting}>
              Batal
            </Button>
            <Button onClick={handleReset} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reset Lisensi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
