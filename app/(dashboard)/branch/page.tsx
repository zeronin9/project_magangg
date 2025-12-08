'use client';

import { useEffect, useState } from 'react';
import { reportAPI } from '@/lib/api/mitra'; // Reuse report API (L1 can access sales report)
import { formatRupiah } from '@/lib/utils';
import { DashboardSkeleton } from '@/components/skeletons/DashboardSkeleton';
import { DollarSign, ShoppingCart, AlertCircle, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function BranchDashboard() {
  const [stats, setStats] = useState({
    todaySales: 0,
    transactionCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        // Doc 8.3 Laporan Penjualan (Harian)
        const salesData = await reportAPI.getSales({
          tanggalMulai: today,
          tanggalSelesai: today
        }) as { summary?: { total_sales: number }; data?: unknown[] };
        
        setStats({
          todaySales: Number(salesData.summary?.total_sales || 0),
          transactionCount: salesData.data?.length || 0
        });
      } catch (e) {
        console.error("Failed to load dashboard stats", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8 @container">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard Cabang</h2>
          <p className="text-sm text-muted-foreground">Ringkasan operasional hari ini</p>
        </div>
        <Button variant="outline" className="hidden sm:flex">
          <Calendar className="mr-2 h-4 w-4" />
          {new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Penjualan Hari Ini</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRupiah(stats.todaySales)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transaksi</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.transactionCount}</div>
          </CardContent>
        </Card>

        {/* Placeholder for Void Requests or other urgent tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status Operasional</CardTitle>
            <AlertCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Buka</div>
            <p className="text-xs text-muted-foreground">Shift Pagi</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}