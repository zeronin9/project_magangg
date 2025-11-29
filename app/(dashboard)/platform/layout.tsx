import DashboardLayout from '@/components/DashboardLayout';

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayout role="admin_platform">
      {children}
    </DashboardLayout>
  );
}
