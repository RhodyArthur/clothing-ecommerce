import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { OrderStatus } from '../../../../core/models/order';
import { Order } from '../../../../core/services/order';
import { Order as OrderModel } from '../../../../core/models/order';

@Component({
  selector: 'app-admin-orders',
  imports: [
    CommonModule,
    FormsModule,
    TagModule,
    TableModule,
    SelectModule,
    SkeletonModule,
    ToastModule,
    DialogModule,
    DividerModule,
    ButtonModule,
  ],
  providers: [MessageService],
  templateUrl: './admin-orders.html',
})
export class AdminOrders implements OnInit {
  orderService = inject(Order);
  private messages = inject(MessageService);

  selectedStatus = signal<OrderStatus | 'all'>('all');
  selectedOrder = signal<OrderModel | null>(null);
  detailVisible = signal(false);

  statusOptions = [
    { label: 'All Orders', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Confirmed', value: 'confirmed' },
    { label: 'Shipped', value: 'shipped' },
    { label: 'Delivered', value: 'delivered' },
    { label: 'Cancelled', value: 'cancelled' },
  ];

  orderStatuses: { label: string; value: OrderStatus }[] = [
    { label: 'Pending', value: 'pending' },
    { label: 'Confirmed', value: 'confirmed' },
    { label: 'Shipped', value: 'shipped' },
    { label: 'Delivered', value: 'delivered' },
    { label: 'Cancelled', value: 'cancelled' },
  ];

  filteredOrders = computed(() => {
    const status = this.selectedStatus();
    const orders = this.orderService.orders();
    return status === 'all' ? orders : orders.filter((o) => o.status === status);
  });

  ngOnInit(): void {
    this.orderService.fetchAllOrders();
  }

  openDetail(order: OrderModel): void {
    this.selectedOrder.set(order);
    this.detailVisible.set(true);
  }

  async updateStatus(orderId: string, status: OrderStatus): Promise<void> {
    const success = await this.orderService.updateOrderStatus(orderId, status);
    if (success) {
      // Update selected order in dialog if open
      const current = this.selectedOrder();
      if (current?.id === orderId) {
        this.selectedOrder.set({ ...current, status });
      }
      this.messages.add({
        severity: 'success',
        summary: 'Updated',
        detail: `Order status set to ${status}`,
        life: 2000,
      });
    } else {
      this.messages.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to update status',
        life: 2000,
      });
    }
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

  itemsTotal(order: OrderModel): number {
    return order.items.reduce((s, i) => s + i.price * i.quantity, 0);
  }
}
