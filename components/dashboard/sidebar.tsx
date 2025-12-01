'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface NavItem {
  icon: LucideIcon;
  label: string;
  href: string;
  badge?: string | number;
  children?: NavItem[];
}

interface SidebarProps {
  items: NavItem[];
  collapsed?: boolean;
  onItemClick?: () => void;
}

export function Sidebar({ items, collapsed = false, onItemClick }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/mitra') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <ScrollArea className="h-full py-4">
      <nav className="space-y-1 px-3">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          if (collapsed) {
            return (
              <TooltipProvider key={item.href} delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href={item.href} onClick={onItemClick}>
                      <Button
                        variant={active ? 'default' : 'ghost'}
                        size="icon"
                        className={cn(
                          'w-full h-10',
                          active && 'bg-primary text-primary-foreground'
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          }

          return (
            <Link key={item.href} href={item.href} onClick={onItemClick}>
              <Button
                variant={active ? 'default' : 'ghost'}
                className={cn(
                  'w-full justify-start gap-3 h-10',
                  active && 'bg-primary text-primary-foreground hover:bg-primary/90'
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className="font-medium">{item.label}</span>
                {item.badge && (
                  <span className="ml-auto bg-primary-foreground/20 px-2 py-0.5 rounded-full text-xs font-semibold">
                    {item.badge}
                  </span>
                )}
              </Button>
            </Link>
          );
        })}
      </nav>
    </ScrollArea>
  );
}
