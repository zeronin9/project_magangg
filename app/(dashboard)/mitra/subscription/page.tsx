'use client';

import { useEffect, useState } from 'react';
import { fetchWithAuth } from '@/lib/api';
import { PartnerSubscription } from '@/types';
import { Package, Plus, MoreHorizontal, Search, CheckCircle, Clock, Calendar, DollarSign } from 'lucide-react';
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
import { formatRupiah } from '@/lib/utils';

export default function PartnerSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<PartnerSubscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        setIsLoading(true);
        const data = await fetchWithAuth('/partner/subscriptions');
        setSubscriptions(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching subscriptions:', error);
        setSubscriptions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscriptions();
  }, []);

  const filteredSubscriptions = subscriptions.filter(sub => 
    sub.plan_snapshot?.plan_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <TableSkeleton rows={5} showSearch showButton />;
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8 @container">
      {/* Header */}
      <div className="flex flex-col gap-4 @md:flex-row @md:items-center @md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight @md:text-3xl">Langganan Saya</h2>
          <p className="text-sm text-muted-foreground @md:text-base">
            Kelola paket langganan dan riwayat pembayaran
          </p>
        </div>
        
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Upgrade Paket
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 @md:flex-row @md:items-center @md:justify-between">
            <div className="space-y-1 flex-1">
              <CardTitle>Riwayat Langganan</CardTitle>
              <CardDescription>Semua paket langganan yang pernah Anda gunakan</CardDescription>
            </div>
            <div className="flex flex-col gap-2 @md:flex-row @md:items-center">
              <div className="relative w-full @md:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari langganan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filteredSubscriptions.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">{searchTerm ? 'Tidak ada hasil' : 'Belum ada langganan'}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {searchTerm ? 'Coba ubah kata kunci pencarian' : 'Mulai dengan berlangganan paket pertama'}
              </p>
              {!searchTerm && (
                <Button className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />Berlangganan
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
                      <TableHead>Nama Paket</TableHead>
                      <TableHead>Harga & Durasi</TableHead>
                      <TableHead>Tanggal Mulai</TableHead>
                      <TableHead>Tanggal Selesai</TableHead>
                      <TableHead>Pembayaran</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubscriptions.map((subscription) => (
                      <TableRow key={subscription.subscription_id}>
                        <TableCell className="font-medium">
                          {subscription.plan_snapshot?.plan_name || 'Paket tidak tersedia'}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-semibold flex items-center gap-1">
                              <DollarSign className="h-3 w-3 text-green-600" />
                              {formatRupiah(subscription.plan_snapshot?.price || 0)}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {subscription.plan_snapshot?.duration_months || 0} bulan
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(subscription.start_date).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(subscription.end_date).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={subscription.payment_status === 'Paid' ? 'default' : 'secondary'}>
                            {subscription.payment_status === 'Paid' ? (
                              <><CheckCircle className="mr-1 h-3 w-3" /> Lunas</>
                            ) : (
                              <><Clock className="mr-1 h-3 w-3" /> Menunggu</>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={subscription.status === 'Active' ? 'default' : 'outline'}>
                            {subscription.status === 'Active' ? 'Aktif' : 'Tidak Aktif'}
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
                                Lihat Detail
                              </DropdownMenuItem>
                              {subscription.status === 'Active' && (
                                <DropdownMenuItem className="text-orange-600">
                                  Batalkan Langganan
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                Unduh Invoice
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
                {filteredSubscriptions.map((subscription) => (
                  <Card key={subscription.subscription_id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1 min-w-0">
                          <CardTitle className="text-base">
                            {subscription.plan_snapshot?.plan_name || 'Paket tidak tersedia'}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant={subscription.status === 'Active' ? 'default' : 'outline'}>
                              {subscription.status === 'Active' ? 'Aktif' : 'Tidak Aktif'}
                            </Badge>
                            <Badge variant={subscription.payment_status === 'Paid' ? 'default' : 'secondary'}>
                              {subscription.payment_status === 'Paid' ? 'Lunas' : 'Menunggu'}
                            </Badge>
                          </div>
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
                              Lihat Detail
                            </DropdownMenuItem>
                            {subscription.status === 'Active' && (
                              <DropdownMenuItem className="text-orange-600">
                                Batalkan Langganan
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              Unduh Invoice
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Harga:</span>
                        <span className="font-semibold text-primary">
                          {formatRupiah(subscription.plan_snapshot?.price || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Durasi:</span>
                        <span className="font-medium">
                          {subscription.plan_snapshot?.duration_months || 0} bulan
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Mulai:</span>
                        <span>
                          {new Date(subscription.start_date).toLocaleDateString('id-ID')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Selesai:</span>
                        <span>
                          {new Date(subscription.end_date).toLocaleDateString('id-ID')}
                        </span>
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