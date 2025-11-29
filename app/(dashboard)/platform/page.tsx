'use client';

import { useEffect, useState } from 'react';
import { fetchWithAuth } from '@/lib/api';
import { formatRupiah } from '@/lib/utils';
import { DashboardSkeleton } from '@/components/skeletons/DashboardSkeleton';
import { 
  Users, Package, CheckCircle, Smartphone, Award, TrendingUp, Activity, ArrowUpRight, Calendar
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from 'next/link';

interface DashboardStats {
  totalPartners: number;
  activePartners: number;
  suspendedPartners: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
  totalRevenue: number;
  totalPlans: number;
  totalLicenses: number;
  activeLicenses: number;
}

export default function PlatformDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalPartners: 0,
    activePartners: 0,
    suspendedPartners: 0,
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    totalPlans: 0,
    totalLicenses: 0,
    activeLicenses: 0,
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [username, setUsername] = useState('Admin Platform');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userObj = JSON.parse(userStr);
        if (userObj.name || userObj.username) {
          setUsername(userObj.name || userObj.username);
        }
      } catch (e) {
        // Ignore
      }
    }

    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [partnersData, subscriptionsData, plansData] = await Promise.allSettled([
        fetchWithAuth('/partner'),
        fetchWithAuth('/partner-subscription'),
        fetchWithAuth('/subscription-plan'),
      ]);

      const partners = partnersData.status === 'fulfilled' 
        ? (Array.isArray(partnersData.value) ? partnersData.value : [])
        : [];
      
      const subscriptions = subscriptionsData.status === 'fulfilled' 
        ? subscriptionsData.value
        : { summary: {}, data: [] };
      
      const plans = plansData.status === 'fulfilled'
        ? (Array.isArray(plansData.value) ? plansData.value : [])
        : [];

      const activePartners = partners.filter((p: any) => p.status === 'Active').length;
      const suspendedPartners = partners.filter((p: any) => p.status === 'Suspended').length;

      let allLicenses: any[] = [];
      try {
        const licensePromises = partners.map((p: any) => 
          fetchWithAuth(`/license/partner/${p.partner_id}`).catch(() => [])
        );
        const licenseResults = await Promise.all(licensePromises);
        allLicenses = licenseResults.flat();
      } catch (err) {
        console.error('Error fetching licenses:', err);
      }

      const activeLicenses = allLicenses.filter((l: any) => l.license_status === 'Active').length;

      setStats({
        totalPartners: partners.length,
        activePartners: activePartners,
        suspendedPartners: suspendedPartners,
        totalSubscriptions: subscriptions?.summary?.total_subscriptions_record || 0,
        activeSubscriptions: subscriptions?.summary?.currently_active_partners || 0,
        totalRevenue: parseInt(subscriptions?.summary?.total_revenue || '0'),
        totalPlans: plans.length,
        totalLicenses: allLicenses.length,
        activeLicenses: activeLicenses,
      });

    } catch (err) {
      console.error('Dashboard error:', err);
      setError('Gagal memuat data dashboard.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatRp = (val: number) => 
    'Rp ' + parseInt(val.toString() || '0').toLocaleString('id-ID');

  if (isLoading) {
    return <DashboardSkeleton />; // ✅ Use skeleton instead of spinner
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8 @container">
      {/* Header - Responsive */}
      <div className="flex flex-col gap-4 @md:flex-row @md:items-center @md:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight @md:text-3xl">Dashboard</h2>
          <p className="text-sm text-muted-foreground @md:text-base">
            Selamat Datang, <span className="font-semibold text-foreground">{username}</span>! Semangat Bekerja.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="w-full @md:w-auto">
            <Calendar className="mr-2 h-4 w-4" />
            <span className="hidden @sm:inline">
              {new Date().toLocaleDateString('id-ID', { 
                day: 'numeric', 
                month: 'short', 
                year: 'numeric' 
              })}
            </span>
            <span className="@sm:hidden">
              {new Date().toLocaleDateString('id-ID', { 
                day: 'numeric', 
                month: 'short'
              })}
            </span>
          </Button>
        </div>
      </div>

      {/* Stats Grid - Responsive */}
      <div className="grid gap-4 grid-cols-1 @sm:grid-cols-2 @xl:grid-cols-4">
        {/* Card 1: Total Revenue */}
        <Card className="@container/card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Pendapatan
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold @md/card:text-2xl">{formatRp(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Dari {stats.totalSubscriptions} langganan
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Total Partners */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Mitra
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold @md:text-2xl">+{stats.totalPartners}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activePartners} aktif, {stats.suspendedPartners} ditangguhkan
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Active Subscriptions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Langganan Aktif
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold @md:text-2xl">+{stats.activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground">
              Dari {stats.totalPlans} paket tersedia
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Active Licenses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Lisensi Aktif
            </CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold @md:text-2xl">+{stats.activeLicenses}</div>
            <p className="text-xs text-muted-foreground">
              Dari {stats.totalLicenses} total perangkat
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid - Responsive */}
      <div className="grid gap-4 grid-cols-1 @4xl:grid-cols-7">
        {/* Overview Card */}
        <Card className="@4xl:col-span-4">
          <CardHeader>
            <CardTitle>Ringkasan Platform</CardTitle>
            <CardDescription>
              Statistik keseluruhan sistem Horeka Pos+
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="space-y-8">
              {/* Progress Bars */}
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-24 text-xs font-medium @md:w-32 @md:text-sm">Total Mitra</div>
                  <div className="flex-1">
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all" 
                        style={{ width: `${(stats.totalPartners / 100) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-12 text-right text-xs font-bold @md:w-16 @md:text-sm">{stats.totalPartners}</div>
                </div>

                <div className="flex items-center">
                  <div className="w-24 text-xs font-medium @md:w-32 @md:text-sm">Total Paket</div>
                  <div className="flex-1">
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-chart-2 transition-all" 
                        style={{ width: `${(stats.totalPlans / 20) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-12 text-right text-xs font-bold @md:w-16 @md:text-sm">{stats.totalPlans}</div>
                </div>

                <div className="flex items-center">
                  <div className="w-24 text-xs font-medium @md:w-32 @md:text-sm">Langganan</div>
                  <div className="flex-1">
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-chart-3 transition-all" 
                        style={{ width: `${(stats.activeSubscriptions / stats.totalSubscriptions) * 100 || 0}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-12 text-right text-xs font-bold @md:w-16 @md:text-sm">{stats.activeSubscriptions}</div>
                </div>

                <div className="flex items-center">
                  <div className="w-24 text-xs font-medium @md:w-32 @md:text-sm">Lisensi Aktif</div>
                  <div className="flex-1">
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-chart-4 transition-all" 
                        style={{ width: `${(stats.activeLicenses / stats.totalLicenses) * 100 || 0}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-12 text-right text-xs font-bold @md:w-16 @md:text-sm">{stats.activeLicenses}</div>
                </div>

                <div className="flex items-center">
                  <div className="w-24 text-xs font-medium @md:w-32 @md:text-sm">Total Lisensi</div>
                  <div className="flex-1">
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-chart-5 transition-all" 
                        style={{ width: `${(stats.totalLicenses / 100) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-12 text-right text-xs font-bold @md:w-16 @md:text-sm">{stats.totalLicenses}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="@4xl:col-span-3">
          <CardHeader>
            <CardTitle>Aksi Cepat</CardTitle>
            <CardDescription>
              Navigasi cepat ke fitur utama
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link href="/platform/partners">
                <Button variant="outline" className="w-full justify-between">
                  <div className="flex items-center">
                    <Users className="mr-2 h-4 w-4" />
                    Kelola Mitra
                  </div>
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </Link>

              <Link href="/platform/subscription-plans">
                <Button variant="outline" className="w-full justify-between">
                  <div className="flex items-center">
                    <Package className="mr-2 h-4 w-4" />
                    Paket Langganan
                  </div>
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </Link>

              <Link href="/platform/subscriptions">
                <Button variant="outline" className="w-full justify-between">
                  <div className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Langganan Mitra
                  </div>
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </Link>

              <Link href="/platform/licenses">
                <Button variant="outline" className="w-full justify-between">
                  <div className="flex items-center">
                    <Smartphone className="mr-2 h-4 w-4" />
                    Lisensi Perangkat
                  </div>
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 @md:flex-row @md:items-center @md:justify-between">
            <div>
              <CardTitle>Status Sistem</CardTitle>
              <CardDescription>
                Informasi real-time dari platform Horeka Pos+
              </CardDescription>
            </div>
            <Badge variant="outline" className="gap-1 w-fit">
              <Activity className="h-3 w-3" />
              Online
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col gap-4 p-4 bg-muted rounded-lg @md:flex-row @md:items-center @md:justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium">Sistem Berjalan Normal</p>
                  <p className="text-sm text-muted-foreground">
                    Semua layanan aktif dan responsif
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 w-fit">
                Healthy
              </Badge>
            </div>

            <div className="grid grid-cols-1 gap-4 @md:grid-cols-3">
              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Pertumbuhan Mitra</p>
                  <p className="text-lg font-bold">+{stats.activePartners}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <Package className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Paket Tersedia</p>
                  <p className="text-lg font-bold">{stats.totalPlans}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <Smartphone className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Perangkat Terdaftar</p>
                  <p className="text-lg font-bold">{stats.totalLicenses}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
