"use client";

/* eslint-disable @next/next/no-img-element */
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { User, Shield, Save, ArrowLeft, Lock, CheckCircle2, AlertCircle, Upload, Image as ImageIcon, Store, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export default function ProfilePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [profile, setProfile] = useState<any>(null);
  const [showrooms, setShowrooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showPwdModal, setShowPwdModal] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    showroomId: "",
    identityCardNumber: "",
    identityCardDate: "",
    identityCardPlace: "",
    permanentAddress: "",
    monthlyIncome: "",
  });

  const [cccdFront, setCccdFront] = useState<string | null>(null);
  const [cccdBack, setCccdBack] = useState<string | null>(null);

  const [pwdForm, setPwdForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/v1/users/profile").then((r) => r.json()),
      fetch("/api/v1/showrooms").then((r) => r.json()),
    ])
      .then(([profileRes, showroomsRes]) => {
        if (profileRes.success) {
          setProfile(profileRes.data);
          setForm({
            fullName: profileRes.data.fullName || "",
            email: profileRes.data.email || "",
            showroomId: profileRes.data.showroomId || "",
            identityCardNumber: profileRes.data.identityCardMasked || "",
            identityCardDate: profileRes.data.identityCardDate || "",
            identityCardPlace: profileRes.data.identityCardPlace || "Cục CSQLHC về TTXH",
            permanentAddress: profileRes.data.permanentAddress || "",
            monthlyIncome: profileRes.data.monthlyIncome || "",
          });
        }
        if (showroomsRes.success) {
          setShowrooms(showroomsRes.data || []);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>, side: "front" | "back") {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (side === "front") setCccdFront(reader.result as string);
        else setCccdBack(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setProfileMsg(null);

    // Client-side validations
    if (form.fullName.trim().length < 2 || form.fullName.trim().length > 100) {
      setProfileMsg({ type: "error", text: "Họ và tên phải từ 2 đến 100 ký tự (ERR_UI_048)" });
      return;
    }

    if (form.identityCardNumber && !form.identityCardNumber.includes("*")) {
      if (!/^[0-9]{12}$/.test(form.identityCardNumber)) {
        setProfileMsg({ type: "error", text: "Số CCCD phải đủ 12 chữ số chuẩn (ERR_UI_048)" });
        return;
      }
    }

    if (form.identityCardDate && new Date(form.identityCardDate) > new Date()) {
      setProfileMsg({ type: "error", text: "Ngày cấp CCCD không thể vượt quá ngày hiện tại (ERR_UI_048)" });
      return;
    }

    if (form.permanentAddress && (form.permanentAddress.trim().length < 10 || form.permanentAddress.trim().length > 255)) {
      setProfileMsg({ type: "error", text: "Địa chỉ HKTT phải từ 10 đến 255 ký tự (ERR_UI_048)" });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/v1/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setProfileMsg({ type: "success", text: "Cập nhật hồ sơ cá nhân thành công!" });
      } else {
        setProfileMsg({ type: "error", text: data.error || "Cập nhật hồ sơ thất bại" });
      }
    } catch {
      setProfileMsg({ type: "error", text: "Lỗi kết nối máy chủ" });
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwdMsg(null);

    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      setPwdMsg({ type: "error", text: "Mật khẩu mới và xác nhận mật khẩu không trùng khớp" });
      return;
    }

    setPwdSaving(true);
    try {
      const res = await fetch("/api/v1/users/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: pwdForm.currentPassword,
          newPassword: pwdForm.newPassword,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPwdMsg({ type: "success", text: "Đổi mật khẩu tài khoản thành công!" });
        setPwdForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        setPwdMsg({ type: "error", text: data.error || "Đổi mật khẩu thất bại" });
      }
    } catch {
      setPwdMsg({ type: "error", text: "Lỗi kết nối máy chủ" });
    } finally {
      setPwdSaving(false);
    }
  }

  if (loading) {
    return <div className="animate-pulse h-96 bg-muted rounded" />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => router.back()} className="mb-2">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Quay lại
      </Button>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <User className="h-6 w-6 text-primary" />
          Thông Tin Tài Khoản & Hồ Sơ Pháp Lý (SCR-00-PROF)
        </h1>
        {profile?.role && (
          <Badge variant="outline" className="text-sm px-3 py-1 font-semibold">
            Role: {profile.role}
          </Badge>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {profileMsg && (
          <div className={`p-4 rounded-lg border flex items-center gap-3 text-sm font-medium ${
            profileMsg.type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"
          }`}>
            {profileMsg.type === "success" ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
            <span>{profileMsg.text}</span>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Card 1: Basic Contact Info */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                1. Thông Tin Liên Hệ Cơ Bản
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Họ và tên (*)</Label>
                <Input
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder="Nguyễn Văn A"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Số điện thoại</Label>
                <div className="relative">
                  <Input value={session?.user?.phone || profile?.phone || ""} disabled className="bg-slate-100 dark:bg-slate-800" />
                  <span className="absolute right-3 top-2.5 text-xs text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> (Đã xác thực)
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Email nhận thông báo (*)</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="nguyenvana@gmail.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Store className="h-3.5 w-3.5 text-slate-500" />
                  Showroom quen thuộc
                </Label>
                <select
                  value={form.showroomId}
                  onChange={(e) => setForm({ ...form, showroomId: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">-- Chọn Showroom mua bán / lái thử --</option>
                  {showrooms.map((sr) => (
                    <option key={sr.id} value={sr.id}>
                      {sr.name} ({sr.city || "Việt Nam"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 border-t mt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2 border-primary/40 hover:bg-primary/5 text-primary font-semibold"
                  onClick={() => {
                    setShowPwdModal(true);
                    document.getElementById("password-section")?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  <Lock className="h-4 w-4" />
                  🔒 ĐỔI MẬT KHẨU TÀI KHOẢN
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: CCCD & Legal Profile */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                2. Hồ Sơ Căn Cước Công Dân (CCCD)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Số CCCD (*)</Label>
                <Input
                  value={form.identityCardNumber}
                  onChange={(e) => setForm({ ...form, identityCardNumber: e.target.value })}
                  placeholder="001200001234"
                  maxLength={12}
                />
                <p className="text-[11px] text-muted-foreground">
                  Mã hóa AES-256 qua Mock KMS (Masking UI: 00120000****)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Ngày cấp (*)</Label>
                  <Input
                    type="date"
                    value={form.identityCardDate}
                    onChange={(e) => setForm({ ...form, identityCardDate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Nơi cấp (*)</Label>
                  <Input
                    value={form.identityCardPlace}
                    onChange={(e) => setForm({ ...form, identityCardPlace: e.target.value })}
                    placeholder="Cục CSQLHC về TTXH"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Địa chỉ HKTT (*)</Label>
                <textarea
                  value={form.permanentAddress}
                  onChange={(e) => setForm({ ...form, permanentAddress: e.target.value })}
                  rows={2}
                  className="w-full p-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Số 12 Đường Cầu Giấy, Phường Quan Hoa, Quận Cầu Giấy, Hà Nội"
                />
              </div>

              <div className="space-y-2">
                <Label>Thu nhập hàng tháng (VNĐ)</Label>
                <Input
                  type="number"
                  value={form.monthlyIncome}
                  onChange={(e) => setForm({ ...form, monthlyIncome: e.target.value })}
                  placeholder="30000000"
                />
                <p className="text-[11px] text-muted-foreground">Phục vụ tự động xét duyệt hạn mức vay ngân hàng</p>
              </div>

              {/* CCCD Front and Back Document Uploads */}
              <div className="space-y-2 pt-1">
                <Label className="text-xs font-semibold">Ảnh Giấy Tờ CCCD Legal:</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="border border-dashed rounded-lg p-3 text-center bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center min-h-[90px] relative">
                    {cccdFront ? (
                      <img src={cccdFront} alt="CCCD Mặt Trước" className="h-16 object-cover rounded" />
                    ) : (
                      <>
                        <ImageIcon className="h-6 w-6 text-slate-400 mb-1" />
                        <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Mặt trước</span>
                      </>
                    )}
                    <label className="mt-1 cursor-pointer">
                      <span className="text-[10px] text-primary underline flex items-center gap-1">
                        <Upload className="h-3 w-3" /> Tải ảnh
                      </span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, "front")} />
                    </label>
                  </div>

                  <div className="border border-dashed rounded-lg p-3 text-center bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center min-h-[90px] relative">
                    {cccdBack ? (
                      <img src={cccdBack} alt="CCCD Mặt Sau" className="h-16 object-cover rounded" />
                    ) : (
                      <>
                        <ImageIcon className="h-6 w-6 text-slate-400 mb-1" />
                        <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Mặt sau</span>
                      </>
                    )}
                    <label className="mt-1 cursor-pointer">
                      <span className="text-[10px] text-primary underline flex items-center gap-1">
                        <Upload className="h-3 w-3" /> Tải ảnh
                      </span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, "back")} />
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mascot Notice & Save Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🦊</span>
            <div className="text-xs text-amber-900 dark:text-amber-200">
              <span className="font-bold">Mascot Cáo Bảo Mật:</span> Thông tin CCCD và thu nhập cá nhân của bạn được mã hóa bảo vệ tuyệt đối qua AWS KMS (mã hóa chuẩn mã hóa AES-256-GCM).
            </div>
          </div>
          <Button type="submit" disabled={saving} size="lg" className="w-full sm:w-auto px-8 shrink-0">
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Đang lưu..." : "LƯU THAY ĐỔI HỒ SƠ"}
          </Button>
        </div>
      </form>

      <Separator className="my-8" />

      {/* Change Password Card */}
      <Card id="password-section" className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Lock className="h-4 w-4 text-primary" />
            Đổi Mật Khẩu Tài Khoản
          </CardTitle>
          <CardDescription>Mật khẩu tối thiểu 8 ký tự, bao gồm ít nhất 1 chữ hoa và 1 chữ số</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            {pwdMsg && (
              <div className={`p-3 rounded-lg border flex items-center gap-2 text-sm ${
                pwdMsg.type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"
              }`}>
                {pwdMsg.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                <span>{pwdMsg.text}</span>
              </div>
            )}
            <div className="space-y-2">
              <Label>Mật khẩu hiện tại (*)</Label>
              <Input
                type="password"
                value={pwdForm.currentPassword}
                onChange={(e) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Mật khẩu mới (*)</Label>
              <Input
                type="password"
                value={pwdForm.newPassword}
                onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Xác nhận mật khẩu mới (*)</Label>
              <Input
                type="password"
                value={pwdForm.confirmPassword}
                onChange={(e) => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })}
                required
              />
            </div>
            <Button type="submit" disabled={pwdSaving}>
              <Lock className="h-4 w-4 mr-2" />
              {pwdSaving ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password Change Modal Dialog Triggered from Section 1 */}
      {showPwdModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowPwdModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                Đổi Mật Khẩu Tài Khoản
              </CardTitle>
              <CardDescription>
                Mật khẩu tối thiểu 8 ký tự, bao gồm ít nhất 1 chữ hoa và 1 chữ số
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={async (e) => {
                await handleChangePassword(e);
                if (pwdMsg?.type === "success") {
                  setTimeout(() => setShowPwdModal(false), 1500);
                }
              }} className="space-y-4">
                {pwdMsg && (
                  <div className={`p-3 rounded-lg border flex items-center gap-2 text-sm ${
                    pwdMsg.type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"
                  }`}>
                    {pwdMsg.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                    <span>{pwdMsg.text}</span>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Mật khẩu hiện tại (*)</Label>
                  <Input
                    type="password"
                    value={pwdForm.currentPassword}
                    onChange={(e) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mật khẩu mới (*)</Label>
                  <Input
                    type="password"
                    value={pwdForm.newPassword}
                    onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Xác nhận mật khẩu mới (*)</Label>
                  <Input
                    type="password"
                    value={pwdForm.confirmPassword}
                    onChange={(e) => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={pwdSaving}>
                  <Lock className="h-4 w-4 mr-2" />
                  {pwdSaving ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
