import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { Supabase } from './supabase';
import { Auth } from './auth';

@Injectable({
  providedIn: 'root',
})
export class Wishlist {
  private supabase = inject(Supabase);
  private auth = inject(Auth);

  // ── State ──────────────────────────────────────────
  private _ids = signal<Set<string>>(new Set(this.loadFromStorage()));
  private _loading = signal(false);

  // ── Public readonly signals ────────────────────────
  loading = this._loading.asReadonly();
  count = computed(() => this._ids().size);
  isEmpty = computed(() => this._ids().size === 0);
  ids = computed(() => Array.from(this._ids()));

  constructor() {
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
    const localIds = this.loadFromStorage();
    await this.fetchFromSupabase();

    // Merge local wishlist into DB
    if (localIds.length) {
      const userId = this.auth.currentUser()!.id;
      const rows = localIds.map((product_id) => ({ user_id: userId, product_id }));

      await this.supabase.client
        .from('wishlist')
        .upsert(rows, { onConflict: 'user_id,product_id', ignoreDuplicates: true });

      localStorage.removeItem('wishlist');
      await this.fetchFromSupabase();
    }
  }

  private onLogout(): void {
    this._ids.set(new Set());
    localStorage.removeItem('wishlist');
  }

  // ── Public actions ─────────────────────────────────

  has(productId: string): boolean {
    return this._ids().has(productId);
  }

  async toggle(productId: string): Promise<void> {
    if (this.has(productId)) {
      await this.remove(productId);
    } else {
      await this.add(productId);
    }
  }

  async add(productId: string): Promise<void> {
    if (this.has(productId)) return;

    // Optimistic update
    this._ids.update((current) => {
      const next = new Set(current);
      next.add(productId);
      return next;
    });

    if (this.auth.currentUser()) {
      const { error } = await this.supabase.client
        .from('wishlist')
        .upsert(
          { user_id: this.auth.currentUser()!.id, product_id: productId },
          { onConflict: 'user_id,product_id', ignoreDuplicates: true },
        );
      if (error) {
        // Rollback on failure
        this._ids.update((current) => {
          const next = new Set(current);
          next.delete(productId);
          return next;
        });
        console.error('[WishlistService] add:', error);
      }
    } else {
      this.saveToStorage(this._ids());
    }
  }

  async remove(productId: string): Promise<void> {
    // Optimistic update
    this._ids.update((current) => {
      const next = new Set(current);
      next.delete(productId);
      return next;
    });

    if (this.auth.currentUser()) {
      const { error } = await this.supabase.client.from('wishlist').delete().match({
        user_id: this.auth.currentUser()!.id,
        product_id: productId,
      });
      if (error) {
        // Rollback on failure
        this._ids.update((current) => {
          const next = new Set(current);
          next.add(productId);
          return next;
        });
        console.error('[WishlistService] remove:', error);
      }
    } else {
      this.saveToStorage(this._ids());
    }
  }

  async clearWishlist(): Promise<void> {
    if (this.auth.currentUser()) {
      await this.supabase.client
        .from('wishlist')
        .delete()
        .eq('user_id', this.auth.currentUser()!.id);
    }
    this._ids.set(new Set());
    localStorage.removeItem('wishlist');
  }

  // ── Supabase helpers ───────────────────────────────

  private async fetchFromSupabase(): Promise<void> {
    this._loading.set(true);
    try {
      const { data, error } = await this.supabase.client
        .from('wishlist')
        .select('product_id')
        .eq('user_id', this.auth.currentUser()!.id);

      if (error) throw error;
      this._ids.set(new Set((data ?? []).map((r: { product_id: string }) => r.product_id)));
    } catch (err) {
      console.error('[WishlistService] fetchFromSupabase:', err);
    } finally {
      this._loading.set(false);
    }
  }

  // ── localStorage (guest only) ──────────────────────

  private saveToStorage(ids: Set<string>): void {
    try {
      localStorage.setItem('wishlist', JSON.stringify([...ids]));
    } catch {
      //
    }
  }

  private loadFromStorage(): string[] {
    try {
      const raw = localStorage.getItem('wishlist');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
}
