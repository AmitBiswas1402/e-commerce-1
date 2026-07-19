import { getProductBySlug } from "@/lib/slug";
import ProductDetail, { ProductNotFound } from "@/components/ProductDetail";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ productSlug: string }>;
}) {
  const { productSlug } = await params;
  const product = getProductBySlug(productSlug);

  if (!product) {
    return <ProductNotFound />;
  }

  return <ProductDetail product={product} />;
}
