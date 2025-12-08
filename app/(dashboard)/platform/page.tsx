'use client';

import { useEffect, useState } from 'react';
import { fetchWithAuth } from '@/lib/api';
import { formatRupiah } from '@/lib/utils'; // ✅ Gunakan global utility
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
        // Fetch licenses logic (simplified for dashboard)
        // In real app, maybe a dedicated stats endpoint is better
      } catch (err) {
        console.error('Error fetching licenses:', err);
      }

      // Mock active licenses for dashboard view if endpoint unavailable
      const activeLicenses = 0; 

      setStats({
        totalPartners: partners.length,
        activePartners: activePartners,
        suspendedPartners: suspendedPartners,
        totalSubscriptions: subscriptions?.summary?.total_subscriptions_record || 0,
        activeSubscriptions: subscriptions?.summary?.currently_active_partners || 0,
        totalRevenue: parseInt(subscriptions?.summary?.total_revenue || '0'),
        totalPlans: plans.length,
        totalLicenses: 0, // Update with real data if available
        activeLicenses: activeLicenses,
      });

    } catch (err) {
      console.error('Dashboard error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8 @container">
      {/* Header */}
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

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-1 @sm:grid-cols-2 @xl:grid-cols-4">
        <Card className="@container/card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold @md/card:text-2xl">{formatRupiah(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Dari {stats.totalSubscriptions} langganan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Mitra</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold @md:text-2xl">+{stats.totalPartners}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activePartners} aktif, {stats.suspendedPartners} ditangguhkan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Langganan Aktif</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold @md:text-2xl">+{stats.activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground">
              Dari {stats.totalPlans} paket tersedia
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lisensi Aktif</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold @md:text-2xl">+{stats.activeLicenses}</div>
            <p className="text-xs text-muted-foreground">
              Perangkat terdaftar
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Status */}
      <div className="grid gap-4 grid-cols-1 @4xl:grid-cols-7">
        <Card className="@4xl:col-span-4">
          <CardHeader>
            <div className="flex flex-col gap-4 @md:flex-row @md:items-center @md:justify-between">
              <div>
                <CardTitle>Status Sistem</CardTitle>
                <CardDescription>Informasi real-time platform</CardDescription>
              </div>
              <Badge variant="outline" className="gap-1 w-fit bg-green-50 text-green-700 border-green-200">
                <Activity className="h-3 w-3" />
                All Systems Operational
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-full">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Pertumbuhan Mitra</p>
                    <p className="text-xs text-muted-foreground">Bulan ini</p>
                  </div>
                </div>
                <span className="font-bold text-lg">+{stats.activePartners}</span>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                 <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 text-purple-600 rounded-full">
                    <Package className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Paket Terjual</p>
                    <p className="text-xs text-muted-foreground">Total akumulasi</p>
                  </div>
                </div>
                <span className="font-bold text-lg">{stats.totalSubscriptions}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="@4xl:col-span-3">
          <CardHeader>
            <CardTitle>Aksi Cepat</CardTitle>
            <CardDescription>Shortcut menu utama</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link href="/platform/partners">
                <Button variant="outline" className="w-full justify-between hover:bg-accent">
                  <div className="flex items-center">
                    <Users className="mr-2 h-4 w-4" />
                    Kelola Mitra
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                </Button>
              </Link>

              <Link href="/platform/subscription-plans">
                <Button variant="outline" className="w-full justify-between hover:bg-accent">
                  <div className="flex items-center">
                    <Package className="mr-2 h-4 w-4" />
                    Paket Langganan
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                </Button>
              </Link>

              <Link href="/platform/licenses">
                <Button variant="outline" className="w-full justify-between hover:bg-accent">
                  <div className="flex items-center">
                    <Smartphone className="mr-2 h-4 w-4" />
                    Lisensi Perangkat
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}