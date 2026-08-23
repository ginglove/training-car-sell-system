"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Car, ShieldCheck, ArrowLeft, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone") || "0901234567";
  const redirect = searchParams.get("redirect") || "/catalog";

  const [otpCode, setOtpCode] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const maskedPhone = phone.length >= 10 
    ? `${phone.slice(0, 3)}*****${phone.slice(-2)}` 
    : phone;

  async function handleResend() {
    setError("");
    setSuccess("");
    setResendLoading(true);
    try {
      const res = await fetch("/api/v1/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (data.success) {
        setCountdown(60);
        setSuccess("Mã OTP mới đã được gửi thành công!");
      } else {
        setError(data.error || "Gửi lại OTP thất bại");
      }
    } catch {
      setError("Lỗi kết nối máy chủ");
    } finally {
      setResendLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (otpCode.length < 6) {
      setError("Vui lòng nhập đủ 6 chữ số mã OTP");
      return;
    }

    setLoading(true);
    try {
      if (otpCode === "888888") {
        setSuccess("Xác thực OTP thành công!");
        setTimeout(() => {
          router.push(redirect);
        }, 1000);
      } else {
        setError("Mã OTP không đúng (Sandbox mã đúng: 888888)");
      }
    } catch {
      setError("Lỗi xác thực OTP");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md space-y-4 my-8">
      <Button variant="ghost" onClick={() => router.back()} className="mb-2">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Quay lại đăng nhập
      </Button>

      <Card className="w-full shadow-lg border">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <ShieldCheck className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl font-bold">XÁC THỰC MÃ OTP</CardTitle>
          </div>
          <CardDescription>
            Mã OTP đã được gửi đến số điện thoại: <br />
            <span className="font-semibold text-foreground text-sm">📲 {maskedPhone}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <div className="space-y-2 text-center">
              <Label htmlFor="otpInput" className="text-xs text-muted-foreground">
                Nhập mã 6 chữ số (Sandbox code: <strong className="text-primary">888888</strong>)
              </Label>
              <Input
                id="otpInput"
                placeholder="888888"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="text-center font-mono tracking-[0.5em] text-3xl h-14"
                autoFocus
                required
              />
            </div>

            <div className="text-center text-xs space-y-2">
              <p className="text-muted-foreground">
                {countdown > 0 ? (
                  <span>⏱ Mã sẽ hết hạn sau: <strong className="text-primary font-mono">{countdown}s</strong></span>
                ) : (
                  <span className="text-red-500 font-medium">⚠️ Mã OTP đã hết hạn</span>
                )}
              </p>

              <div>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={handleResend}
                  disabled={countdown > 0 || resendLoading}
                  className="text-xs"
                >
                  <RefreshCw className={`h-3.5 w-3.5 mr-1 ${resendLoading ? "animate-spin" : ""}`} />
                  Chưa nhận được mã? Gửi lại OTP
                </Button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading || otpCode.length < 6}>
              {loading ? "Đang xác thực..." : "XÁC NHẬN MÃ OTP"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
      <VerifyOtpContent />
    </Suspense>
  );
}
