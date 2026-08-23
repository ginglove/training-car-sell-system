"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Car, LogOut, User, ShoppingCart, LayoutDashboard } from "lucide-react";

export function Header() {
  const { data: session } = useSession();
  const role = session?.user?.role;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <Car className="h-6 w-6 text-primary" />
            <span>AUTO DEALERSHIP</span>
          </Link>
          <nav className="hidden md:flex items-center gap-4 text-sm">
            <Link href="/catalog" className="text-muted-foreground hover:text-foreground transition-colors">
              Danh mục xe
            </Link>
            <Link href="/test-drive" className="text-muted-foreground hover:text-foreground transition-colors">
              Lái thử
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {session ? (
            <>
              {role && ["ADMIN", "MANAGER", "SALE"].includes(role) && (
                <Link href="/portal/dashboard">
                  <Button variant="ghost" size="sm">
                    <LayoutDashboard className="h-4 w-4 mr-1" />
                    Portal
                  </Button>
                </Link>
              )}
              {role === "CUSTOMER" && (
                <Link href="/orders">
                  <Button variant="ghost" size="sm">
                    <ShoppingCart className="h-4 w-4 mr-1" />
                    Đơn hàng
                  </Button>
                </Link>
              )}
              <Link href="/profile">
                <Button variant="ghost" size="sm">
                  <User className="h-4 w-4 mr-1" />
                  {session.user.name}
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                <LogOut className="h-4 w-4 mr-1" />
                Đăng xuất
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/register">
                <Button variant="outline" size="sm">Đăng ký</Button>
              </Link>
              <Link href="/login">
                <Button size="sm">Đăng nhập</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
