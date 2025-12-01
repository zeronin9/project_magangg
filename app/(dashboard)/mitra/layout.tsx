'use client';

import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { NavItem } from '@/components/dashboard/sidebar';
import { 
  LayoutDashboard,
  Building2,
  Users,
  Package,
  Layers,
  Percent,
  Key,
  CreditCard,
  FileText,
} from 'lucide-react';

const navItems: NavItem[] = [
  { 
    icon: LayoutDashboard, 
    label: 'Dashboard', 
    href: '/mitra' 
  },
  { 
    icon: Building2, 
    label: 'Cabang', 
    href: '/mitra/branches' 
  },
  { 
    icon: Users, 
    label: 'Admin Cabang', 
    href: '/mitra/branch-admins' 
  },
  { 
    icon: Layers, 
    label: 'Kategori', 
    href: '/mitra/categories' 
  },
  { 
    icon: Package, 
    label: 'Produk', 
    href: '/mitra/products' 
  },
  { 
    icon: Percent, 
    label: 'Diskon', 
    href: '/mitra/discounts' 
  },
  { 
    icon: Key, 
    label: 'Lisensi', 
    href: '/mitra/licenses' 
  },
  { 
    icon: CreditCard, 
    label: 'Langganan', 
    href: '/mitra/subscription' 
  },
  { 
    icon: FileText, 
    label: 'Laporan', 
    href: '/mitra/reports' 
  },
];

export default function MitraLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout navItems={navItems}>{children}</DashboardLayout>;
}
