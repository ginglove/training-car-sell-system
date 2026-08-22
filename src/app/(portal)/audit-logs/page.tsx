"use client";

import { useState, useEffect } from "react";
import { FileText, Search, RefreshCw, Key, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function JsonTreeView({ data, depth = 0 }: { data: any; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 2);

  if (data === null || data === undefined) return <span className="text-gray-400">null</span>;
  if (typeof data !== "object") {
    return <span className="text-green-700 dark:text-green-400">{JSON.stringify(data)}</span>;
  }

  const entries = Object.entries(data);
  if (entries.length === 0) return <span className="text-gray-400">{"{}"}</span>;

  return (
    <div className="ml-3">
      <button onClick={() => setExpanded(!expanded)} className="text-xs text-muted-foreground hover:text-foreground">
        {expanded ? <ChevronDown className="h-3 w-3 inline" /> : <ChevronRight className="h-3 w-3 inline" />}
        {` {${entries.length}}`}
      </button>
      {expanded && (
        <div className="ml-2 border-l pl-2 space-y-0.5">
          {entries.map(([key, value]) => (
            <div key={key} className="text-xs">
              <span className="text-blue-600 dark:text-blue-400">{key}</span>
              <span className="text-muted-foreground">: </span>
              <JsonTreeView data={value} depth={depth + 1} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: "",
    entityType: "",
    correlationId: "",
    dateFrom: "",
    dateTo: "",
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [decrypting, setDecrypting] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [pagination.page]);

  async function fetchLogs() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", pagination.page.toString());
      params.set("limit", pagination.limit.toString());
      if (filters.action) params.set("action", filters.action);
      if (filters.entityType) params.set("entityType", filters.entityType);
      if (filters.correlationId) params.set("correlationId", filters.correlationId);
      if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.set("dateTo", filters.dateTo);

      const res = await fetch(`/api/v1/audit/logs?${params}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.data.logs || []);
        setPagination((prev) => ({ ...prev, ...data.data.pagination }));
      }
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDecryptPII(userId: string) {
    setDecrypting(true);
    try {
      const res = await fetch("/api/v1/audit/decrypt-pii", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, fields: ["identityCardNumber"] }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`CCCD: ${data.data.identityCardNumber}`);
      } else {
        alert(data.error || "Decrypt failed");
      }
    } finally {
      setDecrypting(false);
    }
  }

  function handleSearch() {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchLogs();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6" />
          Nhật Ký Kiểm Toán
        </h1>
        <Button variant="outline" onClick={fetchLogs}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="grid grid-cols-5 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Hành động</Label>
              <Input
                placeholder="VD: UPDATE, DELETE..."
                value={filters.action}
                onChange={(e) => setFilters({ ...filters, action: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Loại entity</Label>
              <Select
                value={filters.entityType}
                onValueChange={(v) => setFilters({ ...filters, entityType: v })}
              >
                <SelectTrigger><SelectValue placeholder="Tất cả" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả</SelectItem>
                  <SelectItem value="ORDER">Order</SelectItem>
                  <SelectItem value="REFUND_REQUEST">Refund</SelectItem>
                  <SelectItem value="LOAN_APPLICATION">Loan</SelectItem>
                  <SelectItem value="DISCOUNT_POLICY">Config</SelectItem>
                  <SelectItem value="TRADE_IN_REQUEST">Trade-in</SelectItem>
                  <SelectItem value="CUSTOMER_PROFILE">Profile</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Correlation ID</Label>
              <Input
                placeholder="ID liên kết..."
                value={filters.correlationId}
                onChange={(e) => setFilters({ ...filters, correlationId: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Từ ngày</Label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Đến ngày</Label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              />
            </div>
          </div>
          <Button onClick={handleSearch} className="mt-3" size="sm">
            <Search className="h-3 w-3 mr-1" />
            Tìm kiếm
          </Button>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardContent className="pt-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Không có bản ghi kiểm toán nào</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2">Thời gian</th>
                      <th className="text-left py-3 px-2">Người thực hiện</th>
                      <th className="text-left py-3 px-2">Hành động</th>
                      <th className="text-left py-3 px-2">Entity</th>
                      <th className="text-left py-3 px-2">Correlation ID</th>
                      <th className="text-right py-3 px-2">Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <>
                        <tr
                          key={log.id}
                          className="border-b hover:bg-muted/50 cursor-pointer"
                          onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                        >
                          <td className="py-3 px-2 text-xs">
                            {log.createdAt ? new Date(log.createdAt).toLocaleString("vi-VN") : "—"}
                          </td>
                          <td className="py-3 px-2">
                            <span className="text-xs">{log.actorName || log.actorType}</span>
                          </td>
                          <td className="py-3 px-2">
                            <Badge variant="outline" className="text-xs">{log.action}</Badge>
                          </td>
                          <td className="py-3 px-2 text-xs">{log.entityType}</td>
                          <td className="py-3 px-2 font-mono text-xs">{log.correlationId || "—"}</td>
                          <td className="py-3 px-2 text-right">
                            {expandedId === log.id ? (
                              <ChevronDown className="h-4 w-4 inline" />
                            ) : (
                              <ChevronRight className="h-4 w-4 inline" />
                            )}
                          </td>
                        </tr>
                        {expandedId === log.id && (
                          <tr key={`${log.id}-detail`}>
                            <td colSpan={6} className="py-3 px-4 bg-muted/30">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-xs font-semibold mb-1 text-red-600">Old Value</p>
                                  <div className="bg-background p-2 rounded border text-xs">
                                    <JsonTreeView data={log.oldValue} />
                                  </div>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold mb-1 text-green-600">New Value</p>
                                  <div className="bg-background p-2 rounded border text-xs">
                                    <JsonTreeView data={log.newValue} />
                                  </div>
                                </div>
                              </div>
                              {log.entityType === "CUSTOMER_PROFILE" && (
                                <div className="mt-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDecryptPII(log.entityId)}
                                    disabled={decrypting}
                                  >
                                    <Key className="h-3 w-3 mr-1" />
                                    Decrypt PII
                                  </Button>
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4 text-sm">
                <p className="text-muted-foreground">
                  Trang {pagination.page}/{pagination.totalPages} — {pagination.total} bản ghi
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pagination.page <= 1}
                    onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                  >
                    Trước
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
