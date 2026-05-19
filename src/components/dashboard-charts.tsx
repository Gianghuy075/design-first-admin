import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { formatVnd } from "@/lib/format";

const STATUS_COLORS: Record<string, string> = {
  placed: "#3b82f6",
  paid: "#6366f1",
  shipping: "#f59e0b",
  delivered: "#10b981",
  unreviewed: "#a855f7",
  cancelled: "#f43f5e",
  returned: "#94a3b8",
};

const STATUS_LABEL: Record<string, string> = {
  placed: "Đã đặt",
  paid: "Đã TT",
  shipping: "Đang giao",
  delivered: "Đã giao",
  unreviewed: "Chờ ĐG",
  cancelled: "Đã hủy",
  returned: "Đã trả",
};

function ChartCard({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl bg-card shadow-[var(--shadow-card)] p-5 ${className}`}>
      <div className="mb-4">
        <h3 className="font-semibold text-foreground">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      <div className="h-64">{children}</div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="h-full grid place-items-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

export function RevenueChart({ orders }: { orders: any[] }) {
  // Aggregate revenue per day (last 14 days from latest order)
  const map = new Map<string, { date: string; revenue: number; orders: number }>();
  orders.forEach((o) => {
    if (!o.createdAt) return;
    const d = new Date(o.createdAt);
    if (Number.isNaN(d.getTime())) return;
    const key = d.toISOString().slice(0, 10);
    const cur = map.get(key) ?? { date: key, revenue: 0, orders: 0 };
    cur.revenue += Number(o.total ?? 0);
    cur.orders += 1;
    map.set(key, cur);
  });
  const data = Array.from(map.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14)
    .map((d) => ({
      ...d,
      label: new Date(d.date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }),
    }));

  return (
    <ChartCard
      title="Doanh thu theo ngày"
      subtitle="14 ngày gần nhất có đơn"
      className="lg:col-span-2"
    >
      {data.length === 0 ? (
        <Empty text="Chưa có dữ liệu doanh thu" />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--brand-orange)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="var(--brand-orange)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgb(0 0 0 / 0.06)" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="rgb(0 0 0 / 0.4)" />
            <YAxis
              tick={{ fontSize: 11 }}
              stroke="rgb(0 0 0 / 0.4)"
              tickFormatter={(v) => (v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}tr` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "1px solid rgb(0 0 0 / 0.08)",
                fontSize: 12,
              }}
              formatter={(v: any, name) =>
                name === "revenue" ? [formatVnd(v as number), "Doanh thu"] : [v, "Đơn"]
              }
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="var(--brand-orange)"
              strokeWidth={2.5}
              fill="url(#revFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

export function StatusChart({ orders }: { orders: any[] }) {
  const counts = new Map<string, number>();
  orders.forEach((o) => {
    const s = o.status ?? "unknown";
    counts.set(s, (counts.get(s) ?? 0) + 1);
  });
  const data = Array.from(counts.entries()).map(([status, value]) => ({
    status,
    name: STATUS_LABEL[status] ?? status,
    value,
  }));

  return (
    <ChartCard title="Đơn theo trạng thái" subtitle={`${orders.length} đơn tổng`}>
      {data.length === 0 ? (
        <Empty text="Chưa có đơn hàng" />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={75}
              paddingAngle={2}
            >
              {data.map((d) => (
                <Cell key={d.status} fill={STATUS_COLORS[d.status] ?? "#94a3b8"} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ borderRadius: 12, border: "1px solid rgb(0 0 0 / 0.08)", fontSize: 12 }}
            />
            <Legend
              wrapperStyle={{ fontSize: 11 }}
              iconType="circle"
              layout="horizontal"
              align="center"
              verticalAlign="bottom"
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

export function TopProductsChart({
  orders,
  products,
}: {
  orders: any[];
  products: any[];
}) {
  const productMap = new Map<string, string>();
  products.forEach((p) => productMap.set(p.id, p.name));

  const tally = new Map<string, { name: string; qty: number; revenue: number }>();
  orders.forEach((o) => {
    (o.items ?? []).forEach((it: any) => {
      const id = it.productId ?? it.product?.id;
      if (!id) return;
      const name = it.product?.name ?? productMap.get(id) ?? it.name ?? id;
      const qty = Number(it.qty ?? it.quantity ?? 0);
      const price = Number(it.price ?? it.product?.price ?? 0);
      const cur = tally.get(id) ?? { name, qty: 0, revenue: 0 };
      cur.qty += qty;
      cur.revenue += qty * price;
      tally.set(id, cur);
    });
  });

  const data = Array.from(tally.values())
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 7)
    .map((d) => ({
      ...d,
      shortName: d.name.length > 22 ? d.name.slice(0, 22) + "…" : d.name,
    }));

  return (
    <ChartCard
      title="Sản phẩm bán chạy"
      subtitle="Top 7 theo số lượng"
      className="lg:col-span-3"
    >
      {data.length === 0 ? (
        <Empty text="Chưa có dữ liệu bán hàng" />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 16, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgb(0 0 0 / 0.06)" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} stroke="rgb(0 0 0 / 0.4)" />
            <YAxis
              type="category"
              dataKey="shortName"
              tick={{ fontSize: 11 }}
              stroke="rgb(0 0 0 / 0.4)"
              width={150}
            />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: "1px solid rgb(0 0 0 / 0.08)", fontSize: 12 }}
              formatter={(v: any, name) =>
                name === "qty" ? [v, "Số lượng"] : [formatVnd(v as number), "Doanh thu"]
              }
            />
            <Bar dataKey="qty" fill="var(--brand-orange)" radius={[0, 8, 8, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}