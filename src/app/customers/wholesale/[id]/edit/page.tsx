import { WholesaleForm } from "@/components/forms/wholesale-form";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <WholesaleForm mode="edit" recordId={id} />;
}
