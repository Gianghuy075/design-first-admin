import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, DataState } from "@/components/page-header";

export const Route = createFileRoute("/_authed/reviews")({
  head: () => ({ meta: [{ title: "Đánh giá — HappyMall Admin" }] }),
  component: ReviewsPage,
});

function ReviewsPage() {
  return (
    <div>
      <PageHeader
        title="Đánh giá"
        subtitle="Danh sách đánh giá sản phẩm"
      />
      <DataState empty emptyText="Chưa có đánh giá" />
    </div>
  );
}
