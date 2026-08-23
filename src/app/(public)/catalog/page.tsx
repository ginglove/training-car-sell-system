/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, RotateCcw, ShieldCheck, Lock, Settings, UserCheck, Calendar, Sparkles, Filter, ChevronLeft, ChevronRight, Store } from "lucide-react";
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

const BRANDS = ["Toyota", "Honda", "Hyundai", "Kia", "Ford", "Mazda"];
const BODY_TYPES = [
  { id: "Sedan", label: "Sedan" },
  { id: "SUV", label: "SUV" },
  { id: "Pickup", label: "Pickup" },
  { id: "CUV", label: "CUV" },
  { id: "Hatchback", label: "Hatchback" },
];

function CatalogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || "GUEST";

  const [vehicles, setVehicles] = useState<VehicleVariant[]>([]);
  const [showrooms, setShowrooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state exactly matching Wireframe sidebar
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [bodyType, setBodyType] = useState(searchParams.get("bodyType") || "all");
  const [priceMin, setPriceMin] = useState<number>(500000000); // 500M
  const [priceMax, setPriceMax] = useState<number>(2000000000); // 2B
  const [selectedShowroom, setSelectedShowroom] = useState<string>("all");

  const [purpose, setPurpose] = useState(searchParams.get("purpose") || "all");
  const [sort, setSort] = useState(searchParams.get("sort") || "price-asc");
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [holdVinSuccess, setHoldVinSuccess] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    fetch("/api/v1/showrooms")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setShowrooms(data.data || []);
      })
      .catch(() => {});
  }, []);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (bodyType !== "all") params.set("bodyType", bodyType);
    if (purpose !== "all") params.set("purpose", purpose);
    if (search) params.set("search", search);
    if (sort) params.set("sort", sort);

    try {
      const res = await fetch(`/api/v1/catalog/models?${params}`);
      const data = await res.json();
      if (data.success) {
        let list = data.data as VehicleVariant[];

        // Filter by Brands checkbox
        if (selectedBrands.length > 0) {
          list = list.filter((v) => selectedBrands.includes(v.brandName));
        }

        // Filter by Price Range Slider/Inputs
        list = list.filter((v) => v.listedPrice >= priceMin && v.listedPrice <= priceMax);

        // Sort
        if (sort === "price-asc") list = [...list].sort((a, b) => a.listedPrice - b.listedPrice);
        if (sort === "price-desc") list = [...list].sort((a, b) => b.listedPrice - a.listedPrice);
        if (sort === "quota-desc") list = [...list].sort((a, b) => b.availableQuota - a.availableQuota);

        setVehicles(list);
        setCurrentPage(1);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }, [bodyType, purpose, search, sort, selectedBrands, priceMin, priceMax]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  function handleBrandToggle(brand: string) {
    if (selectedBrands.includes(brand)) {
      setSelectedBrands(selectedBrands.filter((b) => b !== brand));
    } else {
      setSelectedBrands([...selectedBrands, brand]);
    }
  }

  function handleResetFilters() {
    setSelectedBrands([]);
    setBodyType("all");
    setPriceMin(500000000);
    setPriceMax(2000000000);
    setSelectedShowroom("all");
    setPurpose("all");
    setSort("price-asc");
    setSearch("");
  }

  function handleHoldVin(variantName: string) {
    setHoldVinSuccess(`Đã giữ chỗ Soft-lock (Hold VIN 24h) thành công cho phiên bản ${variantName}! Code: VIN-HOLD-24H`);
    setTimeout(() => setHoldVinSuccess(null), 3500);
  }

  // Pagination calculations
  const totalPages = Math.ceil(vehicles.length / itemsPerPage) || 1;
  const paginatedVehicles = vehicles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="container py-6 space-y-6">
      {holdVinSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2 animate-in fade-in">
          <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>{holdVinSuccess}</span>
        </div>
      )}

      {/* Main 2-Column Wireframe Layout: Sidebar (BỘ LỌC) Left + Content Right */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* ================= LEFT SIDEBAR: BỘ LỌC ================= */}
        <div className="lg:col-span-1 space-y-6 bg-slate-50 dark:bg-slate-900/60 p-5 rounded-2xl border h-fit shadow-sm">
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="font-bold text-lg flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <Filter className="h-5 w-5 text-primary" />
              BỘ LỌC
            </h2>
            <button
              onClick={handleResetFilters}
              className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
            >
              <RotateCcw className="h-3 w-3" /> Đặt lại
            </button>
          </div>

          {/* 1. Hãng xe (Checkboxes) */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Hãng xe</h3>
            <div className="space-y-2">
              {BRANDS.map((brand) => (
                <label key={brand} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(brand)}
                    onChange={() => handleBrandToggle(brand)}
                    className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                  />
                  <span>{brand}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 2. Phân khúc / Kiểu xe (Radio options) */}
          <div className="space-y-2.5 border-t pt-4">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Phân khúc / Kiểu xe</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                <input
                  type="radio"
                  name="bodyType"
                  checked={bodyType === "all"}
                  onChange={() => setBodyType("all")}
                  className="h-4 w-4 text-primary focus:ring-primary cursor-pointer"
                />
                <span>Tất cả kiểu xe</span>
              </label>
              {BODY_TYPES.map((bt) => (
                <label key={bt.id} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="bodyType"
                    checked={bodyType === bt.id}
                    onChange={() => setBodyType(bt.id)}
                    className="h-4 w-4 text-primary focus:ring-primary cursor-pointer"
                  />
                  <span>{bt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 3. Khoảng giá (Range Slider & Inputs 500M - 2B) */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Khoảng giá</h3>
              <span className="text-[11px] font-semibold text-primary font-mono">
                {(priceMin / 1000000000).toFixed(1)}B - {(priceMax / 1000000000).toFixed(1)}B
              </span>
            </div>
            <input
              type="range"
              min={300000000}
              max={3000000000}
              step={50000000}
              value={priceMax}
              onChange={(e) => setPriceMax(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>500M</span>
              <span className="flex-1 text-center font-mono">500M - 2B</span>
              <span>2B+</span>
            </div>
          </div>

          {/* 4. Showroom Picker */}
          <div className="space-y-2 border-t pt-4">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1">
              <Store className="h-3.5 w-3.5" /> Showroom
            </h3>
            <select
              value={selectedShowroom}
              onChange={(e) => setSelectedShowroom(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">[Chọn Showroom ▾]</option>
              {showrooms.map((sr) => (
                <option key={sr.id} value={sr.id}>
                  {sr.name} ({sr.city || "Việt Nam"})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ================= RIGHT MAIN CONTENT ================= */}
        <div className="lg:col-span-3 space-y-6">
          {/* Top Bar: Kết quả count + Sắp xếp Dropdown */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border shadow-sm">
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Kết quả: <span className="text-primary font-bold">{vehicles.length} xe</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm từ khóa xe..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 text-xs"
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Sắp xếp:</span>
                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger className="w-[140px] h-9 text-xs">
                    <SelectValue placeholder="Giá ▾" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="price-asc">Giá 🠅 (Thấp - Cao)</SelectItem>
                    <SelectItem value="price-desc">Giá 🠇 (Cao - Thấp)</SelectItem>
                    <SelectItem value="quota-desc">Tồn kho nhiều nhất</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Vehicle Grid (3 Columns matching Wireframe) */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-44 bg-muted rounded-t-lg" />
                  <CardContent className="p-4 space-y-3">
                    <div className="h-5 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                    <div className="h-8 bg-muted rounded w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : paginatedVehicles.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 dark:bg-slate-900 rounded-2xl border">
              <h3 className="text-lg font-bold mb-1">Không tìm thấy xe phù hợp (Mã lỗi: ERR_UI_010)</h3>
              <p className="text-xs text-muted-foreground mb-4">Vui lòng thay đổi từ khóa hoặc đặt lại bộ lọc để tìm kiếm lại</p>
              <Button variant="outline" size="sm" onClick={handleResetFilters}>
                <RotateCcw className="h-4 w-4 mr-2" /> Đặt Lại Bộ Lọc
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {paginatedVehicles.map((vehicle) => (
                <Card key={vehicle.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 border flex flex-col justify-between group">
                  <div>
                    {/* Thumbnail Image [img] */}
                    <Link href={`/catalog/${vehicle.id}`}>
                      <div className="h-44 relative overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
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
                          <div className="text-slate-400 font-mono text-sm">[img]</div>
                        )}
                        <div className="absolute top-2 right-2">
                          <Badge variant={vehicle.availableQuota > 0 ? "default" : "destructive"} className="text-[9px] px-1.5 py-0.5">
                            {vehicle.availableQuota > 0 ? `Còn ${vehicle.availableQuota} xe` : "Hết xe"}
                          </Badge>
                        </div>
                      </div>
                    </Link>

                    {/* Content: Brand, Model, Variant, Price */}
                    <CardContent className="p-4 space-y-2">
                      <div>
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{vehicle.brandName}</p>
                        <Link href={`/catalog/${vehicle.id}`}>
                          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors line-clamp-1">
                            {vehicle.modelName} {vehicle.variantName}
                          </h3>
                        </Link>
                      </div>

                      <div className="text-lg font-black text-primary font-mono">
                        {formatVND(vehicle.listedPrice)}
                      </div>
                    </CardContent>
                  </div>

                  {/* Actions: [Xem chi tiết] */}
                  <div className="p-4 pt-0 space-y-2">
                    <Link href={`/catalog/${vehicle.id}`} className="w-full block">
                      <Button variant="outline" className="w-full text-xs font-semibold h-9 border-primary/40 text-primary hover:bg-primary/5">
                        [Xem chi tiết]
                      </Button>
                    </Link>

                    {/* Role-based Secondary Action */}
                    {userRole === "MANAGER" && (
                      <Button size="sm" variant="ghost" className="w-full text-[11px] text-purple-700 h-7" onClick={() => handleHoldVin(vehicle.variantName)}>
                        <Lock className="h-3 w-3 mr-1" /> Hold VIN 24h
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Wireframe Pagination Bar: ← Trang 1 / 3 → */}
          {vehicles.length > 0 && (
            <div className="flex items-center justify-center gap-4 border-t pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="text-xs"
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Trước
              </Button>
              <span className="text-sm font-semibold font-mono">
                ← Trang {currentPage} / {totalPages} →
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="text-xs"
              >
                Sau <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}

          {/* Wireframe Bottom Quiz: 🎯 Quiz: Xe phù hợp với nhu cầu của bạn? */}
          <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-900">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
                <Sparkles className="h-4 w-4 text-amber-600" />
                <span>🎯 Quiz: Xe phù hợp với nhu cầu của bạn?</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "FAMILY", label: "🏠 Gia đình" },
                  { id: "HIGHWAY", label: "🏃 Thể thao" },
                  { id: "CITY", label: "💼 Kinh doanh" },
                  { id: "BUDGET", label: "🌱 Eco" },
                ].map((item) => (
                  <Button
                    key={item.id}
                    variant={purpose === item.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPurpose(purpose === item.id ? "all" : item.id)}
                    className="text-xs font-medium rounded-lg"
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={
      <div className="container py-16 text-center space-y-4 animate-pulse">
        <p className="text-sm font-medium text-muted-foreground">Đang tải danh mục xe ô tô...</p>
      </div>
    }>
      <CatalogContent />
    </Suspense>
  );
}
