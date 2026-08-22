"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Calendar, Clock, MapPin, Car, Phone, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Slot {
  id: string;
  slotStart: string;
  slotEnd: string;
  isBooked: boolean;
}

function TestDriveContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();

  const [showrooms, setShowrooms] = useState<any[]>([]);
  const [variants, setVariants] = useState<any[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedShowroom, setSelectedShowroom] = useState("");
  const [selectedVariant, setSelectedVariant] = useState(searchParams.get("variant_id") || "");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [driverName, setDriverName] = useState(session?.user?.name || "");
  const [driverPhone, setDriverPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/v1/showrooms").then((r) => r.json()).then((d) => d.success && setShowrooms(d.data));
    fetch("/api/v1/catalog/models").then((r) => r.json()).then((d) => d.success && setVariants(d.data));
  }, []);

  useEffect(() => {
    if (selectedShowroom && selectedDate) {
      fetch(`/api/v1/test-drives/slots?showroom_id=${selectedShowroom}&date=${selectedDate}`)
        .then((r) => r.json())
        .then((d) => d.success && setSlots(d.data));
    }
  }, [selectedShowroom, selectedDate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session) {
      router.push(`/login?redirect=/test-drive?variant_id=${selectedVariant}`);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/v1/test-drives/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId: selectedVariant,
          showroomId: selectedShowroom,
          slotId: selectedSlot,
          driverName,
          driverPhone,
        }),
      });
      const data = await res.json();
      if (data.success) setSuccess(true);
    } catch {
      // error
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="container py-16 text-center">
        <div className="max-w-md mx-auto">
          <Calendar className="h-16 w-16 mx-auto mb-4 text-green-500" />
          <h2 className="text-2xl font-bold mb-2">Dat lich thanh cong!</h2>
          <p className="text-muted-foreground mb-4">
            Nhan vien kinh doanh se goi dien xac nhan trong vong 2 gio.
          </p>
          <Button onClick={() => router.push("/catalog")}>Quay lai danh muc xe</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-6 w-6" />
            Dang ky trai nghiem lai thu xe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Dong xe</Label>
                <Select value={selectedVariant} onValueChange={setSelectedVariant}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chon dong xe" />
                  </SelectTrigger>
                  <SelectContent>
                    {variants.map((v: any) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.brandName} {v.modelName} - {v.variantName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Showroom</Label>
                <Select value={selectedShowroom} onValueChange={setSelectedShowroom}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chon showroom" />
                  </SelectTrigger>
                  <SelectContent>
                    {showrooms.map((s: any) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Ngay lai thu</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                required
              />
            </div>

            {slots.length > 0 && (
              <div className="space-y-2">
                <Label>Khung gio (Slot 60 phut)</Label>
                <div className="grid grid-cols-3 gap-2">
                  {slots.map((slot) => {
                    const start = new Date(slot.slotStart).toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    const end = new Date(slot.slotEnd).toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        disabled={slot.isBooked}
                        onClick={() => setSelectedSlot(slot.id)}
                        className={`p-3 rounded-lg border text-sm transition-all ${
                          slot.isBooked
                            ? "bg-red-50 border-red-200 text-red-400 cursor-not-allowed"
                            : selectedSlot === slot.id
                            ? "bg-primary text-primary-foreground border-primary"
                            : "hover:border-primary/50"
                        }`}
                      >
                        <Clock className="h-3 w-3 inline mr-1" />
                        {start} - {end}
                        <br />
                        <span className="text-xs">
                          {slot.isBooked ? "Da kin" : "Trong"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ho va ten</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Nguyen Van A"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>So dien thoai</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="0912345678"
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading || !selectedSlot}>
              <Calendar className="h-4 w-4 mr-2" />
              {loading ? "Dang xu ly..." : "Xac nhan dat hen lai thu"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function TestDrivePage() {
  return (
    <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
      <TestDriveContent />
    </Suspense>
  );
}
