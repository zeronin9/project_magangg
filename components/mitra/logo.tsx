'use client';

import Link from 'next/link';
import { Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoProps {
  collapsed?: boolean;
  href?: string;
  className?: string;
}

export function Logo({ collapsed = false, href = '/mitra', className }: LogoProps) {
  return (
    <Link href={href} className={cn('flex items-center gap-2', className)}>
        <img
          src="/images/LOGO HOREKA (1).png "
          alt="Horeka Logo"
          className="w-6 h-6 object-contain"
        />
      {!collapsed && (
        <div className="flex flex-col">
          <span className="font-bold text-sm leading-none">Horeka Pos +</span>
          <span className="text-xs text-muted-foreground">Admin Mitra</span>
        </div>
      )}
    </Link>
  );
}
