import { SetProductForm } from "@/components/forms/set-product-form";

export default async function EditSetProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SetProductForm mode="edit" recordId={id} />;
}
