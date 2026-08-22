"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Car, Calendar, Clock, User, Phone, ArrowLeft, ShieldCheck, FileCheck, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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

  const isStaff = session?.user?.role && ["ADMIN", "MANAGER", "SALE"].includes(session.user.role);

  const [showrooms, setShowrooms] = useState<any[]>([]);
  const [variants, setVariants] = useState<any[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedShowroom, setSelectedShowroom] = useState("");
  const [selectedVariant, setSelectedVariant] = useState(searchParams.get("variant_id") || "");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [driverName, setDriverName] = useState(session?.user?.name || "");
  const [driverPhone, setDriverPhone] = useState("");
  const [gplxNumber, setGplxNumber] = useState("");
  const [gplxUploaded, setGplxUploaded] = useState(false);

  // Sale book on behalf
  const [isOnBehalf, setIsOnBehalf] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

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
          driverName: isOnBehalf ? customerName : driverName,
          driverPhone: isOnBehalf ? customerPhone : driverPhone,
          gplxNumber,
          isOnBehalf,
          bookedByUserId: session.user.id,
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
        <div className="max-w-md mx-auto p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border shadow-lg space-y-4">
          <div className="h-16 w-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600">
            <Calendar className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold">Đặt lịch lái thử thành công!</h2>
          <p className="text-sm text-muted-foreground">
            {isOnBehalf
              ? `Lịch lái thử đã được đăng ký thành công cho khách hàng ${customerName} (${customerPhone}).`
              : "Cảm ơn bạn đã đăng ký trải nghiệm. Nhân viên tư vấn bán hàng sẽ liên hệ xác nhận trong vòng 2 giờ."}
          </p>
          <div className="pt-2 flex gap-3 justify-center">
            <Button onClick={() => router.push("/catalog")}>Quay lại danh mục xe</Button>
            {isStaff && (
              <Button variant="outline" onClick={() => router.push("/portal/crm")}>
                Mở Kanban CRM
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 max-w-2xl">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Quay lại
      </Button>

      <Card className="shadow-md">
        <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Car className="h-6 w-6 text-primary" />
              Đăng ký trải nghiệm lái thử xe (SCR-03)
            </CardTitle>
            {isStaff && (
              <Badge variant="secondary" className="gap-1">
                <UserPlus className="h-3.5 w-3.5" /> Staff Mode
              </Badge>
            )}
          </div>
          <CardDescription>
            Trải nghiệm cảm giác lái thực tế cùng tư vấn viên chuyên nghiệp tại Showroom gần nhất
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sale On-Behalf Checkbox */}
            {isStaff && (
              <div className="p-3 rounded-lg border bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Đặt lịch hộ khách hàng (Sale Consultant)</span>
                </div>
                <input
                  type="checkbox"
                  checked={isOnBehalf}
                  onChange={(e) => setIsOnBehalf(e.target.checked)}
                  className="h-4 w-4 text-primary rounded border-slate-300"
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-medium">Dòng xe lái thử</Label>
                <Select value={selectedVariant} onValueChange={setSelectedVariant}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn dòng xe" />
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
                <Label className="font-medium">Showroom địa điểm</Label>
                <Select value={selectedShowroom} onValueChange={setSelectedShowroom}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn showroom" />
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
              <Label className="font-medium">Ngày lái thử</Label>
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
                <Label className="font-medium flex items-center justify-between">
                  <span>Khung giờ khả dụng (Slot 60 phút - Anti Collision)</span>
                  <span className="text-xs text-muted-foreground">Chống trùng slot tự động</span>
                </Label>
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
                        className={`p-3 rounded-lg border text-sm transition-all text-center ${
                          slot.isBooked
                            ? "bg-red-50 border-red-200 text-red-400 cursor-not-allowed"
                            : selectedSlot === slot.id
                            ? "bg-primary text-primary-foreground border-primary font-semibold shadow-sm"
                            : "hover:border-primary/50"
                        }`}
                      >
                        <Clock className="h-3.5 w-3.5 inline mr-1" />
                        {start} - {end}
                        <br />
                        <span className="text-xs opacity-80">
                          {slot.isBooked ? "Đã kín" : "Trống"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <Separator />

            {/* Customer / Driver Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">
                {isOnBehalf ? "Thông tin khách hàng trải nghiệm" : "Thông tin người lái thử"}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Họ và tên người lái</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Nguyễn Văn A"
                      value={isOnBehalf ? customerName : driverName}
                      onChange={(e) => (isOnBehalf ? setCustomerName(e.target.value) : setDriverName(e.target.value))}
                      className="pl-9"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Số điện thoại liên hệ</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="0912345678"
                      value={isOnBehalf ? customerPhone : driverPhone}
                      onChange={(e) => (isOnBehalf ? setCustomerPhone(e.target.value) : setDriverPhone(e.target.value))}
                      className="pl-9"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* GPLX Driver License Validation */}
              <div className="space-y-2 pt-2">
                <Label className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 font-medium">
                    <FileCheck className="h-4 w-4 text-primary" />
                    Số Giấy Phép Lái Xe (GPLX Ô tô còn hiệu lực)
                  </span>
                  <span className="text-xs text-muted-foreground">Bắt buộc theo quy định an toàn</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nhập 12 chữ số GPLX hạng B2 trở lên"
                    value={gplxNumber}
                    onChange={(e) => setGplxNumber(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant={gplxUploaded ? "secondary" : "outline"}
                    onClick={() => setGplxUploaded(true)}
                    className={gplxUploaded ? "bg-emerald-600 text-white hover:bg-emerald-700 shrink-0" : "shrink-0"}
                  >
                    {gplxUploaded ? "Đã đính kèm ảnh GPLX" : "Đính kèm ảnh GPLX"}
                  </Button>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loading || !selectedSlot}>
              <Calendar className="h-4 w-4 mr-2" />
              {loading ? "Đang xử lý đặt hẹn..." : "Xác nhận đặt hẹn lái thử"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function TestDrivePage() {
  return (
    <Suspense fallback={<div className="text-center py-8">Đang tải trang lái thử...</div>}>
      <TestDriveContent />
    </Suspense>
  );
}
