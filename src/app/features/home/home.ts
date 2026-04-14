import { Component, computed, inject, OnInit } from '@angular/core';
import { Product } from '../../core/services/product';
import { RouterLink } from '@angular/router';
import { SkeletonModule } from 'primeng/skeleton';
import { ProductCard } from "../../shared/components/product-card/product-card";
import { fashionTips } from '../../shared/constants/fashion-tips';
import { CarouselModule } from 'primeng/carousel';

@Component({
  selector: 'app-home',
  imports: [RouterLink, SkeletonModule, ProductCard, CarouselModule],
  templateUrl: './home.html',
})
export class Home implements OnInit{
  productService = inject(Product);

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
      label:    'Unisex',
      subtitle: 'Wear It Your Way',
      query:    'unisex',
      image:    'assets/images/category-unisex.jpg'
    },
    {
      label: 'Accessories',
      subtitle: 'Complete Your Look',
      query: 'accessories',
      image: 'assets/images/accessories.jpg'
    }
  ];

  readonly promo = {
    label: 'EASTER SALE',
    subtitle: 'Up to 30% off selected items',
    endsAt: '2025-04-30',
  };

  readonly hasActivePromo = computed(() => new Date() <= new Date(this.promo.endsAt));
  readonly fashionTips = fashionTips;

  ngOnInit(): void {
    this.productService.fetchProducts();
  }

}
