import { ReturnForm } from "@/components/forms/return-form";

export default async function EditReturnPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ReturnForm mode="edit" recordId={id} />;
}
