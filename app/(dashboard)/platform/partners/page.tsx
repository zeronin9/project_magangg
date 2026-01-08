'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchWithAuth } from '@/lib/api';
import { Partner } from '@/types';
import { TableSkeleton } from '@/components/skeletons/TableSkeleton';
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
import { Plus, Search, MoreHorizontal, Ban, CheckCircle, Eye, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// IMPORT PAGINATION SHADCN
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export default function PartnerListPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isSuspendOpen, setIsSuspendOpen] = useState(false);
  const [isActivateOpen, setIsActivateOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  
  // State untuk mencegah double click (loading state)
  const [isProcessing, setIsProcessing] = useState(false);

  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchPartners();
  }, []);

  // Reset halaman ke 1 saat melakukan pencarian
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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

  const handleSuspend = async (e: React.MouseEvent) => {
    // Mencegah modal tertutup otomatis
    e.preventDefault();
    
    if (!selectedPartner || isProcessing) return;
    
    setIsProcessing(true);

    try {
      // Jalankan API dan Timer 3 Detik secara bersamaan
      await Promise.all([
        fetchWithAuth(`/partner/${selectedPartner.partner_id}`, { method: 'DELETE' }),
        new Promise(resolve => setTimeout(resolve, 3000)) // Delay 3 detik
      ]);
      
      // Alert dihapus sesuai permintaan
      setIsSuspendOpen(false);
      fetchPartners();
    } catch (error: any) {
      console.error('Gagal suspend mitra:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleActivate = async (e: React.MouseEvent) => {
    // Mencegah modal tertutup otomatis
    e.preventDefault();

    if (!selectedPartner || isProcessing) return;

    setIsProcessing(true);

    try {
      // Jalankan API dan Timer 3 Detik secara bersamaan
      await Promise.all([
        fetchWithAuth(`/partner/${selectedPartner.partner_id}`, {
          method: 'PUT',
          body: { 
            business_name: selectedPartner.business_name,
            business_phone: selectedPartner.business_phone,
            status: 'Active' 
          },
        }),
        new Promise(resolve => setTimeout(resolve, 3000)) // Delay 3 detik
      ]);
      
      // Alert dihapus sesuai permintaan
      setIsActivateOpen(false);
      fetchPartners();
    } catch (error: any) {
      console.error('Error activating partner:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- LOGIKA FILTER & PAGINATION ---
  const filteredPartners = partners.filter(p =>
    p.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.business_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPartners = filteredPartners.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPartners.length / itemsPerPage);

  // --- COMPONENT PAGINATION UI ---
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
      const pages = [];
      if (totalPages <= 5) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
      } else {
        if (currentPage <= 3) {
          pages.push(1, 2, 3, '...', totalPages);
        } else if (currentPage >= totalPages - 2) {
          pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
        } else {
          pages.push(1, '...', currentPage, '...', totalPages);
        }
      }
      return pages;
    };

    return (
      <Pagination className="mt-4 justify-center">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              href="#" 
              onClick={(e) => { 
                e.preventDefault(); 
                if (currentPage > 1) setCurrentPage(currentPage - 1); 
              }}
              className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
          
          {getPageNumbers().map((page, idx) => (
            <PaginationItem key={idx}>
              {page === '...' ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink 
                  href="#" 
                  isActive={currentPage === page}
                  onClick={(e) => { 
                    e.preventDefault(); 
                    setCurrentPage(Number(page)); 
                  }}
                >
                  {page}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}

          <PaginationItem>
            <PaginationNext 
              href="#" 
              onClick={(e) => { 
                e.preventDefault(); 
                if (currentPage < totalPages) setCurrentPage(currentPage + 1); 
              }}
              className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

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
                  {/* KOLOM INDEX */}
                  <TableHead className="w-[50px]">No.</TableHead>
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
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? 'Tidak ada mitra yang ditemukan' : 'Belum ada mitra'}
                    </TableCell>
                  </TableRow>
                ) : (
                  currentPartners.map((partner, index) => (
                    <TableRow key={partner.partner_id}>
                      {/* NOMOR URUT DINAMIS */}
                      <TableCell className="text-muted-foreground">
                        {indexOfFirstItem + index + 1}
                      </TableCell>

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

          {/* KONTROL PAGINATION */}
          {renderPagination()}

        </CardContent>
      </Card>

      {/* DIALOG SUSPEND */}
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
            <AlertDialogCancel disabled={isProcessing}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSuspend}
              className="bg-black text-white hover:bg-gray-800"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                'Suspend'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* DIALOG AKTIVASI */}
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
            <AlertDialogCancel disabled={isProcessing}>Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleActivate}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                'Aktifkan'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}