/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, Car, Fuel, Calendar } from "lucide-react";
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

export default function CatalogPage() {
  const [vehicles, setVehicles] = useState<VehicleVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [bodyType, setBodyType] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [purpose, setPurpose] = useState("all");

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (bodyType !== "all") params.set("bodyType", bodyType);
    if (priceRange !== "all") params.set("priceRange", priceRange);
    if (purpose !== "all") params.set("purpose", purpose);
    if (search) params.set("search", search);

    try {
      const res = await fetch(`/api/v1/catalog/models?${params}`);
      const data = await res.json();
      if (data.success) setVehicles(data.data);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  }, [bodyType, priceRange, purpose, search]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  return (
    <div className="container py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Danh muc xe o to</h1>
        <p className="text-muted-foreground">
          Kham pha cac dong xe phu hop voi nhu cau cua ban
        </p>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <Select value={purpose} onValueChange={setPurpose}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Nhu cau su dung" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tat ca nhu cau</SelectItem>
            <SelectItem value="FAMILY">Gia dinh rong rai</SelectItem>
            <SelectItem value="CITY">Di pho tiet kiem</SelectItem>
            <SelectItem value="HIGHWAY">Duong truong manh me</SelectItem>
          </SelectContent>
        </Select>

        <Select value={bodyType} onValueChange={setBodyType}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Kieu xe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tat ca</SelectItem>
            <SelectItem value="Sedan">Sedan</SelectItem>
            <SelectItem value="SUV">SUV</SelectItem>
            <SelectItem value="CUV">CUV</SelectItem>
            <SelectItem value="Hatchback">Hatchback</SelectItem>
            <SelectItem value="Pickup">Pickup</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priceRange} onValueChange={setPriceRange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Khoang gia" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tat ca muc gia</SelectItem>
            <SelectItem value="under500">Duoi 500 trieu</SelectItem>
            <SelectItem value="500to1000">500 trieu - 1 ty</SelectItem>
            <SelectItem value="1000to1500">1 ty - 1.5 ty</SelectItem>
            <SelectItem value="above1500">Tren 1.5 ty</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tim kiem theo ten xe..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchVehicles()}
            className="pl-9"
          />
        </div>

        <Button variant="outline" onClick={fetchVehicles}>
          <SlidersHorizontal className="h-4 w-4 mr-1" />
          Loc
        </Button>
      </div>

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
        <div className="text-center py-16">
          <Car className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Khong tim thay xe phu hop</h3>
          <p className="text-muted-foreground">Hay thu thay doi bo loc de tim kiem lai</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((vehicle) => (
            <Link key={vehicle.id} href={`/catalog/${vehicle.id}`}>
              <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
                <div className="h-48 relative overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  {vehicle.thumbnailUrl ? (
                    <img
                      src={vehicle.thumbnailUrl}
                      alt={`${vehicle.brandName} ${vehicle.modelName}`}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <Car className="h-20 w-20 text-muted-foreground/30" />
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {vehicle.brandName} {vehicle.modelName}
                      </h3>
                      <p className="text-sm text-muted-foreground">{vehicle.variantName}</p>
                    </div>
                    <Badge variant={vehicle.availableQuota > 0 ? "success" : "destructive"}>
                      {vehicle.availableQuota > 0
                        ? `Con ${vehicle.availableQuota} xe`
                        : "Het hang"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                    <span className="flex items-center gap-1">
                      <Fuel className="h-3 w-3" /> {vehicle.bodyType}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold text-primary">
                      {formatVND(vehicle.listedPrice)}
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        Lai thu
                      </Button>
                      <Button size="sm">Dat coc</Button>
                    </div>
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
