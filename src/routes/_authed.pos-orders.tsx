import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, DataState } from "@/components/page-header";

export const Route = createFileRoute("/_authed/pos-orders")({
  head: () => ({ meta: [{ title: "Đơn hàng — HappyMall Admin" }] }),
  component: PosOrdersPage,
});

function PosOrdersPage() {
  return (
    <div>
      <PageHeader
        title="Đơn hàng"
        subtitle="Tạo đơn cho hệ thống bán lẻ tại quầy"
      />
      <DataState empty emptyText="Chưa có đơn hàng tại quầy" />
    </div>
  );
}
