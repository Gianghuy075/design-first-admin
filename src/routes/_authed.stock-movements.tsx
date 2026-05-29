import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search, X } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authed/stock-movements")({
  head: () => ({ meta: [{ title: "Xuất nhập kho — HappyMall Admin" }] }),
  component: StockMovementsPage,
});

type StockMovement = {
  id: string;
  code: string;
  type: "in" | "out";
  createdAt: string;
  createdBy: string;
};

const MOVEMENTS: StockMovement[] = [];
const TYPE_LABEL: Record<StockMovement["type"], string> = {
  in: "Nhập kho",
  out: "Xuất kho",
};

function StockMovementsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | StockMovement["type"]>("all");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return MOVEMENTS.filter((m) => {
      if (typeFilter !== "all" && m.type !== typeFilter) return false;
      if (!term) return true;
      return [m.code, m.createdBy].some((v) => v.toLowerCase().includes(term));
    });
  }, [search, typeFilter]);

  const hasFilter = search.trim() || typeFilter !== "all";

  return (
    <div>
      <PageHeader
        title="Xuất nhập kho"
        subtitle="Theo dõi phiếu xuất và nhập kho"
        action={
          <div className="flex flex-wrap gap-2">
            <Button>Nhập kho</Button>
            <Button variant="outline">Xuất kho</Button>
          </div>
        }
      />

      <div className="mb-5 flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo mã đơn hoặc người tạo..."
            className="h-11 rounded-lg bg-card pl-9"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value as "all" | StockMovement["type"])}
          className="h-11 min-w-[200px] rounded-lg border border-input bg-card px-3 text-sm"
        >
          <option value="all">Tất cả loại đơn</option>
          <option value="in">Nhập kho</option>
          <option value="out">Xuất kho</option>
        </select>
        {hasFilter ? (
          <button
            onClick={() => {
              setSearch("");
              setTypeFilter("all");
            }}
            className="inline-flex h-11 items-center gap-1 rounded-lg border border-input bg-card px-3 text-sm font-medium hover:bg-muted"
          >
            <X className="size-4" /> Xóa lọc
          </button>
        ) : null}
      </div>

      <div className="rounded-2xl bg-card shadow-[var(--shadow-card)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã đơn xuất-nhập</TableHead>
              <TableHead>Loại đơn</TableHead>
              <TableHead>Thời gian</TableHead>
              <TableHead>Người tạo lệnh</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  Chưa có dữ liệu xuất nhập kho
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((movement) => (
                <TableRow key={movement.id}>
                  <TableCell className="font-medium">{movement.code}</TableCell>
                  <TableCell>{TYPE_LABEL[movement.type]}</TableCell>
                  <TableCell>{formatDate(movement.createdAt)}</TableCell>
                  <TableCell>{movement.createdBy}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
