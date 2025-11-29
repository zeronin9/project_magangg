'use client';

import { useEffect, useState } from 'react';
import { fetchWithAuth } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Users, Smartphone, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TableSkeleton } from '@/components/skeletons/TableSkeleton';
import { formatRupiah } from '@/lib/utils';

interface PartnerStats {
  totalSubscriptions: number;
  activeSubscriptions: number;
  totalLicenses: number;
  activeLicenses: number;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    date: string;
    status: string;
  }>;
}

export default function PartnerDashboardPage() {
  const [stats, setStats] = useState<PartnerStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        // Ganti dengan endpoint yang sesuai
        const statsData = await fetchWithAuth('/partner/dashboard/stats');
        setStats(statsData);
      } catch (error) {
        console.error('Error fetching partner stats:', error);
        setStats(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8">
        <TableSkeleton rows={4} />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8 @container">
      {/* Header */}
      <div className="flex flex-col gap-4 @md:flex-row @md:items-center @md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight @md:text-3xl">Dashboard</h2>
          <p className="text-sm text-muted-foreground @md:text-base">
            Ringkasan aktivitas dan statistik bisnis Anda
          </p>
        </div>
        <Button>
          <ArrowUpRight className="mr-2 h-4 w-4" />
          Lihat Laporan
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Langganan</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalSubscriptions || 0}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 flex items-center">
                <ArrowUpRight className="mr-1 h-3 w-3" />
                {stats?.activeSubscriptions || 0} aktif
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Lisensi</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalLicenses || 0}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 flex items-center">
                <ArrowUpRight className="mr-1 h-3 w-3" />
                {stats?.activeLicenses || 0} aktif
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pengguna Aktif</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 flex items-center">
                <ArrowUpRight className="mr-1 h-3 w-3" />
                +5 dari bulan lalu
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendapatan</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRupiah(12500000)}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 flex items-center">
                <ArrowUpRight className="mr-1 h-3 w-3" />
                +12% dari bulan lalu
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Aktivitas Terbaru</CardTitle>
            <CardDescription>
              Aktivitas terbaru dari sistem Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.recentActivity?.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.date).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                  </div>
                  <Badge variant={activity.status === 'success' ? 'default' : 'secondary'}>
                    {activity.status === 'success' ? 'Berhasil' : 'Pending'}
                  </Badge>
                </div>
              )) || (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="mx-auto h-8 w-8 mb-2" />
                  <p>Belum ada aktivitas</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status Sistem</CardTitle>
            <CardDescription>
              Status layanan dan pemeliharaan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">API Services</span>
                <Badge variant="default">Normal</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Database</span>
                <Badge variant="default">Normal</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Authentication</span>
                <Badge variant="default">Normal</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">License Service</span>
                <Badge variant="default">Normal</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}