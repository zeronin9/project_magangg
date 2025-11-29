'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: 'admin_platform' | 'super_admin' | 'branch_admin';
}

export default function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      router.push('/login');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      if (user.role !== role) {
        router.push('/login');
        return;
      }
      setIsAuthenticated(true);
    } catch (error) {
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  }, [role, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted/50">
        <div className="text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 border-4 border-primary/30 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-sm text-muted-foreground font-medium">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="relative flex min-h-screen bg-background">
      <Sidebar role={role} onCollapsedChange={setIsSidebarCollapsed} />
      
      {/* ✅ Main Content with padding top for mobile top bar */}
      <main 
        className={cn(
          "flex-1 overflow-y-auto transition-all duration-300",
          // Mobile: padding top untuk top bar (64px = h-16)
          "pt-16 lg:pt-0",
          // Desktop: margin left berdasarkan sidebar state
          isSidebarCollapsed ? "lg:ml-[70px]" : "lg:ml-64",
        )}
      >
        <div className="min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
}
