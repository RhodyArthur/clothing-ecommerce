import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { Order } from '../../../core/services/order';
import { EmptyState } from "../../../shared/components/empty-state/empty-state";


@Component({
  selector: 'app-orders',
  imports: [CommonModule, RouterLink, ButtonModule, TagModule, SkeletonModule, EmptyState],
  templateUrl: './orders.html',
})
export class Orders implements OnInit {
  orderService = inject(Order);

  ngOnInit(): void {
    this.orderService.fetchMyOrders();
  }

  getSeverity(status: string): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | null | undefined {
    switch (status) {
      case 'delivered':
        return 'success';
      case 'cancelled':
        return 'danger';
      case 'processing':
        return 'info';
      case 'shipped':
        return 'warn';
      default:
        return 'secondary';
    }
  }

  getStatusIcon(status: string): string {
    const map: Record<string, string> = {
      pending:   'pi-clock',
      confirmed: 'pi-check-circle',
      shipped:   'pi-truck',
      delivered: 'pi-box',
      cancelled: 'pi-times-circle'
    };
    return map[status] ?? 'pi-circle';
  }
}