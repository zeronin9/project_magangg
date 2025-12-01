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
      <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
        <Building2 className="h-5 w-5 text-primary-foreground" />
      </div>
      {!collapsed && (
        <div className="flex flex-col">
          <span className="font-bold text-lg leading-none">Horeka</span>
          <span className="text-xs text-muted-foreground">Admin Mitra</span>
        </div>
      )}
    </Link>
  );
}
