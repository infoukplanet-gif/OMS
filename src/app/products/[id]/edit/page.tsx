import { ProductForm } from "@/components/forms/product-form";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params;
  return <ProductForm mode="edit" productCode={id} />;
}
