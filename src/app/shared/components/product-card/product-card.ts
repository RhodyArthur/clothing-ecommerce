import { Component, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { Cart } from '../../../core/services/cart';
import { Wishlist } from '../../../core/services/wishlist';
import { Product as ProductModel } from '../../../core/models/product';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-product-card',
  imports: [CommonModule, RouterLink, ToastModule],
  templateUrl: './product-card.html',
})
export class ProductCard {
  product = input.required<ProductModel>();

  private cartService = inject(Cart);
  private wishlistService = inject(Wishlist);
  private messages = inject(MessageService);
  private router = inject(Router);

  isWishlisted(): boolean {
    return this.wishlistService.has(this.product().id);
  }

  // True when product has only one option — can add directly
  canQuickAdd(): boolean {
    const p = this.product();
    return (p.sizes?.length ?? 0) <= 1 && (p.colors?.length ?? 0) <= 1;
  }

  toggleWishlist(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.wishlistService.toggle(this.product().id);
  }

  quickAdd(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    const p = this.product();

    this.cartService.addItem({
      product_id: p.id,
      name: p.name,
      price: p.price,
      quantity: 1,
      size: p.sizes?.[0] ?? 'One Size',
      color: p.colors?.[0] ?? 'Default',
      image_url: p.image_urls?.[0] ?? '',
    });

    this.messages.add({
      severity: 'success',
      summary: 'Added to cart',
      detail: p.name,
      life: 2000,
    });
  }

  onMobileCartClick(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (this.canQuickAdd()) {
      this.quickAdd(event);
    } else {
      // go to product detail for variant selection
      this.router.navigate(['/products', this.product().id]);
    }
  }
}
