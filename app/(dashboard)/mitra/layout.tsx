'use client';

import DashboardLayout from '@/components/DashboardLayout';

export default function MitraLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayout role="super_admin">
      {children}
    </DashboardLayout>
  );
}