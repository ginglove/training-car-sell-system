/* eslint-disable @next/next/no-img-element */
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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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
          if (data.data.images?.length > 0) {
            setSelectedImage(data.data.images[0].url);
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
      <div className="container py-12 text-center">
        <p className="text-muted-foreground">Dang tai thong tin xe...</p>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="container py-12 text-center">
        <h2 className="text-xl font-semibold mb-2">Khong tim thay thong tin xe</h2>
        <Button onClick={() => router.push("/catalog")}>Quay lai danh muc</Button>
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

  const displayImage = selectedImage || (vehicle.images && vehicle.images.length > 0 ? vehicle.images[0].url : null);

  return (
    <div className="container py-6">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Quay lai
      </Button>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-3">
            <div className="relative rounded-xl overflow-hidden h-96 bg-slate-100 dark:bg-slate-800 flex items-center justify-center border shadow-sm">
              {displayImage ? (
                <img
                  src={displayImage}
                  alt={`${vehicle.brandName} ${vehicle.modelName}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Car className="h-32 w-32 text-muted-foreground/30" />
              )}
            </div>

            {vehicle.images && vehicle.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {vehicle.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img.url)}
                    className={`h-20 w-28 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                      displayImage === img.url ? "border-primary ring-2 ring-primary/20" : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={img.url} alt="angle" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
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
