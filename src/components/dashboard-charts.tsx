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
    <div className="h-full grid place-items-center text-sm text-muted-foreground">{text}</div>
  );
}

export function RevenueChart({ data }: { data: { date: string; total: number; count: number }[] }) {
  const chartData = data.map((d) => ({
    ...d,
    total: Number(d.total),
    label: new Date(d.date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }),
  }));

  return (
    <ChartCard
      title="Doanh thu theo ngày"
      subtitle="14 ngày gần nhất có đơn"
      className="lg:col-span-2"
    >
      {chartData.length === 0 ? (
        <Empty text="Chưa có dữ liệu doanh thu" />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
              tickFormatter={(v) =>
                v >= 1_000_000
                  ? `${(v / 1_000_000).toFixed(1)}tr`
                  : v >= 1000
                    ? `${(v / 1000).toFixed(0)}k`
                    : String(v)
              }
            />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: "1px solid rgb(0 0 0 / 0.08)", fontSize: 12 }}
              formatter={(v: any, name) =>
                name === "total" ? [formatVnd(v as number), "Doanh thu"] : [v, "Đơn"]
              }
            />
            <Area
              type="monotone"
              dataKey="total"
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

export function StatusChart({
  data,
  total,
}: {
  data: { status: string; count: number }[];
  total: number;
}) {
  const chartData = data.map((d) => ({
    status: d.status,
    name: STATUS_LABEL[d.status] ?? d.status,
    value: Number(d.count),
  }));

  return (
    <ChartCard title="Đơn theo trạng thái" subtitle={`${total} đơn tổng`}>
      {chartData.length === 0 ? (
        <Empty text="Chưa có đơn hàng" />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={75}
              paddingAngle={2}
            >
              {chartData.map((d) => (
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
  data,
}: {
  data: { productId: string; name: string; qty: number; revenue: number }[];
}) {
  const chartData = data.map((d) => ({
    ...d,
    qty: Number(d.qty),
    revenue: Number(d.revenue),
    shortName: d.name.length > 22 ? d.name.slice(0, 22) + "…" : d.name,
  }));

  return (
    <ChartCard title="Sản phẩm bán chạy" subtitle="Top 7 theo số lượng" className="lg:col-span-3">
      {chartData.length === 0 ? (
        <Empty text="Chưa có dữ liệu bán hàng" />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 16, left: 8, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgb(0 0 0 / 0.06)"
              horizontal={false}
            />
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
