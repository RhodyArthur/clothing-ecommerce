import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TableModule } from 'primeng/table';
import { Product } from '../../../../core/services/product';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { Supabase } from '../../../../core/services/supabase';
import { Product as ProductModel } from '../../../../core/models/product';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { Search as SearchComponent } from '../../../../shared/components/search/search';
import { Search as SearchServiceImpl } from '../../../../core/services/search';

@Component({
  selector: 'app-admin-products',
  imports: [
    CommonModule,
    RouterLink,
    ButtonModule,
    SelectModule,
    FormsModule,
    TagModule,
    ConfirmDialogModule,
    ToastModule,
    SkeletonModule,
    TableModule,
    EmptyState,
    SearchComponent,
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
  private search = inject(SearchServiceImpl);

  statusFilter = signal<'all' | 'active' | 'hidden'>('all');

  statusOptions: { label: string; value: 'all' | 'active' | 'hidden' }[] = [
    { label: 'All status', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Hidden', value: 'hidden' },
  ];

  mobilePage = signal(1);
  readonly mobilePageSize = 10;

  private resetMobilePage = effect(() => {
    this.filteredProducts();
    this.mobilePage.set(1);
  });

  mobilePaginatedProducts = computed(() => {
    const start = (this.mobilePage() - 1) * this.mobilePageSize;
    return this.filteredProducts().slice(start, start + this.mobilePageSize);
  });

  mobileTotalPages = computed(() =>
    Math.ceil(this.filteredProducts().length / this.mobilePageSize),
  );

  mobilePageNumbers = computed(() =>
    Array.from({ length: this.mobileTotalPages() }, (_, i) => i + 1),
  );

  mobileGoToPage(page: number): void {
    if (page < 1 || page > this.mobileTotalPages()) return;
    this.mobilePage.set(page);
  }

  filteredProducts = computed(() => {
    const term = this.search.query().trim().toLowerCase();
    const status = this.statusFilter();

    return this.products().filter((product) => {
      const matchesStatus =
        status === 'all' || (status === 'active' ? product.is_active : !product.is_active);

      if (!matchesStatus) return false;
      if (!term) return true;

      return [product.name, product.description, product.category]
        .filter((value): value is string => Boolean(value))
        .some((value) => value.toLowerCase().includes(term));
    });
  });

  ngOnInit(): void {
    this.productService.fetchAllProducts();
  }

  // status is set directly via ngModelChange binding in template

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

      await this.productService.fetchAllProducts();
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
      await this.productService.fetchAllProducts();
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
