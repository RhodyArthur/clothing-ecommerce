import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Order } from '../../../../core/services/order';
import { Product } from '../../../../core/services/product';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-admin-dashboard',
  imports: [CommonModule, RouterLink, TagModule, SkeletonModule],
  templateUrl: './admin-dashboard.html',
})
export class AdminDashboard implements OnInit {
  private orderService = inject(Order);
  private productService = inject(Product);

  loading = signal(true);

  totalOrders = computed(() => this.orderService.orders().length);

  totalRevenue = computed(() =>
    this.orderService
      .orders()
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.total, 0),
  );

  pendingOrders = computed(
    () => this.orderService.orders().filter((o) => o.status === 'pending').length,
  );

  lowStockProducts = computed(() =>
    this.productService.products().filter((p) => p.stock_count <= 5 && p.is_active),
  );

  recentOrders = computed(() =>
    [...this.orderService.orders()]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5),
  );

  async ngOnInit(): Promise<void> {
    await Promise.all([this.orderService.fetchAllOrders(), this.productService.fetchAllProducts()]);
    this.loading.set(false);
  }

  getSeverity(
    status: string,
  ): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | null | undefined {
    const map: Record<string, 'success' | 'secondary' | 'info' | 'warn' | 'danger'> = {
      pending: 'warn',
      confirmed: 'info',
      shipped: 'info',
      delivered: 'success',
      cancelled: 'danger',
    };
    return map[status] ?? 'secondary';
  }
}
