// app/(dashboard)/branch/layout.tsx

'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';

export default function BranchLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar menggunakan komponen yang sama dengan Admin Mitra */}
      <Sidebar role="branch_admin" onCollapsedChange={setIsCollapsed} />

      {/* Main Content */}
      <main 
        className={`
          flex-1 overflow-y-auto transition-all duration-300 ease-in-out
          ${isCollapsed ? 'lg:ml-[70px]' : 'lg:ml-64'}
          pt-16 lg:pt-0
        `}
      >
        <div className="h-full bg-muted/10">
          {children}
        </div>
      </main>
    </div>
  );
}
