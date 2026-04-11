import { Component, computed, inject, OnInit } from '@angular/core';
import { Product } from '../../core/models/product';
import { Cart } from '../../core/services/cart';
import { Wishlist as WishlistService} from '../../core/services/wishlist';
import { Product as ProductService } from '../../core/services/product';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-wishlist',
  imports: [CommonModule, RouterLink, ButtonModule],
  templateUrl: './wishlist.html',
  styleUrl: './wishlist.css',
})
export class Wishlist implements OnInit{
  wishlistService = inject(WishlistService);
  cartService     = inject(Cart);
  productService  = inject(ProductService);

  wishlistProducts = computed<Product[]>(() =>
    this.wishlistService.ids()
      .map(id => this.productService.products().find(p => p.id === id))
      .filter((p): p is Product => !!p)
  );

  async ngOnInit(): Promise<void> {
    // Ensure products are loaded so wishlist can resolve names/images
    if (!this.productService.products().length) {
      await this.productService.fetchProducts();
    }
  }
}
