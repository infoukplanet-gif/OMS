import { CustomerForm } from "@/components/forms/customer-form";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CustomerForm mode="edit" recordId={id} />;
}
