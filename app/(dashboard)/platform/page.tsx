'use client';

import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/api';
import Link from 'next/link';
import { 
  Users, Package, CheckCircle, Smartphone, Loader2, AlertCircle, Calendar, TrendingUp, Award
} from 'lucide-react';

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

  return (
    <div className="pb-0 gap-0">
      
      {/* HEADER */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <p className="text-gray-600 text-base py-2 bg-white border border-gray-200 shadow-sm font-small  rounded-xl px-5">
            Selamat Datang, <span className="font-bold text-gray-900">Admin Platform</span>! Semangat Bekerja.
          </p>
        </div>
        <div className="flex items-center gap-8 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm text-sm font-medium text-gray-600">
          <Calendar size={20} className="text-gray-600 "/>
          {new Date().toLocaleDateString('id-ID', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      {/* LOADING STATE */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-gray-200">
          <Loader2 size={40} className="animate-spin text-blue-600 mb-3" />
          <p className="text-gray-500">Memuat data dashboard...</p>
        </div>
      ) : (
        <>
          {/* ERROR MESSAGE */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-200 flex items-center gap-2">
              <AlertCircle size={20} /> {error}
            </div>
          )}

          {/* STATS CARDS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8 ">
            
            {/* Card 1: Total Mitra */}
            <div className=" bg-gradient-to-br from-white to-white p-6 rounded-2xl border border-gray-300 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gray-100 rounded-xl">
                  <Users size={24} className="text-blue-600" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-1">
                {stats.totalPartners}
              </h3>
              <p className="text-sm text-gray-600 font-medium">Total Mitra</p>
            </div>

            {/* Card 2: Total Paket */}
            <div className="bg-gradient-to-br from-white to-white p-6 rounded-2xl border border-gray-300 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gray-100 rounded-xl">
                  <Package size={24} className="text-purple-600" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-1">
                {stats.totalPlans}
              </h3>
              <p className="text-sm text-gray-600 font-medium">Total Paket</p>
            </div>

            {/* Card 3: Langganan Aktif */}
            <div className="bg-gradient-to-br from-white to-white p-6 rounded-2xl border border-gray-300 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gray-100 rounded-xl">
                  <CheckCircle size={24} className="text-green-600" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-1">
                {stats.activeSubscriptions}
              </h3>
              <p className="text-sm text-gray-600 font-medium">Langganan Aktif</p>
            </div>

            {/* Card 4: Lisensi Aktif */}
            <div className=" bg-gradient-to-br from-white to-white p-6 rounded-2xl border border-gray-300 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gray-100 rounded-xl">
                  <Award size={24} className="text-orange-600" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-1">
                {stats.activeLicenses}
              </h3>
              <p className="text-sm text-gray-600 font-medium">Lisensi Aktif</p>
            </div>

            {/* Card 5: Total Lisensi */}
            <div className="bg-gradient-to-br from-white to-white p-6 rounded-2xl border border-gray-300 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gray-100 rounded-xl">
                  <Smartphone size={24} className="text-gray-600" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-1">
                {stats.totalLicenses}
              </h3>
              <p className="text-sm text-gray-600 font-medium">Total Lisensi</p>
            </div>

          </div>

        </>
      )}
    </div>
  );
}
