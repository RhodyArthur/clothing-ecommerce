import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { Auth } from './auth';
import { Supabase } from './supabase';
import { CartItem, SupabaseCartRow } from '../models/cart';

@Injectable({
  providedIn: 'root',
})
export class Cart {
  private supabase = inject(Supabase);
  private auth = inject(Auth);

  // ── State ──────────────────────────────────────────
  private _items = signal<CartItem[]>(this.loadFromStorage());
  private _loading = signal(false);

  // ── Public readonly signals ────────────────────────
  items = this._items.asReadonly();
  loading = this._loading.asReadonly();

  itemCount = computed(() => this._items().reduce((sum, i) => sum + i.quantity, 0));
  total = computed(() => this._items().reduce((sum, i) => sum + i.price * i.quantity, 0));
  isEmpty = computed(() => this._items().length === 0);

  constructor() {
    // React to auth state changes
    effect(() => {
      const user = this.auth.currentUser();
      if (user) {
        this.onLogin();
      } else {
        this.onLogout();
      }
    });
  }

  // ── Auth lifecycle ─────────────────────────────────

  private async onLogin(): Promise<void> {
    const localItems = this.loadFromStorage();
    await this.fetchFromSupabase();

    // Merge any local guest items into DB
    if (localItems.length) {
      for (const item of localItems) {
        await this.upsertToSupabase(item);
      }
      localStorage.removeItem('cart');
      await this.fetchFromSupabase();
    }
  }

  private onLogout(): void {
    this._items.set([]);
    localStorage.removeItem('cart');
  }

  // ── Public actions ─────────────────────────────────

  async addItem(item: CartItem): Promise<void> {
    if (this.auth.currentUser()) {
      await this.upsertToSupabase(item);
      await this.fetchFromSupabase();
    } else {
      this._items.update((current) => {
        const idx = current.findIndex(
          (i) => i.product_id === item.product_id && i.size === item.size && i.color === item.color,
        );
        const updated =
          idx > -1
            ? current.map((i, n) =>
                n === idx ? { ...i, quantity: i.quantity + item.quantity } : i,
              )
            : [...current, item];
        this.saveToStorage(updated);
        return updated;
      });
    }
  }

  async removeItem(productId: string, size: string, color: string): Promise<void> {
    if (this.auth.currentUser()) {
      await this.supabase.client.from('cart_items').delete().match({
        user_id: this.auth.currentUser()!.id,
        product_id: productId,
        size,
        color,
      });
      await this.fetchFromSupabase();
    } else {
      this._items.update((current) => {
        const updated = current.filter(
          (i) => !(i.product_id === productId && i.size === size && i.color === color),
        );
        this.saveToStorage(updated);
        return updated;
      });
    }
  }

  async updateQuantity(
    productId: string,
    size: string,
    color: string,
    quantity: number,
  ): Promise<void> {
    if (quantity < 1) {
      await this.removeItem(productId, size, color);
      return;
    }

    if (this.auth.currentUser()) {
      await this.supabase.client.from('cart_items').update({ quantity }).match({
        user_id: this.auth.currentUser()!.id,
        product_id: productId,
        size,
        color,
      });
      await this.fetchFromSupabase();
    } else {
      this._items.update((current) => {
        const updated = current.map((i) =>
          i.product_id === productId && i.size === size && i.color === color
            ? { ...i, quantity }
            : i,
        );
        this.saveToStorage(updated);
        return updated;
      });
    }
  }

  async clearCart(): Promise<void> {
    if (this.auth.currentUser()) {
      await this.supabase.client
        .from('cart_items')
        .delete()
        .eq('user_id', this.auth.currentUser()!.id);
    }
    this._items.set([]);
    localStorage.removeItem('cart');
  }

  // ── Supabase helpers ───────────────────────────────

  private async fetchFromSupabase(): Promise<void> {
  this._loading.set(true);
  try {
    const { data, error } = await this.supabase.client
      .from('cart_items')
      .select(`
        quantity, size, color,
        products (id, name, price, image_urls)
      `)
      .eq('user_id', this.auth.currentUser()!.id);

    if (error) throw error;

    const items: CartItem[] = ((data as unknown as SupabaseCartRow[]) ?? [])
      .filter(row => row.products !== null)   // ← skip orphaned cart items
      .map(row => ({
        product_id: row.products!.id,          // ← direct object access, not [0]
        name:       row.products!.name,
        price:      row.products!.price,
        image_url:  row.products!.image_urls?.[0] ?? '',
        quantity:   row.quantity,
        size:       row.size,
        color:      row.color,
      }));

    this._items.set(items);
  } catch (err) {
    console.error('[CartService] fetchFromSupabase:', err);
  } finally {
    this._loading.set(false);
  }
}

  private async upsertToSupabase(item: CartItem): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;

    try {
      const { error } = await this.supabase.client.from('cart_items').upsert(
        {
          user_id: userId,
          product_id: item.product_id,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
        },
        {
          onConflict: 'user_id,product_id,size,color',
          ignoreDuplicates: false,
        },
      );

      if (error) throw error;
    } catch (err) {
      console.error('[CartService] upsertToSupabase:', err);
    }
  }

  // ── localStorage (guest only) ──────────────────────

  private saveToStorage(items: CartItem[]): void {
    try {
      localStorage.setItem('cart', JSON.stringify(items));
    } catch {
      // Silently ignore localStorage errors (e.g., quota exceeded, private mode)
    }
  }

  private loadFromStorage(): CartItem[] {
    try {
      const raw = localStorage.getItem('cart');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
}
