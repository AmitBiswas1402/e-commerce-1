import { getProductBySlug } from "@/lib/products-server";
import ProductDetail, { ProductNotFound } from "@/components/ProductDetail";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ productSlug: string }>;
}) {
  const { productSlug } = await params;
  const product = await getProductBySlug(productSlug);

  if (!product) {
    return <ProductNotFound />;
  }

  return <ProductDetail product={product} />;
}
