"use client";

import { useState, useEffect } from "react";
import { Truck, ArrowRight, AlertTriangle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatVND } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  REQUESTED: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-blue-100 text-blue-800",
  IN_TRANSIT: "bg-indigo-100 text-indigo-800",
  RECEIVED: "bg-green-100 text-green-800",
  TRANSIT_DAMAGED: "bg-red-100 text-red-800",
  REJECTED: "bg-gray-100 text-gray-800",
  CANCELED: "bg-gray-100 text-gray-800",
};

const STATUS_LABELS: Record<string, string> = {
  REQUESTED: "Đã yêu cầu",
  APPROVED: "Đã duyệt",
  IN_TRANSIT: "Đang vận chuyển",
  RECEIVED: "Đã nhận",
  TRANSIT_DAMAGED: "Hư hại khi vận chuyển",
  REJECTED: "Từ chối",
  CANCELED: "Đã hủy",
};

export default function TransfersPage() {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [showrooms, setShowrooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [damageDialogOpen, setDamageDialogOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<any>(null);
  const [damageNotes, setDamageNotes] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [transfersRes, showroomsRes] = await Promise.all([
        fetch("/api/v1/inventory/transfers"),
        fetch("/api/v1/showrooms"),
      ]);
      const transfersData = await transfersRes.json();
      const showroomsData = await showroomsRes.json();
      if (transfersData.success) setTransfers(transfersData.data || []);
      if (showroomsData.success) setShowrooms(showroomsData.data || []);
    } catch {
      // Error handling
    } finally {
      setLoading(false);
    }
  }

  async function handleDamageReport() {
    if (!selectedTransfer || !damageNotes) return;
    try {
      await fetch(`/api/v1/inventory/transfers/${selectedTransfer.id}/damage-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ damageNotes }),
      });
      fetchData();
      setDamageDialogOpen(false);
      setDamageNotes("");
    } catch {
      // Error handling
    }
  }

  function getShowroomName(id: string) {
    return showrooms.find((s) => s.id === id)?.name || id;
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Truck className="h-6 w-6" />
          Điều Chuyển Kho Vùng
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Đang chờ duyệt</p>
            <p className="text-2xl font-bold text-yellow-600">
              {transfers.filter((t) => t.status === "REQUESTED").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Đang vận chuyển</p>
            <p className="text-2xl font-bold text-indigo-600">
              {transfers.filter((t) => t.status === "IN_TRANSIT").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Đã nhận</p>
            <p className="text-2xl font-bold text-green-600">
              {transfers.filter((t) => t.status === "RECEIVED").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Hư hại</p>
            <p className="text-2xl font-bold text-red-600">
              {transfers.filter((t) => t.status === "TRANSIT_DAMAGED").length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transfers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Danh sách điều chuyển</CardTitle>
        </CardHeader>
        <CardContent>
          {transfers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Chưa có yêu cầu điều chuyển nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">Mã chuyển</th>
                    <th className="text-left py-3 px-2">VIN</th>
                    <th className="text-left py-3 px-2">Từ</th>
                    <th className="text-left py-3 px-2"></th>
                    <th className="text-left py-3 px-2">Đến</th>
                    <th className="text-right py-3 px-2">Phí vận chuyển</th>
                    <th className="text-left py-3 px-2">Trạng thái</th>
                    <th className="text-right py-3 px-2">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {transfers.map((transfer) => (
                    <tr key={transfer.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-2 font-mono text-xs">{transfer.transferCode}</td>
                      <td className="py-3 px-2 font-mono text-xs">{transfer.vinNumber}</td>
                      <td className="py-3 px-2 text-xs">{getShowroomName(transfer.fromShowroomId)}</td>
                      <td className="py-1 px-1">
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </td>
                      <td className="py-3 px-2 text-xs">{getShowroomName(transfer.toShowroomId)}</td>
                      <td className="py-3 px-2 text-right">{formatVND(transfer.logisticsFee)}</td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[transfer.status]}`}>
                          {STATUS_LABELS[transfer.status]}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        {transfer.status === "IN_TRANSIT" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600"
                            onClick={() => {
                              setSelectedTransfer(transfer);
                              setDamageDialogOpen(true);
                            }}
                          >
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Báo hư hại
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Damage Report Dialog */}
      <Dialog open={damageDialogOpen} onOpenChange={setDamageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Báo cáo hư hại vận chuyển</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">VIN</p>
              <p className="font-mono">{selectedTransfer?.vinNumber}</p>
            </div>
            <div className="space-y-2">
              <Label>Mô tả hư hại</Label>
              <textarea
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Mô tả chi tiết tình trạng hư hại..."
                value={damageNotes}
                onChange={(e) => setDamageNotes(e.target.value)}
              />
            </div>
            <Button onClick={handleDamageReport} className="w-full" variant="destructive">
              <AlertTriangle className="h-4 w-4 mr-1" />
              Gửi báo cáo hư hại
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
