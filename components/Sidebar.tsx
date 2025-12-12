'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { 
  LogOut,
  ChevronLeft,
  Menu,
  X
} from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface SidebarProps {
  role: 'admin_platform' | 'super_admin' | 'branch_admin';
  onCollapsedChange?: (collapsed: boolean) => void;
}

export default function Sidebar({ role, onCollapsedChange }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [userName, setUserName] = useState('Admin');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userObj = JSON.parse(userStr);
        setUserName(userObj.name || userObj.username || 'Admin');
        setUserEmail(userObj.email || '');
      } catch (e) {
        // Ignore
      }
    }
  }, []);

  useEffect(() => {
    if (onCollapsedChange) {
      onCollapsedChange(isCollapsed);
    }
  }, [isCollapsed, onCollapsedChange]);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const getNavigationItems = () => {
    // 1. ADMIN PLATFORM (L3)
    if (role === 'admin_platform') {
      return [
        { 
          href: '/platform', 
          icon: '/images/icons/dashboard.png',
          label: 'Dashboard',
          badge: null,
          exact: true
        },
        { 
          href: '/platform/partners', 
          icon: '/images/icons/branchadmin.png',
          label: 'Mitra',
          badge: null,
          exact: false
        },
        { 
          href: '/platform/subscription-plans', 
          icon: '/images/icons/BranchProduk.png',
          label: 'Paket Langganan',
          badge: null,
          exact: false
        },
        { 
          href: '/platform/subscriptions', 
          icon: '/images/icons/Branch.png',
          label: 'Langganan',
          badge: null,
          exact: false
        },
        { 
          href: '/platform/licenses', 
          icon: '/images/icons/licenses.png',
          label: 'Lisensi',
          badge: null,
          exact: false
        },
      ];
    }

    // 2. ADMIN MITRA (L2)
    if (role === 'super_admin') {
      return [
        { 
          href: '/mitra', 
          icon: '/images/icons/dashboard.png',
          label: 'Dashboard',
          badge: null,
          exact: true
        },
        { 
          href: '/mitra/branches', 
          icon: '/images/icons/Cabang1.png',
          label: 'Cabang',
          badge: null,
          exact: false
        },
        { 
          href: '/mitra/branch-admins', 
          icon: '/images/icons/branchadmin.png',
          label: 'Admin Cabang',
          badge: null,
          exact: false
        },
        { 
          href: '/mitra/categories', 
          icon: '/images/icons/catalog.png',
          label: 'Kategori',
          badge: null,
          exact: false
        },
        { 
          href: '/mitra/products', 
          icon: '/images/icons/BranchProduk.png',
          label: 'Produk',
          badge: null,
          exact: false
        },
        { 
          href: '/mitra/discounts', 
          icon: '/images/icons/discount.png',
          label: 'Diskon',
          badge: null,
          exact: false
        },
        { 
          href: '/mitra/licenses', 
          icon: '/images/icons/licenses.png',
          label: 'Lisensi',
          badge: null,
          exact: false
        },
        { 
          href: '/mitra/subscription', 
          icon: '/images/icons/Langganan1.png',
          label: 'Langganan',
          badge: null,
          exact: false
        },
        { 
          href: '/mitra/reports', 
          icon: '/images/icons/reportbaru1.png',
          label: 'Laporan',
          badge: null,
          exact: false
        },
      ];
    }
        // 3. ADMIN CABANG (L1) - UPDATED MENU
    if (role === 'branch_admin') {
      return [
        { 
          href: '/branch', 
          icon: '/images/icons/dashboard.png',
          label: 'Dashboard',
          badge: null,
          exact: true
        },
        { 
          href: '/branch/cashier-management', 
          icon: '/images/icons/branchadmin.png', 
          label: 'Akun Kasir',
          badge: null,
          exact: false
        },
        { 
          href: '/branch/shift-schedules',
          icon: '/images/icons/clock.png',
          label: 'Jadwal Shift',
          badge: null,
          exact: false
        },
        { 
          href: '/branch/categories', 
          icon: '/images/icons/catalog.png',
          label: 'Kategori',
          badge: null,
          exact: false
        },
        { 
          href: '/branch/products', 
          icon: '/images/icons/BranchProduk.png',
          label: 'Produk',
          badge: null,
          exact: false
        },
        { 
          href: '/branch/discounts', 
          icon: '/images/icons/discount.png',
          label: 'Diskon',
          badge: null,
          exact: false
        },
        { 
          href: '/branch/expenses', 
          icon: '/images/icons/kas2.png', 
          label: 'Kas Keluar',
          badge: null,
          exact: false
        },
        { 
          href: '/branch/void-requests',
          icon: '/images/icons/void1.png',
          label: 'Permintaan Void',
          badge: null,
          exact: false
        },
        { 
          href: '/branch/reports', 
          icon: '/images/icons/reportbaru1.png',
          label: 'Laporan',
          badge: null,
          exact: false
        },
        { 
          href: '/branch/licenses', 
          icon: '/images/icons/licenses.png',
          label: 'Lisensi',
          badge: null,
          exact: false
        },
        { 
          href: '/branch/settings', 
          icon: '/images/icons/pajak.png',
          label: 'Pajak & Pembayaran',
          badge: null,
          exact: false
        },
      ];
    }
    return [];
  };

  const navItems = getNavigationItems();

  const NavItem = ({ item }: { item: typeof navItems[0] }) => {
    const isActive = item.exact 
      ? pathname === item.href 
      : pathname.startsWith(`${item.href}/`) || pathname === item.href;

    const content = (
      <Link href={item.href} onClick={() => setIsMobileOpen(false)}>
        <div
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all hover:bg-accent group",
            isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <div className="relative w-5 h-5 ">
            <Image
              src={item.icon}
              alt={item.label}
              width={20}
              height={20}
              className={cn(
                "object-contain transition-all duration-200",
                item.label === 'Permintaan Void' && "p-0.5",
                item.label === 'Laporan' && "p-0.5",
                isActive ? "opacity-100 scale-110" : "opacity-60 group-hover:opacity-80 group-hover:scale-105"
              )}
            />
          </div>
          
          
          {!isCollapsed && (
            <>
              <span className="flex-1 font-medium text-sm">{item.label}</span>
              {item.badge && (
                <span className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {item.badge}
                </span>
              )}
            </>
          )}
        </div>
      </Link>
    );

    if (isCollapsed) {
      return (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              {content}
            </TooltipTrigger>
            <TooltipContent side="right" className="font-medium">
              <p>{item.label}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return content;
  };

  const sidebarContent = (
    <div className="flex h-full flex-col @container">
      {/* Header */}
      <div className="flex h-16 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <div className="flex items-center justify-between w-full">
          {!isCollapsed ? (
            <Link 
              href={`/${role === 'admin_platform' ? 'platform' : role === 'super_admin' ? 'mitra' : 'branch'}`} 
              className="flex items-center gap-2.5 font-semibold"
              onClick={() => setIsMobileOpen(false)}
            >
              <div className="relative w-8 h-8 flex-shrink-0">
                <Image 
                  src="/images/LOGO HOREKA (1).png" 
                  alt="Horeka Logo" 
                  width={32}
                  height={32}
                  className="object-contain" 
                  priority
                />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Horeka Pos+
              </span>
            </Link>
          ) : (
            <Link 
              href={`/${role === 'admin_platform' ? 'platform' : role === 'super_admin' ? 'mitra' : 'branch'}`} 
              className="flex items-center justify-center w-full"
              onClick={() => setIsMobileOpen(false)}
            >
              <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                <Image 
                  src="/images/LOGO HOREKA (1).png" 
                  alt="Horeka Logo" 
                  width={32}
                  height={32}
                  className="object-contain"
                  priority
                  style={{ 
                    width: '32px', 
                    height: '32px',
                    minWidth: '32px',
                    minHeight: '32px',
                    maxWidth: '32px',
                    maxHeight: '32px'
                  }}
                />
              </div>
            </Link>
          )}

          {/* Close button untuk mobile sidebar */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setIsMobileOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-2 lg:px-3">
        <nav className="grid gap-1">
          {navItems.map((item) => (
            <NavItem key={item.href} item={item} />
          ))}
        </nav>
      </div>

      <Separator />

      {/* User Section */}
      <div className="p-3 lg:p-4">
        <div className={cn(
          "flex items-center gap-3 rounded-lg p-2 transition-all hover:bg-accent cursor-pointer",
          isCollapsed && "justify-center"
        )}>
          <Avatar className="h-8 w-8 ring-2 ring-primary/10 flex-shrink-0">
            <AvatarImage src="" alt={userName} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-semibold text-sm">
              {userName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex-1 overflow-hidden min-w-0">
              <p className="text-sm font-semibold leading-none truncate">{userName}</p>
              {userEmail && (
                <p className="text-xs text-muted-foreground truncate mt-1">{userEmail}</p>
              )}
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          className={cn(
            "w-full mt-2 text-muted-foreground hover:text-foreground hover:bg-destructive/10",
            isCollapsed ? "justify-center px-2" : "justify-start"
          )}
          onClick={handleLogout}
        >
          <img src="/images/icons/logout.png" alt="" className='h-5 w-4' />
          {!isCollapsed && <span className="ml-2 text-sm font-medium">Keluar</span>}
        </Button>
      </div>

      {/* Collapse Toggle (Desktop Only) */}
      <div className="hidden lg:block border-t p-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full hover:bg-accent"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <ChevronLeft className={cn(
            "h-4 w-4 transition-transform duration-200 flex-shrink-0",
            isCollapsed && "rotate-180"
          )} />
          {!isCollapsed && <span className="ml-2 text-xs font-medium">Collapse</span>}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* ✅ Mobile Top Bar - Fixed Position */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b shadow-sm">
        <div className="flex items-center justify-between h-16 px-4">
          {/* Hamburger Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="flex-shrink-0"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          {/* Logo & Title - Centered */}
          <Link 
            href={`/${role === 'admin_platform' ? 'platform' : role === 'super_admin' ? 'mitra' : 'branch'}`}
            className="flex items-center gap-2 absolute left-1/2 transform -translate-x-1/2"
          >
            <div className="relative w-7 h-7 flex-shrink-0">
              <Image 
                src="/images/LOGO HOREKA (1).png" 
                alt="Horeka Logo" 
                width={28}
                height={28}
                className="object-contain" 
                priority
              />
            </div>
            <span className="text-base font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Horeka Pos+
            </span>
          </Link>
          
          {/* User Avatar */}
          <Avatar className="h-8 w-8 ring-2 ring-primary/10 flex-shrink-0">
            <AvatarImage src="" alt={userName} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-semibold text-xs">
              {userName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "lg:hidden fixed inset-y-0 left-0 z-50 w-72 border-r bg-background shadow-2xl transition-transform duration-300 ease-out",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:block fixed inset-y-0 left-0 z-40 border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300 ease-in-out",
          isCollapsed ? "w-[70px]" : "w-64"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}