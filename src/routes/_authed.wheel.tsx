import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Gift, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { PageHeader, DataState } from "@/components/page-header";
import { formatDate } from "@/lib/format";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type PrizeType = "voucher" | "points" | "turns" | "product" | "miss";

type WheelPrize = {
  id: string;
  name?: string | null;
  label?: string | null;
  type: PrizeType;
  probability: number;
  value?: number | null;
  voucherId?: string | null;
  sortOrder?: number | null;
  isActive?: boolean | null;
};

type WheelHistoryItem = {
  id: string;
  createdAt?: string | null;
  prizeName?: string | null;
  prize?: {
    name?: string | null;
    label?: string | null;
  } | null;
};

type PrizeFormState = {
  name: string;
  type: PrizeType;
  probability: string;
  value: string;
  voucherId: string;
  sortOrder: string;
  isActive: boolean;
};

const defaultForm: PrizeFormState = {
  name: "",
  type: "points",
  probability: "",
  value: "",
  voucherId: "",
  sortOrder: "0",
  isActive: true,
};

const TYPE_LABEL: Record<PrizeType, string> = {
  voucher: "Voucher",
  points: "Điểm",
  turns: "Lượt quay",
  product: "Sản phẩm",
  miss: "Chúc may mắn lần sau",
};

const EMPTY_PRIZES: WheelPrize[] = [];
const EMPTY_HISTORY: WheelHistoryItem[] = [];

export const Route = createFileRoute("/_authed/wheel")({
  head: () => ({ meta: [{ title: "Vòng quay — HappyMall Admin" }] }),
  component: WheelPage,
});

function WheelPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<WheelPrize | null>(null);
  const [form, setForm] = useState<PrizeFormState>(defaultForm);
  const [formError, setFormError] = useState("");
  const [deleting, setDeleting] = useState<WheelPrize | null>(null);

  const prizes = useQuery({
    queryKey: ["wheel-admin-prizes"],
    queryFn: () => apiFetch<WheelPrize[]>("/wheel/admin/prizes"),
  });

  const history = useQuery({
    queryKey: ["wheel-history"],
    queryFn: () => apiFetch<WheelHistoryItem[]>("/wheel/history"),
  });

  const list = prizes.data?.data ?? EMPTY_PRIZES;
  const historyList = history.data?.data ?? EMPTY_HISTORY;

  const activeProbability = useMemo(
    () =>
      list
        .filter((item) => item.isActive ?? true)
        .reduce((sum, item) => sum + Number(item.probability ?? 0), 0),
    [list],
  );

  const saveMutation = useMutation({
    mutationFn: (payload: { id?: string; body: Record<string, unknown> }) =>
      apiFetch(payload.id ? `/wheel/admin/prizes/${payload.id}` : "/wheel/admin/prizes", {
        method: payload.id ? "PATCH" : "POST",
        body: JSON.stringify(payload.body),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["wheel-admin-prizes"] });
      toast.success(editing ? "Cập nhật phần thưởng thành công" : "Tạo phần thưởng thành công");
      setDialogOpen(false);
      setEditing(null);
      setForm(defaultForm);
      setFormError("");
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Lưu phần thưởng thất bại";
      setFormError(message);
      toast.error(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/wheel/admin/prizes/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["wheel-admin-prizes"] });
      toast.success("Xóa phần thưởng thành công");
      setDeleting(null);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Xóa phần thưởng thất bại";
      toast.error(message);
    },
  });

  function openCreate() {
    setEditing(null);
    setForm(defaultForm);
    setFormError("");
    setDialogOpen(true);
  }

  function openEdit(prize: WheelPrize) {
    setEditing(prize);
    setForm({
      name: prize.name ?? prize.label ?? "",
      type: prize.type ?? "points",
      probability: String(prize.probability ?? ""),
      value: prize.value == null ? "" : String(prize.value),
      voucherId: prize.voucherId ?? "",
      sortOrder: String(prize.sortOrder ?? 0),
      isActive: prize.isActive ?? true,
    });
    setFormError("");
    setDialogOpen(true);
  }

  function validateForm() {
    if (!form.name.trim()) return "Tên phần thưởng là bắt buộc";
    if (!form.probability.trim()) return "Xác suất là bắt buộc";
    const probability = Number(form.probability);
    if (!Number.isFinite(probability) || probability <= 0) return "Xác suất phải lớn hơn 0";
    if (probability > 100) return "Xác suất không được vượt quá 100%";
    if (form.value.trim()) {
      const value = Number(form.value);
      if (!Number.isFinite(value) || value < 0) return "Giá trị thưởng không hợp lệ";
    }
    if (form.sortOrder.trim()) {
      const sortOrder = Number(form.sortOrder);
      if (!Number.isInteger(sortOrder)) return "Sort order phải là số nguyên";
    }
    if (form.type === "voucher" && !form.voucherId.trim())
      return "Voucher ID là bắt buộc cho phần thưởng voucher";
    return "";
  }

  function validateProbabilityCeiling(nextProbability: number) {
    const remainder = list.reduce((sum, item) => {
      const isCurrent = item.id === editing?.id;
      if (isCurrent || !(item.isActive ?? true)) return sum;
      return sum + Number(item.probability ?? 0);
    }, 0);
    const total = remainder + (form.isActive ? nextProbability : 0);
    if (total > 100) {
      return `Tổng probability active đang là ${total.toFixed(2)}%. Không được vượt quá 100%.`;
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
    const probability = Number(form.probability);
    const probabilityError = validateProbabilityCeiling(probability);
    if (probabilityError) {
      setFormError(probabilityError);
      return;
    }

    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      label: form.name.trim(),
      type: form.type,
      probability,
      value: form.value.trim() ? Number(form.value) : undefined,
      voucherId: form.voucherId.trim() || undefined,
      sortOrder: form.sortOrder.trim() ? Number(form.sortOrder) : 0,
      isActive: form.isActive,
    };

    setFormError("");
    saveMutation.mutate({ id: editing?.id, body: payload });
  }

  return (
    <div>
      <PageHeader
        title="Vòng quay may mắn"
        subtitle={`${list.length} phần thưởng (active probability: ${activeProbability.toFixed(2)}%)`}
      />

      <Tabs defaultValue="prizes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="prizes">Quản lý phần thưởng</TabsTrigger>
          <TabsTrigger value="history">Lịch sử quay</TabsTrigger>
        </TabsList>

        <TabsContent value="prizes" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              Tạo phần thưởng
            </Button>
          </div>

          {prizes.isLoading || prizes.isError || list.length === 0 ? (
            <DataState
              loading={prizes.isLoading}
              error={prizes.error}
              empty={list.length === 0}
              emptyText="Chưa có phần thưởng nào"
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {list.map((p) => (
                <div key={p.id} className="rounded-2xl bg-card p-4 shadow-[var(--shadow-card)]">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="grid size-12 place-items-center rounded-2xl bg-accent text-accent-foreground">
                      <Gift className="size-6" />
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        (p.isActive ?? true)
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {(p.isActive ?? true) ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-sm font-semibold">{p.name ?? p.label ?? "—"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Loại: {TYPE_LABEL[p.type] ?? p.type}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Tỷ lệ: {Number(p.probability ?? 0).toFixed(2)}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Giá trị: {p.value == null ? "—" : p.value}{" "}
                    {p.voucherId ? `• Voucher ${p.voucherId}` : ""}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => openEdit(p)}
                    >
                      Sửa
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1"
                      onClick={() => setDeleting(p)}
                    >
                      Xóa
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history">
          {history.isLoading || history.isError || historyList.length === 0 ? (
            <DataState
              loading={history.isLoading}
              error={history.error}
              empty={historyList.length === 0}
              emptyText="Chưa có lượt quay"
            />
          ) : (
            <div className="overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-card)]">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-6 py-3 text-left">Phần thưởng</th>
                    <th className="px-6 py-3 text-left">Thời gian</th>
                  </tr>
                </thead>
                <tbody>
                  {historyList.map((h) => (
                    <tr key={h.id} className="border-t border-border">
                      <td className="px-6 py-3 font-medium">
                        {h.prize?.name ?? h.prize?.label ?? h.prizeName ?? "—"}
                      </td>
                      <td className="px-6 py-3 text-muted-foreground">{formatDate(h.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Cập nhật phần thưởng" : "Tạo phần thưởng"}</DialogTitle>
            <DialogDescription>Điền thông tin phần thưởng và lưu thay đổi.</DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="prize-name">Tên phần thưởng *</Label>
              <Input
                id="prize-name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="prize-type">Loại</Label>
                <select
                  id="prize-type"
                  value={form.type}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, type: e.target.value as PrizeType }))
                  }
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="points">Điểm</option>
                  <option value="turns">Lượt quay</option>
                  <option value="voucher">Voucher</option>
                  <option value="product">Sản phẩm</option>
                  <option value="miss">Chúc may mắn</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="prize-probability">Probability (%) *</Label>
                <Input
                  id="prize-probability"
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  value={form.probability}
                  onChange={(e) => setForm((prev) => ({ ...prev, probability: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="prize-value">Giá trị</Label>
                <Input
                  id="prize-value"
                  type="number"
                  min={0}
                  value={form.value}
                  onChange={(e) => setForm((prev) => ({ ...prev, value: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prize-voucher">Voucher ID</Label>
                <Input
                  id="prize-voucher"
                  value={form.voucherId}
                  onChange={(e) => setForm((prev) => ({ ...prev, voucherId: e.target.value }))}
                  placeholder="Chỉ dùng khi type = voucher"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="prize-sort-order">Sort order</Label>
                <Input
                  id="prize-sort-order"
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm((prev) => ({ ...prev, sortOrder: e.target.value }))}
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

      <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa phần thưởng?</AlertDialogTitle>
            <AlertDialogDescription>
              Phần thưởng <strong>{deleting?.name ?? deleting?.label}</strong> sẽ bị xóa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              disabled={!deleting || deleteMutation.isPending}
              onClick={() => deleting && deleteMutation.mutate(deleting.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
