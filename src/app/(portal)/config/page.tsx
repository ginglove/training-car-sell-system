"use client";

import { useState, useEffect } from "react";
import { Settings, Save, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { formatVND } from "@/lib/utils";

export default function SystemConfigPage() {
  const [configs, setConfigs] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchConfigs();
  }, []);

  async function fetchConfigs() {
    try {
      const res = await fetch("/api/v1/system/configs");
      const data = await res.json();
      if (data.success) setConfigs(data.data);
    } catch {
      // Error handling
    } finally {
      setLoading(false);
    }
  }

  async function handleSavePolicy(policyId: string) {
    setSaving(true);
    try {
      const values = editValues[policyId];
      if (!values) return;
      await fetch("/api/v1/system/configs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policyId, ...values }),
      });
      fetchConfigs();
    } finally {
      setSaving(false);
    }
  }

  function updatePolicyField(policyId: string, field: string, value: any) {
    setEditValues((prev) => ({
      ...prev,
      [policyId]: { ...(prev[policyId] || {}), [field]: value },
    }));
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Cấu Hình Hệ Thống
        </h1>
        <Button variant="outline" onClick={fetchConfigs}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* System Parameters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tham số hệ thống</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">Tiền cọc mặc định</span>
              <span className="font-semibold">{formatVND(configs?.defaultDepositAmount || "50000000")}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">Timeout soft-lock</span>
              <span className="font-semibold">{configs?.softLockTimeoutMinutes || 3} phút</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">VIN hold timeout</span>
              <span className="font-semibold">{configs?.vinHoldTimeoutHours || 24} giờ</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">SLA hoàn cọc</span>
              <span className="font-semibold">{configs?.refundSlaDays || 3} ngày</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">Số lần đổi bank tối đa</span>
              <span className="font-semibold">{configs?.maxBankSwitchCount || 3}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-muted-foreground">Tỷ lệ vay tối đa</span>
              <span className="font-semibold">{configs?.maxLoanPercent || 80}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Discount Policies */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Chính sách chiết khấu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {(configs?.policies || []).map((policy: any) => (
              <div key={policy.id} className="space-y-3 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <Badge variant={policy.role === "ADMIN" ? "default" : "secondary"}>
                    {policy.role}
                  </Badge>
                  <Badge variant={policy.isActive ? "default" : "outline"}>
                    {policy.isActive ? "Đang hoạt động" : "Tạm ngưng"}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">% Chiết khấu tối đa</Label>
                    <Input
                      type="number"
                      step="0.01"
                      max="10"
                      defaultValue={policy.maxDiscountPercentage}
                      onChange={(e) =>
                        updatePolicyField(policy.id, "maxDiscountPercentage", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Số tiền CK tối đa</Label>
                    <Input
                      type="number"
                      defaultValue={policy.maxDiscountAmount}
                      onChange={(e) =>
                        updatePolicyField(policy.id, "maxDiscountAmount", e.target.value)
                      }
                    />
                  </div>
                </div>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => handleSavePolicy(policy.id)}
                  disabled={saving}
                >
                  <Save className="h-3 w-3 mr-1" />
                  Lưu thay đổi
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
