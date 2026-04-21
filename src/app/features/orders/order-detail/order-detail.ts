import { Component, OnInit, inject, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Order as OrderService } from '../../../core/services/order';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { TimelineModule } from 'primeng/timeline';
import { Order } from '../../../core/models/order';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Supabase } from '../../../core/services/supabase';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-order-detail',
  imports: [CommonModule, RouterLink, ButtonModule, TagModule, DividerModule, TimelineModule],
  templateUrl: './order-detail.html',
})
export class OrderDetail implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private orderService = inject(OrderService);
  private supabase = inject(Supabase);
  private channel: RealtimeChannel | null = null;

  order = signal<Order | null>(null);
  loading = signal(true);
  confirming = signal(false);

  // Order status timeline steps
  timelineSteps = [
    { status: 'pending', label: 'Order Placed', icon: 'pi-clock' },
    { status: 'confirmed', label: 'Confirmed', icon: 'pi-check-circle' },
    { status: 'shipped', label: 'Shipped', icon: 'pi-truck' },
    { status: 'delivered', label: 'Delivered', icon: 'pi-box' },
  ];

  currentStepIndex = computed(() => {
    const status = this.order()?.status ?? 'pending';
    const idx = this.timelineSteps.findIndex((s) => s.status === status);
    return idx === -1 ? 0 : idx;
  });

  isCancelled = computed(() => this.order()?.status === 'cancelled');

  shippingCost = computed(() => {
    const o = this.order();
    if (!o) return 0;
    // Derive from total — if total matches items sum, shipping was free
    const itemsTotal = o.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    return Math.round((o.total - itemsTotal) * 100) / 100;
  });

  itemsTotal = computed(
    () => this.order()?.items.reduce((sum, i) => sum + i.price * i.quantity, 0) ?? 0,
  );

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    // Check local signal state first (avoids extra DB call)
    const cached = this.orderService.orders().find((o) => o.id === id);
    if (cached) {
      this.order.set(cached);
      this.loading.set(false);
    } else {
      // Fallback: fetch all orders then find this one
      await this.orderService.fetchMyOrders();
      const found = this.orderService.orders().find((o) => o.id === id) ?? null;
      this.order.set(found);
      this.loading.set(false);
    }

    // Always subscribe to realtime status changes for this order
    this.channel = this.supabase.client
      .channel(`order-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${id}`,
        },
        (payload) => {
          const updated = payload.new as Partial<Order>;
          this.order.update((current) => (current ? { ...current, ...updated } : current));
        },
      )
      .subscribe();
  }

  getSeverity(
    status: string,
  ): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | null | undefined {
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

  resendWhatsApp(): void {
    const o = this.order();
    if (!o) return;

    const itemLines = o.items
      .map(
        (i) =>
          `• ${i.name} (${i.color}, ${i.size}) x${i.quantity} — GHS ${(i.price * i.quantity).toFixed(2)}`,
      )
      .join('\n');

    const message = [
      `🛍 *Order Enquiry — #${o.id.slice(0, 8).toUpperCase()}*`,
      ``,
      `*Order Items*`,
      itemLines,
      ``,
      `*Delivery Address*`,
      o.delivery_address,
      ``,
      `*Total: GHS ${o.total.toFixed(2)}*`,
    ].join('\n');

    const whatsappNumber = environment.whatsappNumber;
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
  }

  canConfirmDelivery = computed(
    () => this.order()?.status === 'shipped' && !this.order()?.confirmed_by_customer,
  );

  async confirmDelivery(): Promise<void> {
    this.confirming.set(true);
    const success = await this.orderService.confirmDelivery(this.order()!.id);
    if (!success) {
      // show error — keep existing toast pattern
    }
    this.confirming.set(false);
  }

  ngOnDestroy(): void {
    if (this.channel) {
      this.supabase.client.removeChannel(this.channel);
    }
  }
}
