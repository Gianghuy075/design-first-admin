import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Ticket } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { PageHeader, DataState } from "@/components/page-header";
import { formatDateShort } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type VoucherItem = {
  id: string;
  code?: string | null;
  type: "discount" | "ship";
  title?: string | null;
  description?: string | null;
  value: number;
  valueType?: "fixed" | "percent";
  minOrder?: number | null;
  expiryDate?: string | null;
  totalLimit?: number | null;
  remaining?: number | null;
  usedCount?: number | null;
  isActive?: boolean | null;
};

type VoucherFormState = {
  id: string;
  type: "discount" | "ship";
  title: string;
  description: string;
  value: string;
  valueType: "fixed" | "percent";
  minOrder: string;
  expiryDate: string;
  totalLimit: string;
  isActive: boolean;
};

const defaultForm: VoucherFormState = {
  id: "",
  type: "discount",
  title: "",
  description: "",
  value: "",
  valueType: "fixed",
  minOrder: "0",
  expiryDate: "",
  totalLimit: "",
  isActive: true,
};

export const Route = createFileRoute("/_authed/vouchers")({
  head: () => ({ meta: [{ title: "Voucher — HappyMall Admin" }] }),
  component: VouchersPage,
});

function VouchersPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<VoucherItem | null>(null);
  const [form, setForm] = useState<VoucherFormState>(defaultForm);
  const [formError, setFormError] = useState("");

  const q = useQuery({
    queryKey: ["vouchers"],
    queryFn: () => apiFetch<VoucherItem[]>("/vouchers"),
  });
  const list = q.data?.data ?? [];

  const saveMutation = useMutation({
    mutationFn: (payload: { id?: string; body: Record<string, unknown> }) =>
      apiFetch(payload.id ? `/vouchers/admin/${payload.id}` : "/vouchers/admin", {
        method: payload.id ? "PATCH" : "POST",
        body: JSON.stringify(payload.body),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["vouchers"] });
      toast.success(editing ? "Cập nhật voucher thành công" : "Tạo voucher thành công");
      setDialogOpen(false);
      setEditing(null);
      setForm(defaultForm);
      setFormError("");
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Lưu voucher thất bại";
      setFormError(message);
      toast.error(message);
    },
  });

  function openCreate() {
    setEditing(null);
    setForm(defaultForm);
    setFormError("");
    setDialogOpen(true);
  }

  function openEdit(voucher: VoucherItem) {
    setEditing(voucher);
    setForm({
      id: voucher.id ?? voucher.code ?? "",
      type: voucher.type ?? "discount",
      title: voucher.title ?? "",
      description: voucher.description ?? "",
      value: String(voucher.value ?? 0),
      valueType: voucher.valueType ?? "fixed",
      minOrder: String(voucher.minOrder ?? 0),
      expiryDate: voucher.expiryDate ? String(voucher.expiryDate).slice(0, 10) : "",
      totalLimit: voucher.totalLimit == null ? "" : String(voucher.totalLimit),
      isActive: voucher.isActive ?? true,
    });
    setFormError("");
    setDialogOpen(true);
  }

  function validateForm() {
    if (!form.id.trim()) return "Mã voucher là bắt buộc";
    if (!form.title.trim()) return "Tiêu đề voucher là bắt buộc";
    const value = Number(form.value);
    if (!Number.isFinite(value) || value <= 0) return "Giá trị voucher phải lớn hơn 0";
    const minOrder = Number(form.minOrder || 0);
    if (!Number.isFinite(minOrder) || minOrder < 0) return "Đơn tối thiểu không hợp lệ";
    if (form.totalLimit.trim()) {
      const totalLimit = Number(form.totalLimit);
      if (!Number.isInteger(totalLimit) || totalLimit < 0)
        return "Giới hạn lượt phải là số nguyên không âm";
    }
    return "";
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const error = validateForm();
    if (error) {
      setFormError(error);
      return;
    }
    const payload: Record<string, unknown> = {
      id: form.id.trim(),
      type: form.type,
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      value: Number(form.value),
      valueType: form.valueType,
      minOrder: Number(form.minOrder || 0),
      expiryDate: form.expiryDate || undefined,
      totalLimit: form.totalLimit.trim() ? Number(form.totalLimit) : undefined,
      isActive: form.isActive,
    };
    setFormError("");
    saveMutation.mutate({ id: editing?.id, body: payload });
  }

  return (
    <div>
      <PageHeader
        title="Voucher"
        subtitle={`${list.length} voucher đang hoạt động`}
        action={
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Tạo voucher
          </Button>
        }
      />

      {q.isLoading || q.isError || list.length === 0 ? (
        <DataState loading={q.isLoading} error={q.error} empty={list.length === 0} />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {list.map((v) => (
            <button
              key={v.id ?? v.code}
              className="relative flex overflow-hidden rounded-2xl bg-card text-left shadow-[var(--shadow-card)] transition hover:shadow-md"
              onClick={() => openEdit(v)}
            >
              <div className="flex w-28 flex-col items-center justify-center bg-gradient-to-br from-primary to-orange-400 p-4 text-center text-primary-foreground">
                <Ticket className="mb-1 size-7" />
                <p className="text-xs font-semibold uppercase tracking-wide opacity-90">
                  {v.type === "ship" ? "Freeship" : "Giảm giá"}
                </p>
              </div>
              <div className="min-w-0 flex-1 p-4">
                <p className="font-mono text-base font-bold text-secondary-foreground">
                  {v.id ?? v.code}
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-foreground">
                  {v.description ?? v.title ?? "—"}
                </p>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  {v.expiryDate ? <span>HSD: {formatDateShort(v.expiryDate)}</span> : null}
                  {v.totalLimit != null ? <span>Còn: {v.remaining ?? v.totalLimit}</span> : null}
                  {v.minOrder != null && Number(v.minOrder) > 0 ? (
                    <span>Đơn từ {Number(v.minOrder).toLocaleString("vi-VN")}₫</span>
                  ) : null}
                </div>
                <p className="mt-2 text-xs font-medium text-muted-foreground">
                  {v.isActive ? "Đang hoạt động" : "Đã tắt"}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Cập nhật voucher" : "Tạo voucher mới"}</DialogTitle>
            <DialogDescription>Cập nhật thông tin voucher và lưu thay đổi.</DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="voucher-id">Mã voucher *</Label>
                <Input
                  id="voucher-id"
                  value={form.id}
                  disabled={Boolean(editing)}
                  onChange={(e) => setForm((prev) => ({ ...prev, id: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="voucher-type">Loại *</Label>
                <select
                  id="voucher-type"
                  value={form.type}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      type: e.target.value as VoucherFormState["type"],
                    }))
                  }
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="discount">Giảm giá</option>
                  <option value="ship">Freeship</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="voucher-title">Tiêu đề *</Label>
              <Input
                id="voucher-title"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="voucher-description">Mô tả</Label>
              <Input
                id="voucher-description"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="voucher-value">Giá trị *</Label>
                <Input
                  id="voucher-value"
                  type="number"
                  min={0}
                  value={form.value}
                  onChange={(e) => setForm((prev) => ({ ...prev, value: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="voucher-value-type">Kiểu giá trị</Label>
                <select
                  id="voucher-value-type"
                  value={form.valueType}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      valueType: e.target.value as VoucherFormState["valueType"],
                    }))
                  }
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="fixed">Số tiền cố định</option>
                  <option value="percent">Phần trăm</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="voucher-min-order">Đơn tối thiểu</Label>
                <Input
                  id="voucher-min-order"
                  type="number"
                  min={0}
                  value={form.minOrder}
                  onChange={(e) => setForm((prev) => ({ ...prev, minOrder: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="voucher-total-limit">Tổng lượt dùng</Label>
                <Input
                  id="voucher-total-limit"
                  type="number"
                  min={0}
                  value={form.totalLimit}
                  onChange={(e) => setForm((prev) => ({ ...prev, totalLimit: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="voucher-expiry">Ngày hết hạn</Label>
                <Input
                  id="voucher-expiry"
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, expiryDate: e.target.value }))}
                />
              </div>
              <div className="flex items-end">
                <div className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-sm">
                  <span>Kích hoạt</span>
                  <Switch
                    checked={form.isActive}
                    onCheckedChange={(checked) =>
                      setForm((prev) => ({ ...prev, isActive: checked }))
                    }
                  />
                </div>
              </div>
            </div>

            {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Đang lưu..." : "Lưu"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
