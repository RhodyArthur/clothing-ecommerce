export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  sizes: string[];
  colors: string[];
  stock_count: number;
  image_urls: string[];
  is_active: boolean;
  created_at: string;
}

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  size?: string;
  color?: string;
}
