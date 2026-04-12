export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface OrderItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
  color: string;
  image_url: string;
}

export interface Order {
  id: string;
  user_id: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  delivery_address: string;
  whatsapp_sent: boolean;
  confirmed_by_customer:   boolean;
  created_at: string;
}

export interface CreateOrderPayload {
  items: OrderItem[];
  total: number;
  delivery_address: string;
}