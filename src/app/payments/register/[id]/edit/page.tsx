import { PaymentForm } from "@/components/forms/payment-form";

export default async function EditPaymentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PaymentForm mode="edit" recordId={id} />;
}
