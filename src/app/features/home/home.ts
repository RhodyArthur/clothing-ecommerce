import { Component, inject, OnInit } from '@angular/core';
import { Product } from '../../core/services/product';
import { RouterLink } from '@angular/router';
import { SkeletonModule } from 'primeng/skeleton';
import { ProductCard } from "../../shared/components/product-card/product-card";

@Component({
  selector: 'app-home',
  imports: [RouterLink, SkeletonModule, ProductCard],
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

  ngOnInit(): void {
    this.productService.fetchProducts();
  }
}
