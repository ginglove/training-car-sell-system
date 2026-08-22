"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Car, CreditCard, Building, FileText, RefreshCw, CheckCircle2, AlertCircle, ShieldAlert, DollarSign, Clock, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { formatVND } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/constants/order-status";

const BANKS = [
  { name: "Vietcombank AutoLoan", approvalOdds: 92, interest: "7.2%/năm" },
  { name: "TPBank Car Credit", approvalOdds: 88, interest: "7.5%/năm" },
  { name: "VIB Auto Finance", approvalOdds: 78, interest: "8.0%/năm" },
  { name: "VPBank Commercial", approvalOdds: 65, interest: "8.5%/năm" },
];

export default function OrderDetailPage() {
  const { orderId } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [selectedBank, setSelectedBank] = useState("");

  // Trade-in form state
  const [showTradeInModal, setShowTradeInModal] = useState(false);
  const [carBrand, setCarBrand] = useState("");
  const [carModel, setCarModel] = useState("");
  const [carYear, setCarYear] = useState("2020");
  const [carOdo, setCarOdo] = useState("45000");
  const [carExpectedPrice, setCarExpectedPrice] = useState("350000000");
  const [tradeInSubmitting, setTradeInSubmitting] = useState(false);

  // Refund modal state
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState("BANK_LOAN_REJECTED");
  const [bankName, setBankName] = useState("Vietcombank");
  const [bankAccount, setBankAccount] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [refundSubmitting, setRefundSubmitting] = useState(false);

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/orders/${orderId}`);
      const data = await res.json();
      if (data.success) setOrder(data.data);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  async function handleBankSwitch() {
    if (!selectedBank) return;
    setSwitching(true);
    try {
      const res = await fetch(`/api/v1/loans/${order.loanApplication?.id || "demo_loan"}/switch-bank`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bankName: selectedBank, reuseExistingDocs: true }),
      });
      const data = await res.json();
      if (data.success) fetchOrder();
    } finally {
      setSwitching(false);
    }
  }

  async function handleTradeInSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTradeInSubmitting(true);
    try {
      const res = await fetch("/api/v1/trade-in/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          oldCarBrand: carBrand,
          oldCarModel: carModel,
          manufacturingYear: Number(carYear),
          odoKm: Number(carOdo),
          expectedPrice: Number(carExpectedPrice),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowTradeInModal(false);
        fetchOrder();
      }
    } finally {
      setTradeInSubmitting(false);
    }
  }

  async function handleRefundSubmit(e: React.FormEvent) {
    e.preventDefault();
    setRefundSubmitting(true);
    try {
      const res = await fetch("/api/v1/refunds/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          refundReasonType: refundReason,
          bankName,
          bankAccountNumber: bankAccount,
          bankAccountName: accountHolder,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowRefundModal(false);
        fetchOrder();
      }
    } finally {
      setRefundSubmitting(false);
    }
  }

  if (loading) {
    return <div className="animate-pulse h-96 bg-slate-100 dark:bg-slate-800 rounded-xl max-w-4xl mx-auto" />;
  }

  if (!order) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold">Đơn hàng không tồn tại</h2>
        <Button onClick={() => router.push("/orders")} className="mt-4">Quay lại danh sách đơn hàng</Button>
      </div>
    );
  }

  const isBankRejected = order.status === "BANK_REJECTED" || order.status === "BANK_APPROVING";
  const canSwitchBank = (order.loanApplication?.switchCount || 0) < 3;

  const totalListed = Number(order.totalListedPrice || order.finalPrice || 0);
  const accessoriesPrice = Number(order.accessoriesTotalPrice || 0);
  const grandTotal = totalListed + accessoriesPrice;
  const depositPaid = Number(order.depositAmount || 0);
  const tradeInValue = Number(order.tradeInCreditValue || 0);
  const remainingPayment = grandTotal - depositPaid - tradeInValue;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => router.back()} className="mb-2">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Quay lại
      </Button>

      {/* Main Order Card & Timeline Status */}
      <Card className="shadow-md">
        <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Cổng Theo Dõi Đơn Hàng {order.orderCode} (SCR-11)
              </CardTitle>
              <CardDescription>
                Ngày khởi tạo: {new Date(order.createdAt).toLocaleDateString("vi-VN")}
              </CardDescription>
            </div>
            <Badge variant="success" className="text-sm px-3 py-1 font-semibold">
              {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS] || order.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-24 w-24 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center border shrink-0">
              <Car className="h-12 w-12 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-xl">{order.variantName || "Xe AutoDealership Premium"}</h3>
              <p className="text-sm text-muted-foreground">Màu sắc đăng ký: <span className="font-medium text-foreground">{order.selectedColor}</span></p>
              {order.vinNumber ? (
                <p className="text-sm font-mono text-emerald-600 font-bold mt-1">VIN giữ chỗ: {order.vinNumber}</p>
              ) : (
                <p className="text-xs text-amber-600 mt-1">VIN kho chi nhánh đang chờ phân bổ cứng</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Cash Flow Deduction Financial Card (SCR-11 Core Spec) */}
          <Card className="bg-slate-50/50 dark:bg-slate-900/40 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-600" />
                Bảng tính cấn trừ dòng tiền thanh toán (Cash Flow Deduction)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Giá xe niêm yết</span>
                <span className="font-medium">{formatVND(totalListed)}</span>
              </div>
              {accessoriesPrice > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gói phụ kiện chính hãng chọn thêm</span>
                  <span className="font-medium text-primary">+{formatVND(accessoriesPrice)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold border-t pt-2">
                <span>Tổng hợp đồng</span>
                <span>{formatVND(grandTotal)}</span>
              </div>
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Tiền cọc giữ xe đã thanh toán</span>
                <span>-{formatVND(depositPaid)}</span>
              </div>
              {tradeInValue > 0 && (
                <div className="flex justify-between text-amber-600 font-medium">
                  <span>Cấn trừ giá trị xe thu cũ (Trade-in offset)</span>
                  <span>-{formatVND(tradeInValue)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between items-baseline font-bold text-lg pt-1">
                <span>Số tiền còn lại phải thanh toán khi nhận xe</span>
                <span className="text-2xl text-primary">{formatVND(remainingPayment)}</span>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* Trade-in Platform Card */}
      <Card className="border-amber-500/30 bg-amber-50/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2 text-amber-900 dark:text-amber-300">
              <RefreshCw className="h-5 w-5 text-amber-600" />
              Nền tảng Thu Cũ Đổi Mới (Trade-in Platform)
            </CardTitle>
            {tradeInValue > 0 && (
              <Badge variant="success">Đã cấn trừ {formatVND(tradeInValue)}</Badge>
            )}
          </div>
          <CardDescription>
            Bán lại xe cũ đang dùng để cấn trừ trực tiếp vào tổng tiền còn lại của đơn xe mới này.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tradeInValue > 0 ? (
            <p className="text-sm font-semibold text-emerald-600">
              ✓ Xe cũ của bạn đã được thẩm định & chấp nhận cấn trừ {formatVND(tradeInValue)} vào hợp đồng!
            </p>
          ) : (
            <Button variant="outline" className="border-amber-500/40 hover:bg-amber-500/10" onClick={() => setShowTradeInModal(true)}>
              <RefreshCw className="h-4 w-4 mr-2 text-amber-600" />
              Nộp thông tin định giá xe cũ của bạn
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Bank Switch Wizard (SCR-11 Core Spec) */}
      <Card className="border-blue-200 bg-blue-50/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-blue-900 dark:text-blue-300">
            <Building className="h-5 w-5 text-blue-600" />
            Hồ sơ Vay Ngân hàng & Wizard Đổi Ngân Hàng (Bank Switch)
          </CardTitle>
          <CardDescription>
            Tự động tái sử dụng giấy tờ đã nộp (reuse_existing_docs = true) để nộp hồ sơ sang ngân hàng đối tác khác
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-background rounded-lg border text-sm flex justify-between items-center">
            <div>
              <p className="font-semibold">Ngân hàng hiện tại: {order.loanApplication?.selectedBank || "Vietcombank"}</p>
              <p className="text-xs text-muted-foreground">Trạng thái: {order.loanApplication?.loanStatus || "Đang thẩm định tin dùng"}</p>
            </div>
            <Badge variant="outline">Số lần đổi: {order.loanApplication?.switchCount || 0}/3</Badge>
          </div>

          {canSwitchBank && (
            <div className="space-y-3 pt-2">
              <Label className="text-sm font-semibold">Bảng chỉ số tỷ lệ phê duyệt (Approval Odds Index):</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {BANKS.map((b) => (
                  <div
                    key={b.name}
                    onClick={() => setSelectedBank(b.name)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedBank === b.name ? "border-primary bg-primary/10 ring-2 ring-primary/20" : "bg-background hover:border-slate-300"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <p className="font-semibold text-sm">{b.name}</p>
                      <Badge variant="success" className="text-[10px]">{b.approvalOdds}% Tỉ lệ duyệt</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Lãi suất: {b.interest}</p>
                  </div>
                ))}
              </div>

              {selectedBank && (
                <Button onClick={handleBankSwitch} disabled={switching} className="w-full mt-2">
                  <RefreshCw className={`h-4 w-4 mr-2 ${switching ? "animate-spin" : ""}`} />
                  {switching ? "Đang nộp lại hồ sơ..." : `Xác nhận chuyển sang ngân hàng ${selectedBank}`}
                </Button>
              )}
            </div>
          )}

          <Separator />

          <div className="flex justify-between items-center pt-1">
            <span className="text-xs text-muted-foreground">Nếu hồ sơ vay bị từ chối bởi tất cả ngân hàng:</span>
            <Button variant="destructive" size="sm" onClick={() => setShowRefundModal(true)}>
              <FileText className="h-4 w-4 mr-1" />
              Yêu cầu hoàn tiền cọc 100% (SLA 3 ngày)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Trade-In Request Modal */}
      <Dialog open={showTradeInModal} onOpenChange={setShowTradeInModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-amber-600" />
              Nộp thông tin định giá xe cũ (Trade-in)
            </DialogTitle>
            <DialogDescription>Chuyên viên thẩm định sẽ kiểm tra và đề xuất giá cấn trừ trong 24h</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleTradeInSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Hãng xe cũ</Label>
                <Input placeholder="Toyota, Honda, Mazda..." value={carBrand} onChange={(e) => setCarBrand(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label>Dòng xe & Phiên bản</Label>
                <Input placeholder="Camry 2.5Q, CX-5..." value={carModel} onChange={(e) => setCarModel(e.target.value)} required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Năm sản xuất</Label>
                <Input type="number" value={carYear} onChange={(e) => setCarYear(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label>Số Km đã đi (ODO)</Label>
                <Input type="number" value={carOdo} onChange={(e) => setCarOdo(e.target.value)} required />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Giá mong muốn bán lại (VND)</Label>
              <Input type="number" value={carExpectedPrice} onChange={(e) => setCarExpectedPrice(e.target.value)} required />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowTradeInModal(false)}>Hủy</Button>
              <Button type="submit" disabled={tradeInSubmitting}>
                {tradeInSubmitting ? "Đang gửi..." : "Gửi yêu cầu định giá"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 100% Refund Request Modal */}
      <Dialog open={showRefundModal} onOpenChange={setShowRefundModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <ShieldAlert className="h-5 w-5" />
              Yêu cầu hoàn tiền cọc 100% (Manager Override)
            </DialogTitle>
            <DialogDescription>SLA hoàn lại 100% tiền cọc về tài khoản ngân hàng trong 3 ngày làm việc</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRefundSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label>Lý do hoàn cọc</Label>
              <select
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="w-full p-2 border rounded-md text-sm bg-background"
              >
                <option value="BANK_LOAN_REJECTED">Ngân hàng từ chối cho vay tài chính</option>
                <option value="SYSTEM_TIMEOUT_ERROR">Hệ thống xử lý quá hạn 15 phút</option>
                <option value="FORCE_MAJEURE">Bất khả kháng / Khách hàng thay đổi ý định</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label>Ngân hàng nhận tiền hoàn</Label>
              <Input value={bankName} onChange={(e) => setBankName(e.target.value)} required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Số tài khoản</Label>
                <Input placeholder="0123456789" value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label>Tên chủ tài khoản</Label>
                <Input placeholder="NGUYEN VAN A" value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} required />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowRefundModal(false)}>Hủy</Button>
              <Button type="submit" variant="destructive" disabled={refundSubmitting}>
                {refundSubmitting ? "Đang nộp..." : "Xác nhận gửi yêu cầu hoàn tiền"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
