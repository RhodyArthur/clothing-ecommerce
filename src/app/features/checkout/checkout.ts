import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Cart } from '../../core/services/cart';
import { Order } from '../../core/services/order';
import { Auth } from '../../core/services/auth';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { FloatLabelModule } from 'primeng/floatlabel';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { environment } from '../../../environments/environment';
import { buildWhatsappUrl } from '../../core/utils/whatsapp';
import { parseColor } from '../../core/utils/color-map';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    TextareaModule,
    FloatLabelModule,
    ButtonModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './checkout.html',
})
export class Checkout implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private messages = inject(MessageService);
  cartService = inject(Cart);
  orderService = inject(Order);
  authService = inject(Auth);

  submitting = signal(false);
  parseColor = parseColor;
  deliveryMethod = signal<'delivery' | 'pickup'>('delivery');

  form = this.fb.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: ['', Validators.required],
    street: ['', Validators.required],
    city: ['', Validators.required],
    postalCode: ['', Validators.required],
    orderNotes: [''],
  });

  selectDeliveryMethod(method: 'delivery' | 'pickup'): void {
    this.deliveryMethod.set(method);
    const addressFields = ['street', 'city', 'postalCode'];
    if (method === 'pickup') {
      addressFields.forEach((f) => {
        this.form.get(f)?.clearValidators();
        this.form.get(f)?.updateValueAndValidity();
      });
    } else {
      addressFields.forEach((f) => {
        this.form.get(f)?.setValidators(Validators.required);
        this.form.get(f)?.updateValueAndValidity();
      });
    }
  }

  ngOnInit(): void {
    if (this.cartService.isEmpty()) {
      this.router.navigate(['/cart']);
      return;
    }

    const user = this.authService.currentUser();
    if (user) {
      this.form.patchValue({
        email: user.email ?? '',
        fullName: user.user_metadata?.['full_name'] ?? '',
        phoneNumber: user.user_metadata?.['phone_number'] ?? '',
      });
    }
  }

  async placeOrder(): Promise<void> {
    if (this.submitting()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);

    const { fullName, email, phoneNumber, street, city, postalCode, orderNotes } = this.form.value;
    const isPickup = this.deliveryMethod() === 'pickup';
    const deliveryAddress = isPickup ? 'Pick Up' : `${street}, ${city}, ${postalCode}`;
    const orderItems = this.cartService.items().map((item) => ({ ...item }));
    const orderTotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    try {
      if (!orderItems.length) {
        throw new Error('Your cart is empty.');
      }

      if (!buildWhatsappUrl(environment.whatsappNumber, '')) {
        throw new Error('WhatsApp ordering is temporarily unavailable.');
      }

      const order = await this.orderService.createOrder({
        items: orderItems,
        total: orderTotal,
        delivery_address: deliveryAddress,
      });

      if (!order) {
        throw new Error('Order creation failed');
      }

      const itemLines = orderItems
        .map(
          (i) =>
            `• ${i.name} (${parseColor(i.color).name}, ${i.size}) x${i.quantity} — GHS ${(i.price * i.quantity).toFixed(2)}`,
        )
        .join('\n');

      const message = [
        `🛍 *New Order - #${order.id.slice(0, 8).toUpperCase()}*`,
        '',
        '*Customer Details*',
        `Name: ${fullName}`,
        `Email: ${email}`,
        `Phone: ${phoneNumber}`,
        '',
        '*Order Items*',
        itemLines,
        '',
        '*Delivery Address*',
        deliveryAddress,
        orderNotes ? `Notes: ${orderNotes}` : '',
        '',
        `*Fulfillment:* ${isPickup ? 'Pick Up' : 'Delivery'}`,
        `*Subtotal:* GHS ${orderTotal.toFixed(2)}`,
        isPickup ? `*Delivery Fee:* Free (Pick Up)` : `*Delivery Fee:* GHS 20+ (paid to courier)`,
        `*Order Total: GHS ${orderTotal.toFixed(2)}*`,
      ]
        .filter(Boolean)
        .join('\n');

      await this.cartService.clearCart();

      let handoffStarted = false;
      const handleVisibilityChange = async () => {
        if (document.visibilityState === 'hidden') {
          handoffStarted = true;
          return;
        }

        if (document.visibilityState === 'visible' && handoffStarted) {
          document.removeEventListener('visibilitychange', handleVisibilityChange);
          await this.orderService.markWhatsappSent(order.id);
          await this.router.navigate(['/orders', order.id]);
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      const whatsappUrl = buildWhatsappUrl(environment.whatsappNumber, message);
      if (!whatsappUrl) {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        throw new Error('WhatsApp ordering is temporarily unavailable.');
      }

      window.location.href = whatsappUrl;
    } catch (err: unknown) {
      const detail =
        err instanceof Error
          ? err.message
          : typeof err === 'string'
            ? err
            : 'Something went wrong. Please try again.';

      this.messages.add({
        severity: 'error',
        summary: 'Order failed',
        detail,
        life: 2000,
      });
    } finally {
      this.submitting.set(false);
    }
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }
}
