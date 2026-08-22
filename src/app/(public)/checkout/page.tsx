"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { CreditCard, Shield, Clock, Car, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { formatVND } from "@/lib/utils";

const ACCESSORIES = [
  { id: "film-3m", name: "Dan Phim 3M", price: 12000000 },
  { id: "camera-4k", name: "Camera 4K", price: 6000000 },
  { id: "insurance", name: "Bao Hiem Than Vo 1 Nam", price: 15000000 },
  { id: "coating", name: "Phu Ceramic", price: 8000000 },
];

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();

  const variantId = searchParams.get("variant_id");
  const color = searchParams.get("color") || "";

  const [vehicle, setVehicle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedAccessories, setSelectedAccessories] = useState<string[]>([]);
  const [countdown, setCountdown] = useState(900);
  const [paymentMethod, setPaymentMethod] = useState("MOCK_VIETQR");
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      router.push(`/login?redirect=/checkout?variant_id=${variantId}&color=${color}`);
      return;
    }
    if (variantId) {
      fetch(`/api/v1/catalog/variants/${variantId}`)
        .then((r) => r.json())
        .then((d) => { if (d.success) setVehicle(d.data); })
        .finally(() => setLoading(false));
    }
  }, [variantId, session, router, color]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((p) => p - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const accessoriesTotal = ACCESSORIES
    .filter((a) => selectedAccessories.includes(a.id))
    .reduce((sum, a) => sum + a.price, 0);

  const listedPrice = vehicle?.listedPrice || 0;
  const depositAmount = 50000000;
  const finalPrice = listedPrice + accessoriesTotal;

  function toggleAccessory(id: string) {
    setSelectedAccessories((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/orders/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId,
          selectedColor: color,
          accessories: ACCESSORIES.filter((a) => selectedAccessories.includes(a.id)),
          paymentMethod,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setOrderId(data.data.id);
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
      <div className="container py-6">
        <div className="animate-pulse h-96 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <CreditCard className="h-6 w-6" />
        Thanh toan dat coc an toan
      </h1>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <Accordion type="multiple" defaultValue={["config", "payment"]}>
            <AccordionItem value="config">
              <AccordionTrigger>Cau hinh xe & Goi phu kien</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">{vehicle?.brandName} {vehicle?.modelName} - {vehicle?.variantName}</p>
                      <p className="text-sm text-muted-foreground">Mau: {color}</p>
                    </div>
                    <p className="font-bold">{formatVND(listedPrice)}</p>
                  </div>

                  <p className="text-sm font-medium mt-4">Phu kien & Bao hiem:</p>
                  {ACCESSORIES.map((acc) => (
                    <label
                      key={acc.id}
                      className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedAccessories.includes(acc.id)}
                          onChange={() => toggleAccessory(acc.id)}
                          className="h-4 w-4"
                        />
                        <span>{acc.name}</span>
                      </div>
                      <span className="text-sm font-medium">+{formatVND(acc.price)}</span>
                    </label>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="payment">
              <AccordionTrigger>Phuong thuc nop tien coc</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  {[
                    { id: "MOCK_VIETQR", label: "Quet Ma VietQR (Khuyen dung)" },
                    { id: "MOCK_GATEWAY", label: "Cong thanh toan Mock Gateway" },
                  ].map((method) => (
                    <label
                      key={method.id}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer ${
                        paymentMethod === method.id ? "border-primary bg-primary/5" : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={method.id}
                        checked={paymentMethod === method.id}
                        onChange={() => setPaymentMethod(method.id)}
                      />
                      {method.label}
                    </label>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {!orderId ? (
            <Button
              className="w-full"
              size="lg"
              onClick={handleSubmit}
              disabled={submitting || countdown <= 0}
            >
              <Shield className="h-4 w-4 mr-2" />
              {submitting ? "Dang tao don..." : `Xac nhan dat coc ${formatVND(depositAmount)}`}
            </Button>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Mock Payment Simulator</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <Button onClick={() => simulatePayment("SUCCESS")} className="bg-green-600 hover:bg-green-700">
                  <Check className="h-4 w-4 mr-1" /> Thanh cong
                </Button>
                <Button onClick={() => simulatePayment("PARTIAL_PAID")} variant="outline">
                  Nop thieu
                </Button>
                <Button onClick={() => simulatePayment("FAILED")} variant="destructive">
                  That bai
                </Button>
                <Button onClick={() => simulatePayment("EXPIRED")} variant="secondary">
                  Het han
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2">
          <Card className="sticky top-20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Tom tat dong tien</CardTitle>
                <Badge variant={countdown > 180 ? "success" : "destructive"}>
                  <Clock className="h-3 w-3 mr-1" />
                  {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Gia niem yet</span>
                <span>{formatVND(listedPrice)}</span>
              </div>
              {accessoriesTotal > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Phu kien & BH</span>
                  <span>+{formatVND(accessoriesTotal)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Tong gia ban</span>
                <span>{formatVND(finalPrice)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span>Tien coc giu cho</span>
                <span className="font-bold text-primary">{formatVND(depositAmount)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Con lai</span>
                <span>{formatVND(finalPrice - depositAmount)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
