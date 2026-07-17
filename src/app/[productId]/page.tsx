import { PRODUCTS } from "@/lib/products";
import ProductDetail, { ProductNotFound } from "@/components/ProductDetail";

// Next.js 16: params is a Promise in server components — await it
export default async function ProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId: rawId } = await params;
  const productId = parseInt(rawId, 10);
  const product = PRODUCTS.find((p) => p.id === productId);

  if (!product) {
    return <ProductNotFound />;
  }

  return <ProductDetail product={product} />;
}