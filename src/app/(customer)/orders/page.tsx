"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Package, ChevronRight, Clock, Car, ArrowLeft, CheckCircle2, ShoppingBag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatVND } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/constants/order-status";

interface Order {
  id: string;
  orderCode: string;
  status: string;
  variantName: string;
  modelName?: string;
  brandName: string;
  selectedColor: string;
  finalPrice: number;
  depositAmount: number;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING_PAYMENT: "warning",
  DEPOSIT_PAID: "success",
  BANK_APPROVING: "default",
  BANK_APPROVED: "success",
  BANK_REJECTED: "destructive",
  PROCESSING: "default",
  DELIVERED: "success",
  COMPLETED: "success",
  CANCELED: "destructive",
  REFUNDED: "secondary",
};

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/orders/my")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) {
          setOrders(d.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4 py-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-6">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Quay lại
      </Button>

      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Package className="h-6 w-6 text-primary" />
        Đơn hàng của tôi
      </h1>

      {orders.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 dark:bg-slate-900 rounded-2xl border shadow-sm space-y-4">
          <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground/40" />
          <h3 className="text-lg font-medium">Chưa có đơn hàng nào</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Bạn chưa thực hiện đơn đặt cọc mua xe nào. Hãy khám phá danh mục sản phẩm xe mới nhất ngay!
          </p>
          <Link href="/catalog">
            <Button className="mt-2 font-semibold">
              <Car className="h-4 w-4 mr-2" />
              Khám phá danh mục xe
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`}>
              <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer border group">
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0 group-hover:scale-105 transition-transform">
                      <Car className="h-8 w-8" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-base group-hover:text-primary transition-colors">
                        {order.brandName} {order.modelName ? `${order.modelName} - ` : ""}{order.variantName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Mã đơn: <span className="font-mono font-medium text-foreground">{order.orderCode}</span> | Màu sơn: <span className="font-medium text-foreground">{order.selectedColor}</span>
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <Badge variant={(STATUS_COLORS[order.status] as any) || "default"} className="text-xs font-semibold px-2 py-0.5">
                          {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS] || order.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex items-center gap-3 shrink-0">
                    <div>
                      <p className="font-bold text-lg text-primary">{formatVND(order.finalPrice)}</p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        Đã cọc: {formatVND(order.depositAmount)}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
