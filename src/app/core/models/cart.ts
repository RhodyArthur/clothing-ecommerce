export interface CartItem {
  product_id: string;
  name:       string;
  price:      number;
  quantity:   number;
  size:       string;
  color:      string;
  image_url:  string;
}

export interface SupabaseCartRow {
    quantity: number;
    size: string;
    color: string;
    products: { id: string; name: string; price: number; image_urls: string[] }[];
}