'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar, NavItem } from './sidebar';
import { Header } from './header';
import { Logo } from './logo';
import { Button } from '@/components/ui/button';
import { X, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { authAPI } from '@/lib/api/mitra';

interface DashboardLayoutProps {
  children: React.ReactNode;
  navItems: NavItem[];
}

export function DashboardLayout({ children, navItems }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Get user data
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }

      // Load collapsed state from localStorage
      const collapsed = localStorage.getItem('sidebar-collapsed');
      if (collapsed === 'true') {
        setSidebarCollapsed(true);
      }
    }
  }, []);

  const handleLogout = () => {
    authAPI.logout();
    router.push('/login');
  };

  const toggleCollapsed = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar-collapsed', String(newState));
    }
  };

  if (!mounted) {
    return null; // Prevent hydration mismatch
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full bg-card border-r transition-all duration-300 ease-in-out',
          sidebarCollapsed ? 'w-16' : 'w-64',
          'lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo & Close Button */}
          <div className="flex items-center justify-between p-4 border-b h-16">
            <Logo collapsed={sidebarCollapsed} />
            <div className="flex items-center gap-1">
              {/* Collapse Button - Desktop */}
              <Button
                variant="ghost"
                size="icon"
                className="hidden lg:flex h-8 w-8"
                onClick={toggleCollapsed}
              >
                {sidebarCollapsed ? (
                  <ChevronsRight className="h-4 w-4" />
                ) : (
                  <ChevronsLeft className="h-4 w-4" />
                )}
              </Button>
              {/* Close Button - Mobile */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-8 w-8"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <Sidebar
            items={navItems}
            collapsed={sidebarCollapsed}
            onItemClick={() => setSidebarOpen(false)}
          />

          {/* Footer */}
          {!sidebarCollapsed && (
            <div className="p-4 border-t">
              <div className="bg-muted rounded-lg p-3">
                <p className="text-xs font-semibold mb-1">Horeka POS+</p>
                <p className="text-xs text-muted-foreground">Version 1.0.0</p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={cn(
          'transition-all duration-300 ease-in-out',
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        )}
      >
        {/* Header */}
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          userName={user?.full_name || user?.username || 'Admin Mitra'}
          userEmail={user?.email}
          onLogout={handleLogout}
        />

        {/* Page Content */}
        <main className="p-4 md:p-6 lg:p-8">{children}</main>

        {/* Footer */}
        <footer className="border-t py-4 px-4 md:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-2 text-sm text-muted-foreground">
            <p>© 2025 Horeka POS+. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-foreground transition-colors">
                Bantuan
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Syarat & Ketentuan
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Privasi
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
