"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { User, Shield, Save, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function ProfilePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    identityCardNumber: "",
    identityCardDate: "",
    identityCardPlace: "",
    permanentAddress: "",
    monthlyIncome: "",
  });

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
    try {
      await fetch("/api/v1/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="animate-pulse h-96 bg-muted rounded" />;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Quay lai
      </Button>

      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <User className="h-6 w-6" />
        Thong tin tai khoan & Ho so phap ly
      </h1>

      <form onSubmit={handleSave} className="space-y-6">
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
                <p className="text-xs text-muted-foreground">Da xac thuc</p>
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
                Ho so CCCD
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
                  Duoc ma hoa AES-256 qua Mock KMS
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
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <Button type="submit" disabled={saving} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Dang luu..." : "Luu thay doi ho so"}
        </Button>
      </form>
    </div>
  );
}
