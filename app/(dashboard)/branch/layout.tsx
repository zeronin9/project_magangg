'use client';

import DashboardLayout from '@/components/DashboardLayout';

export default function BranchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayout role="branch_admin">
      {children}
    </DashboardLayout>
  );
}