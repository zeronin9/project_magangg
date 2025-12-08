'use client';

import { useEffect, useState } from 'react';
import { fetchWithAuth } from '@/lib/api';
import { formatRupiah } from '@/lib/utils';
import { DashboardSkeleton } from '@/components/skeletons/DashboardSkeleton';
import { 
  Users, Package, CheckCircle, Award, TrendingUp, Activity, ArrowUpRight, Calendar
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from 'next/link';

interface DashboardStats {
  totalPartners: number;
  activePartners: number;
  suspendedPartners: number;
  activeSubscriptions: number;
  totalRevenue: number;
  totalPlans: number;
}

export default function PlatformDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalPartners: 0,
    activePartners: 0,
    suspendedPartners: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    totalPlans: 0,
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState('Admin Platform');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userObj = JSON.parse(userStr);
        setUsername(userObj.name || userObj.username || 'Admin');
      } catch (e) {}
    }
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [partnersData, subscriptionsData, plansData] = await Promise.allSettled([
        fetchWithAuth('/partner'),
        fetchWithAuth('/partner-subscription'), // Mengambil summary revenue & active partners
        fetchWithAuth('/subscription-plan'),
      ]);

      const partners = partnersData.status === 'fulfilled' && Array.isArray(partnersData.value) 
        ? partnersData.value : [];
      
      const subResponse = subscriptionsData.status === 'fulfilled' 
        ? subscriptionsData.value 
        : { summary: { total_revenue: 0, active_partners: 0 } };
      
      const plans = plansData.status === 'fulfilled' && Array.isArray(plansData.value)
        ? plansData.value : [];

      setStats({
        totalPartners: partners.length,
        activePartners: partners.filter((p: any) => p.status === 'Active').length,
        suspendedPartners: partners.filter((p: any) => p.status === 'Suspended').length,
        activeSubscriptions: subResponse.summary?.active_partners || 0,
        totalRevenue: Number(subResponse.summary?.total_revenue || 0),
        totalPlans: plans.length,
      });

    } catch (err) {
      console.error('Dashboard error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8 @container">
      {/* Header */}
      <div className="flex flex-col gap-4 @md:flex-row @md:items-center @md:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight @md:text-3xl">Dashboard</h2>
          <p className="text-sm text-muted-foreground @md:text-base">
            Selamat Datang, <span className="font-semibold text-foreground">{username}</span>!
          </p>
        </div>
        <Button variant="outline" size="sm" className="w-full @md:w-auto">
          <Calendar className="mr-2 h-4 w-4" />
          {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-1 @sm:grid-cols-2 @xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatRupiah(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">Total pendapatan sistem</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Mitra</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{stats.totalPartners}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activePartners} Active, {stats.suspendedPartners} Suspended
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mitra Berlangganan</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{stats.activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground">Saat ini aktif</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paket Tersedia</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{stats.totalPlans}</div>
            <p className="text-xs text-muted-foreground">Pilihan paket</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 grid-cols-1 @4xl:grid-cols-3">
        <Card className="@4xl:col-span-2">
          <CardHeader>
            <CardTitle>Aksi Cepat</CardTitle>
            <CardDescription>Shortcut manajemen utama</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 @md:grid-cols-2">
            <Link href="/platform/partners">
              <Button variant="outline" className="w-full justify-between h-auto py-4 hover:bg-accent hover:border-primary/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    <Users className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">Kelola Mitra</p>
                    <p className="text-xs text-muted-foreground">Tambah/Edit data mitra</p>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </Button>
            </Link>

            <Link href="/platform/subscriptions">
              <Button variant="outline" className="w-full justify-between h-auto py-4 hover:bg-accent hover:border-primary/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">Cek Pesanan</p>
                    <p className="text-xs text-muted-foreground">Approve pembayaran mitra</p>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}