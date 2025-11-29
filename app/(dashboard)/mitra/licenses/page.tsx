'use client';

import { useEffect, useState } from 'react';
import { fetchWithAuth } from '@/lib/api';
import { License } from '@/types';
import { Key, Plus, MoreHorizontal, Search, CheckCircle, XCircle, Smartphone, Building2 } from 'lucide-react';
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

export default function PartnerLicensesPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchLicenses = async () => {
      try {
        setIsLoading(true);
        const data = await fetchWithAuth('/partner/licenses');
        setLicenses(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching licenses:', error);
        setLicenses([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLicenses();
  }, []);

  const filteredLicenses = licenses.filter(license => 
    license.activation_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    license.device_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    license.branch?.branch_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <TableSkeleton rows={5} showSearch showButton />;
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8 @container">
      {/* Header */}
      <div className="flex flex-col gap-4 @md:flex-row @md:items-center @md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight @md:text-3xl">Lisensi Perangkat</h2>
          <p className="text-sm text-muted-foreground @md:text-base">
            Kelola lisensi perangkat untuk bisnis Anda
          </p>
        </div>
        
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Buat Lisensi Baru
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 @md:flex-row @md:items-center @md:justify-between">
            <div className="space-y-1 flex-1">
              <CardTitle>Daftar Lisensi</CardTitle>
              <CardDescription>Semua lisensi perangkat yang aktif untuk bisnis Anda</CardDescription>
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
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Smartphone className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{license.device_name || 'Belum diassign'}</div>
                              {license.device_id && (
                                <div className="text-xs text-muted-foreground">
                                  {license.device_id}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            {license.branch?.branch_name || 'Pusat'}
                          </div>
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
                              <DropdownMenuItem>
                                Salin Kode
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                Edit Perangkat
                              </DropdownMenuItem>
                              {license.license_status === 'Active' && (
                                <DropdownMenuItem className="text-orange-600">
                                  Cabut Lisensi
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive">
                                Hapus Lisensi
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
                            {license.device_name || 'Belum diassign'}
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
                            <DropdownMenuItem>
                              Salin Kode
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              Edit Perangkat
                            </DropdownMenuItem>
                            {license.license_status === 'Active' && (
                              <DropdownMenuItem className="text-orange-600">
                                Cabut Lisensi
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              Hapus Lisensi
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Device ID:</span>
                        <span className="font-medium text-xs">{license.device_id || '-'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Cabang:</span>
                        <span className="font-medium">{license.branch?.branch_name || 'Pusat'}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}