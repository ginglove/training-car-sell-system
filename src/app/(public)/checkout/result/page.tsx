"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Clock, Ban, ArrowLeft, Car, FileText, RefreshCw, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STATUS_CONFIG: Record<string, {
  icon: React.ElementType;
  title: string;
  badge: string;
  badgeVariant: "success" | "destructive" | "secondary" | "outline";
  description: string;
  color: string;
}> = {
  SUCCESS: {
    icon: CheckCircle2,
    title: "Đặt cọc xe thành công!",
    badge: "Giao dịch đã xác nhận",
    badgeVariant: "success",
    description: "Đơn cọc của bạn đã được ghi nhận vào hệ thống. Số VIN xe trong kho chi nhánh đã được khóa giữ chỗ cho bạn.",
    color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200",
  },
  FAILED: {
    icon: XCircle,
    title: "Thanh toán thất bại!",
    badge: "Giao dịch không thành công",
    badgeVariant: "destructive",
    description: "Ngân hàng hoặc Cổng thanh toán từ chối giao dịch. Vui lòng kiểm tra lại hạn mức thẻ hoặc phương thức thanh toán.",
    color: "text-rose-500 bg-rose-50 dark:bg-rose-950/30 border-rose-200",
  },
  EXPIRED: {
    icon: Clock,
    title: "Đã hết thời gian giữ chỗ 15 phút!",
    badge: "Phiên giữ chỗ hết hạn",
    badgeVariant: "secondary",
    description: "Thời hạn 15 phút đặt cọc đã trôi qua. Xe đã được tự động mở khóa giải phóng về kho chi nhánh.",
    color: "text-amber-500 bg-amber-50 dark:bg-amber-950/30 border-amber-200",
  },
  CANCELLED: {
    icon: Ban,
    title: "Bạn đã hủy giao dịch đặt cọc!",
    badge: "Giao dịch đã hủy",
    badgeVariant: "outline",
    description: "Bạn đã chủ động hủy quy trình đặt cọc. Không có khoản tiền nào bị trừ khỏi tài khoản của bạn.",
    color: "text-slate-500 bg-slate-100 dark:bg-slate-800 border-slate-200",
  },
};

function PaymentResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const status = searchParams.get("status") || "FAILED";
  const orderId = searchParams.get("orderId");
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.FAILED;
  const Icon = config.icon;

  return (
    <div className="container py-16 max-w-lg">
      <Button variant="ghost" onClick={() => router.push("/catalog")} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Về danh mục xe
      </Button>

      <Card className="shadow-lg border">
        <CardHeader className="text-center pb-2">
          <div className={`h-24 w-24 mx-auto rounded-full flex items-center justify-center border-2 mb-4 ${config.color}`}>
            <Icon className="h-12 w-12" />
          </div>
          <Badge variant={config.badgeVariant} className="mx-auto mb-2 text-xs">
            {config.badge}
          </Badge>
          <CardTitle className="text-2xl font-bold">{config.title}</CardTitle>
          <CardDescription className="pt-2 text-sm">
            Màn hình thông báo kết quả giao dịch thanh toán (SCR-10)
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-5 pt-2">
          <p className="text-sm text-muted-foreground leading-relaxed px-4">{config.description}</p>

          {orderId && (
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border text-sm flex justify-between items-center font-mono">
              <span className="text-muted-foreground text-xs font-sans">Mã đơn hàng:</span>
              <span className="font-bold text-primary">{orderId}</span>
            </div>
          )}

          <div className="flex flex-col gap-2.5 pt-2">
            {status === "SUCCESS" && (
              <>
                <Link href={orderId ? `/orders/${orderId}` : "/orders"}>
                  <Button className="w-full h-11 text-sm font-semibold shadow">
                    <FileText className="h-4 w-4 mr-2" />
                    Theo dõi đơn hàng & Nộp hồ sơ vay (SCR-11)
                  </Button>
                </Link>
                <Link href="/catalog">
                  <Button variant="outline" className="w-full">
                    <Car className="h-4 w-4 mr-2" />
                    Tiếp tục khám phá xe khác
                  </Button>
                </Link>
              </>
            )}

            {(status === "FAILED" || status === "EXPIRED" || status === "CANCELLED") && (
              <>
                <Link href="/catalog">
                  <Button className="w-full h-11 text-sm font-semibold shadow">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {status === "EXPIRED" ? "Tạo lại đơn cọc xe mới" : "Thử đặt cọc lại"}
                  </Button>
                </Link>
                <Button variant="outline" className="w-full" onClick={() => alert("Đang kết nối tới tổng đài Sale 1900-1234...")}>
                  <PhoneCall className="h-4 w-4 mr-2" />
                  Gọi hỗ trợ tư vấn viên 24/7
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense fallback={<div className="text-center py-8">Đang tải kết quả thanh toán...</div>}>
      <PaymentResultContent />
    </Suspense>
  );
}
