// app/(dashboard)/branch/shift-schedules/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { shiftScheduleAPI } from '@/lib/api/branch';
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
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Clock,
  AlertCircle,
  Loader2,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

interface ShiftSchedule {
  shift_schedule_id: string;
  shift_name: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

const ITEMS_PER_PAGE = 10;

export default function ShiftSchedulesPage() {
  const [shifts, setShifts] = useState<ShiftSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter & Pagination
  const [showInactive, setShowInactive] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<ShiftSchedule | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    shift_name: '',
    start_time: '',
    end_time: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, showInactive]);

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const loadData = async () => {
    try {
      setIsLoading(true);
      const response = await shiftScheduleAPI.getAll();
      const shiftsData = Array.isArray(response.data) ? response.data : [];

      setShifts(shiftsData);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data jadwal shift');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (shift?: ShiftSchedule) => {
    if (shift) {
      setSelectedShift(shift);
      setFormData({
        shift_name: shift.shift_name,
        start_time: shift.start_time,
        end_time: shift.end_time,
      });
    } else {
      setSelectedShift(null);
      setFormData({
        shift_name: '',
        start_time: '',
        end_time: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedShift(null);
    setFormData({
      shift_name: '',
      start_time: '',
      end_time: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (selectedShift) {
        await shiftScheduleAPI.update(selectedShift.shift_schedule_id, formData);
      } else {
        await shiftScheduleAPI.create(formData);
      }

      await loadData();
      handleCloseModal();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Gagal menyimpan jadwal shift';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (shift: ShiftSchedule) => {
    setIsSubmitting(true);
    try {
      await delay(1500);
      await shiftScheduleAPI.update(shift.shift_schedule_id, {
        shift_name: shift.shift_name,
        start_time: shift.start_time,
        end_time: shift.end_time,
        is_active: !shift.is_active,
      });

      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal mengubah status shift');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter
  const filteredShifts = shifts.filter((shift) => {
    const matchesSearch = shift.shift_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesActive = showInactive ? shift.is_active === false : shift.is_active !== false;
    return matchesSearch && matchesActive;
  });

  // Pagination
  const totalItems = filteredShifts.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedShifts = filteredShifts.slice(startIndex, endIndex);

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
          <h1 className="text-3xl font-bold tracking-tight">Jadwal Shift</h1>
          <p className="text-muted-foreground">Kelola jadwal waktu operasional shift kasir</p>
        </div>
        <div className="grid grid-cols-2 gap-2 @md:flex">
          <Button variant={showInactive ? 'default' : 'outline'} onClick={() => setShowInactive(!showInactive)}>
            {showInactive ? <ToggleRight className="mr-2 h-4 w-4" /> : <ToggleLeft className="mr-2 h-4 w-4" />}
            {showInactive ? 'Tampilkan Aktif' : 'Tampilkan Non-Aktif'}
          </Button>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Shift
          </Button>
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
        <Clock className="h-4 w-4" />
        <AlertDescription>
          <strong>Jadwal Shift:</strong> Tentukan waktu mulai dan selesai shift. Operator akan memilih shift saat membuka
          kasir.
        </AlertDescription>
      </Alert>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Jadwal Shift</CardTitle>
          <CardDescription>
            Total {filteredShifts.length} shift {showInactive ? 'non-aktif' : 'aktif'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {paginatedShifts.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                {searchQuery
                  ? 'Tidak ada hasil pencarian'
                  : showInactive
                  ? 'Tidak ada shift non-aktif'
                  : 'Belum ada jadwal shift'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Shift</TableHead>
                    <TableHead>Jam Mulai</TableHead>
                    <TableHead>Jam Selesai</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedShifts.map((shift) => (
                    <TableRow key={shift.shift_schedule_id}>
                      <TableCell className="font-medium">{shift.shift_name}</TableCell>
                      <TableCell>{shift.start_time}</TableCell>
                      <TableCell>{shift.end_time}</TableCell>
                      <TableCell>
                        {shift.is_active === false ? (
                          <Badge variant="secondary">Non-Aktif</Badge>
                        ) : (
                          <Badge variant="default" className="bg-black">
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

                            <DropdownMenuItem onClick={() => handleOpenModal(shift)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem onClick={() => handleToggleActive(shift)}>
                              {shift.is_active === false ? (
                                <>
                                  <ToggleRight className="mr-2 h-4 w-4" />
                                  Aktifkan
                                </>
                              ) : (
                                <>
                                  <ToggleLeft className="mr-2 h-4 w-4" />
                                  Non-Aktifkan
                                </>
                              )}
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
            <DialogTitle>{selectedShift ? 'Edit Jadwal Shift' : 'Tambah Jadwal Shift Baru'}</DialogTitle>
            <DialogDescription>
              {selectedShift ? 'Perbarui informasi jadwal shift' : 'Buat jadwal shift baru untuk operasional kasir'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="shift_name">Nama Shift *</Label>
                <Input
                  id="shift_name"
                  value={formData.shift_name}
                  onChange={(e) => setFormData({ ...formData, shift_name: e.target.value })}
                  placeholder="Masukkan nama shift"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="start_time">Jam Mulai *</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_time">Jam Selesai *</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseModal} disabled={isSubmitting}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selectedShift ? 'Update' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
