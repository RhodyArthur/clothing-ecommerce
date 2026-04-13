import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule, NgTemplateOutlet } from '@angular/common';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { SliderModule } from 'primeng/slider';
import { DrawerModule } from 'primeng/drawer';
import { Product } from '../../../core/services/product';
import { FormsModule } from '@angular/forms';
import { Search } from "../../../shared/components/search/search";
import { ProductCard } from "../../../shared/components/product-card/product-card";

type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'newest';

@Component({
  selector: 'app-product-list',
  imports: [
    CommonModule,
    FormsModule,
    NgTemplateOutlet,
    SelectModule,
    DrawerModule,
    ButtonModule,
    SkeletonModule,
    SliderModule,
    Search,
    ProductCard
],
  templateUrl: './product-list.html',
  styleUrls: ['./product-list.css'],
})
export class ProductList implements OnInit, OnDestroy {
  productService = inject(Product);
  private route = inject(ActivatedRoute);

  // --- Filter state ---
  selectedCategories = signal<string[]>([]);
  selectedSizes = signal<string[]>([]);
  selectedColors = signal<string[]>([]);
  minPrice = signal<number>(0);
  maxPrice = signal<number>(300);
  sortBy = signal<SortOption>('featured');
  filterDrawerOpen = signal(false);

  openFilters(): void {
    this.filterDrawerOpen.set(true);
  }
  closeFilters(): void {
    this.filterDrawerOpen.set(false);
  }

  // --- Filter options ---
  categories = ['Women', 'Men', 'Unisex', 'Accessories'];
  sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  colors = ['Black', 'White', 'Gray', 'Blue', 'Brown', 'Beige', 'Navy'];

  sortOptions = [
    { label: 'Featured', value: 'featured' },
    { label: 'Price: Low → High', value: 'price-asc' },
    { label: 'Price: High → Low', value: 'price-desc' },
    { label: 'Newest', value: 'newest' },
  ];

  // --- Derived: filtered + sorted products ---
  filteredProducts = computed(() => {
    let products = this.productService.activeProducts();

    if (this.selectedCategories().length) {
      products = products.filter((p) =>
        this.selectedCategories().some((c) => c.toLowerCase() === p.category?.toLowerCase()),
      );
    }
    if (this.selectedSizes().length) {
      products = products.filter((p) => this.selectedSizes().some((s) => p.sizes.includes(s)));
    }
    if (this.selectedColors().length) {
      products = products.filter((p) =>
        this.selectedColors().some((c) =>
          p.colors.map((col) => col.toLowerCase()).includes(c.toLowerCase()),
        ),
      );
    }

    products = products.filter((p) => p.price >= this.minPrice() && p.price <= this.maxPrice());

    switch (this.sortBy()) {
      case 'price-asc':
        return [...products].sort((a, b) => a.price - b.price);
      case 'price-desc':
        return [...products].sort((a, b) => b.price - a.price);
      case 'newest':
        return [...products].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
      default:
        return products;
    }
  });

  ngOnInit(): void {
    // Pre-select category from query param (e.g. from navbar links)
    this.route.queryParams.subscribe((params) => {
      if (params['category']) {
        const cat = params['category'];
        this.selectedCategories.set([cat.charAt(0).toUpperCase() + cat.slice(1)]);
      }
    });

    this.productService.fetchProducts();
    this.productService.subscribeToRealtime();
  }

  ngOnDestroy(): void {
    this.productService.unsubscribeFromRealtime();
  }

  toggleCategory(cat: string): void {
    this.selectedCategories.update((current) =>
      current.includes(cat) ? current.filter((c) => c !== cat) : [...current, cat],
    );
  }

  toggleSize(size: string): void {
    this.selectedSizes.update((current) =>
      current.includes(size) ? current.filter((s) => s !== size) : [...current, size],
    );
  }

  toggleColor(color: string): void {
    this.selectedColors.update((current) =>
      current.includes(color) ? current.filter((c) => c !== color) : [...current, color],
    );
  }

  clearFilters(): void {
    this.selectedCategories.set([]);
    this.selectedSizes.set([]);
    this.selectedColors.set([]);
    this.minPrice.set(0);
    this.maxPrice.set(300);
    this.sortBy.set('featured');
  }

  hasActiveFilters(): boolean {
    return (
      this.selectedCategories().length > 0 ||
      this.selectedSizes().length > 0 ||
      this.selectedColors().length > 0 ||
      this.minPrice() > 0 ||
      this.maxPrice() < 300
    );
  }
}
