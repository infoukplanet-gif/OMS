import { PurchaseOrderForm } from "@/components/forms/purchase-order-form";

export default async function EditPurchaseOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PurchaseOrderForm mode="edit" recordId={id} />;
}
