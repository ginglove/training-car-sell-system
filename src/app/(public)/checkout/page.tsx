"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { CreditCard, Clock, Shield, ArrowLeft, Check, AlertTriangle, RefreshCw, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { formatVND } from "@/lib/utils";

const ACCESSORIES_MASTER = [
  { id: "acc_1", name: "Phim cách nhiệt V-Kool Premium", price: 12000000 },
  { id: "acc_2", name: "Thảm lót sàn tràn viền 6D", price: 3500000 },
  { id: "acc_3", name: "Camera hành trình VietMap SpeedMap", price: 5500000 },
  { id: "acc_4", name: "Bọc ghế da Nappa cao cấp", price: 18000000 },
  { id: "acc_5", name: "Phủ Ceramic 9H bảo vệ sơn", price: 15000000 },
];

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();

  const variantId = searchParams.get("variant_id") || searchParams.get("variantId") || "";
  const color = searchParams.get("color") || "";
  const initialAccessories = searchParams.get("accessories")?.split(",").filter(Boolean) || [];

  const [vehicle, setVehicle] = useState<any>(null);
  const [selectedAccessories, setSelectedAccessories] = useState<string[]>(initialAccessories);
  const [paymentMethod, setPaymentMethod] = useState("MOCK_VIETQR");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(900); // 15 phút hold

  // SSE Connection status
  const [sseStatus, setSseStatus] = useState<"connecting" | "connected" | "disconnected">("disconnected");

  useEffect(() => {
    if (!variantId) {
      router.push("/catalog");
      return;
    }
    fetch(`/api/v1/catalog/variants/${variantId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setVehicle(d.data);
      })
      .finally(() => setLoading(false));
  }, [variantId, router]);

  // 15-minute countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Client SSE Stream for Real-time Payment Updates
  useEffect(() => {
    if (!orderId) return;

    setSseStatus("connecting");
    const eventSource = new EventSource(`/api/v1/payments/stream?orderId=${orderId}`);

    eventSource.onopen = () => {
      setSseStatus("connected");
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.status && ["SUCCESS", "FAILED", "EXPIRED", "CANCELLED"].includes(data.status)) {
          eventSource.close();
          router.push(`/checkout/result?orderId=${orderId}&status=${data.status}`);
        }
      } catch (err) {
        console.error("SSE parse error", err);
      }
    };

    eventSource.onerror = () => {
      setSseStatus("disconnected");
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [orderId, router]);

  const toggleAccessory = (id: string) => {
    if (selectedAccessories.includes(id)) {
      setSelectedAccessories(selectedAccessories.filter((i) => i !== id));
    } else {
      setSelectedAccessories([...selectedAccessories, id]);
    }
  };

  const listedPrice = vehicle?.listedPrice || 0;
  const accessoriesTotal = ACCESSORIES_MASTER.filter((a) => selectedAccessories.includes(a.id)).reduce(
    (sum, a) => sum + a.price,
    0
  );
  const finalPrice = listedPrice + accessoriesTotal;
  const depositAmount = vehicle?.minDepositAmount || 50000000;

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const selectedColorQuota = vehicle?.colors?.find((c: any) => c.color === color);
      const res = await fetch("/api/v1/orders/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId,
          selectedColor: color,
          showroomId: selectedColorQuota?.showroomId,
          accessories: ACCESSORIES_MASTER.filter((a) => selectedAccessories.includes(a.id)),
          paymentMethod,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setOrderId(data.data.orderId || data.data.id);
      }
    } catch {
      // error
    } finally {
      setSubmitting(false);
    }
  }

  async function simulatePayment(result: string) {
    if (!orderId) return;
    const res = await fetch("/api/v1/payments/mock-webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, result }),
    });
    const data = await res.json();
    if (data.success) {
      router.push(`/checkout/result?orderId=${orderId}&status=${result}`);
    }
  }

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;

  if (loading) {
    return (
      <div className="container py-12 max-w-4xl text-center">
        <div className="animate-pulse h-96 bg-slate-100 dark:bg-slate-800 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="container py-6 max-w-5xl">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Quay lại
      </Button>

      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <CreditCard className="h-6 w-6 text-primary" />
        Thanh toán đặt cọc giữ chỗ xe trực tuyến (SCR-04)
      </h1>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <Accordion type="multiple" defaultValue={["config", "payment"]}>
            <AccordionItem value="config">
              <AccordionTrigger className="text-base font-semibold">Cấu hình xe & Gói phụ kiện chọn kèm</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                    <div>
                      <p className="font-semibold text-base">{vehicle?.brandName} {vehicle?.modelName} - {vehicle?.variantName}</p>
                      <p className="text-sm text-muted-foreground">Ngoại thất chọn: <span className="font-medium text-foreground">{color || "Tiêu chuẩn"}</span></p>
                    </div>
                    <p className="font-bold text-base">{formatVND(listedPrice)}</p>
                  </div>

                  <p className="text-sm font-semibold pt-2">Danh sách phụ kiện chính hãng chọn thêm:</p>
                  {ACCESSORIES_MASTER.map((acc) => (
                    <label
                      key={acc.id}
                      className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all ${
                        selectedAccessories.includes(acc.id) ? "border-primary bg-primary/5 shadow-sm" : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedAccessories.includes(acc.id)}
                          onChange={() => toggleAccessory(acc.id)}
                          className="h-4 w-4 text-primary rounded"
                        />
                        <span className="text-sm font-medium">{acc.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-primary">+{formatVND(acc.price)}</span>
                    </label>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="payment">
              <AccordionTrigger className="text-base font-semibold">Phương thức nộp tiền cọc Sandbox</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  {[
                    { id: "MOCK_VIETQR", label: "Quét mã VietQR Chuyển khoản (Mock Sandbox)", desc: "Xác nhận tự động trong 5 giây" },
                    { id: "MOCK_GATEWAY", label: "Cổng thanh toán Mock VNPAY / Thẻ nội địa", desc: "Giả lập cổng thanh toán trực tuyến" },
                  ].map((method) => (
                    <label
                      key={method.id}
                      className={`flex items-start gap-3 p-3.5 border rounded-lg cursor-pointer transition-all ${
                        paymentMethod === method.id ? "border-primary bg-primary/5 shadow-sm" : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={method.id}
                        checked={paymentMethod === method.id}
                        onChange={() => setPaymentMethod(method.id)}
                        className="mt-1 text-primary"
                      />
                      <div>
                        <p className="font-medium text-sm">{method.label}</p>
                        <p className="text-xs text-muted-foreground">{method.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {!orderId ? (
            <Button
              className="w-full h-12 text-base font-bold shadow-lg shadow-primary/20"
              size="lg"
              onClick={handleSubmit}
              disabled={submitting || countdown <= 0}
            >
              <Shield className="h-5 w-5 mr-2" />
              {submitting ? "Đang khởi tạo đơn hàng..." : `Xác nhận giữ xe & Đặt cọc ${formatVND(depositAmount)}`}
            </Button>
          ) : (
            <Card className="border-primary shadow-md">
              <CardHeader className="bg-primary/5 pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Radio className="h-4 w-4 text-emerald-600 animate-pulse" />
                    Real-time Mock Payment Sandbox
                  </CardTitle>
                  <Badge variant={sseStatus === "connected" ? "success" : "outline"} className="text-xs">
                    {sseStatus === "connected" ? "SSE Stream Connected" : "Connecting Stream..."}
                  </Badge>
                </div>
                <CardDescription>
                  Mã đơn hàng: <span className="font-mono font-bold text-foreground">{orderId}</span>. Sử dụng các nút mô phỏng bên dưới để giả lập webhook phản hồi.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 pt-4">
                <Button onClick={() => simulatePayment("SUCCESS")} className="bg-emerald-600 hover:bg-emerald-700 font-semibold">
                  <Check className="h-4 w-4 mr-1" /> Mock Thanh Cong (SUCCESS)
                </Button>
                <Button onClick={() => simulatePayment("FAILED")} variant="destructive" className="font-semibold">
                  <AlertTriangle className="h-4 w-4 mr-1" /> Mock That Bai (FAILED)
                </Button>
                <Button onClick={() => simulatePayment("EXPIRED")} variant="secondary" className="font-semibold">
                  <Clock className="h-4 w-4 mr-1" /> Mock Het Han 15p (EXPIRED)
                </Button>
                <Button onClick={() => simulatePayment("CANCELLED")} variant="outline" className="font-semibold">
                  Huy Giao Dich (CANCELLED)
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Financial Breakdown Sidebar */}
        <div className="lg:col-span-2">
          <Card className="sticky top-20 shadow-md">
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold">Tóm tắt dòng tiền cọc</CardTitle>
                <Badge variant={countdown > 180 ? "success" : "destructive"} className="font-mono font-semibold">
                  <Clock className="h-3.5 w-3.5 mr-1" />
                  Hold VIN: {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Giá niêm yết xe</span>
                <span className="font-medium">{formatVND(listedPrice)}</span>
              </div>
              {accessoriesTotal > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gói phụ kiện chính hãng</span>
                  <span className="font-medium text-primary">+{formatVND(accessoriesTotal)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-base">
                <span>Tổng giá trị hợp đồng</span>
                <span>{formatVND(finalPrice)}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-baseline font-bold text-lg pt-1">
                <span>Tiền cọc giữ xe (15 phút)</span>
                <span className="text-2xl text-primary">{formatVND(depositAmount)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground pt-1">
                <span>Còn lại thanh toán khi nhận xe</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{formatVND(finalPrice - depositAmount)}</span>
              </div>

              <div className="pt-3 text-xs text-muted-foreground bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border space-y-1">
                <p className="font-semibold text-slate-700 dark:text-slate-300">Quyền lợi đặt cọc trực tuyến:</p>
                <p>• Cam kết giữ đúng số khung/VIN xe trong kho chi nhánh.</p>
                <p>• Hoàn tiền cọc 100% nếu hồ sơ vay ngân hàng bị từ chối.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="text-center py-8">Đang tải trang thanh toán...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
