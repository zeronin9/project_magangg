'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/ui/Sidebar';



export default function PlatformLayout({
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
      } else if (user.role !== 'admin_platform') {
        switch (user.role) {
          case 'super_admin':
            router.replace('/mitra');
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
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin_platform') {
    return null;
  }

  // Definisikan menu items dengan path gambar Anda
  const menuItems = [
    { 
      href: '/platform', 
      name: 'Dashboard', 
      iconSrc: '/images/icons/dashboard.png' // Ganti dengan path gambar Anda
    },
    { 
      href: '/platform/partners', 
      name: 'Mitra', 
      iconSrc: '/images/icons/branchadmin.png' // Ganti dengan path gambar Anda
    },
    { 
      href: '/platform/subscription-plans', 
      name: 'Paket Langganan', 
      iconSrc: '/images/icons/branchProduk.png' // Ganti dengan path gambar Anda
    },
    { 
      href: '/platform/subscriptions', 
      name: 'Langganan Mitra', 
      iconSrc: '/images/icons/Branch.png' // Ganti dengan path gambar Anda
    },
    { 
      href: '/platform/licenses', 
      name: 'Lisensi', 
      iconSrc: '/images/icons/licenses.png' // Ganti dengan path gambar Anda
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900">
      {/* Sidebar */}
      <Sidebar
        menuItems={menuItems}
        title="Horeka POS+"
        subtitle="Admin Platform"
        logoSrc="/images/LOGO HOREKA (1).png" // Ganti dengan path logo Anda
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
