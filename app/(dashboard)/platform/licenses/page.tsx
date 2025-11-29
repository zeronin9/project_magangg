'use client';

import { useEffect, useState } from 'react';
import { fetchWithAuth } from '@/lib/api';
import { License, Partner } from '@/types';
import { TableSkeleton } from '@/components/skeletons/TableSkeleton';
import { Award, Search, Key, Smartphone, Building2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ExtendedLicense extends License {
  partner?: Partner;
}

export default function LicensesPage() {
  const [licenses, setLicenses] = useState<ExtendedLicense[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      const partnersData = await fetchWithAuth('/partner');
      const partnersList = Array.isArray(partnersData) ? partnersData : [];
      setPartners(partnersList);

      const licensePromises = partnersList.map((partner: Partner) => 
        fetchWithAuth(`/license/partner/${partner.partner_id}`)
          .then(data => {
            const licensesArray = Array.isArray(data) ? data : [];
            return licensesArray.map((license: License) => ({
              ...license,
              partner: partner
            }));
          })
          .catch(() => [])
      );

      const licenseResults = await Promise.all(licensePromises);
      const allLicenses = licenseResults.flat();
      setLicenses(allLicenses);

    } catch (error) {
      console.error('Error fetching licenses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPartnerName = (license: ExtendedLicense): string => {
    if (license.partner) {
      return license.partner.business_name;
    }
    const partner = partners.find(p => p.partner_id === license.partner_id);
    return partner?.business_name || 'Unknown';
  };

  const filteredLicenses = licenses.filter(license => {
    const matchesSearch = 
      license.activation_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (license.device_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (license.device_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      getPartnerName(license).toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      statusFilter === 'all' || 
      license.license_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: licenses.length,
    active: licenses.filter(l => l.license_status === 'Active').length,
    assigned: licenses.filter(l => l.license_status === 'Assigned').length,
    pending: licenses.filter(l => l.license_status === 'Pending').length,
  };

  if (isLoading) {
    return <TableSkeleton rows={12} showSearch showButton />; // ✅ Use skeleton
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8 @container">
      {/* Header - Responsive */}
      <div className="flex flex-col gap-4 @md:flex-row @md:items-center @md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight @md:text-3xl">Lisensi Perangkat</h2>
          <p className="text-sm text-muted-foreground @md:text-base">
            Monitor dan kelola semua lisensi perangkat mitra
          </p>
        </div>
      </div>

      {/* Stats Cards - Responsive */}
      <div className="grid gap-4 grid-cols-2 @lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium @md:text-sm">
              Total Lisensi
            </CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold @md:text-2xl">+{stats.total}</div>
            <p className="text-xs text-muted-foreground hidden @sm:block">
              Semua perangkat terdaftar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium @md:text-sm">
              Lisensi Aktif
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold @md:text-2xl">+{stats.active}</div>
            <p className="text-xs text-muted-foreground hidden @sm:block">
              Perangkat aktif dan terverifikasi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium @md:text-sm">
              Dialokasikan
            </CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold @md:text-2xl">+{stats.assigned}</div>
            <p className="text-xs text-muted-foreground hidden @sm:block">
              Sudah ditempatkan ke cabang
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium @md:text-sm">
              Menunggu
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold @md:text-2xl">+{stats.pending}</div>
            <p className="text-xs text-muted-foreground hidden @sm:block">
              Belum diaktivasi
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 @md:flex-row @md:items-center @md:justify-between">
            <div className="space-y-1">
              <CardTitle>Daftar Lisensi</CardTitle>
              <CardDescription>
                Semua lisensi perangkat dari seluruh mitra
              </CardDescription>
            </div>
            
            <div className="flex flex-col gap-2 @md:flex-row @md:items-center">
              {/* Search */}
              <div className="relative w-full @md:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari lisensi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full @md:w-[180px]">
                  <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="Active">Aktif</SelectItem>
                  <SelectItem value="Assigned">Dialokasikan</SelectItem>
                  <SelectItem value="Pending">Menunggu</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filteredLicenses.length === 0 ? (
            <div className="text-center py-12">
              <Award className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">
                {searchTerm || statusFilter !== 'all' ? 'Tidak ada hasil' : 'Belum ada lisensi'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Coba ubah filter atau kata kunci pencarian' 
                  : 'Lisensi akan muncul setelah mitra mengaktivasi perangkat'}
              </p>
            </div>
          ) : (
            <div className="@container/licenses">
              {/* Desktop Table */}
              <div className="hidden @2xl/licenses:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kode Aktivasi</TableHead>
                      <TableHead>Mitra</TableHead>
                      <TableHead>ID Perangkat</TableHead>
                      <TableHead>Nama Perangkat</TableHead>
                      <TableHead>Cabang</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Diaktivasi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLicenses.map((license) => (
                      <TableRow key={license.license_id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Key className="h-4 w-4 text-muted-foreground" />
                            <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
                              {license.activation_code}
                            </code>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            {getPartnerName(license)}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {license.device_id || '-'}
                        </TableCell>
                        <TableCell className="font-medium">
                          {license.device_name || '-'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {license.branch?.branch_name || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              license.license_status === 'Active' ? 'default' :
                              license.license_status === 'Assigned' ? 'secondary' : 'outline'
                            }
                          >
                            {license.license_status === 'Active' && (
                              <CheckCircle className="mr-1 h-3 w-3" />
                            )}
                            {license.license_status === 'Assigned' && (
                              <Smartphone className="mr-1 h-3 w-3" />
                            )}
                            {license.license_status === 'Pending' && (
                              <Clock className="mr-1 h-3 w-3" />
                            )}
                            {license.license_status === 'Active' ? 'Aktif' : 
                             license.license_status === 'Assigned' ? 'Dialokasikan' : 'Menunggu'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {license.activated_at 
                            ? new Date(license.activated_at).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })
                            : '-'
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile/Tablet Card List */}
              <div className="@2xl/licenses:hidden space-y-4">
                {filteredLicenses.map((license) => (
                  <Card key={license.license_id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Key className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <code className="text-xs font-mono font-semibold bg-muted px-2 py-1 rounded truncate">
                              {license.activation_code}
                            </code>
                          </div>
                          <CardTitle className="text-sm truncate">{getPartnerName(license)}</CardTitle>
                        </div>
                        <Badge 
                          variant={
                            license.license_status === 'Active' ? 'default' :
                            license.license_status === 'Assigned' ? 'secondary' : 'outline'
                          }
                          className="flex-shrink-0"
                        >
                          {license.license_status === 'Active' ? 'Aktif' : 
                           license.license_status === 'Assigned' ? 'Dialokasikan' : 'Menunggu'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Device ID:</span>
                        <span className="font-medium truncate ml-2">{license.device_id || '-'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Nama Perangkat:</span>
                        <span className="font-medium truncate ml-2">{license.device_name || '-'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Cabang:</span>
                        <span className="font-medium truncate ml-2">{license.branch?.branch_name || '-'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Diaktivasi:</span>
                        <span className="text-xs">
                          {license.activated_at 
                            ? new Date(license.activated_at).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })
                            : '-'
                          }
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

      {/* Info Card - Responsive */}
      <Card className="bg-muted/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base @md:text-lg">Informasi Lisensi</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-xs @md:text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
            <div>
              <span className="font-semibold text-foreground">Aktif:</span> Perangkat telah diaktivasi dan terverifikasi
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Smartphone className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />
            <div>
              <span className="font-semibold text-foreground">Dialokasikan:</span> Lisensi telah ditempatkan ke cabang tertentu
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Clock className="h-4 w-4 mt-0.5 text-yellow-600 flex-shrink-0" />
            <div>
              <span className="font-semibold text-foreground">Menunggu:</span> Belum diaktivasi oleh mitra
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
