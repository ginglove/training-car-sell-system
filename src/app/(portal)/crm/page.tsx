"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Phone, Link as LinkIcon, Search, Filter, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Lead {
  id: string;
  customerName: string;
  phone: string;
  email: string;
  interestedVariant: string;
  leadStatus: string;
  leadScore: number;
  updatedAt: string;
}

const COLUMNS = [
  { id: "NEW", label: "Moi tiep nhan", color: "bg-blue-100" },
  { id: "CONTACTED", label: "Da lien lac", color: "bg-yellow-100" },
  { id: "TEST_DRIVE_BOOKED", label: "Hen lai thu", color: "bg-green-100" },
  { id: "NEGOTIATING", label: "Dam phan / Vay", color: "bg-purple-100" },
  { id: "WON", label: "Thanh cong", color: "bg-emerald-100" },
];

function maskPhone(phone: string) {
  if (phone.length < 8) return phone;
  return phone.slice(0, 4) + "****" + phone.slice(-2);
}

function getScoreBadge(score: number) {
  if (score >= 80) return { label: "Hot", variant: "destructive" as const };
  if (score >= 50) return { label: "Warm", variant: "warning" as const };
  return { label: "Cold", variant: "secondary" as const };
}

export default function CRMPage() {
  const { data: session } = useSession();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [scoreFilter, setScoreFilter] = useState("all");

  useEffect(() => {
    fetchLeads();
  }, []);

  async function fetchLeads() {
    try {
      const res = await fetch("/api/v1/crm/leads");
      const data = await res.json();
      if (data.success) setLeads(data.data);
    } finally {
      setLoading(false);
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

  const filteredLeads = leads.filter((l) => {
    if (search && !l.customerName.toLowerCase().includes(search.toLowerCase())) return false;
    if (scoreFilter === "hot" && l.leadScore < 80) return false;
    if (scoreFilter === "warm" && (l.leadScore < 50 || l.leadScore >= 80)) return false;
    if (scoreFilter === "cold" && l.leadScore >= 50) return false;
    return true;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">CRM Leads Kanban</h1>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tim ten / SDT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={scoreFilter} onValueChange={setScoreFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Diem Lead" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tat ca</SelectItem>
            <SelectItem value="hot">Hot (&gt;=80)</SelectItem>
            <SelectItem value="warm">Warm (50-79)</SelectItem>
            <SelectItem value="cold">Cold (&lt;50)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-5 gap-4 overflow-x-auto">
        {COLUMNS.map((col) => {
          const columnLeads = filteredLeads.filter((l) => l.leadStatus === col.id);
          return (
            <div key={col.id} className={`rounded-lg p-3 ${col.color} min-h-[400px]`}>
              <h3 className="font-semibold text-sm mb-3 flex items-center justify-between">
                {col.label}
                <Badge variant="outline">{columnLeads.length}</Badge>
              </h3>
              <div className="space-y-3">
                {columnLeads.map((lead) => {
                  const score = getScoreBadge(lead.leadScore);
                  const timeDiff = Date.now() - new Date(lead.updatedAt).getTime();
                  const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));

                  return (
                    <Card key={lead.id} className="cursor-grab active:cursor-grabbing">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium text-sm">{lead.customerName}</p>
                            <p className="text-xs text-muted-foreground">
                              {maskPhone(lead.phone)}
                            </p>
                          </div>
                          <Badge variant={score.variant} className="text-xs">
                            {lead.leadScore} {score.label}
                          </Badge>
                        </div>
                        {lead.interestedVariant && (
                          <p className="text-xs text-muted-foreground mb-2">
                            Xe: {lead.interestedVariant}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mb-2">
                          {hoursAgo < 1 ? "Vua moi" : `${hoursAgo}h truoc`}
                        </p>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" className="h-7 text-xs flex-1">
                            <Phone className="h-3 w-3 mr-1" />
                            Call
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs flex-1">
                            <LinkIcon className="h-3 w-3 mr-1" />
                            PayLink
                          </Button>
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
    </div>
  );
}
