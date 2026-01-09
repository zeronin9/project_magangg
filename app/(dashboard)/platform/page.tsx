'use client';

import { useEffect, useState } from 'react';
import { fetchWithAuth } from '@/lib/api';
import { formatRupiah } from '@/lib/utils';
import { DashboardSkeleton } from '@/components/skeletons/DashboardSkeleton';
import { 
  Activity, 
  CreditCard, 
  DollarSign, 
  Download, 
  Users, 
  Calendar as CalendarIcon,
  ArrowUpRight
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import Link from 'next/link';

// --- Interfaces (Disesuaikan dengan Backend) ---
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

// ✅ FIX: Interface disesuaikan dengan Controller (business_name, dll)
interface Partner {
  partner_id: string;
  business_name: string;
  business_email: string;
  business_phone?: string;
  status: string;
  created_at?: string; // Field bawaan Prisma biasanya snake_case
  updated_at?: string;
}

// --- Components ---

// 1. Overview Chart Component
function Overview() {
  // Mock data bulanan
  const data = [
    { name: "Jan", total: Math.floor(Math.random() * 5000000) + 1000000 },
    { name: "Feb", total: Math.floor(Math.random() * 5000000) + 1000000 },
    { name: "Mar", total: Math.floor(Math.random() * 5000000) + 1000000 },
    { name: "Apr", total: Math.floor(Math.random() * 5000000) + 1000000 },
    { name: "May", total: Math.floor(Math.random() * 5000000) + 1000000 },
    { name: "Jun", total: Math.floor(Math.random() * 5000000) + 1000000 },
    { name: "Jul", total: Math.floor(Math.random() * 5000000) + 1000000 },
    { name: "Aug", total: Math.floor(Math.random() * 5000000) + 1000000 },
    { name: "Sep", total: Math.floor(Math.random() * 5000000) + 1000000 },
    { name: "Oct", total: Math.floor(Math.random() * 5000000) + 1000000 },
    { name: "Nov", total: Math.floor(Math.random() * 5000000) + 1000000 },
    { name: "Dec", total: Math.floor(Math.random() * 5000000) + 1000000 },
  ];

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `Rp${(value / 1000000).toFixed(0)}jt`}
        />
        <Tooltip 
            cursor={{fill: 'transparent'}}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
            formatter={(value: number) => formatRupiah(value)}
        />
        <Bar
          dataKey="total"
          fill="currentColor"
          radius={[4, 4, 0, 0]}
          className="fill-primary"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

// 2. Recent Partners Component (✅ FIXED MAPPING)
function RecentPartners({ partners }: { partners: Partner[] }) {
  if (!partners || partners.length === 0) {
    return <div className="text-sm text-muted-foreground">Belum ada data mitra.</div>;
  }

  // Mengambil 5 mitra teratas
  const recentPartners = partners.slice(0, 5);

  return (
    <div className="space-y-8">
      {recentPartners.map((partner, index) => {
        // ✅ FIX: Gunakan business_name dan business_email
        const name = partner.business_name || 'Tanpa Nama';
        const initials = name.substring(0, 2).toUpperCase();
        const email = partner.business_email || '-';
        const status = partner.status || 'Unknown';

        return (
          // Gunakan partner_id sebagai key
          <div key={partner.partner_id || index} className="flex items-center">
            <Avatar className="h-9 w-9">
              <AvatarImage src={`/avatars/${index + 1}.png`} alt="Avatar" />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="ml-4 space-y-1">
              <p className="text-sm font-medium leading-none">{name}</p>
              <p className="text-sm text-muted-foreground">
                {email}
              </p>
            </div>
            <div className="ml-auto font-medium">
               <span className={`text-xs px-2 py-1 rounded-full ${
                  status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
               }`}>
                  {status}
               </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// --- Main Page Component ---
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
  
  const [partnersList, setPartnersList] = useState<Partner[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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

      // Handle Partner Response
      let partners: Partner[] = [];
      if (partnersData.status === 'fulfilled') {
        const val = partnersData.value;
        // Cek apakah response berupa array atau object { data: [] }
        if (Array.isArray(val)) {
            partners = val;
        } else if (val && Array.isArray(val.data)) {
            partners = val.data;
        }
      }
      
      // Handle Subscription Response
      const subscriptions = subscriptionsData.status === 'fulfilled' 
        ? subscriptionsData.value
        : { summary: {}, data: [] };
      
      // Handle Plans Response
      const plans = plansData.status === 'fulfilled'
        ? (Array.isArray(plansData.value) ? plansData.value : [])
        : [];

      // 1. Hitung statistik
      const activePartners = partners.filter((p) => p.status === 'Active').length;
      const suspendedPartners = partners.filter((p) => p.status === 'Suspended').length;

      // 2. Sorting Mitra Terbaru (berdasarkan created_at)
      // Kita copy array dulu biar aman (mutability)
      const sortedPartners = [...partners].sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA; // Descending (Terbaru di atas)
      });

      setStats({
        totalPartners: partners.length,
        activePartners: activePartners,
        suspendedPartners: suspendedPartners,
        totalSubscriptions: subscriptions?.summary?.total_subscriptions_record || 0,
        activeSubscriptions: subscriptions?.summary?.currently_active_partners || 0,
        totalRevenue: parseInt(subscriptions?.summary?.total_revenue || '0'),
        totalPlans: plans.length,
        totalLicenses: 0, 
        activeLicenses: 0, 
      });

      setPartnersList(sortedPartners);

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
    <div className="flex-1 space-y-4 p-8 pt-6">
      {/* Header */}
      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs defaultValue="overview" className="space-y-4">

        <TabsContent value="overview" className="space-y-4">
          {/* Key Metrics Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Pendapatan
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatRupiah(stats.totalRevenue)}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Mitra
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+{stats.totalPartners}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.activePartners} aktif saat ini
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Langganan</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+{stats.totalSubscriptions}</div>
                <p className="text-xs text-muted-foreground">
                  +{stats.activeSubscriptions} langganan aktif
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Status Sistem
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-black">Aktif</div>
                <p className="text-xs text-muted-foreground">
                  Semua layanan beroperasi
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid: Chart & Recent List */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* Overview Chart */}
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Overview</CardTitle>
                <CardDescription>
                  Estimasi pendapatan bulanan sistem tahun ini.
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <Overview />
              </CardContent>
            </Card>

            {/* Recent Partners List */}
            <Card className=" col-span-3">
              <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Mitra Terbaru</CardTitle>
                        <CardDescription>
                        Pendaftar mitra baru bulan ini.
                        </CardDescription>
                    </div>
                    <Link href="/platform/partners">
                        <Button variant="ghost" size="icon">
                            <ArrowUpRight className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>
              </CardHeader>
              <CardContent>
                <RecentPartners partners={partnersList} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}