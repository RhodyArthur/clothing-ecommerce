import { Component, inject, OnInit } from '@angular/core';
import { Cart } from '../../core/services/cart';
import { Product } from '../../core/services/product';
import { Wishlist } from '../../core/services/wishlist';
import { RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [RouterLink, CurrencyPipe],
  templateUrl: './home.html',
})
export class Home implements OnInit{
  productService = inject(Product);
  cartService    = inject(Cart);
  wishlistService = inject(Wishlist);

  categories = [
    {
      label: 'Women',
      subtitle: 'Elegant & Timeless',
      query: 'women',
      image: 'assets/images/category-women.jpg'
    },
    {
      label: 'Men',
      subtitle: 'Modern & Classic',
      query: 'men',
      image: 'assets/images/category-men.jpg'
    },
    {
      label: 'Accessories',
      subtitle: 'Complete Your Look',
      query: 'accessories',
      image: 'assets/images/category-accessories.jpg'
    }
  ];

  ngOnInit(): void {
    this.productService.fetchProducts();
  }

  // toggleWishlist(event: Event, productId: string): void {
  //   event.preventDefault();
  //   event.stopPropagation();
  //   this.wishlistService.toggle(productId);
  // }

  // isWishlisted(productId: string): boolean {
  //   return this.wishlistService.has(productId);
  // }
}
