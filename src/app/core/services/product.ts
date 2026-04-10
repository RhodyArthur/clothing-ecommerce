import { computed, inject, Injectable, signal } from '@angular/core';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Product as prod, ProductFilters } from '../models/product';
import { Supabase } from './supabase';

@Injectable({
  providedIn: 'root',
})
export class Product {
  // --- State (Signals) ---
  private readonly _products = signal<prod[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly supabaseService = inject(Supabase);
  
  products = this._products.asReadonly();
  loading = this._loading.asReadonly();

  // --- Derived signals ---
  activeProducts = computed(() =>
    this._products().filter(p => p.is_active)
  );

  categories = computed(() =>
    [...new Set(this._products().map(p => p.category).filter(Boolean))] as string[]
  );

  private realtimeChannel: RealtimeChannel | null = null;

   async fetchProducts(filters?: ProductFilters): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      let query = this.supabaseService.client
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.minPrice !== undefined) {
        query = query.gte('price', filters.minPrice);
      }
      if (filters?.maxPrice !== undefined) {
        query = query.lte('price', filters.maxPrice);
      }
      if (filters?.size) {
        query = query.contains('sizes', [filters.size]);
      }
      if (filters?.color) {
        query = query.contains('colors', [filters.color]);
      }

      const { data, error } = await query;

      if (error) throw error;
      this._products.set(data as prod[]);

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load products';
      this._error.set(message);
    } finally {
      this._loading.set(false);
    }
  }

  async getProductById(id: string): Promise<prod | null> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('products')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data as prod;

    } catch (err: unknown) {
      console.error('[ProductService] getProductById:', err);
      return null;
    }
  }

  subscribeToRealtime(): void {
    if (this.realtimeChannel) return;

    this.realtimeChannel = this.supabaseService.client
      .channel('products-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'products' },
        (payload) => this.handleInsert(payload.new as prod)
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'products' },
        (payload) => this.handleUpdate(payload.new as prod)
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'products' },
        (payload) => this.handleDelete(payload.old as Pick<prod, 'id'>)
      )
      .subscribe((status) => {
        console.log('[ProductService] Realtime status:', status);
      });
  }

  unsubscribeFromRealtime(): void {
    if (this.realtimeChannel) {
      this.supabaseService.client.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }
  }

  private handleInsert(newProduct: prod): void {
    if (!newProduct.is_active) return;
    this._products.update(current => [newProduct, ...current]);
  }

  private handleUpdate(updatedProduct: prod): void {
    this._products.update(current => {
      const exists = current.some(p => p.id === updatedProduct.id);

      // If it became inactive, remove it from the list
      if (!updatedProduct.is_active) {
        return current.filter(p => p.id !== updatedProduct.id);
      }

      // If it's new (was inactive before, now active), prepend it
      if (!exists) {
        return [updatedProduct, ...current];
      }

      // Otherwise update in place
      return current.map(p => p.id === updatedProduct.id ? updatedProduct : p);
    });
  }

  private handleDelete(deleted: Pick<prod, 'id'>): void {
    this._products.update(current =>
      current.filter(p => p.id !== deleted.id)
    );
  }
}
