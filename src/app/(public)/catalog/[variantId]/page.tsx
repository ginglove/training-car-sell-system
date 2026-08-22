"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Car, ArrowLeft, Fuel, Gauge, Calendar, MapPin, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatVND } from "@/lib/utils";

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

export default function CarDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [vehicle, setVehicle] = useState<VariantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState("");

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
      <div className="container py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-96 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="container py-16 text-center">
        <h2 className="text-xl font-semibold">Khong tim thay xe</h2>
        <Link href="/catalog">
          <Button className="mt-4">Quay lai danh muc</Button>
        </Link>
      </div>
    );
  }

  const loanAmount = vehicle.listedPrice * (loanPercent / 100);
  const monthlyRate = interestRate / 100 / 12;
  const totalMonths = loanTermYears * 12;
  const monthlyPayment =
    (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
    (Math.pow(1 + monthlyRate, totalMonths) - 1);

  const selectedQuota = vehicle.colors?.find((c) => c.color === selectedColor);

  return (
    <div className="container py-6">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Quay lai
      </Button>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg h-96 flex items-center justify-center">
            <Car className="h-40 w-40 text-blue-200" />
          </div>

          <div>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground">{vehicle.brandName}</p>
                <h1 className="text-3xl font-bold">{vehicle.modelName} - {vehicle.variantName}</h1>
              </div>
              <Badge variant={selectedQuota && selectedQuota.quota > 0 ? "success" : "destructive"} className="text-base px-3 py-1">
                {selectedQuota && selectedQuota.quota > 0 ? `Con ${selectedQuota.quota} xe` : "Het hang"}
              </Badge>
            </div>

            <p className="text-3xl font-bold text-primary mb-4">{formatVND(vehicle.listedPrice)}</p>

            <div className="flex gap-2 mb-6">
              {vehicle.colors?.map((c) => (
                <button
                  key={c.color}
                  onClick={() => setSelectedColor(c.color)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                    selectedColor === c.color
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {c.color} ({c.quota})
                </button>
              ))}
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Thong so ky thuat</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {vehicle.specsJson &&
                  Object.entries(vehicle.specsJson).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">{key}</span>
                      <span className="font-medium">{String(value)}</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Uoc tinh tra gop
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Ty le vay ({loanPercent}%)</Label>
                <Input
                  type="range"
                  min="10"
                  max="80"
                  value={loanPercent}
                  onChange={(e) => setLoanPercent(Number(e.target.value))}
                  className="mt-1"
                />
                <p className="text-sm text-muted-foreground">
                  So tien vay: {formatVND(loanAmount)}
                </p>
              </div>

              <div>
                <Label>Thoi han vay</Label>
                <Select
                  value={String(loanTermYears)}
                  onValueChange={(v) => setLoanTermYears(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y} nam
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Gia niem yet</span>
                  <span>{formatVND(vehicle.listedPrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tra truoc ({100 - loanPercent}%)</span>
                  <span>{formatVND(vehicle.listedPrice - loanAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Lai suat</span>
                  <span>{interestRate}%/nam</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Tra gop/thang</span>
                  <span className="text-primary">{formatVND(Math.round(monthlyPayment))}</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Link href={`/test-drive?variant_id=${vehicle.id}`}>
                  <Button variant="outline" className="w-full">
                    <Calendar className="h-4 w-4 mr-2" />
                    Dat lich lai thu
                  </Button>
                </Link>
                <Link href={`/checkout?variant_id=${vehicle.id}&color=${selectedColor}`}>
                  <Button className="w-full" disabled={!selectedQuota || selectedQuota.quota <= 0}>
                    Dat coc giu xe - {formatVND(vehicle.minDepositAmount)}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
