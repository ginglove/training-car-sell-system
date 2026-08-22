"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Package, ChevronRight, Clock, Car } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatVND } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/constants/order-status";

interface Order {
  id: string;
  orderCode: string;
  status: string;
  variantName: string;
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
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/orders/my")
      .then((r) => r.json())
      .then((d) => { if (d.success) setOrders(d.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-muted rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Package className="h-6 w-6" />
        Don hang cua toi
      </h1>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Chua co don hang nao</h3>
          <Link href="/catalog" className="text-primary hover:underline">
            Kham pha danh muc xe
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 bg-muted rounded-lg flex items-center justify-center">
                      <Car className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold">{order.brandName} - {order.variantName}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.orderCode} | Mau: {order.selectedColor}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={(STATUS_COLORS[order.status] as any) || "default"}>
                          {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS] || order.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <div>
                      <p className="font-bold text-primary">{formatVND(order.finalPrice)}</p>
                      <p className="text-xs text-muted-foreground">
                        Coc: {formatVND(order.depositAmount)}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
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
