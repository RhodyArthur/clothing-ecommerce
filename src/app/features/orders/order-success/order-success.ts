import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Order as OrderService} from '../../../core/services/order';
import { Order } from '../../../core/models/order';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-order-success',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonModule],
  template: `
    <div class="max-w-lg mx-auto px-4 py-20 text-center">

      <!-- Success icon -->
      <div class="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center
                  mx-auto mb-6">
        <i class="pi pi-check text-green-600" style="font-size:1.75rem;"></i>
      </div>

      <h1 class="text-2xl font-bold text-gray-900 mb-3">Order Placed!</h1>
      <p class="text-sm text-gray-500 mb-2">
        Thank you for your order. We'll confirm it via WhatsApp shortly.
      </p>

      @if (order()) {
        <p class="text-xs text-gray-400 mb-8">
          Order ID: <span class="font-mono font-medium text-gray-600">
            #{{ order()!.id.slice(0,8).toUpperCase() }}
          </span>
        </p>

        <!-- Order items recap -->
        <div class="border border-gray-200 rounded-lg p-5 text-left mb-8">
          @for (item of order()!.items; track item.product_id) {
            <div class="flex justify-between text-sm py-2 border-b border-gray-50 last:border-0">
              <span class="text-gray-700">
                {{ item.name }}
                <span class="text-gray-400 text-xs ml-1">({{ item.color }}, {{ item.size }}) ×{{ item.quantity }}</span>
              </span>
              <span class="font-medium text-gray-900">
                GHS {{ (item.price * item.quantity) | number:'1.2-2' }}
              </span>
            </div>
          }
          <div class="flex justify-between text-sm font-semibold text-gray-900 pt-3 mt-1">
            <span>Total</span>
            <span>GHS {{ order()!.total | number:'1.2-2' }}</span>
          </div>
        </div>
      }

      <div class="flex flex-col sm:flex-row gap-3 justify-center">
        <p-button
          label="Continue Shopping"
          routerLink="/products"
          styleClass="!bg-gray-900 !border-gray-900 !text-white"
        />
        <p-button
          label="View My Orders"
          routerLink="/orders"
          [outlined]="true"
          styleClass="!border-gray-300 !text-gray-700"
        />
      </div>

    </div>
  `
})
export class OrderSuccess implements OnInit {
  private route        = inject(ActivatedRoute);
  private orderService = inject(OrderService);
  order = signal<Order | null>(null);

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    // Find order in local signal state first (already there from createOrder)
    const found = this.orderService.orders().find(o => o.id === id) ?? null;
    this.order.set(found);
  }
}