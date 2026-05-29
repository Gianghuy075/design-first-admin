import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search, X } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

type MovementFormState = {
  code: string;
  createdBy: string;
};

const INITIAL_MOVEMENTS: StockMovement[] = [];
const defaultForm: MovementFormState = {
  code: "",
  createdBy: "",
};

function generateId() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function StockMovementsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | StockMovement["type"]>("all");
  const [movements, setMovements] = useState<StockMovement[]>(INITIAL_MOVEMENTS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingType, setPendingType] = useState<StockMovement["type"] | null>(null);
  const [form, setForm] = useState<MovementFormState>(defaultForm);
  const [formError, setFormError] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return movements.filter((m) => {
      if (typeFilter !== "all" && m.type !== typeFilter) return false;
      if (!term) return true;
      return [m.code, m.createdBy].some((v) => v.toLowerCase().includes(term));
    });
  }, [search, typeFilter, movements]);

  const hasFilter = search.trim() || typeFilter !== "all";
  const dialogTitle = pendingType ? `Tạo phiếu ${TYPE_LABEL[pendingType].toLowerCase()}` : "Tạo phiếu";
  const dialogDescription = pendingType
    ? `Điền thông tin phiếu ${TYPE_LABEL[pendingType].toLowerCase()} và lưu.`
    : "Điền thông tin phiếu và lưu.";

  function openCreate(type: StockMovement["type"]) {
    setPendingType(type);
    setForm(defaultForm);
    setFormError("");
    setDialogOpen(true);
  }

  function validateForm() {
    if (!pendingType) return "Vui lòng chọn loại đơn";
    if (!form.code.trim()) return "Mã đơn là bắt buộc";
    if (!form.createdBy.trim()) return "Người tạo lệnh là bắt buộc";
    return "";
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const error = validateForm();
    if (error) {
      setFormError(error);
      return;
    }
    setFormError("");

    const newMovement: StockMovement = {
      id: generateId(),
      code: form.code.trim(),
      type: pendingType!,
      createdAt: new Date().toISOString(),
      createdBy: form.createdBy.trim(),
    };

    setMovements((prev) => [newMovement, ...prev]);
    setDialogOpen(false);
    setPendingType(null);
    setForm(defaultForm);
  }

  return (
    <div>
      <PageHeader
        title="Xuất nhập kho"
        subtitle="Theo dõi phiếu xuất và nhập kho"
        action={
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => openCreate("in")}>Nhập kho</Button>
            <Button type="button" variant="outline" onClick={() => openCreate("out")}>
              Xuất kho
            </Button>
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

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setForm(defaultForm);
            setFormError("");
            setPendingType(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogDescription}</DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="movement-code">Mã đơn xuất-nhập *</Label>
              <Input
                id="movement-code"
                value={form.code}
                onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))}
                placeholder="Ví dụ: XN-000123"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="movement-creator">Người tạo lệnh *</Label>
              <Input
                id="movement-creator"
                value={form.createdBy}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, createdBy: event.target.value }))
                }
                placeholder="Ví dụ: Nguyễn Văn A"
              />
            </div>

            <div className="space-y-2">
              <Label>Thời gian</Label>
              <Input value={formatDate(new Date().toISOString())} disabled />
            </div>

            {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Hủy
              </Button>
              <Button type="submit">Lưu</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
