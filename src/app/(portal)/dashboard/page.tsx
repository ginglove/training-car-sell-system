"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { BarChart3, TrendingUp, Users, Car, DollarSign, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatVND } from "@/lib/utils";

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  activeLeads: number;
  availableVehicles: number;
  pendingDeposits: number;
  monthlyGrowth: number;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 156,
    totalRevenue: 45000000000,
    activeLeads: 89,
    availableVehicles: 234,
    pendingDeposits: 12,
    monthlyGrowth: 15.3,
  });

  const cards = [
    {
      title: "Tong don hang",
      value: stats.totalOrders.toString(),
      icon: Package,
      description: "Trong thang nay",
      color: "text-blue-600",
    },
    {
      title: "Doanh thu",
      value: formatVND(stats.totalRevenue),
      icon: DollarSign,
      description: `+${stats.monthlyGrowth}% so voi thang truoc`,
      color: "text-green-600",
    },
    {
      title: "Leads hoat dong",
      value: stats.activeLeads.toString(),
      icon: Users,
      description: "Dang theo doi",
      color: "text-orange-600",
    },
    {
      title: "Xe ton kho",
      value: stats.availableVehicles.toString(),
      icon: Car,
      description: "San sang giao",
      color: "text-purple-600",
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Xin chao, {session?.user?.name} ({session?.user?.role})
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground">{card.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Don hang theo trang thai
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: "Cho thanh toan", count: 12, color: "bg-yellow-500" },
                { label: "Da coc", count: 45, color: "bg-green-500" },
                { label: "Dang tham dinh", count: 23, color: "bg-blue-500" },
                { label: "San sang giao", count: 8, color: "bg-purple-500" },
                { label: "Da giao", count: 68, color: "bg-emerald-500" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${item.color}`} />
                    <span className="text-sm">{item.label}</span>
                  </div>
                  <span className="font-medium">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top xe ban chay
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: "Toyota Camry 2.0Q", sold: 28 },
                { name: "Ford Everest Titanium", sold: 22 },
                { name: "Kia Seltos Premium", sold: 18 },
                { name: "Honda CR-V L", sold: 15 },
                { name: "Mazda CX-5 Premium", sold: 12 },
              ].map((item, i) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-muted-foreground w-5">#{i + 1}</span>
                    <span className="text-sm">{item.name}</span>
                  </div>
                  <span className="font-medium">{item.sold} xe</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
