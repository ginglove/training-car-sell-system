/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Car, ArrowLeft, Fuel, Gauge, Calendar, MapPin, Calculator, RefreshCw, CheckCircle2, ShieldCheck, Tag, Box, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatVND } from "@/lib/utils";
import { Car3DViewer } from "@/components/ui/car-3d-viewer";

interface VariantDetail {
  id: string;
  variantName: string;
  listedPrice: number;
  minDepositAmount: number;
  specsJson: Record<string, any>;
  modelName: string;
  brandName: string;
  bodyType: string;
  colors: { color: string; quota: number; showroomName: string }[];
  images: { url: string; is360: boolean; angle: number }[];
}

const AVAILABLE_ACCESSORIES = [
  { id: "acc_1", name: "Phim cách nhiệt V-Kool Premium", price: 12000000, desc: "Cản 99% tia UV & hồng ngoại" },
  { id: "acc_2", name: "Thảm lót sàn tràn viền 6D", price: 3500000, desc: "Chống nước, ôm khít sàn xe" },
  { id: "acc_3", name: "Camera hành trình VietMap SpeedMap", price: 5500000, desc: "Ghi hình 4K & cảnh báo tốc độ" },
  { id: "acc_4", name: "Bọc ghế da Nappa cao cấp", price: 18000000, desc: "Độ bền 10 năm, thoáng khí" },
  { id: "acc_5", name: "Phủ Ceramic 9H bảo vệ sơn", price: 15000000, desc: "Chống trầy xước & hiệu ứng lá sen" },
];

