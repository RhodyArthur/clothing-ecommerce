import { Component, computed, inject, OnInit, signal, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Product } from '../../../core/services/product';
import { Cart } from '../../../core/services/cart';
import { Wishlist } from '../../../core/services/wishlist';
import { Product as prod } from '../../../core/models/product';
import { CommonModule } from '@angular/common';

import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageService } from 'primeng/api';
import { ProductCard } from "../../../shared/components/product-card/product-card";
import { SizeGuide } from '../../../shared/components/size-guide/size-guide';

@Component({
  selector: 'app-product-detail',
  imports: [CommonModule, ButtonModule, TagModule, DividerModule, ToastModule, SkeletonModule, RouterLink, ProductCard, SizeGuide],
  providers: [MessageService],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css',
})
export class ProductDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private messages = inject(MessageService);
  productService = inject(Product);
  cartService = inject(Cart);
  wishlistService = inject(Wishlist);

  product = signal<prod | null>(null);
  loading = signal(true);
  notFound = signal(false);

  selectedSize = signal<string>('');
  selectedColor = signal<string>('');
  quantity = signal<number>(1);

  @ViewChild(SizeGuide) sizeGuide!: SizeGuide;

  openSizeGuide(): void {
    this.sizeGuide.open();
  }

  relatedProducts = computed(() =>
    this.productService
      .activeProducts()
      .filter((p) => p.id !== this.product()?.id && p.category === this.product()?.category)
      .slice(0, 4),
  );

  isWishlisted = computed(() =>
    this.product() ? this.wishlistService.has(this.product()!.id) : false
  );

  inStock = computed(() => (this.product()?.stock_count ?? 0) > 0);

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/products']);
      return;
    }

    if (!this.productService.activeProducts().length) {
      await this.productService.fetchProducts();
    }

    const found = await this.productService.getProductById(id);
    if (!found) {
      this.notFound.set(true);
    } else {
      this.product.set(found);
      if (found.sizes?.length) this.selectedSize.set(found.sizes[0]);
      if (found.colors?.length) this.selectedColor.set(found.colors[0]);
    }
    this.loading.set(false);
  }

  selectSize(size: string): void {
    this.selectedSize.set(size);
  }
  selectColor(color: string): void {
    this.selectedColor.set(color);
  }

  addToCart(): void {
    const p = this.product();
    if (!p) return;

    this.cartService.addItem({
      product_id: p.id,
      name:       p.name,
      price:      p.price,
      quantity:   this.quantity(),
      size:       this.selectedSize(),
      color:      this.selectedColor(),
      image_url:  p.image_urls?.[0] ?? ''
    });

    this.messages.add({
      severity: 'success',
      summary: 'Added to cart',
      detail: `${p.name} has been added to your cart`,
      life: 2000
    });
  }

  buyNow(): void {
    this.addToCart();
    this.router.navigate(['/checkout']);
  }

  toggleWishlist(): void {
    const p = this.product();
    if (p) this.wishlistService.toggle(p.id);
  }

  get stars(): number[] {
    return [1, 2, 3, 4, 5];
  }
}
