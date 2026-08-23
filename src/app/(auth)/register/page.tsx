"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Car, Eye, EyeOff, Mail, Phone, Lock, User, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Simple password strength calculation
  function getPasswordStrength(pw: string) {
    if (!pw) return { score: 0, label: "Trống", color: "bg-slate-200" };
    let score = 0;
    if (pw.length >= 10) score += 1;
    if (/[A-Z]/.test(pw)) score += 1;
    if (/[a-z]/.test(pw)) score += 1;
    if (/\d/.test(pw)) score += 1;
    if (/[@$!%*?&]/.test(pw)) score += 1;

    if (score <= 2) return { score: 25, label: "Yếu", color: "bg-red-500" };
    if (score === 3 || score === 4) return { score: 75, label: "Khá", color: "bg-yellow-500" };
    return { score: 100, label: "Mạnh", color: "bg-green-500" };
  }

  const strength = getPasswordStrength(password);

  async function handleSendOTP() {
    setError("");
    if (!phone) {
      setError("Vui lòng nhập số điện thoại trước khi nhận mã OTP");
      return;
    }
    const phoneRegex = /^(0|84)[35789][0-9]{8}$/;
    if (!phoneRegex.test(phone)) {
      setError("Số điện thoại không hợp lệ (Ví dụ: 0901234567)");
      return;
    }

    setOtpLoading(true);
    try {
      const res = await fetch("/api/v1/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (data.success) {
        setOtpSent(true);
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setError(data.error || "Gửi OTP thất bại");
      }
    } catch {
      setError("Lỗi kết nối máy chủ khi gửi OTP");
    } finally {
      setOtpLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp!");
      return;
    }

    if (password.length < 10 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password) || !/[@$!%*?&]/.test(password)) {
      setError("Mật khẩu phải từ 10 ký tự, gồm ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt (@$!%*?&)");
      return;
    }

    if (!termsAccepted) {
      setError("Bạn cần đồng ý với Điều khoản sử dụng và Chính sách bảo mật");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          password,
          otpCode,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg("Đăng ký tài khoản thành công! Đang chuyển hướng về trang Đăng nhập...");
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      } else {
        setError(data.error?.message || data.error || "Đăng ký thất bại");
      }
    } catch {
      setError("Lỗi hệ thống khi đăng ký tài khoản");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md space-y-4 my-8">
      <Card className="w-full shadow-lg border">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Car className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl font-bold">AUTO DEALERSHIP</CardTitle>
          </div>
          <CardDescription>Tạo tài khoản mới để trải nghiệm dịch vụ</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-medium">
                {error}
              </div>
            )}
            {successMsg && (
              <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-xs font-medium">
                {successMsg}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="fullName">Họ và tên *</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="fullName"
                  placeholder="Nguyễn Văn A"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="nguyenvana@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Số điện thoại *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  placeholder="0901234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Mật khẩu *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min 10 ký tự, 1 hoa, 1 thường, 1 số, 1 ký tự đặc biệt"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 pr-9"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {password && (
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>Độ mạnh mật khẩu:</span>
                    <span className="font-semibold">{strength.label}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${strength.color} transition-all duration-300`} style={{ width: `${strength.score}%` }} />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Xác nhận mật khẩu *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Nhập lại mật khẩu"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="otpCode">Mã OTP (xác thực SĐT) *</Label>
              <div className="flex gap-2">
                <Input
                  id="otpCode"
                  placeholder="888888"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="text-center tracking-widest font-mono text-base"
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSendOTP}
                  disabled={otpLoading || countdown > 0}
                  className="shrink-0"
                >
                  {countdown > 0 ? `${countdown}s` : "Gửi mã OTP"}
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Môi trường Sandbox OTP cố định: <span className="font-mono font-bold text-primary">888888</span>
              </p>
            </div>

            <div className="flex items-start gap-2 pt-1 text-xs">
              <input
                type="checkbox"
                id="terms"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
              />
              <label htmlFor="terms" className="cursor-pointer text-slate-600 dark:text-slate-400">
                Tôi đồng ý với <span className="text-primary underline">Điều khoản sử dụng</span> và{" "}
                <span className="text-primary underline">Chính sách bảo mật</span>.
              </label>
            </div>

            <Button
              type="submit"
              className="w-full mt-2"
              disabled={loading || !termsAccepted}
            >
              {loading ? "Đang tạo tài khoản..." : "ĐĂNG KÝ TÀI KHOẢN"}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-muted-foreground border-t pt-4">
            Đã có tài khoản?{" "}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Đăng nhập ngay
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
