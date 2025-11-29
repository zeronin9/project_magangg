// components/admin/sidebar-nav.tsx
"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Branch, Users, Package, Tag, Percent, FileText, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

const links = [
  { title: "Cabang", href: "/admin/mitra/branch", icon: Branch },
  { title: "Admin Cabang", href: "/admin/mitra/branch-admin", icon: Users },
  { title: "Produk Pusat", href: "/admin/mitra/product", icon: Package },
  { title: "Kategori", href: "/admin/mitra/category", icon: Tag },
  { title: "Diskon", href: "/admin/mitra/discount", icon: Percent },
  { title: "Lisensi", href: "/admin/mitra/license", icon: CreditCard },
  { title: "Laporan", href: "/admin/mitra/report", icon: FileText },
]

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <ScrollArea className="flex w-full flex-col">
      <div className="mb-4 px-4">
        <div className="h-8 w-8 rounded-lg bg-primary/10" />
      </div>
      <nav className="flex flex-col space-y-1 px-2">
        {links.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className="justify-start w-full px-2 py-2 hover:bg-accent hover:text-accent-foreground"
              >
                <Icon className="mr-2 h-4 w-4" />
                {item.title}
              </Button>
            </Link>
          )
        })}
      </nav>
    </ScrollArea>
  )
}
