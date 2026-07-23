export interface ProductReview {
  author: string;
  avatar: string;
  rating: number;
  comment: string;
  date: string;
  verified: boolean;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviewCount: number;
  images: string[];
  reviews: ProductReview[];
  badge?: string;
  inStock: boolean;
}

export const PRODUCTS: Product[] = [];
