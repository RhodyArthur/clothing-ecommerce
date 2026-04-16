import { Component, OnInit, inject, signal, computed } from '@angular/core';
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

  shippingCost = computed(() => (this.cartService.total() >= 50 ? 0 : 15));
  grandTotal = computed(() => this.cartService.total() + this.shippingCost());

  form = this.fb.group({
    // Contact
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: ['', Validators.required],
    // Delivery
    street: ['', Validators.required],
    city: ['', Validators.required],
    postalCode: ['', Validators.required],
    orderNotes: [''],
  });

  ngOnInit(): void {
    // Redirect if cart is empty
    if (this.cartService.isEmpty()) {
      this.router.navigate(['/cart']);
      return;
    }

    // Pre-fill from auth profile if logged in
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
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);

    const { fullName, email, phoneNumber, street, city, postalCode, orderNotes } = this.form.value;
    const deliveryAddress = `${street}, ${city}, ${postalCode}`;

    try {
      // 1 — Save order to Supabase
      const order = await this.orderService.createOrder({
        items: this.cartService.items(),
        total: this.grandTotal(),
        delivery_address: deliveryAddress,
      });

      if (!order) throw new Error('Order creation failed');

      // 2 — Build WhatsApp message
      const itemLines = this.cartService
        .items()
        .map(
          (i) =>
            `• ${i.name} (${i.color}, ${i.size}) x${i.quantity} — GHS ${(i.price * i.quantity).toFixed(2)}`,
        )
        .join('\n');

      const message = [
        `🛍 *New Order — #${order.id.slice(0, 8).toUpperCase()}*`,
        ``,
        `*Customer Details*`,
        `Name: ${fullName}`,
        `Email: ${email}`,
        `Phone: ${phoneNumber}`,
        ``,
        `*Order Items*`,
        itemLines,
        ``,
        `*Delivery Address*`,
        deliveryAddress,
        orderNotes ? `Notes: ${orderNotes}` : '',
        ``,
        `*Subtotal:* GHS ${this.cartService.total().toFixed(2)}`,
        `*Shipping:* ${this.shippingCost() === 0 ? 'FREE' : `GHS ${this.shippingCost().toFixed(2)}`}`,
        `*Total: GHS ${this.grandTotal().toFixed(2)}*`,
      ]
        .filter(Boolean)
        .join('\n');

      // 3 — Mark whatsapp_sent + open WhatsApp
      await this.orderService.markWhatsappSent(order.id);

      const whatsappNumber = environment.whatsappNumber;
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`; // ← encode the whole thing

      // 4 — Clear cart + redirect
      this.cartService.clearCart();
      window.location.href = whatsappUrl;
      this.router.navigate(['/orders', order.id]);
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
        life: 4000,
      });
    } finally {
      this.submitting.set(false);
    }
  }

  // Helper for template validation display
  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }
}
