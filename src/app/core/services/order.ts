import { inject, Injectable, signal } from '@angular/core';
import { Supabase } from './supabase';
import { Auth } from './auth';
import { Order as OrderModel, CreateOrderPayload, OrderStatus } from '../models/order';

@Injectable({
  providedIn: 'root',
})
export class Order {
  // --- State (Signals) ---
  private readonly _orders = signal<OrderModel[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly supabaseService = inject(Supabase);
  private readonly authService = inject(Auth);

  // --- Public readonly signals ---
  orders = this._orders.asReadonly();
  loading = this._loading.asReadonly();
  error = this._error.asReadonly();

  async createOrder(payload: CreateOrderPayload): Promise<OrderModel | null> {
    const user = this.authService.currentUser();
    if (!user) {
      this._error.set('You must be logged in to place an order.');
      return null;
    }

    this._loading.set(true);
    this._error.set(null);

    try {
      const { data, error } = await this.supabaseService.client
        .from('orders')
        .insert({
          user_id: user.id,
          items: payload.items, // stored as JSONB
          total: payload.total,
          delivery_address: payload.delivery_address,
          status: 'pending',
          whatsapp_sent: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data as OrderModel;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create order';
      this._error.set(message);
      return null;
    } finally {
      this._loading.set(false);
    }
  }

  async fetchMyOrders(): Promise<void> {
    const user = this.authService.currentUser();
    if (!user) return;

    this._loading.set(true);
    this._error.set(null);

    try {
      const { data, error } = await this.supabaseService.client
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      this._orders.set(data as OrderModel[]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch your orders.';
      this._error.set(message);
    } finally {
      this._loading.set(false);
    }
  }

  async fetchAllOrders(status?: OrderStatus): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      let query = this.supabaseService.client
        .from('orders')
        .select('*, profiles(full_name, phone)') // join customer info
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;
      this._orders.set(data as OrderModel[]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch orders.';
      this._error.set(message);
    } finally {
      this._loading.set(false);
    }
  }

  // ------------------------------------------------
  // Update order status (admin only)
  // ------------------------------------------------
  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<boolean> {
    try {
      const { error } = await this.supabaseService.client
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;

      // Update local signal in place — no refetch needed
      this._orders.update((current) =>
        current.map((o) => (o.id === orderId ? { ...o, status } : o)),
      );

      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update order status.';
      this._error.set(message);
      return false;
    }
  }

  // ------------------------------------------------
  // Mark whatsapp_sent = true after message is sent
  // ------------------------------------------------
  async markWhatsappSent(orderId: string): Promise<void> {
    try {
      const { error } = await this.supabaseService.client
        .from('orders')
        .update({ whatsapp_sent: true })
        .eq('id', orderId);

      if (error) throw error;

      this._orders.update((current) =>
        current.map((o) => (o.id === orderId ? { ...o, whatsapp_sent: true } : o)),
      );
    } catch (err: unknown) {
      console.error('[OrderService] markWhatsappSent:', err);
    }
  }

  async confirmDelivery(orderId: string): Promise<boolean> {
    try {
      const { error } = await this.supabaseService.client
        .from('orders')
        .update({
          status:                'delivered',
          confirmed_by_customer: true
        })
        .eq('id', orderId)
        .eq('user_id', this.authService.currentUser()!.id); // safety: only own orders

      if (error) throw error;

      this._orders.update(current =>
        current.map(o =>
          o.id === orderId
            ? { ...o, status: 'delivered', confirmed_by_customer: true }
            : o
        )
      );
      return true;
    } catch (err) {
      console.error('[OrderService] confirmDelivery:', err);
      return false;
    }
  }

  // ------------------------------------------------
  // Clear local state (e.g. on logout)
  // ------------------------------------------------
  clearOrders(): void {
    this._orders.set([]);
    this._error.set(null);
  }
}
