"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Phone, Link as LinkIcon, Search, Filter, Calendar, UserCheck, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

interface Lead {
  id: string;
  customerName: string;
  phone: string;
  email: string;
  interestedVariant: string;
  leadStatus: string;
  leadScore: number;
  assignedSaleId?: string;
  assignedSaleName?: string;
  updatedAt: string;
}

const COLUMNS = [
  { id: "NEW", label: "Mới tiếp nhận", color: "bg-blue-50/80 border-blue-200" },
  { id: "CONTACTED", label: "Đã liên lạc", color: "bg-amber-50/80 border-amber-200" },
  { id: "TEST_DRIVE_BOOKED", label: "Hẹn lái thử", color: "bg-emerald-50/80 border-emerald-200" },
  { id: "NEGOTIATING", label: "Đàm phán / Vay", color: "bg-purple-50/80 border-purple-200" },
  { id: "WON", label: "Thành công", color: "bg-teal-50/80 border-teal-200" },
];

function maskPhone(phone: string) {
  if (!phone || phone.length < 8) return phone || "";
  return phone.slice(0, 4) + "****" + phone.slice(-2);
}

function getScoreBadge(score: number) {
  if (score >= 80) return { label: "Hot (>=80)", variant: "destructive" as const };
  if (score >= 50) return { label: "Warm (50-79)", variant: "warning" as const };
  return { label: "Cold (<50)", variant: "secondary" as const };
}

