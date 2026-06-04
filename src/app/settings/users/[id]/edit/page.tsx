import { UserForm } from "@/components/forms/user-form";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <UserForm mode="edit" recordId={id} />;
}
