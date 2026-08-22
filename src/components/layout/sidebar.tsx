"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Settings,
  FileText,
  Kanban,
  Warehouse,
  Truck,
  Shield,
  ReceiptText,
} from "lucide-react";

const menuItems = [
  { href: "/portal/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "MANAGER", "SALE"] },
  { href: "/portal/crm", label: "CRM Leads", icon: Kanban, roles: ["ADMIN", "MANAGER", "SALE"] },
  { href: "/portal/refunds", label: "Duyệt hoàn cọc", icon: ReceiptText, roles: ["ADMIN", "MANAGER"] },
  { href: "/portal/inventory", label: "Kho xe", icon: Warehouse, roles: ["ADMIN", "MANAGER"] },
  { href: "/portal/transfers", label: "Điều chuyển kho", icon: Truck, roles: ["ADMIN", "MANAGER"] },
  { href: "/portal/users", label: "Quản trị Users", icon: Users, roles: ["ADMIN"] },
  { href: "/portal/config", label: "Cấu hình", icon: Settings, roles: ["ADMIN"] },
  { href: "/portal/audit-logs", label: "Nhật ký kiểm toán", icon: FileText, roles: ["ADMIN"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role;

  const filteredItems = menuItems.filter(
    (item) => role && item.roles.includes(role)
  );

  return (
    <aside className="w-64 border-r bg-background min-h-[calc(100vh-4rem)]">
      <div className="flex flex-col gap-1 p-4">
        <div className="flex items-center gap-2 px-3 py-2 mb-4">
          <Shield className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm">Dealer Portal</span>
        </div>
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
                isActive
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
