import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { PageHeader, DataState } from "@/components/page-header";
import { formatVnd, formatDate } from "@/lib/format";
import { RevenueChart, StatusChart, TopProductsChart } from "@/components/dashboard-charts";
import {
  Package,
  ShoppingCart,
  Ticket,
  Tag,
  TrendingUp,
  Users,
} from "lucide-react";

export const Route = createFileRoute("/_authed/")({
  head: () => ({ meta: [{ title: "Tổng quan — HappyMall Admin" }] }),
  component: DashboardPage,
});

function StatCard({
  label,
  value,
  icon: Icon,
  tone = "orange",
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "orange" | "navy" | "hero" | "green";
}) {
  const tones: Record<string, string> = {
    orange: "bg-primary/10 text-primary",
    navy: "bg-secondary text-secondary-foreground",
    hero: "bg-accent text-accent-foreground",
    green: "bg-emerald-100 text-emerald-700",
  };
  return (
    <div className="rounded-2xl bg-card shadow-[var(--shadow-card)] p-5 flex items-center gap-4">
      <div className={`size-12 rounded-xl grid place-items-center ${tones[tone]}`}>
        <Icon className="size-6" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
          {label}
        </p>
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
  const products = useQuery({
    queryKey: ["products", { limit: 1 }],
    queryFn: () => apiFetch<unknown[]>("/products", { auth: false, query: { limit: 1 } }),
  });
  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiFetch<unknown[]>("/categories", { auth: false }),
  });
  const orders = useQuery({
    queryKey: ["orders"],
    queryFn: () => apiFetch<any[]>("/orders"),
  });
  const vouchers = useQuery({
    queryKey: ["vouchers"],
    queryFn: () => apiFetch<any[]>("/vouchers"),
  });
  const me = useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch<any>("/auth/me"),
  });
  const topProducts = useQuery({
    queryKey: ["products-top"],
    queryFn: () => apiFetch<any[]>("/products/top", { auth: false }),
  });

  const totalProducts = products.data?.meta?.total ?? products.data?.data?.length ?? 0;
  const totalCategories = categories.data?.data?.length ?? 0;
  const totalOrders = orders.data?.data?.length ?? 0;
  const totalVouchers = vouchers.data?.data?.length ?? 0;
  const revenue = (orders.data?.data ?? []).reduce(
    (sum: number, o: any) => sum + Number(o.total ?? 0),
    0,
  );
  const recent = (orders.data?.data ?? []).slice(0, 6);
  const allOrders = orders.data?.data ?? [];
  const allTopProducts = topProducts.data?.data ?? [];

  return (
    <div>
      <PageHeader
        title={`Chào mừng${me.data?.data?.name ? `, ${me.data.data.name}` : ""}!`}
        subtitle="Tổng quan hoạt động của HappyMall"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Sản phẩm" value={totalProducts} icon={Package} tone="orange" />
        <StatCard label="Danh mục" value={totalCategories} icon={Tag} tone="navy" />
        <StatCard label="Đơn hàng" value={totalOrders} icon={ShoppingCart} tone="hero" />
        <StatCard label="Voucher" value={totalVouchers} icon={Ticket} tone="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="rounded-2xl bg-gradient-to-br from-primary to-orange-400 text-primary-foreground p-6 shadow-[var(--shadow-card)] lg:col-span-2">
          <div className="flex items-center gap-2 text-sm opacity-90">
            <TrendingUp className="size-4" />
            Doanh thu đơn hàng (toàn bộ)
          </div>
          <p className="text-4xl font-bold mt-2">{formatVnd(revenue)}</p>
          <p className="text-sm opacity-90 mt-1">
            Tổng từ {totalOrders} đơn hàng đã ghi nhận
          </p>
        </div>
        <div className="rounded-2xl bg-sidebar text-sidebar-foreground p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2 text-sm opacity-90">
            <Users className="size-4" />
            Tài khoản
          </div>
          <p className="text-lg font-semibold mt-2 truncate">
            {me.data?.data?.name ?? "—"}
          </p>
          <p className="text-xs opacity-80 truncate">
            Zalo ID: {me.data?.data?.zaloId ?? "—"}
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-card shadow-[var(--shadow-card)] overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-0 mb-6 [&]:bg-transparent [&]:shadow-none">
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <RevenueChart orders={allOrders} />
        <StatusChart orders={allOrders} />
        <TopProductsChart orders={allOrders} products={allTopProducts} />
      </div>

      <div className="rounded-2xl bg-card shadow-[var(--shadow-card)] overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-semibold">Đơn hàng gần đây</h2>
        </div>
        {orders.isLoading || orders.isError || recent.length === 0 ? (
          <div className="p-6">
            <DataState
              loading={orders.isLoading}
              error={orders.error}
              empty={recent.length === 0}
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
                {recent.map((o: any) => (
                  <tr key={o.id} className="border-t border-border">
                    <td className="px-6 py-3 font-medium">{o.code ?? o.id}</td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${
                          STATUS_TONE[o.status] ?? "bg-muted"
                        }`}
                      >
                        {STATUS_LABEL[o.status] ?? o.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right font-semibold">
                      {formatVnd(o.total)}
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">
                      {formatDate(o.createdAt)}
                    </td>
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