"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { User, Shield, Save, ArrowLeft, Lock, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function ProfilePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    identityCardNumber: "",
    identityCardDate: "",
    identityCardPlace: "",
    permanentAddress: "",
    monthlyIncome: "",
  });

  const [pwdForm, setPwdForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/v1/users/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setProfile(d.data);
          setForm({
            fullName: d.data.fullName || "",
            email: d.data.email || "",
            identityCardNumber: d.data.identityCardMasked || "",
            identityCardDate: d.data.identityCardDate || "",
            identityCardPlace: d.data.identityCardPlace || "",
            permanentAddress: d.data.permanentAddress || "",
            monthlyIncome: d.data.monthlyIncome || "",
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setProfileMsg(null);
    try {
      const res = await fetch("/api/v1/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setProfileMsg({ type: "success", text: "Cap nhat ho so ca nhan thanh cong!" });
      } else {
        setProfileMsg({ type: "error", text: data.error || "Cap nhat ho so thất bại" });
      }
    } catch {
      setProfileMsg({ type: "error", text: "Loi ket noi server" });
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwdMsg(null);

    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      setPwdMsg({ type: "error", text: "Mat khau moi va xac nhan mat khau khong trung khớp" });
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
        setPwdMsg({ type: "success", text: "Doi mat khau thanh cong!" });
        setPwdForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        setPwdMsg({ type: "error", text: data.error || "Doi mat khau that bai" });
      }
    } catch {
      setPwdMsg({ type: "error", text: "Loi ket noi server" });
    } finally {
      setPwdSaving(false);
    }
  }

  if (loading) {
    return <div className="animate-pulse h-96 bg-muted rounded" />;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => router.back()} className="mb-2">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Quay lai
      </Button>

      <h1 className="text-2xl font-bold flex items-center gap-2">
        <User className="h-6 w-6" />
        Thong tin tai khoan & Ho so phap ly (SCR-00-PROF)
      </h1>

      <form onSubmit={handleSave} className="space-y-6">
        {profileMsg && (
          <div className={`p-3 rounded-lg border flex items-center gap-2 text-sm ${
            profileMsg.type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"
          }`}>
            {profileMsg.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <span>{profileMsg.text}</span>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Thong tin lien he</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Ho va ten</Label>
                <Input
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>So dien thoai</Label>
                <Input value={session?.user?.phone || ""} disabled />
                <p className="text-xs text-muted-foreground">Da xac thuc qua OTP</p>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Ho so CCCD & Thu nhập
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>So CCCD</Label>
                <Input
                  value={form.identityCardNumber}
                  onChange={(e) => setForm({ ...form, identityCardNumber: e.target.value })}
                  placeholder="001200001234"
                  maxLength={12}
                />
                <p className="text-xs text-muted-foreground">
                  Ma hoa AES-256 qua KMS (100% masking dạng 00120000****)
                </p>
              </div>
              <div className="space-y-2">
                <Label>Ngay cap</Label>
                <Input
                  type="date"
                  value={form.identityCardDate}
                  onChange={(e) => setForm({ ...form, identityCardDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Noi cap</Label>
                <Input
                  value={form.identityCardPlace}
                  onChange={(e) => setForm({ ...form, identityCardPlace: e.target.value })}
                  placeholder="Cuc CSQLHC ve TTXH"
                />
              </div>
              <div className="space-y-2">
                <Label>Dia chi HKTT</Label>
                <Input
                  value={form.permanentAddress}
                  onChange={(e) => setForm({ ...form, permanentAddress: e.target.value })}
                  placeholder="So nha, Duong, Phuong/Xa, Quan/Huyen..."
                />
              </div>
              <div className="space-y-2">
                <Label>Thu nhap hang thang (VND)</Label>
                <Input
                  type="number"
                  value={form.monthlyIncome}
                  onChange={(e) => setForm({ ...form, monthlyIncome: e.target.value })}
                  placeholder="30000000"
                />
                <p className="text-xs text-muted-foreground">Phuc vu duyet vay ngan hang tu dong</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Button type="submit" disabled={saving} className="w-full" size="lg">
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Dang luu..." : "Luu thay doi ho so"}
        </Button>
      </form>

      <Separator className="my-6" />

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Doi mat khau tai khoan
          </CardTitle>
          <CardDescription>Mat khau toi thieu 8 ky tu, bao gom chu hoa va chu so</CardDescription>
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
              <Label>Mat khau hien tai</Label>
              <Input
                type="password"
                value={pwdForm.currentPassword}
                onChange={(e) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Mat khau moi</Label>
              <Input
                type="password"
                value={pwdForm.newPassword}
                onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Xac nhan mat khau moi</Label>
              <Input
                type="password"
                value={pwdForm.confirmPassword}
                onChange={(e) => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })}
                required
              />
            </div>
            <Button type="submit" disabled={pwdSaving}>
              <Lock className="h-4 w-4 mr-2" />
              {pwdSaving ? "Dang cap nhat..." : "Cap nhat mat khau"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
