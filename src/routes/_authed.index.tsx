import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { PageHeader, DataState } from "@/components/page-header";
import { formatVnd, formatDate } from "@/lib/format";
import { RevenueChart, StatusChart, TopProductsChart } from "@/components/dashboard-charts";
import { Package, ShoppingCart, Ticket, Tag, TrendingUp, Users } from "lucide-react";

export const Route = createFileRoute("/_authed/")({
  head: () => ({ meta: [{ title: "Tổng quan — HappyMall Admin" }] }),
  component: DashboardPage,
});

type AdminStats = {
  counts: {
    products: number;
    categories: number;
    orders: number;
    users: number;
    vouchers: number;
  };
  totalRevenue: number;
  recentOrders: {
    id: string;
    status: string;
    total: number;
    payMethod: string | null;
    createdAt: string;
  }[];
  ordersByStatus: { status: string; count: number }[];
  revenueByDay: { date: string; total: number; count: number }[];
  topProducts: { productId: string; name: string; qty: number; revenue: number }[];
};

function StatCard({
  label,
  value,
  icon: Icon,
  tone = "orange",
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "orange" | "navy" | "hero" | "green" | "purple";
}) {
  const tones: Record<string, string> = {
    orange: "bg-primary/10 text-primary",
    navy: "bg-secondary text-secondary-foreground",
    hero: "bg-accent text-accent-foreground",
    green: "bg-emerald-100 text-emerald-700",
    purple: "bg-purple-100 text-purple-700",
  };
  return (
    <div className="rounded-2xl bg-card shadow-(--shadow-card) p-5 flex items-center gap-4">
      <div className={`size-12 rounded-xl grid place-items-center ${tones[tone]}`}>
        <Icon className="size-6" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}

const STATUS_LABEL: Record<string, string> = {
  placed: "Đã đặt",
  paid: "Đã thanh toán",
  shipping: "Đang giao",
  delivered: "Đã giao",
  unreviewed: "Chờ đánh giá",
  cancelled: "Đã hủy",
  returned: "Đã trả",
};

const STATUS_TONE: Record<string, string> = {
  placed: "bg-blue-100 text-blue-700",
  paid: "bg-indigo-100 text-indigo-700",
  shipping: "bg-amber-100 text-amber-700",
  delivered: "bg-emerald-100 text-emerald-700",
  unreviewed: "bg-purple-100 text-purple-700",
  cancelled: "bg-rose-100 text-rose-700",
  returned: "bg-gray-200 text-gray-700",
};

function DashboardPage() {
  const stats = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => apiFetch<AdminStats>("/admin/stats"),
  });
  const me = useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch<any>("/auth/me"),
  });

  const s = stats.data?.data;
  const counts = s?.counts;
  const meData = me.data?.data;
  const displayName = meData?.username?.trim() || meData?.name?.trim() || "";
  const accountIdentifier = meData?.username?.trim() || "—";

  return (
    <div>
      <PageHeader
        title={`Chào mừng${displayName ? `, ${displayName}` : ""}!`}
        subtitle="Tổng quan hoạt động của HappyMall"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard label="Sản phẩm" value={counts?.products ?? "—"} icon={Package} tone="orange" />
        <StatCard label="Danh mục" value={counts?.categories ?? "—"} icon={Tag} tone="navy" />
        <StatCard label="Đơn hàng" value={counts?.orders ?? "—"} icon={ShoppingCart} tone="hero" />
        <StatCard label="Voucher" value={counts?.vouchers ?? "—"} icon={Ticket} tone="green" />
        <StatCard label="Người dùng" value={counts?.users ?? "—"} icon={Users} tone="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="rounded-2xl bg-linear-to-br from-primary to-orange-400 text-primary-foreground p-6 shadow-(--shadow-card) lg:col-span-2">
          <div className="flex items-center gap-2 text-sm opacity-90">
            <TrendingUp className="size-4" />
            Doanh thu (không tính đơn hủy / hoàn trả)
          </div>
          <p className="text-4xl font-bold mt-2">{formatVnd(s?.totalRevenue ?? 0)}</p>
          <p className="text-sm opacity-90 mt-1">Tổng từ {counts?.orders ?? 0} đơn đã ghi nhận</p>
        </div>
        <div className="rounded-2xl bg-sidebar text-sidebar-foreground p-6 shadow-(--shadow-card)">
          <div className="flex items-center gap-2 text-sm opacity-90">
            <Users className="size-4" />
            Tài khoản
          </div>
          <p className="text-lg font-semibold mt-2 truncate">{displayName || "—"}</p>
          <p className="text-xs opacity-80 truncate">Tài khoản: {accountIdentifier}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <RevenueChart data={s?.revenueByDay ?? []} />
        <StatusChart data={s?.ordersByStatus ?? []} total={counts?.orders ?? 0} />
        <TopProductsChart data={s?.topProducts ?? []} />
      </div>

      <div className="rounded-2xl bg-card shadow-(--shadow-card) overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-semibold">Đơn hàng gần đây</h2>
        </div>
        {stats.isLoading || stats.isError || (s?.recentOrders.length ?? 0) === 0 ? (
          <div className="p-6">
            <DataState
              loading={stats.isLoading}
              error={stats.error}
              empty={(s?.recentOrders.length ?? 0) === 0}
              emptyText="Chưa có đơn hàng"
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left px-6 py-3">Mã đơn</th>
                  <th className="text-left px-6 py-3">Trạng thái</th>
                  <th className="text-right px-6 py-3">Tổng</th>
                  <th className="text-left px-6 py-3">Ngày tạo</th>
                </tr>
              </thead>
              <tbody>
                {(s?.recentOrders ?? []).map((o) => (
                  <tr key={o.id} className="border-t border-border">
                    <td className="px-6 py-3 font-medium">{o.id}</td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${
                          STATUS_TONE[o.status] ?? "bg-muted"
                        }`}
                      >
                        {STATUS_LABEL[o.status] ?? o.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right font-semibold">{formatVnd(o.total)}</td>
                    <td className="px-6 py-3 text-muted-foreground">{formatDate(o.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
