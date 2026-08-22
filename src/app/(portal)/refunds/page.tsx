"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { FileText, Check, X, AlertTriangle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatVND } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  PENDING_MANAGER: "bg-yellow-100 text-yellow-800",
  PENDING_ADMIN: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Nháp",
  PENDING_MANAGER: "Chờ Manager duyệt",
  PENDING_ADMIN: "Chờ Admin duyệt",
  COMPLETED: "Đã hoàn tiền",
  REJECTED: "Từ chối",
};

export default function RefundsPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const [refunds, setRefunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRefund, setSelectedRefund] = useState<any>(null);
  const [overrideReason, setOverrideReason] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchRefunds();
  }, []);

  async function fetchRefunds() {
    try {
      const res = await fetch("/api/v1/refunds/request");
      const data = await res.json();
      if (data.success) setRefunds(data.data || []);
    } catch {
      // API might not support GET yet, use empty
      setRefunds([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDecision(refundId: string, decision: "APPROVED" | "REJECTED") {
    setProcessing(true);
    try {
      const res = await fetch(`/api/v1/refunds/${refundId}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, managerOverrideReason: overrideReason }),
      });
      const data = await res.json();
      if (data.success) {
        fetchRefunds();
        setSelectedRefund(null);
        setOverrideReason("");
      }
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6" />
          Duyệt Hoàn Cọc
        </h1>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {role === "ADMIN" ? "Quyền Admin" : "Quyền Manager"}
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Chờ duyệt</p>
            <p className="text-2xl font-bold text-yellow-600">
              {refunds.filter((r) => r.status === "PENDING_MANAGER" || r.status === "PENDING_ADMIN").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Đã hoàn</p>
            <p className="text-2xl font-bold text-green-600">
              {refunds.filter((r) => r.status === "COMPLETED").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Từ chối</p>
            <p className="text-2xl font-bold text-red-600">
              {refunds.filter((r) => r.status === "REJECTED").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Tổng số tiền</p>
            <p className="text-2xl font-bold">
              {formatVND(refunds.reduce((sum, r) => sum + parseFloat(r.refundAmount || "0"), 0).toString())}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Refund List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Danh sách yêu cầu hoàn cọc</CardTitle>
        </CardHeader>
        <CardContent>
          {refunds.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Chưa có yêu cầu hoàn cọc nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">Mã hoàn cọc</th>
                    <th className="text-left py-3 px-2">Số tiền</th>
                    <th className="text-left py-3 px-2">Lý do</th>
                    <th className="text-left py-3 px-2">Ngân hàng</th>
                    <th className="text-left py-3 px-2">Trạng thái</th>
                    <th className="text-left py-3 px-2">Hạn xử lý</th>
                    <th className="text-right py-3 px-2">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {refunds.map((refund) => (
                    <tr key={refund.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-2 font-mono text-xs">{refund.refundCode}</td>
                      <td className="py-3 px-2 font-semibold">{formatVND(refund.refundAmount)}</td>
                      <td className="py-3 px-2">{refund.refundReasonType?.replace(/_/g, " ")}</td>
                      <td className="py-3 px-2">{refund.bankName}</td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[refund.status]}`}>
                          {STATUS_LABELS[refund.status]}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-xs">{refund.payoutDueDate}</td>
                      <td className="py-3 px-2 text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedRefund(refund)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Chi tiết
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg">
                            <DialogHeader>
                              <DialogTitle>Xử lý hoàn cọc {refund.refundCode}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                  <p className="text-muted-foreground">Số tiền</p>
                                  <p className="font-bold">{formatVND(refund.refundAmount)}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Lý do</p>
                                  <p>{refund.refundReasonType?.replace(/_/g, " ")}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">STK</p>
                                  <p>{refund.bankAccountNumber}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Ngân hàng</p>
                                  <p>{refund.bankName}</p>
                                </div>
                              </div>

                              {refund.bankRejectionLetterUrl && (
                                <div>
                                  <p className="text-sm text-muted-foreground">Chứng từ từ chối vay</p>
                                  <a href={refund.bankRejectionLetterUrl} className="text-sm text-primary underline">
                                    Xem file PDF
                                  </a>
                                </div>
                              )}

                              {(refund.status === "PENDING_MANAGER" && role === "MANAGER") ||
                              (refund.status === "PENDING_ADMIN" && role === "ADMIN") ? (
                                <div className="space-y-3 pt-2 border-t">
                                  <div className="space-y-2">
                                    <Label>Manager Override Reason (tuỳ chọn)</Label>
                                    <Input
                                      placeholder="Lý do duyệt ngoại lệ..."
                                      value={overrideReason}
                                      onChange={(e) => setOverrideReason(e.target.value)}
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      className="flex-1"
                                      onClick={() => handleDecision(refund.id, "APPROVED")}
                                      disabled={processing}
                                    >
                                      <Check className="h-4 w-4 mr-1" />
                                      Duyệt
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      className="flex-1"
                                      onClick={() => handleDecision(refund.id, "REJECTED")}
                                      disabled={processing}
                                    >
                                      <X className="h-4 w-4 mr-1" />
                                      Từ chối
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="pt-2 border-t text-center text-sm text-muted-foreground">
                                  <AlertTriangle className="h-4 w-4 inline mr-1" />
                                  {refund.status === "COMPLETED"
                                    ? "Đã hoàn tiền thành công"
                                    : refund.status === "REJECTED"
                                    ? "Đã từ chối yêu cầu"
                                    : "Không có quyền duyệt ở bước này"}
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
