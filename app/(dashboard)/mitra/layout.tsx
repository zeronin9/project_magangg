// app/admin/mitra/layout.tsx
import { MitraLayout } from "@/components/admin/mitra-layout"
import { SidebarNav } from "@/components/admin/sidebar-nav"

export default function MitraLayoutRoot({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <MitraLayout>
      <div className="flex-1 space-y-4 p-8 pt-6 md:p-10">
        {children}
      </div>
    </MitraLayout>
  )
}
