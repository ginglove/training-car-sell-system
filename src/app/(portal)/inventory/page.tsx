"use client";

import { useState, useEffect, useCallback } from "react";
import { Warehouse, Lock, Clock, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Vehicle {
  vinNumber: string;
  engineNumber: string;
  variantName: string;
  color: string;
  manufacturingYear: number;
  originType: string;
  status: string;
  lockedUntil: string | null;
  showroomName: string;
}

const STATUS_BADGES: Record<string, { label: string; variant: any }> = {
  AVAILABLE: { label: "San sang", variant: "success" },
  LOCKED: { label: "Da khoa", variant: "warning" },
  RESERVED: { label: "Da giu", variant: "default" },
  SOLD: { label: "Da ban", variant: "secondary" },
  TRANSFERRING: { label: "Dang chuyen", variant: "outline" },
};

export default function InventoryPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [holdDialog, setHoldDialog] = useState(false);
  const [holdVin, setHoldVin] = useState("");
  const [holdPhone, setHoldPhone] = useState("");
  const [holdName, setHoldName] = useState("");
  const [holdReason, setHoldReason] = useState("");

  const fetchVehicles = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search) params.set("search", search);
      const res = await fetch(`/api/v1/inventory/vehicles?${params}`);
      const data = await res.json();
      if (data.success) setVehicles(data.data);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  async function handleHoldVIN() {
    const res = await fetch("/api/v1/inventory/manual-vin-hold", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vinNumber: holdVin,
        customerPhone: holdPhone,
        customerName: holdName,
        holdReason: holdReason,
      }),
    });
    const data = await res.json();
    if (data.success) {
      setHoldDialog(false);
      fetchVehicles();
    }
  }

  function getRemainingTime(lockedUntil: string | null) {
    if (!lockedUntil) return null;
    const diff = new Date(lockedUntil).getTime() - Date.now();
    if (diff <= 0) return "Het han";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h${mins}m`;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Warehouse className="h-6 w-6" />
          Kho xe & Quota
        </h1>
        <Dialog open={holdDialog} onOpenChange={setHoldDialog}>
          <DialogTrigger asChild>
            <Button>
              <Lock className="h-4 w-4 mr-2" />
              Hold VIN 24h
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Khoa VIN 24h</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>So VIN</Label>
                <Input value={holdVin} onChange={(e) => setHoldVin(e.target.value)} placeholder="VF8US998822001122" />
              </div>
              <div className="space-y-2">
                <Label>SDT Khach hang</Label>
                <Input value={holdPhone} onChange={(e) => setHoldPhone(e.target.value)} placeholder="0912345678" />
              </div>
              <div className="space-y-2">
                <Label>Ten khach hang</Label>
                <Input value={holdName} onChange={(e) => setHoldName(e.target.value)} placeholder="Nguyen Van A" />
              </div>
              <div className="space-y-2">
                <Label>Ly do</Label>
                <Input value={holdReason} onChange={(e) => setHoldReason(e.target.value)} placeholder="Khach hang dang xem xe" />
              </div>
              <Button onClick={handleHoldVIN} className="w-full">Xac nhan Hold VIN</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tim VIN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchVehicles()}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Trang thai" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tat ca</SelectItem>
            <SelectItem value="AVAILABLE">San sang</SelectItem>
            <SelectItem value="LOCKED">Da khoa</SelectItem>
            <SelectItem value="RESERVED">Da giu</SelectItem>
            <SelectItem value="SOLD">Da ban</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-3 text-left font-medium">So VIN</th>
                  <th className="p-3 text-left font-medium">Dong xe</th>
                  <th className="p-3 text-left font-medium">Mau</th>
                  <th className="p-3 text-left font-medium">Nam</th>
                  <th className="p-3 text-left font-medium">Nguon</th>
                  <th className="p-3 text-left font-medium">Trang thai</th>
                  <th className="p-3 text-left font-medium">Thao tac</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => {
                  const statusInfo = STATUS_BADGES[v.status] || STATUS_BADGES.AVAILABLE;
                  const remaining = getRemainingTime(v.lockedUntil);
                  return (
                    <tr key={v.vinNumber} className="border-b hover:bg-muted/30">
                      <td className="p-3 font-mono text-xs">{v.vinNumber}</td>
                      <td className="p-3">{v.variantName}</td>
                      <td className="p-3">{v.color}</td>
                      <td className="p-3">{v.manufacturingYear}</td>
                      <td className="p-3">{v.originType}</td>
                      <td className="p-3">
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                        {remaining && v.status === "LOCKED" && (
                          <span className="text-xs text-muted-foreground ml-2">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {remaining}
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        {v.status === "AVAILABLE" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setHoldVin(v.vinNumber);
                              setHoldDialog(true);
                            }}
                          >
                            Hold 24h
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
