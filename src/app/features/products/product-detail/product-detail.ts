import { Component, computed, DestroyRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Product } from '../../../core/services/product';
import { Cart } from '../../../core/services/cart';
import { Wishlist } from '../../../core/services/wishlist';
import { Product as prod } from '../../../core/models/product';
import { CommonModule } from '@angular/common';
import { GalleriaModule } from 'primeng/galleria';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageService } from 'primeng/api';
import { ProductCard } from '../../../shared/components/product-card/product-card';
import { SizeGuide } from '../../../shared/components/size-guide/size-guide';
import { Auth } from '../../../core/services/auth';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { parseColor } from '../../../core/utils/color-map';

@Component({
  selector: 'app-product-detail',
  imports: [
    CommonModule,
    ButtonModule,
    TagModule,
    DividerModule,
    ToastModule,
    SkeletonModule,
    MessageModule,
    RouterLink,
    ProductCard,
    SizeGuide,
    EmptyState,
    GalleriaModule
  ],
  providers: [MessageService],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css',
})
export class ProductDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private messages = inject(MessageService);
  productService = inject(Product);
  cartService = inject(Cart);
  wishlistService = inject(Wishlist);
  authService = inject(Auth);

  product = signal<prod | null>(null);
  loading = signal(true);
  notFound = signal(false);

  selectedSize = signal<string>('');
  selectedColor = signal<string>('');
  quantity = signal<number>(1);
  parseColor = parseColor;

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
    this.product() ? this.wishlistService.has(this.product()!.id) : false,
  );

  inStock = computed(() => (this.product()?.stock_count ?? 0) > 0);

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(async (params) => {
      const id = params.get('id');
      if (!id) {
        this.router.navigate(['/products']);
        return;
      }

      // Reset state for the new product
      this.loading.set(true);
      this.notFound.set(false);
      this.product.set(null);
      this.selectedSize.set('');
      this.selectedColor.set('');

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
    });
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
      name: p.name,
      price: p.price,
      quantity: this.quantity(),
      size: this.selectedSize(),
      color: this.selectedColor(),
      image_url: p.image_urls?.[0] ?? '',
    });

    this.messages.add({
      severity: 'success',
      summary: 'Added to cart',
      detail: `${p.name} has been added to your cart`,
      life: 2000,
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
}
