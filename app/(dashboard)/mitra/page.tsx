'use client';

import { useState, useEffect } from 'react';
import { branchAPI, productAPI, licenseAPI, categoryAPI, branchAdminAPI } from '@/lib/api/mitra';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Building2, 
  Users, 
  Package, 
  Key,
  AlertCircle,
  TrendingUp,
  Layers
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DashboardStats {
  totalBranches: number;
  totalBranchAdmins: number;
  totalCategories: number;
  totalProducts: number;
  generalProducts: number;
  localProducts: number;
  totalLicenses: number;
  activeLicenses: number;
}

export default function MitraDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalBranches: 0,
    totalBranchAdmins: 0,
    totalCategories: 0,
    totalProducts: 0,
    generalProducts: 0,
    localProducts: 0,
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
      const [branches, admins, categories, products, licenses] = await Promise.allSettled([
        branchAPI.getAll(),
        branchAdminAPI.getAll(),
        categoryAPI.getAll(),
        productAPI.getAll(),
        licenseAPI.getAll(),
      ]);

      const branchesData = branches.status === 'fulfilled' ? (Array.isArray(branches.value) ? branches.value : []) : [];
      const adminsData = admins.status === 'fulfilled' ? (Array.isArray(admins.value) ? admins.value : []) : [];
      const categoriesData = categories.status === 'fulfilled' ? (Array.isArray(categories.value) ? categories.value : []) : [];
      const productsData = products.status === 'fulfilled' ? (Array.isArray(products.value) ? products.value : []) : [];
      const licensesData = licenses.status === 'fulfilled' ? (Array.isArray(licenses.value) ? licenses.value : []) : [];

      const generalProducts = productsData.filter((p: any) => !p.branch_id).length;
      const localProducts = productsData.filter((p: any) => p.branch_id).length;
      const activeLicenses = licensesData.filter((l: any) => l.license_status === 'Active').length;

      setStats({
        totalBranches: branchesData.length,
        totalBranchAdmins: adminsData.length,
        totalCategories: categoriesData.length,
        totalProducts: productsData.length,
        generalProducts,
        localProducts,
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
    { name: 'Cabang', value: stats.totalBranches, fill: '#3b82f6' },
    { name: 'Admin', value: stats.totalBranchAdmins, fill: '#8b5cf6' },
    { name: 'Kategori', value: stats.totalCategories, fill: '#10b981' },
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
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Admin Mitra</h1>
        <p className="text-muted-foreground">Overview sistem manajemen bisnis Anda</p>
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
            <CardTitle className="text-sm font-medium">Total Cabang</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBranches}</div>
            <p className="text-xs text-muted-foreground mt-1">Cabang aktif</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Admin Cabang</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBranchAdmins}</div>
            <p className="text-xs text-muted-foreground mt-1">User terdaftar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Produk</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.generalProducts} General · {stats.localProducts} Lokal
            </p>
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
          <CardDescription>Overview data dalam sistem</CardDescription>
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
              <Layers className="h-5 w-5" />
              Data General vs Lokal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Produk General:</span>
              <span className="font-semibold">{stats.generalProducts}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Produk Lokal:</span>
              <span className="font-semibold">{stats.localProducts}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Kategori:</span>
              <span className="font-semibold">{stats.totalCategories}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Status Lisensi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Lisensi:</span>
              <span className="font-semibold">{stats.totalLicenses}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Aktif:</span>
              <span className="font-semibold text-green-600">{stats.activeLicenses}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Tersedia:</span>
              <span className="font-semibold">{stats.totalLicenses - stats.activeLicenses}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}