export default function CarDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [vehicle, setVehicle] = useState<VariantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [rotationAngle, setRotationAngle] = useState(0);

  // View Mode: 3D WebGL vs 2D Photo Gallery
  const [viewMode, setViewMode] = useState<"3d" | "2d">("3d");

  // Accessories selector
  const [selectedAccessories, setSelectedAccessories] = useState<string[]>([]);

  // Loan calculator
  const [loanPercent, setLoanPercent] = useState(70);
  const [loanTermYears, setLoanTermYears] = useState(5);
  const interestRate = 8.5;

  useEffect(() => {
    async function fetchDetail() {
      try {
        const res = await fetch(`/api/v1/catalog/variants/${params.variantId}`);
        const data = await res.json();
        if (data.success) {
          setVehicle(data.data);
          if (data.data.colors?.length > 0) {
            setSelectedColor(data.data.colors[0].color);
          }
          if (data.data.images?.length > 0) {
            setSelectedImage(data.data.images[0].url);
          }
        }
      } catch {
        // error
      } finally {
        setLoading(false);
      }
    }
    fetchDetail();
  }, [params.variantId]);

  if (loading) {
    return (
      <div className="container py-12 text-center">
        <p className="text-muted-foreground">Đang tải thông tin chi tiết xe...</p>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="container py-12 text-center">
        <h2 className="text-xl font-semibold mb-2">Không tìm thấy thông tin xe</h2>
        <Button onClick={() => router.push("/catalog")}>Quay lại danh mục</Button>
      </div>
    );
  }

  const toggleAccessory = (id: string) => {
    if (selectedAccessories.includes(id)) {
      setSelectedAccessories(selectedAccessories.filter((item) => item !== id));
    } else {
      setSelectedAccessories([...selectedAccessories, id]);
    }
  };

  const accessoriesTotal = AVAILABLE_ACCESSORIES.filter((a) => selectedAccessories.includes(a.id)).reduce(
    (sum, a) => sum + a.price,
    0
  );

  const grandTotal = vehicle.listedPrice + accessoriesTotal;
  const loanAmount = grandTotal * (loanPercent / 100);
  const monthlyRate = interestRate / 100 / 12;
  const totalMonths = loanTermYears * 12;
  const monthlyPayment =
    (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
    (Math.pow(1 + monthlyRate, totalMonths) - 1);

  const selectedQuota = vehicle.colors?.find((c) => c.color === selectedColor);
  const displayImage = selectedImage || (vehicle.images && vehicle.images.length > 0 ? vehicle.images[0].url : null);

  const checkoutQuery = new URLSearchParams({
    variant_id: vehicle.id,
    color: selectedColor,
    accessories: selectedAccessories.join(","),
  }).toString();

  return (
    <div className="container py-6">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Quay lại danh mục
      </Button>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Main Visual Header Toggle (3D WebGL Model vs 2D Photo Gallery) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-900 p-1.5 rounded-xl border">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={viewMode === "3d" ? "default" : "ghost"}
                  onClick={() => setViewMode("3d")}
                  className="gap-2 font-semibold"
                >
                  <Box className="h-4 w-4 text-primary" />
                  Mô hình 3D WebGL 360° Real-time
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === "2d" ? "default" : "ghost"}
                  onClick={() => setViewMode("2d")}
                  className="gap-2 font-semibold"
                >
                  <ImageIcon className="h-4 w-4" />
                  Bộ sưu tập ảnh chụp 2D
                </Button>
              </div>
              <Badge variant="outline" className="hidden sm:inline-flex text-xs">
                {viewMode === "3d" ? "Đổi màu sơn 3D theo lựa chọn" : "Ảnh chụp thực tế Studio"}
              </Badge>
            </div>

            {/* 3D WebGL Viewer vs 2D Photo Display */}
            {viewMode === "3d" ? (
              <Car3DViewer
                selectedColor={selectedColor}
                brandName={vehicle.brandName}
                modelName={vehicle.modelName}
                bodyType={vehicle.bodyType}
              />
            ) : (
              <div className="relative rounded-xl overflow-hidden h-[420px] bg-slate-100 dark:bg-slate-800 flex items-center justify-center border shadow-sm group">
                {displayImage ? (
                  <img
                    src={displayImage}
                    alt={`${vehicle.brandName} ${vehicle.modelName}`}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80";
                    }}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    style={{ transform: `rotate(${rotationAngle}deg)` }}
                  />
                ) : (
                  <Car className="h-32 w-32 text-muted-foreground/30" />
                )}

                <div className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 border shadow text-xs font-medium">
                  <RefreshCw className="h-3.5 w-3.5 text-primary" />
                  <span>Xoay góc 2D</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => setRotationAngle((prev) => (prev + 90) % 360)}
                  >
                    ↻
                  </Button>
                </div>
              </div>
            )}

            {/* 2D Thumbnail Carousel */}
            {vehicle.images && vehicle.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {vehicle.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedImage(img.url);
                      setViewMode("2d");
                    }}
                    className={`h-20 w-28 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                      viewMode === "2d" && displayImage === img.url ? "border-primary ring-2 ring-primary/20" : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={img.url}
                      alt="angle"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80";
                      }}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Vehicle Information & Color Picker */}
          <div>
            {(() => {
              const uniqueColors = Array.from(new Set(vehicle.colors?.map((c) => c.color) || []));
              const totalStockForSelectedColor = vehicle.colors
                ?.filter((c) => c.color === selectedColor)
                .reduce((sum, c) => sum + (c.quota || 0), 0) || 0;
              const totalSystemStock = vehicle.colors?.reduce((sum, c) => sum + (c.quota || 0), 0) || 0;

              return (
                <>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-sm font-semibold text-primary uppercase tracking-wider">{vehicle.brandName}</p>
                      <h1 className="text-3xl font-bold">{vehicle.modelName} - {vehicle.variantName}</h1>
                      <p className="text-xs text-muted-foreground mt-1">Tổng tồn kho toàn hệ thống: <span className="font-semibold text-foreground">{totalSystemStock} xe</span></p>
                    </div>
                    <Badge variant={totalStockForSelectedColor > 0 ? "success" : "destructive"} className="text-base px-3 py-1">
                      {totalStockForSelectedColor > 0 ? `Còn ${totalStockForSelectedColor} xe sẵn giao` : "Hết hàng kho chi nhánh"}
                    </Badge>
                  </div>

                  <div className="flex items-baseline gap-4 mb-4">
                    <p className="text-3xl font-bold text-primary">{formatVND(grandTotal)}</p>
                    {accessoriesTotal > 0 && (
                      <p className="text-sm text-muted-foreground line-through">
                        Giá gốc xe: {formatVND(vehicle.listedPrice)}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3 mb-6">
                    <Label className="text-sm font-medium">Màu sắc ngoại thất (Tự động đổi màu sơn mô hình 3D):</Label>
                    <div className="flex flex-wrap gap-2">
                      {uniqueColors.map((colorName) => {
                        const colorTotalStock = vehicle.colors
                          ?.filter((c) => c.color === colorName)
                          .reduce((sum, c) => sum + (c.quota || 0), 0) || 0;

                        return (
                          <button
                            key={colorName}
                            onClick={() => setSelectedColor(colorName)}
                            className={`px-4 py-2.5 rounded-lg text-sm border flex items-center gap-2 transition-all ${
                              selectedColor === colorName
                                ? "border-primary bg-primary/10 text-primary font-semibold shadow-sm ring-1 ring-primary"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            <span>{colorName}</span>
                            <Badge variant="outline" className="text-xs">
                              Còn {colorTotalStock} xe
                            </Badge>
                          </button>
                        );
                      })}
                    </div>

                    {/* Showroom Breakdown for Selected Color */}
                    <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border text-xs space-y-1.5">
                      <p className="font-medium text-slate-700 dark:text-slate-300">📍 Phân bổ tồn kho màu <span className="font-bold text-primary">{selectedColor}</span> theo đại lý:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                        {vehicle.colors
                          ?.filter((c) => c.color === selectedColor)
                          .map((c, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 rounded bg-white dark:bg-slate-800 border text-[11px]">
                              <span className="truncate font-medium">{c.showroomName || "Showroom"}</span>
                              <Badge variant="secondary" className="font-mono text-[10px] shrink-0">
                                {c.quota} xe
                              </Badge>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Accessories Selector Checklist */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Tag className="h-5 w-5 text-primary" />
                Gói phụ kiện chính hãng & Đồ chơi xe
              </CardTitle>
              <CardDescription>Chọn thêm phụ kiện cao cấp được lắp đặt chuẩn PDI trước khi bàn giao xe</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {AVAILABLE_ACCESSORIES.map((acc) => {
                const isSelected = selectedAccessories.includes(acc.id);
                return (
                  <div
                    key={acc.id}
                    onClick={() => toggleAccessory(acc.id)}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected ? "border-primary bg-primary/5 shadow-sm" : "hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-5 w-5 rounded border flex items-center justify-center ${
                          isSelected ? "bg-primary border-primary text-white" : "border-slate-300"
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="h-3.5 w-3.5" />}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{acc.name}</p>
                        <p className="text-xs text-muted-foreground">{acc.desc}</p>
                      </div>
                    </div>
                    <span className="font-semibold text-sm">{formatVND(acc.price)}</span>
                  </div>
                );
              })}
              {accessoriesTotal > 0 && (
                <div className="flex justify-between items-center pt-2 border-t font-semibold text-sm">
                  <span>Tổng tiền phụ kiện:</span>
                  <span className="text-primary">{formatVND(accessoriesTotal)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Specifications Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Thông số kỹ thuật chi tiết</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {vehicle.specsJson &&
                  Object.entries(vehicle.specsJson).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-2 border-b text-sm">
                      <span className="text-muted-foreground">{key}</span>
                      <span className="font-medium">{String(value)}</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Trade-in Section */}
          <Card className="bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border-amber-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-amber-900 dark:text-amber-300">
                <RefreshCw className="h-5 w-5 text-amber-600" />
                Thu cũ đổi mới (Trade-in Platform)
              </CardTitle>
              <CardDescription>
                Bán lại xe cũ bất kỳ thương hiệu với giá tốt nhất thị trường và cấn trừ trực tiếp vào đơn cọc xe mới.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Thẩm định miễn phí tận nhà trong 24h</p>
                <p className="text-sm font-semibold">Tặng thêm voucher 15,000,000đ khi đổi sang xe điện/hybrid</p>
              </div>
              <Link href={`/orders`}>
                <Button variant="outline" className="border-amber-500/40 hover:bg-amber-500/10">
                  Gửi yêu cầu định giá xe cũ
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar - Loan Calculator & Action Buttons */}
        <div className="space-y-6">
          <Card className="sticky top-20 shadow-md">
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calculator className="h-5 w-5 text-primary" />
                Ước tính trả góp Ngân hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div>
                <div className="flex justify-between text-sm mb-1 font-medium">
                  <span>Tỷ lệ vay ({loanPercent}%)</span>
                  <span className="text-primary">{formatVND(loanAmount)}</span>
                </div>
                <Input
                  type="range"
                  min="10"
                  max="80"
                  value={loanPercent}
                  onChange={(e) => setLoanPercent(Number(e.target.value))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Thời hạn vay</Label>
                <Select
                  value={String(loanTermYears)}
                  onValueChange={(v) => setLoanTermYears(Number(v))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y} năm ({y * 12} tháng)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Giá lăn bánh ước tính</span>
                  <span className="font-semibold">{formatVND(grandTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Trả trước tối thiểu ({100 - loanPercent}%)</span>
                  <span className="font-semibold">{formatVND(grandTotal - loanAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lãi suất ưu đãi</span>
                  <span className="font-semibold text-emerald-600">{interestRate}%/năm cố định</span>
                </div>
                <Separator />
                <div className="flex justify-between items-baseline font-bold text-lg pt-1">
                  <span>Gốc + Lãi/tháng</span>
                  <span className="text-2xl text-primary">{formatVND(Math.round(monthlyPayment))}</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2.5 pt-2">
                <Link href={`/test-drive?variant_id=${vehicle.id}`}>
                  <Button variant="outline" className="w-full h-11 text-sm font-medium">
                    <Calendar className="h-4 w-4 mr-2" />
                    🗓️ Đặt lịch lái thử xe
                  </Button>
                </Link>
                <Link href={`/checkout?${checkoutQuery}`}>
                  <Button
                    className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20"
                    disabled={!selectedQuota || selectedQuota.quota <= 0}
                  >
                    💳 Đặt cọc giữ xe ({formatVND(vehicle.minDepositAmount)})
                  </Button>
                </Link>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Hoàn cọc 100% nếu ngân hàng từ chối vay</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
