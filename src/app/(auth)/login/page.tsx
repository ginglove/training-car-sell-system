"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Car, Eye, EyeOff, Lock, Phone, Mail, ArrowLeft, UserCheck, KeyRound, CheckCircle2, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const DEMO_ACCOUNTS = [
  { role: "ADMIN", email: "admin@autodealer.vn", name: "Nguyễn Văn Admin" },
  { role: "MANAGER", email: "manager.hn@autodealer.vn", name: "Trần Thị Manager HN" },
  { role: "SALE", email: "sale1@autodealer.vn", name: "Phạm Văn Sale HN 1" },
  { role: "CUSTOMER", email: "customer1@gmail.com", name: "Nguyễn Văn Tuấn" },
];

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/catalog";

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const [otpPhone, setOtpPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Forgot Password modal state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetIdentity, setResetIdentity] = useState("");
  const [resetOtpSent, setResetOtpSent] = useState(false);
  const [resetOtpCode, setResetOtpCode] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [resetCountdown, setResetCountdown] = useState(0);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMsg, setResetMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const savedIdentity = localStorage.getItem("autodealer_remember_identity");
    if (savedIdentity) {
      setIdentity(savedIdentity);
      setRememberMe(true);
    }
  }, []);

  function quickFillAccount(email: string) {
    setIdentity(email);
    setPassword("Admin@123");
    setError("");
  }

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (rememberMe) {
      localStorage.setItem("autodealer_remember_identity", identity);
    } else {
      localStorage.removeItem("autodealer_remember_identity");
    }

    const result = await signIn("credentials", {
      identity,
      password,
      mode: "password",
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      const errorMap: Record<string, string> = {
        ERR_UI_003: "Sai thông tin đăng nhập. Mật khẩu không chính xác.",
        ERR_UI_004: "Tài khoản tạm thời bị khóa 30 phút do nhập sai mật khẩu quá 5 lần.",
        CredentialsSignin: "Sai thông tin đăng nhập. Mật khẩu hoặc Email/SĐT không đúng.",
      };
      const errorMsg = errorMap[result.error] || (
        result.error.includes("ERR_UI_004")
          ? "Tài khoản tạm thời bị khóa 30 phút do nhập sai mật khẩu quá 5 lần."
          : "Sai thông tin đăng nhập. Mật khẩu hoặc Email/SĐT không đúng."
      );
      setError(errorMsg);
    } else {
      router.push(redirect);
      router.refresh();
    }
  }

  async function handleSendOTP() {
    setError("");
    if (!otpPhone) {
      setError("Vui lòng nhập số điện thoại nhận mã OTP");
      return;
    }

    const phoneRegex = /^(0|84)[3|5|7|8|9][0-9]{8}$/;
    if (!phoneRegex.test(otpPhone)) {
      setError("Định dạng số điện thoại không hợp lệ (Ví dụ: 0912345678)");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: otpPhone }),
      });
      const data = await res.json();
      if (data.success) {
        setOtpSent(true);
        setCountdown(60);
        setError("");
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
        setError(data.error || "Gửi mã OTP thất bại");
      }
    } catch {
      setError("Lỗi kết nối máy chủ khi gửi OTP");
    } finally {
      setLoading(false);
    }
  }

  async function handleOTPLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!otpCode || otpCode.length < 6) {
      setError("Vui lòng nhập đủ 6 chữ số mã OTP");
      return;
    }
    setLoading(true);

    const result = await signIn("credentials", {
      identity: otpPhone,
      otp: otpCode,
      mode: "otp",
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      if (result.error === "ERR_UI_005") {
        setError("Mã OTP không hợp lệ hoặc đã hết hạn (Sandbox: 888888).");
      } else if (result.error === "ERR_UI_004") {
        setError("Tài khoản tạm thời bị khóa 30 phút do đăng nhập sai quá nhiều lần.");
      } else {
        setError("Số điện thoại chưa được đăng ký trong hệ thống hoặc không chính xác.");
      }
    } else {
      router.push(redirect);
      router.refresh();
    }
  }

  async function handleSendResetOTP() {
    if (!resetIdentity) {
      setResetMsg({ type: "error", text: "Vui lòng nhập Email hoặc Số điện thoại" });
      return;
    }
    setResetMsg(null);
    setResetLoading(true);
    try {
      const res = await fetch("/api/v1/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: resetIdentity.match(/^[0-9]+$/) ? resetIdentity : "0912345678" }),
      });
      const data = await res.json();
      if (data.success) {
        setResetOtpSent(true);
        setResetCountdown(60);
        setResetMsg({ type: "success", text: "Mã OTP khôi phục mật khẩu đã gửi (Sandbox: 888888)" });
        const timer = setInterval(() => {
          setResetCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setResetMsg({ type: "error", text: data.error || "Gửi OTP thất bại" });
      }
    } catch {
      setResetMsg({ type: "error", text: "Lỗi kết nối máy chủ" });
    } finally {
      setResetLoading(false);
    }
  }

  async function handleResetPasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResetMsg(null);

    if (resetNewPassword !== resetConfirmPassword) {
      setResetMsg({ type: "error", text: "Mật khẩu mới và xác nhận mật khẩu không trùng khớp" });
      return;
    }

    setResetLoading(true);
    try {
      const res = await fetch("/api/v1/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identity: resetIdentity,
          otp: resetOtpCode,
          newPassword: resetNewPassword,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResetMsg({ type: "success", text: "Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay." });
        setTimeout(() => {
          setShowForgotPassword(false);
          setIdentity(resetIdentity);
          setPassword(resetNewPassword);
        }, 1800);
      } else {
        setResetMsg({ type: "error", text: data.error || "Đặt lại mật khẩu thất bại" });
      }
    } catch {
      setResetMsg({ type: "error", text: "Lỗi kết nối máy chủ" });
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md space-y-4">
      <Button variant="ghost" onClick={() => router.back()} className="mb-2">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Quay lai
      </Button>

      <Card className="w-full shadow-lg border">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Car className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl font-bold">AUTO DEALERSHIP</CardTitle>
          </div>
          <CardDescription>Đăng nhập vào hệ thống quản lý & bán xe</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border text-xs space-y-2">
            <div className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
              <UserCheck className="h-3.5 w-3.5 text-primary" />
              <span>Tài khoản Demo (Click để tự động nhập):</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => quickFillAccount(acc.email)}
                  className="flex items-center justify-between p-1.5 rounded bg-white dark:bg-slate-800 border hover:border-primary text-left text-[11px] transition-colors"
                >
                  <span className="font-medium truncate">{acc.name.split(" ")[0]}</span>
                  <Badge variant="outline" className="text-[9px] px-1 py-0">{acc.role}</Badge>
                </button>
              ))}
            </div>
          </div>

          <Tabs defaultValue="password">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="password">Mật khẩu</TabsTrigger>
              <TabsTrigger value="otp">Mã OTP SMS</TabsTrigger>
            </TabsList>

            <TabsContent value="password">
              <form onSubmit={handlePasswordLogin} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="identity">Email / Số điện thoại</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="identity"
                      placeholder="admin@autodealer.vn"
                      value={identity}
                      onChange={(e) => setIdentity(e.target.value)}
                      className="pl-9"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Mật khẩu</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
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
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                    />
                    <span>Ghi nhớ đăng nhập</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-primary hover:underline font-medium"
                  >
                    Quên mật khẩu?
                  </button>
                </div>

                {error && <p className="text-sm text-destructive font-medium">{error}</p>}

                <Button type="submit" className="w-full" disabled={loading}>
                  <Lock className="h-4 w-4 mr-2" />
                  {loading ? "Đang xử lý..." : "Đăng nhập"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="otp">
              <form onSubmit={handleOTPLogin} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="otpPhone">Số điện thoại nhận mã OTP</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="otpPhone"
                      placeholder="0912345678"
                      value={otpPhone}
                      onChange={(e) => setOtpPhone(e.target.value)}
                      className="pl-9"
                      required
                    />
                  </div>
                </div>
                {!otpSent ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleSendOTP}
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Gửi mã xác thực OTP
                  </Button>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="otpCode">Nhập mã OTP 6 chữ số</Label>
                      <Input
                        id="otpCode"
                        placeholder="888888"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        className="text-center text-2xl tracking-[0.5em]"
                        required
                      />
                      <p className="text-xs text-muted-foreground text-center">
                        {countdown > 0
                          ? `Mã hết hạn sau: ${countdown}s`
                          : ""}
                        {countdown === 0 && otpSent && (
                          <button
                            type="button"
                            onClick={handleSendOTP}
                            className="text-primary ml-2 underline"
                          >
                            Gửi lại mã
                          </button>
                        )}
                      </p>
                    </div>
                    {error && <p className="text-sm text-destructive font-medium">{error}</p>}
                    <Button type="submit" className="w-full" disabled={loading}>
                      <Lock className="h-4 w-4 mr-2" />
                      {loading ? "Đang xử lý..." : "Xác nhận & Đăng nhập"}
                    </Button>
                  </>
                )}
                <p className="text-xs text-muted-foreground text-center">
                  Sandbox: Mã OTP cố định là 888888
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Forgot Password Modal Dialog */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowForgotPassword(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-primary" />
                Quen mat khau tai khoan
              </CardTitle>
              <CardDescription>
                Nhap Email/SĐT de nhan ma khoi phuc mat khau qua SMS OTP (Mock Sandbox: 888888)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {resetMsg && (
                <div className={`p-3 rounded-lg border flex items-center gap-2 text-xs ${
                  resetMsg.type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"
                }`}>
                  {resetMsg.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                  <span>{resetMsg.text}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label>Email hoac So dien thoai</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="0912345678"
                    value={resetIdentity}
                    onChange={(e) => setResetIdentity(e.target.value)}
                    disabled={resetOtpSent}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSendResetOTP}
                    disabled={resetLoading || (resetOtpSent && resetCountdown > 0)}
                  >
                    {resetOtpSent ? `${resetCountdown}s` : "Gui OTP"}
                  </Button>
                </div>
              </div>

              {resetOtpSent && (
                <form onSubmit={handleResetPasswordSubmit} className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label>Ma OTP 6 chu so</Label>
                    <Input
                      placeholder="888888"
                      maxLength={6}
                      value={resetOtpCode}
                      onChange={(e) => setResetOtpCode(e.target.value)}
                      className="text-center font-mono tracking-widest text-lg"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mat khau moi</Label>
                    <Input
                      type="password"
                      placeholder="Mat khau moi (min 8 ky tu, 1 hoa, 1 so)"
                      value={resetNewPassword}
                      onChange={(e) => setResetNewPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Xac nhan mat khau moi</Label>
                    <Input
                      type="password"
                      placeholder="Nhap lai mat khau moi"
                      value={resetConfirmPassword}
                      onChange={(e) => setResetConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={resetLoading}>
                    <Lock className="h-4 w-4 mr-2" />
                    {resetLoading ? "Dang dat lai..." : "Dat lai mat khau"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
