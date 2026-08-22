"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Car, CreditCard, Building, FileText, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatVND } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/constants/order-status";

const BANKS = [
  { name: "TPBank", approvalOdds: 88 },
  { name: "VIB", approvalOdds: 75 },
  { name: "Techcombank", approvalOdds: 65 },
  { name: "VPBank", approvalOdds: 60 },
];

export default function OrderDetailPage() {
  const { orderId } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [selectedBank, setSelectedBank] = useState("");

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/orders/${orderId}`);
      const data = await res.json();
      if (data.success) setOrder(data.data);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  async function handleBankSwitch() {
    if (!selectedBank) return;
    setSwitching(true);
    try {
      const res = await fetch(`/api/v1/loans/${order.loanApplication?.id}/switch-bank`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bankName: selectedBank }),
      });
      const data = await res.json();
      if (data.success) fetchOrder();
    } finally {
      setSwitching(false);
    }
  }

  async function handleRefundRequest() {
    router.push(`/orders/${orderId}/refund`);
  }

  if (loading) {
    return <div className="animate-pulse h-96 bg-muted rounded max-w-3xl mx-auto" />;
  }

  if (!order) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold">Don hang khong ton tai</h2>
      </div>
    );
  }

  const isBankRejected = order.status === "BANK_REJECTED";
  const canSwitchBank = isBankRejected && (order.loanApplication?.switchCount || 0) < 3;

  return (
    <div className="max-w-3xl mx-auto">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Quay lai
      </Button>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Don hang {order.orderCode}</CardTitle>
              <Badge>{ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS]}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 bg-muted rounded-lg flex items-center justify-center">
                <Car className="h-10 w-10 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{order.variantName}</h3>
                <p className="text-sm text-muted-foreground">Mau: {order.selectedColor}</p>
                {order.vinNumber && (
                  <p className="text-sm text-muted-foreground">VIN: {order.vinNumber}</p>
                )}
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Tong gia ban</p>
                <p className="font-bold text-lg">{formatVND(order.finalPrice)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Tien coc</p>
                <p className="font-bold text-lg">{formatVND(order.depositAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {isBankRejected && (
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-red-600">
                <Building className="h-5 w-5" />
                Thong bao tu ngan hang
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">
                {order.loanApplication?.rejectionReason ||
                  "Ho so chua dat diem tin dung toi thieu."}
              </p>

              {canSwitchBank && (
                <>
                  <p className="text-sm font-medium">
                    Ty le duyet tin dung goi y (Approval Odds Index):
                  </p>
                  <div className="space-y-2">
                    {BANKS.map((bank) => (
                      <div
                        key={bank.name}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{bank.name}</p>
                          <p className="text-sm text-muted-foreground">
                            He so duyet: {bank.approvalOdds}%
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedBank(bank.name)}
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Chuyen
                        </Button>
                      </div>
                    ))}
                  </div>
                  {selectedBank && (
                    <Button onClick={handleBankSwitch} disabled={switching} className="w-full">
                      Xac nhan chuyen ho so sang {selectedBank}
                    </Button>
                  )}
                </>
              )}

              <Separator />

              <Button variant="destructive" onClick={handleRefundRequest} className="w-full">
                <FileText className="h-4 w-4 mr-2" />
                Yeu cau hoan tien coc 100% (SLA 3 Ngay)
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lich su trang thai</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(order.statusHistory || []).map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <div>
                    <p className="font-medium">
                      {ORDER_STATUS_LABELS[item.newStatus as keyof typeof ORDER_STATUS_LABELS]}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleString("vi-VN")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
