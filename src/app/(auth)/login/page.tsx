"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Car, Eye, EyeOff, Lock, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/catalog";

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");

  const [otpPhone, setOtpPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      identity,
      password,
      mode: "password",
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      const errorMap: Record<string, string> = {
        ERR_UI_003: "Sai thong tin dang nhap. Vui long thu lai.",
        ERR_UI_004: "Tai khoan bi khoa 30 phut do nhap sai qua nhieu.",
        CredentialsSignin: "Sai thong tin dang nhap.",
      };
      setError(errorMap[result.error] || "Dang nhap that bai.");
    } else {
      router.push(redirect);
      router.refresh();
    }
  }

  async function handleSendOTP() {
    if (!otpPhone) return;
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
  }

  async function handleOTPLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      identity: otpPhone,
      otp: otpCode,
      mode: "otp",
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError(
        result.error === "ERR_UI_005"
          ? "Ma OTP khong hop le hoac da het han."
          : "Dang nhap that bai."
      );
    } else {
      router.push(redirect);
      router.refresh();
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Car className="h-8 w-8 text-primary" />
          <CardTitle className="text-2xl">AUTO DEALERSHIP</CardTitle>
        </div>
        <CardDescription>Dang nhap vao he thong</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="password">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="password">Mat khau</TabsTrigger>
            <TabsTrigger value="otp">Ma OTP SMS</TabsTrigger>
          </TabsList>

          <TabsContent value="password">
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="identity">Email / So dien thoai</Label>
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
                <Label htmlFor="password">Mat khau</Label>
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
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                <Lock className="h-4 w-4 mr-2" />
                {loading ? "Dang xu ly..." : "Dang nhap"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="otp">
            <form onSubmit={handleOTPLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otpPhone">So dien thoai nhan ma OTP</Label>
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
                  Gui ma xac thuc OTP
                </Button>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="otpCode">Nhap ma OTP 6 chu so</Label>
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
                        ? `Ma het han sau: ${countdown}s`
                        : ""}
                      {countdown === 0 && otpSent && (
                        <button
                          type="button"
                          onClick={handleSendOTP}
                          className="text-primary ml-2 underline"
                        >
                          Gui lai ma
                        </button>
                      )}
                    </p>
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button type="submit" className="w-full" disabled={loading}>
                    <Lock className="h-4 w-4 mr-2" />
                    {loading ? "Dang xu ly..." : "Xac nhan & Dang nhap"}
                  </Button>
                </>
              )}
              <p className="text-xs text-muted-foreground text-center">
                Sandbox: Ma OTP co dinh la 888888
              </p>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