export default function CRMPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const isManager = session?.user?.role && ["ADMIN", "MANAGER"].includes(session.user.role);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [salesList, setSalesList] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [scoreFilter, setScoreFilter] = useState("all");

  // Call modal
  const [callingLead, setCallingLead] = useState<Lead | null>(null);

  // Assign lead dialog
  const [assigningLead, setAssigningLead] = useState<Lead | null>(null);
  const [selectedSaleId, setSelectedSaleId] = useState("");

  // Paylink modal
  const [paylinkSuccess, setPaylinkSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchLeads();
    if (isManager) {
      fetchSales();
    }
  }, [isManager]);

  async function fetchLeads() {
    try {
      const res = await fetch("/api/v1/crm/leads");
      const data = await res.json();
      if (data.success) setLeads(data.data);
    } finally {
      setLoading(false);
    }
  }

  async function fetchSales() {
    try {
      const res = await fetch("/api/v1/admin/users?role=SALE");
      const data = await res.json();
      if (data.success) setSalesList(data.data);
    } catch {
      // error
    }
  }

  async function updateLeadStatus(leadId: string, newStatus: string) {
    await fetch(`/api/v1/crm/leads/${leadId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchLeads();
  }

  async function handleAssignLead() {
    if (!assigningLead || !selectedSaleId) return;
    try {
      await fetch(`/api/v1/crm/leads/${assigningLead.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedSaleId: selectedSaleId }),
      });
      setAssigningLead(null);
      fetchLeads();
    } catch {
      // error
    }
  }

  async function handleSendPaylink(lead: Lead) {
    try {
      const res = await fetch(`/api/v1/orders/deposit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId: "default_variant",
          selectedColor: "Đen",
          paymentMethod: "MOCK_VIETQR",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPaylinkSuccess(`Đã tạo & gửi PayLink thành công cho ${lead.customerName}! Mã đơn: ${data.data.orderId || data.data.id}`);
      }
    } catch {
      alert("Không thể gửi Paylink. Vui lòng thử lại.");
    }
  }

  const filteredLeads = leads.filter((l) => {
    if (search && !l.customerName.toLowerCase().includes(search.toLowerCase()) && !l.phone.includes(search)) {
      return false;
    }
    if (scoreFilter === "hot" && l.leadScore < 80) return false;
    if (scoreFilter === "warm" && (l.leadScore < 50 || l.leadScore >= 80)) return false;
    if (scoreFilter === "cold" && l.leadScore >= 50) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Quản Lý Phễu CRM Leads & Quick Actions (SCR-06)</h1>
          <p className="text-sm text-muted-foreground">Theo dõi hành trình khách hàng & gọi điện 1-click, đặt lịch lái thử, gửi Paylink</p>
        </div>
        {isManager && (
          <Badge variant="outline" className="px-3 py-1 text-sm font-medium">
            <UserCheck className="h-4 w-4 mr-1 text-primary" /> Store Manager Mode
          </Badge>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên khách hàng hoặc SĐT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={scoreFilter} onValueChange={setScoreFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Điểm Phễu Lead" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả điểm số</SelectItem>
            <SelectItem value="hot">🔥 Hot Lead (&gt;=80)</SelectItem>
            <SelectItem value="warm">⚡ Warm Lead (50-79)</SelectItem>
            <SelectItem value="cold">❄️ Cold Lead (&lt;50)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Paylink Toast Notification */}
      {paylinkSuccess && (
        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex justify-between items-center">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <span>{paylinkSuccess}</span>
          </div>
          <Button size="sm" variant="ghost" onClick={() => setPaylinkSuccess(null)}>Đóng</Button>
        </div>
      )}

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto">
        {COLUMNS.map((col) => {
          const columnLeads = filteredLeads.filter((l) => l.leadStatus === col.id);
          return (
            <div key={col.id} className={`rounded-xl p-3 border ${col.color} min-h-[520px]`}>
              <div className="flex items-center justify-between pb-3 mb-3 border-b">
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">{col.label}</h3>
                <Badge variant="secondary" className="font-mono font-bold">
                  {columnLeads.length}
                </Badge>
              </div>

              <div className="space-y-3">
                {columnLeads.map((lead) => {
                  const score = getScoreBadge(lead.leadScore);
                  const timeDiff = Date.now() - new Date(lead.updatedAt).getTime();
                  const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));

                  return (
                    <Card key={lead.id} className="shadow-sm hover:shadow-md transition-all border">
                      <CardContent className="p-3.5 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-bold text-sm">{lead.customerName}</p>
                            <p className="text-xs text-muted-foreground font-mono">{maskPhone(lead.phone)}</p>
                          </div>
                          <Badge variant={score.variant} className="text-[10px] px-1.5 py-0.5">
                            {score.label}
                          </Badge>
                        </div>

                        {lead.interestedVariant && (
                          <div className="text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded">
                            <span className="text-muted-foreground">Quan tâm: </span>
                            <span className="font-semibold text-foreground">{lead.interestedVariant}</span>
                          </div>
                        )}

                        {lead.assignedSaleName && (
                          <p className="text-xs text-primary font-medium flex items-center gap-1">
                            <UserCheck className="h-3 w-3" /> Sale: {lead.assignedSaleName}
                          </p>
                        )}

                        {/* Status Select dropdown */}
                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                          <span>{hoursAgo < 1 ? "Vừa cập nhật" : `${hoursAgo}h trước`}</span>
                          <select
                            value={lead.leadStatus}
                            onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                            className="text-xs bg-background border rounded px-1.5 py-1 text-foreground"
                          >
                            {COLUMNS.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Quick-Action Bar */}
                        <div className="pt-2 border-t flex flex-wrap gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs flex-1 px-2"
                            onClick={() => setCallingLead(lead)}
                          >
                            <Phone className="h-3 w-3 mr-1 text-emerald-600" />
                            Gọi 1-Click
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs flex-1 px-2"
                            onClick={() => router.push(`/test-drive?customer_name=${encodeURIComponent(lead.customerName)}&phone=${lead.phone}`)}
                          >
                            <Calendar className="h-3 w-3 mr-1 text-blue-600" />
                            Lái thử
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs px-2"
                            onClick={() => handleSendPaylink(lead)}
                          >
                            <Send className="h-3 w-3 text-purple-600" />
                          </Button>

                          {isManager && (
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-7 text-xs px-2"
                              title="Phân bổ Sale"
                              onClick={() => {
                                setAssigningLead(lead);
                                setSelectedSaleId(lead.assignedSaleId || "");
                              }}
                            >
                              <UserCheck className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* 1-Click Call Modal */}
      <Dialog open={!!callingLead} onOpenChange={() => setCallingLead(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-emerald-600 animate-bounce" />
              1-Click Call Simulator (SCR-06)
            </DialogTitle>
            <DialogDescription>Giả lập cuộc gọi thoại trực tiếp cho Lead khách hàng</DialogDescription>
          </DialogHeader>
          {callingLead && (
            <div className="space-y-4 py-2">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl text-center space-y-1 border border-emerald-200">
                <p className="font-bold text-lg">{callingLead.customerName}</p>
                <p className="font-mono text-xl font-bold text-emerald-600">{callingLead.phone}</p>
                <p className="text-xs text-muted-foreground">Đang kết nối Voip tổng đài showroom...</p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold">Ghi chú cuộc gọi nhanh:</p>
                <Input placeholder="Khách hẹn chiều xem xe / Muốn làm hồ sơ vay Vietcombank..." />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCallingLead(null)}>Hủy bỏ</Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => {
                if (callingLead) updateLeadStatus(callingLead.id, "CONTACTED");
                setCallingLead(null);
              }}
            >
              Hoàn thành cuộc gọi & Cập nhật
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Sale Dialog for Store Manager */}
      <Dialog open={!!assigningLead} onOpenChange={() => setAssigningLead(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              Phân bổ Lead cho Sale Consultant
            </DialogTitle>
            <DialogDescription>Gán khách hàng tiềm năng cho nhân viên tư vấn chịu trách nhiệm theo dõi</DialogDescription>
          </DialogHeader>
          {assigningLead && (
            <div className="space-y-4 py-2">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border text-sm">
                <p className="font-semibold">{assigningLead.customerName} ({assigningLead.phone})</p>
                <p className="text-xs text-muted-foreground">Xe quan tâm: {assigningLead.interestedVariant || "Chưa chọn"}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Chọn Sale Consultant chi nhánh:</label>
                <Select value={selectedSaleId} onValueChange={setSelectedSaleId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn tư vấn bán hàng..." />
                  </SelectTrigger>
                  <SelectContent>
                    {salesList.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                    {salesList.length === 0 && (
                      <SelectItem value="demo_sale">Sale Ngô Văn B (Showroom 1)</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssigningLead(null)}>Hủy</Button>
            <Button onClick={handleAssignLead}>Lưu gán Sale</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
