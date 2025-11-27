'use client';

import { useState, useEffect } from 'react';
import { branchAPI, productAPI, licenseAPI, categoryAPI, branchAdminAPI } from '@/lib/api';
import { 
  Loader2, 
  AlertCircle, 
  Calendar
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from 'recharts';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton';

interface DashboardStats {
  totalBranches: number;
  totalBranchAdmins: number;
  totalCategories: number;
  totalProducts: number;
  totalLicenses: number;
  activeLicenses: number;
  pendingLicenses: number;
  assignedLicenses: number;
}

export default function MitraDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalBranches: 0,
    totalBranchAdmins: 0,
    totalCategories: 0,
    totalProducts: 0,
    totalLicenses: 0,
    activeLicenses: 0,
    pendingLicenses: 0,
    assignedLicenses: 0,
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [username, setUsername] = useState('Admin Mitra');

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
      const [
        branchesData, 
        branchAdminsData, 
        categoriesData, 
        productsData, 
        licensesData
      ] = await Promise.allSettled([
        branchAPI.getAll(),
        branchAdminAPI.getAll(),
        categoryAPI.getAll(),
        productAPI.getAll(),
        licenseAPI.getAll(),
      ]);

      const branches = branchesData.status === 'fulfilled' 
        ? (Array.isArray(branchesData.value) ? branchesData.value : [])
        : [];
      
      const branchAdmins = branchAdminsData.status === 'fulfilled' 
        ? (Array.isArray(branchAdminsData.value) ? branchAdminsData.value : [])
        : [];
      
      const categories = categoriesData.status === 'fulfilled'
        ? (Array.isArray(categoriesData.value) ? categoriesData.value : [])
        : [];

      const products = productsData.status === 'fulfilled'
        ? (Array.isArray(productsData.value) ? productsData.value : [])
        : [];

      const licenses = licensesData.status === 'fulfilled'
        ? (Array.isArray(licensesData.value) ? licensesData.value : [])
        : [];

      const activeLicenses = licenses.filter((l: any) => l.license_status === 'Active').length;
      const pendingLicenses = licenses.filter((l: any) => l.license_status === 'Pending').length;
      const assignedLicenses = licenses.filter((l: any) => l.license_status === 'Assigned').length;

      setStats({
        totalBranches: branches.length,
        totalBranchAdmins: branchAdmins.length,
        totalCategories: categories.length,
        totalProducts: products.length,
        totalLicenses: licenses.length,
        activeLicenses: activeLicenses,
        pendingLicenses: pendingLicenses,
        assignedLicenses: assignedLicenses,
      });

    } catch (err) {
      console.error('Dashboard error:', err);
      setError('Gagal memuat data dashboard.');
    } finally {
      setIsLoading(false);
    }
  };

  // Chart Data
  const chartData = [
    { 
      category: "Total Cabang", 
      value: stats.totalBranches,
      fill: "hsl(217, 91%, 60%)"
    },
    { 
      category: "Admin Cabang", 
      value: stats.totalBranchAdmins,
      fill: "hsl(45, 93%, 47%)"
    },
    { 
      category: "Kategori", 
      value: stats.totalCategories,
      fill: "hsl(142, 71%, 45%)"
    },
    { 
      category: "Produk", 
      value: stats.totalProducts,
      fill: "hsl(262, 83%, 58%)"
    },
    { 
      category: "Lisensi Aktif", 
      value: stats.activeLicenses,
      fill: "hsl(168, 76%, 42%)"
    },
    { 
      category: "Total Lisensi", 
      value: stats.totalLicenses,
      fill: "hsl(0, 65%, 60%)"
    },
  ];

  const chartConfig = {
    value: {
      label: "Total",
      color: "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig;

  // Show skeleton while loading
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="pb-10">
      {/* HEADER */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-gray-600 text-base">
            Selamat Datang, <span className="font-bold text-gray-900">{username}</span>! Selamat dan Semangat Bekerja.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm text-sm font-medium text-gray-600">
          <Calendar size={18} className="text-gray-600"/>
          {new Date().toLocaleDateString('id-ID', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-200 flex items-center gap-2">
          <AlertCircle size={20} /> {error}
        </div>
      )}

      {/* BAR CHART */}
      <Card className="border-2 shadow-sm">
        <CardHeader className="p-6 pt-0 pb-0">
          <CardTitle className="text-2xl font-bold text-gray-900">Statistik Mitra</CardTitle>
        </CardHeader>
        
        <CardContent className="p-6 pt-0">
          <ChartContainer config={chartConfig} className="h-[335px] w-full">
            <BarChart
              accessibilityLayer
              data={chartData}
              margin={{
                top: 10,
                right: 30,
                left: 20,
                bottom: 20,
              }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="category"
                tickLine={false}
                tickMargin={15}
                axisLine={false}
                angle={0}
                textAnchor="middle"
                height={20}
                tick={{ fontSize: 13, fontWeight: 500 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12 }}
              />
              <ChartTooltip
                cursor={{ fill: 'rgba(34, 197, 94, 0.1)' }}
                content={<ChartTooltipContent hideLabel />}
              />
              <Bar 
                dataKey="value" 
                radius={[12, 12, 0, 0]}
              >
                <LabelList
                  position="top"
                  offset={12}
                  className="fill-foreground"
                  fontSize={14}
                  fontWeight={700}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
        
        <CardFooter className="p-6 pb-0 border-t flex-col items-start gap-3">
          <div className="text-gray-600 leading-relaxed text-sm">
            Data real-time yang menunjukkan total cabang, produk, kategori, dan lisensi perangkat di seluruh mitra Anda.
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
