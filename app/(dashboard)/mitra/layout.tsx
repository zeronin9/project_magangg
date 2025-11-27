'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/ui/Sidebar';

export default function MitraLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoading) {
      if (!user) {
        router.replace('/login');
      } else if (user.role !== 'super_admin') {
        switch (user.role) {
          case 'admin_platform':
            router.replace('/platform');
            break;
          case 'branch_admin':
            router.replace('/branch');
            break;
          default:
            router.replace('/login');
        }
      }
    }
  }, [user, isLoading, router, mounted]);

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'super_admin') {
    return null;
  }

  // Definisikan menu items dengan path gambar
  const menuItems = [
    { 
      href: '/mitra', 
      name: 'Dashboard', 
      iconSrc: '/images/icons/dashboard.png'
    },
    { 
      href: '/mitra/branches', 
      name: 'Cabang', 
      iconSrc: '/images/icons/Cabang1.png'
    },
    { 
      href: '/mitra/branch-admins', 
      name: 'Admin Cabang', 
      iconSrc: '/images/icons/branchadmin.png'
    },
    { 
      href: '/mitra/categories', 
      name: 'Kategori', 
      iconSrc: '/images/icons/catalog.png'
    },
    { 
      href: '/mitra/products', 
      name: 'Produk', 
      iconSrc: '/images/icons/BranchProduk.png'
    },
    { 
      href: '/mitra/discounts', 
      name: 'Diskon', 
      iconSrc: '/images/icons/discount.png'
    },
    { 
      href: '/mitra/licenses', 
      name: 'Lisensi', 
      iconSrc: '/images/icons/licenses.png'
    },
    { 
      href: '/mitra/subscription', 
      name: 'Langganan', 
      iconSrc: '/images/icons/Langganan1.png'
    },
    { 
      href: '/mitra/reports', 
      name: 'Laporan', 
      iconSrc: '/images/icons/report.png'
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900">
      {/* Sidebar */}
      <Sidebar
        menuItems={menuItems}
        title="Horeka POS+"
        subtitle="Admin Mitra"
        logoSrc="/images/LOGO HOREKA (1).png"
        onLogout={logout}
      />

      {/* Main Content */}
      <main className="flex-1 p-10 overflow-y-auto h-full transition-all duration-300 ease-in-out ml-72">
        <div className="w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
