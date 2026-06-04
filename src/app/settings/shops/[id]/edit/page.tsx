import { ShopForm } from "@/components/forms/shop-form";

export default async function EditShopPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ShopForm mode="edit" recordId={id} />;
}
