/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, Car, Fuel, RotateCcw, ShieldCheck, Lock, Settings, UserCheck, Calendar, Sparkles, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatVND } from "@/lib/utils";

interface VehicleVariant {
  id: string;
  variantName: string;
  listedPrice: number;
  modelName: string;
  brandName: string;
  bodyType: string;
  availableQuota: number;
  colors: string[];
  thumbnailUrl: string | null;
}

function CatalogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || "GUEST";

  const [vehicles, setVehicles] = useState<VehicleVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [bodyType, setBodyType] = useState(searchParams.get("bodyType") || "all");
  const [priceRange, setPriceRange] = useState(searchParams.get("priceRange") || "all");
  const [purpose, setPurpose] = useState(searchParams.get("purpose") || "all");
  const [sort, setSort] = useState(searchParams.get("sort") || "recommended");
  const [holdVinSuccess, setHoldVinSuccess] = useState<string | null>(null);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (bodyType !== "all") params.set("bodyType", bodyType);
    if (priceRange !== "all") params.set("priceRange", priceRange);
    if (purpose !== "all") params.set("purpose", purpose);
    if (search) params.set("search", search);
    if (sort !== "recommended") params.set("sort", sort);

    try {
      const res = await fetch(`/api/v1/catalog/models?${params}`);
      const data = await res.json();
      if (data.success) {
        let list = data.data as VehicleVariant[];
        if (sort === "price-asc") list = [...list].sort((a, b) => a.listedPrice - b.listedPrice);
        if (sort === "price-desc") list = [...list].sort((a, b) => b.listedPrice - a.listedPrice);
        if (sort === "quota-desc") list = [...list].sort((a, b) => b.availableQuota - a.availableQuota);
        setVehicles(list);
      }
    } catch {
      // error fallback
    } finally {
      setLoading(false);
    }
  }, [bodyType, priceRange, purpose, search, sort]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  function handleResetFilters() {
    setSearch("");
    setBodyType("all");
    setPriceRange("all");
    setPurpose("all");
    setSort("recommended");
  }

  function handleHoldVin(variantName: string) {
    setHoldVinSuccess(`Đã giữ chỗ Soft-lock (Hold VIN 24h) thành công cho phiên bản ${variantName}! Code: VIN-HOLD-24H`);
    setTimeout(() => setHoldVinSuccess(null), 3500);
  }

  return (
    <div className="container py-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Car className="h-8 w-8 text-primary" />
            Khám Phá Danh Mục Xe Ô Tô (SCR-01)
          </h1>
          <p className="text-slate-300 text-sm mt-1">
            Tra cứu thông số, ước tính chi phí trả góp và tồn kho sẵn có theo thời gian thực
          </p>
        </div>
        {userRole !== "GUEST" && (
          <Badge className="self-start md:self-auto bg-primary/20 text-primary-foreground border border-primary/40 text-xs px-3 py-1.5 font-bold">
            Quyền Truy Cập: {userRole}
          </Badge>
        )}
      </div>

      {holdVinSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2 animate-in fade-in">
          <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>{holdVinSuccess}</span>
        </div>
      )}

      {/* Smart Quiz / Lifestyle Quick Filter Pills */}
      <Card className="bg-slate-50 dark:bg-slate-900 border shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>🎯 BỘ LỌC NHU CẦU LIFE-STYLE (SMART QUIZ):</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { id: "all", label: "Tất Cả Nhu Cầu" },
              { id: "FAMILY", label: "👨‍👩‍👧‍👦 Gia Đình Rộng Rãi" },
              { id: "CITY", label: "🏙️ Đi Phố Tiết Kiệm Xăng" },
              { id: "HIGHWAY", label: "🛣️ Đường Trường Vận Hành Mạnh" },
              { id: "BUDGET", label: "💰 Ngân Sách < 1 Tỷ" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (purpose === item.id) {
                    setPurpose("all");
                    if (item.id === "BUDGET") setPriceRange("all");
                  } else {
                    setPurpose(item.id);
                    if (item.id === "BUDGET") setPriceRange("under1000");
                  }
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                  purpose === item.id
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-white dark:bg-slate-800 hover:border-primary border-slate-200 dark:border-slate-700"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Advanced Filters Control Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border shadow-sm">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 mr-1">
          <Filter className="h-4 w-4 text-primary" />
          <span>Bộ Lọc:</span>
        </div>

        <Select value={bodyType} onValueChange={setBodyType}>
          <SelectTrigger className="w-[150px] h-9 text-xs">
            <SelectValue placeholder="Kiểu xe (Body)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả Kiểu xe</SelectItem>
            <SelectItem value="Sedan">Sedan</SelectItem>
            <SelectItem value="SUV">SUV</SelectItem>
            <SelectItem value="CUV">CUV</SelectItem>
            <SelectItem value="Hatchback">Hatchback</SelectItem>
            <SelectItem value="Pickup">Pickup</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priceRange} onValueChange={setPriceRange}>
          <SelectTrigger className="w-[170px] h-9 text-xs">
            <SelectValue placeholder="Khoảng giá" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả mức giá</SelectItem>
            <SelectItem value="under500">Dưới 500 Triệu</SelectItem>
            <SelectItem value="under1000">Dưới 1 Tỷ</SelectItem>
            <SelectItem value="500to1000">500 Triệu - 1 Tỷ</SelectItem>
            <SelectItem value="1000to1500">1 Tỷ - 1.5 Tỷ</SelectItem>
            <SelectItem value="above1500">Trên 1.5 Tỷ</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-[170px] h-9 text-xs">
            <SelectValue placeholder="Sắp xếp" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recommended">Phù hợp nhất</SelectItem>
            <SelectItem value="price-asc">Giá tăng dần</SelectItem>
            <SelectItem value="price-desc">Giá giảm dần</SelectItem>
            <SelectItem value="quota-desc">Tồn kho nhiều nhất</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm dòng xe, phiên bản..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchVehicles()}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <Button variant="outline" size="sm" onClick={handleResetFilters} className="h-9 text-xs">
          <RotateCcw className="h-3.5 w-3.5 mr-1" />
          Đặt Lại
        </Button>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <span>Tìm thấy <strong>{vehicles.length}</strong> sản phẩm phù hợp</span>
        {userRole === "SALE" && <span className="text-blue-600 font-semibold">Chế độ Sale: Có thể tạo đơn cọc hộ khách hàng</span>}
        {userRole === "MANAGER" && <span className="text-purple-600 font-semibold">Chế độ Manager: Quyền Hold VIN 24h & Giám sát Gross Margin</span>}
        {userRole === "ADMIN" && <span className="text-amber-600 font-semibold">Chế độ Admin: Quản trị Quota & Niêm Yết Giá</span>}
      </div>

      {/* Vehicle Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-muted rounded-t-lg" />
              <CardContent className="p-4 space-y-3">
                <div className="h-5 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-8 bg-muted rounded w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : vehicles.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 dark:bg-slate-900 rounded-2xl border">
          <Car className="h-16 w-16 mx-auto mb-4 text-muted-foreground/40" />
          <h3 className="text-lg font-bold mb-1">Không tìm thấy xe phù hợp (Mã lỗi: ERR_UI_010)</h3>
          <p className="text-xs text-muted-foreground mb-4">Vui lòng thay đổi từ khóa hoặc đặt lại bộ lọc để tìm kiếm lại</p>
          <Button variant="outline" size="sm" onClick={handleResetFilters}>
            <RotateCcw className="h-4 w-4 mr-2" /> Đặt Lại Bộ Lọc
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((vehicle) => (
            <Card key={vehicle.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col justify-between border group">
              <div>
                {/* Thumbnail Image */}
                <Link href={`/catalog/${vehicle.id}`}>
                  <div className="h-52 relative overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    {vehicle.thumbnailUrl ? (
                      <img
                        src={vehicle.thumbnailUrl}
                        alt={`${vehicle.brandName} ${vehicle.modelName}`}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80";
                        }}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <Car className="h-20 w-20 text-muted-foreground/30" />
                    )}
                    <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
                      <Badge variant={vehicle.availableQuota > 0 ? "default" : "destructive"} className="text-[10px] font-bold px-2 py-0.5 shadow">
                        {vehicle.availableQuota > 0 ? `🟢 Còn ${vehicle.availableQuota} xe giao ngay` : "🔴 Hết hàng giao ngay"}
                      </Badge>
                    </div>
                  </div>
                </Link>

                <CardContent className="p-5 space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{vehicle.brandName} • {vehicle.bodyType}</span>
                      {userRole === "MANAGER" && (
                        <span className="text-[10px] bg-purple-100 text-purple-700 font-bold px-1.5 py-0.5 rounded">Margin: 8.5%</span>
                      )}
                    </div>
                    <Link href={`/catalog/${vehicle.id}`}>
                      <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">
                        {vehicle.brandName} {vehicle.modelName}
                      </h3>
                    </Link>
                    <p className="text-xs text-muted-foreground font-medium">{vehicle.variantName}</p>
                  </div>

                  {/* Pricing & Prepay Estimation */}
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border space-y-1">
                    <div className="text-xs text-muted-foreground">Giá niêm yết:</div>
                    <div className="text-xl font-black text-primary">
                      {formatVND(vehicle.listedPrice)}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium pt-0.5">
                      💡 Ước tính trả góp từ: <strong className="text-slate-800 dark:text-slate-200">{formatVND(Math.round(vehicle.listedPrice * 0.2))}</strong> (20%)
                    </div>
                  </div>
                </CardContent>
              </div>

              {/* ROLE-BASED CARD ACTIONS */}
              <div className="p-4 pt-0 space-y-2 border-t mt-2">
                {/* ROLE: CUSTOMER / GUEST */}
                {(userRole === "GUEST" || userRole === "CUSTOMER") && (
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => router.push(`/test-drive?variant_id=${vehicle.id}`)}>
                      <Calendar className="h-3.5 w-3.5 mr-1" /> Lái Thử
                    </Button>
                    <Button size="sm" onClick={() => router.push(`/checkout?variant_id=${vehicle.id}`)}>
                      Đặt Cọc Ngay
                    </Button>
                  </div>
                )}

                {/* ROLE: SALE */}
                {userRole === "SALE" && (
                  <div className="space-y-2 pt-2">
                    <div className="text-[11px] text-slate-600 flex items-center justify-between font-medium">
                      <span>Tồn kho khả dụng: <strong>{vehicle.availableQuota} xe</strong></span>
                      <Badge variant="outline" className="text-[9px]">Sale Mode</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" onClick={() => router.push(`/test-drive?variant_id=${vehicle.id}`)}>
                        <Calendar className="h-3.5 w-3.5 mr-1" /> Đặt Lái Thử
                      </Button>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => router.push(`/checkout?variant_id=${vehicle.id}&mode=sale`)}>
                        <UserCheck className="h-3.5 w-3.5 mr-1" /> Tạo Đơn Cọc Hộ
                      </Button>
                    </div>
                  </div>
                )}

                {/* ROLE: MANAGER */}
                {userRole === "MANAGER" && (
                  <div className="space-y-2 pt-2">
                    <div className="text-[11px] text-purple-700 flex items-center justify-between font-medium">
                      <span>Chi nhánh Quota: <strong>{vehicle.availableQuota} xe</strong></span>
                      <span className="text-[10px]">Trần giảm: 30Tr</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" className="border-purple-300 text-purple-700 hover:bg-purple-50" onClick={() => handleHoldVin(vehicle.variantName)}>
                        <Lock className="h-3.5 w-3.5 mr-1" /> Hold VIN 24h
                      </Button>
                      <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => router.push(`/checkout?variant_id=${vehicle.id}&mode=manager`)}>
                        <UserCheck className="h-3.5 w-3.5 mr-1" /> Đặt Cọc Hộ
                      </Button>
                    </div>
                  </div>
                )}

                {/* ROLE: ADMIN */}
                {userRole === "ADMIN" && (
                  <div className="space-y-2 pt-2">
                    <div className="text-[11px] text-amber-700 flex items-center justify-between font-semibold">
                      <span>Quota Toàn Quốc: <strong>{vehicle.availableQuota} xe</strong></span>
                      <Badge variant="outline" className="text-[9px]">Admin System</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" onClick={() => router.push(`/inventory`)}>
                        <Settings className="h-3.5 w-3.5 mr-1" /> Quản Lý Quota
                      </Button>
                      <Button size="sm" className="bg-slate-900 text-white" onClick={() => router.push(`/checkout?variant_id=${vehicle.id}`)}>
                        Đặt Cọc Xe
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={
      <div className="container py-16 text-center space-y-4 animate-pulse">
        <Car className="h-12 w-12 mx-auto text-muted-foreground/40" />
        <p className="text-sm font-medium text-muted-foreground">Đang tải danh mục xe ô tô...</p>
      </div>
    }>
      <CatalogContent />
    </Suspense>
  );
}
