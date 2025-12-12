// app/(dashboard)/branch/page.tsx

'use client';

import { useState, useEffect } from 'react';
import {
  branchProductAPI,
  cashierAccountAPI,
  pinOperatorAPI,
  shiftScheduleAPI,
  branchLicenseAPI,
} from '@/lib/api/branch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Users,
  UserCog,
  Package,
  Clock,
  Key,
  AlertCircle,
  TrendingUp,
  Building2,
  Globe,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DashboardStats {
  totalCashierAccounts: number;
  activeCashierAccounts: number;
  totalOperators: number;
  activeOperators: number;
  totalShifts: number;
  activeShifts: number;
  totalProducts: number;
  localProducts: number;
  generalProducts: number;
  totalLicenses: number;
  activeLicenses: number;
}

export default function BranchDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCashierAccounts: 0,
    activeCashierAccounts: 0,
    totalOperators: 0,
    activeOperators: 0,
    totalShifts: 0,
    activeShifts: 0,
    totalProducts: 0,
    localProducts: 0,
    generalProducts: 0,
    totalLicenses: 0,
    activeLicenses: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [accounts, operators, shifts, products, licenses] = await Promise.allSettled([
        cashierAccountAPI.getAll(true),
        pinOperatorAPI.getAll(),
        shiftScheduleAPI.getAll(),
        branchProductAPI.getAll(),
        branchLicenseAPI.getMyBranch(),
      ]);

      const accountsData = accounts.status === 'fulfilled' ? (Array.isArray(accounts.value.data) ? accounts.value.data : []) : [];
      const operatorsData = operators.status === 'fulfilled' ? (Array.isArray(operators.value.data) ? operators.value.data : []) : [];
      const shiftsData = shifts.status === 'fulfilled' ? (Array.isArray(shifts.value.data) ? shifts.value.data : []) : [];
      const productsData = products.status === 'fulfilled' ? (Array.isArray(products.value.data) ? products.value.data : []) : [];
      const licensesData = licenses.status === 'fulfilled' ? (Array.isArray(licenses.value.data) ? licenses.value.data : []) : [];

      const activeCashierAccounts = accountsData.filter((a: any) => a.is_active).length;
      const activeOperators = operatorsData.filter((o: any) => o.is_active).length;
      const activeShifts = shiftsData.filter((s: any) => s.is_active !== false).length;
      const localProducts = productsData.filter((p: any) => p.branch_id).length;
      const generalProducts = productsData.filter((p: any) => !p.branch_id).length;
      const activeLicenses = licensesData.filter((l: any) => l.license_status === 'Active').length;

      setStats({
        totalCashierAccounts: accountsData.length,
        activeCashierAccounts,
        totalOperators: operatorsData.length,
        activeOperators,
        totalShifts: shiftsData.length,
        activeShifts,
        totalProducts: productsData.length,
        localProducts,
        generalProducts,
        totalLicenses: licensesData.length,
        activeLicenses,
      });
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const chartData = [
    { name: 'Akun Kasir', value: stats.totalCashierAccounts, fill: '#3b82f6' },
    { name: 'Operator', value: stats.totalOperators, fill: '#8b5cf6' },
    { name: 'Shift', value: stats.totalShifts, fill: '#10b981' },
    { name: 'Produk', value: stats.totalProducts, fill: '#f59e0b' },
    { name: 'Lisensi', value: stats.totalLicenses, fill: '#ef4444' },
  ];

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8 @container">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-80 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8 @container">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Admin Cabang</h1>
        <p className="text-muted-foreground">Overview operasional cabang Anda</p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Akun Kasir</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCashierAccounts}</div>
            <p className="text-xs text-muted-foreground mt-1">dari {stats.totalCashierAccounts} total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Operator PIN</CardTitle>
            <UserCog className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeOperators}</div>
            <p className="text-xs text-muted-foreground mt-1">dari {stats.totalOperators} total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Jadwal Shift</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeShifts}</div>
            <p className="text-xs text-muted-foreground mt-1">dari {stats.totalShifts} shift</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Lisensi Aktif</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeLicenses}</div>
            <p className="text-xs text-muted-foreground mt-1">dari {stats.totalLicenses} total</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Statistik Sistem</CardTitle>
          <CardDescription>Overview data operasional cabang</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" name="Jumlah" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-5 w-5" />
              Data Produk
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Globe className="h-3 w-3" />
                Produk General:
              </span>
              <span className="font-semibold">{stats.generalProducts}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Building2 className="h-3 w-3" />
                Produk Lokal:
              </span>
              <span className="font-semibold">{stats.localProducts}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Produk:</span>
              <span className="font-semibold">{stats.totalProducts}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Status Operasional
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Kasir Aktif:</span>
              <span className="font-semibold text-green-600">{stats.activeCashierAccounts}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Operator Aktif:</span>
              <span className="font-semibold text-green-600">{stats.activeOperators}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Shift Aktif:</span>
              <span className="font-semibold text-green-600">{stats.activeShifts}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
