"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, AlertTriangle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const STATUS_CONFIG: Record<string, {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
}> = {
  SUCCESS: {
    icon: CheckCircle,
    title: "Dat coc thanh cong!",
    description: "Don hang cua ban da duoc xac nhan. Nhan vien kinh doanh se lien he ban trong 24h.",
    color: "text-green-500",
  },
  PARTIAL_PAID: {
    icon: AlertTriangle,
    title: "Nop thieu tien coc",
    description: "So tien nhan duoc chua du. Phan tien da nop se duoc chuyen vao vi tin dung cua ban.",
    color: "text-yellow-500",
  },
  FAILED: {
    icon: XCircle,
    title: "Thanh toan that bai",
    description: "Giao dich khong thanh cong. Vui long thu lai hoac chon phuong thuc thanh toan khac.",
    color: "text-red-500",
  },
  EXPIRED: {
    icon: Clock,
    title: "Het thoi gian giu cho",
    description: "Phien giu cho da het han. Xe da duoc mo khoa tro lai kho. Vui long dat coc lai.",
    color: "text-gray-500",
  },
};

export default function PaymentResultPage() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status") || "FAILED";
  const orderId = searchParams.get("orderId");
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.FAILED;
  const Icon = config.icon;

  return (
    <div className="container py-16 max-w-lg">
      <Card>
        <CardHeader className="text-center">
          <Icon className={`h-20 w-20 mx-auto mb-4 ${config.color}`} />
          <CardTitle className="text-2xl">{config.title}</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">{config.description}</p>
          {orderId && (
            <p className="text-sm">
              Ma don hang: <span className="font-mono font-bold">{orderId}</span>
            </p>
          )}
          <div className="flex gap-3 justify-center pt-4">
            {status === "FAILED" || status === "EXPIRED" ? (
              <Link href="/catalog">
                <Button>Quay lai danh muc</Button>
              </Link>
            ) : (
              <Link href="/orders">
                <Button>Xem don hang cua toi</Button>
              </Link>
            )}
            <Link href="/catalog">
              <Button variant="outline">Tiep tuc mua sam</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
