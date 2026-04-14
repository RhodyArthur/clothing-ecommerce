import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TableModule } from 'primeng/table';
import { Product } from '../../../../core/services/product';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { Supabase } from '../../../../core/services/supabase';
import { Product as ProductModel } from '../../../../core/models/product';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-admin-products',
  imports: [
    CommonModule,
    RouterLink,
    ButtonModule,
    TagModule,
    ConfirmDialogModule,
    ToastModule,
    SkeletonModule,
    TableModule,
    EmptyState,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './admin-products.html',
})
export class AdminProducts implements OnInit {
  private productService = inject(Product);
  private supabase = inject(Supabase);
  private confirm = inject(ConfirmationService);
  private messages = inject(MessageService);

  products = this.productService.products;
  loading = this.productService.loading;

  ngOnInit(): void {
    this.productService.fetchAllProducts();
  }

  confirmDelete(product: ProductModel): void {
    this.confirm.confirm({
      message: `Delete "${product.name}"? This cannot be undone.`,
      header: 'Delete Product',
      icon: 'pi pi-trash',
      accept: () => this.deleteProduct(product.id),
    });
  }

  private async deleteProduct(id: string): Promise<void> {
    try {
      const { error } = await this.supabase.client.from('products').delete().eq('id', id);

      if (error) throw error;

      await this.productService.fetchProducts();
      this.messages.add({
        severity: 'success',
        summary: 'Deleted',
        detail: 'Product removed successfully',
        life: 2000,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete product';
      this.messages.add({
        severity: 'error',
        summary: 'Error',
        detail: message,
        life: 2000,
      });
    }
  }

  async toggleActive(product: ProductModel): Promise<void> {
    try {
      const { error } = await this.supabase.client
        .from('products')
        .update({ is_active: !product.is_active })
        .eq('id', product.id);

      if (error) throw error;
      await this.productService.fetchProducts();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to toggle active state';
      this.messages.add({
        severity: 'error',
        summary: 'Error',
        detail: message,
        life: 2000,
      });
    }
  }
}
