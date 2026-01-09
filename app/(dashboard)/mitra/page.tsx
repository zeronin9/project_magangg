'use client';

import { useEffect, useState } from 'react';
import { fetchWithAuth } from '@/lib/api';
import { formatRupiah } from '@/lib/utils';
import { DashboardSkeleton } from '@/components/skeletons/DashboardSkeleton';
import { 
  CreditCard, 
  DollarSign, 
  Package, 
  ShoppingBag, // Mengembalikan ikon ShoppingBag
  Store, 
  Calendar as CalendarIcon, 
  Download,
  ArrowUpRight,
  Filter
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import Link from 'next/link';

// --- Interfaces ---
interface DashboardStats {
  totalRevenue: number;
  totalTransactions: number;
  totalBranches: number;
  totalProducts: number;
}

interface Transaction {
  transaction_id: string;
  total_amount: number;
  payment_method: string;
  transaction_time: string;
  branch_name?: string;
}

// --- Components ---

// 1. Overview Chart (Pendapatan Bulanan)
function Overview({ data }: { data: any[] }) {
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
          tickFormatter={(value) => `Rp${(value / 1000).toFixed(0)}k`}
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

// 2. Recent Sales Component
function RecentSales({ transactions }: { transactions: Transaction[] }) {
  if (!transactions || transactions.length === 0) {
    return <div className="text-sm text-muted-foreground">Belum ada transaksi terbaru.</div>;
  }

  const recent = transactions.slice(0, 5);

  return (
    <div className="space-y-8">
      {recent.map((trx, index) => {
        const amount = Number(trx.total_amount) || 0;
        const method = trx.payment_method ? trx.payment_method.replace('_', ' ') : 'Tunai';
        const date = new Date(trx.transaction_time).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
        });
        const branchName = trx.branch_name || 'Pusat';

        return (
          <div key={trx.transaction_id || index} className="flex items-center">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary/10 text-primary">
                {/* PERBAIKAN: Mengembalikan ikon ShoppingBag */}
                <ShoppingBag className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="ml-4 space-y-1">
              <p className="text-sm font-medium leading-none">
                {branchName}
              </p>
              <p className="text-xs text-muted-foreground">
                {method} • {date}
              </p>
            </div>
            <div className="ml-auto font-medium">
              +{formatRupiah(amount)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// --- Main Page Component ---
export default function MitraDashboard() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
  
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalTransactions: 0,
    totalBranches: 0,
    totalProducts: 0,
  });
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [partnerName, setPartnerName] = useState('Mitra');

  const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setPartnerName(user.full_name || user.username || 'Mitra');
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [selectedYear]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const startDate = `${selectedYear}-01-01`;
      const endDate = `${selectedYear}-12-31`;

      const [branchesData, productsData, reportData] = await Promise.allSettled([
        fetchWithAuth('/branch'),
        // PERBAIKAN: Tambahkan limit=1000 agar mengambil SEMUA produk (bukan default 10)
        fetchWithAuth('/product?limit=1000'), 
        fetchWithAuth(`/report/sales?tanggalMulai=${startDate}&tanggalSelesai=${endDate}&limit=1000`),
      ]);

      // 1. Process Branches
      let branchCount = 0;
      if (branchesData.status === 'fulfilled') {
        const val = branchesData.value;
        const list = Array.isArray(val) ? val : (val.data || []);
        branchCount = list.filter((b: any) => b.is_active).length;
      }

      // 2. Process Products 
      let productCount = 0;
      if (productsData.status === 'fulfilled') {
        const val = productsData.value;
        // Backend mengembalikan object pagination { data: [], meta: {} } atau array langsung
        const list = Array.isArray(val) ? val : (val.data || []);
        // Dengan limit=1000, list.length akan mencerminkan total produk sebenarnya (misal 16)
        productCount = list.length; 
      }

      // 3. Process Sales Report
      let revenue = 0;
      let count = 0;
      let trxList: Transaction[] = [];
      let monthlyData: Record<string, number> = {};

      if (reportData.status === 'fulfilled') {
        const val = reportData.value;
        const summary = val.summary || {};
        const rawList = val.data || [];

        revenue = Number(summary.total_sales) || 0;
        count = Number(summary.transaction_count) || 0;

        trxList = rawList.map((t: any) => ({
            transaction_id: t.transaction_id,
            total_amount: Number(t.total_amount),
            payment_method: t.payment_method,
            transaction_time: t.transaction_time,
            branch_name: t.branch?.branch_name
        }));

        trxList.forEach(t => {
          if (t.transaction_time) {
            const date = new Date(t.transaction_time);
            if (date.getFullYear().toString() === selectedYear) {
                const monthName = date.toLocaleDateString('id-ID', { month: 'short' });
                monthlyData[monthName] = (monthlyData[monthName] || 0) + t.total_amount;
            }
          }
        });
      }

      const monthsOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const chart = monthsOrder.map(m => ({
          name: m,
          total: monthlyData[m] || 0
      }));

      setStats({
        totalRevenue: revenue,
        totalTransactions: count,
        totalBranches: branchCount,
        totalProducts: productCount
      });

      setTransactions(trxList);
      setChartData(chart);

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
        <div>
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-muted-foreground">
                Ringkasan performa bisnis Anda.
            </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs defaultValue="overview" className="space-y-4">

        <TabsContent value="overview" className="space-y-4">
          {/* Key Metrics Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatRupiah(stats.totalRevenue)}</div>
                <p className="text-xs text-muted-foreground">Periode Tahun {selectedYear}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Transaksi</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+{stats.totalTransactions}</div>
                <p className="text-xs text-muted-foreground">Berhasil dibayar</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cabang Aktif</CardTitle>
                <Store className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+{stats.totalBranches}</div>
                <p className="text-xs text-muted-foreground">Outlet beroperasi</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Produk</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+{stats.totalProducts}</div>
                <p className="text-xs text-muted-foreground">Item dalam katalog</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content: Chart & Recent Sales */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* Overview Chart dengan Filter Tahun */}
            <Card className="col-span-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Overview Pendapatan</CardTitle>
                    <CardDescription>
                        Grafik pendapatan per bulan tahun {selectedYear}.
                    </CardDescription>
                  </div>
                  <div className="w-[120px]">
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Tahun" />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((year) => (
                          <SelectItem key={year} value={year}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pl-2">
                <Overview data={chartData} />
              </CardContent>
            </Card>

            {/* Recent Sales List */}
            <Card className="col-span-3">
              <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Penjualan Terakhir</CardTitle>
                        <CardDescription>Transaksi terbaru tahun ini.</CardDescription>
                    </div>
                    <Link href="/mitra/reports">
                        <Button variant="ghost" size="icon">
                            <ArrowUpRight className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>
              </CardHeader>
              <CardContent>
                <RecentSales transactions={transactions} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}