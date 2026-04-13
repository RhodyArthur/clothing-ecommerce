import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Product as ProductModel } from '../models/product';
import { Product } from './product';

@Injectable({
  providedIn: 'root',
})
export class Search {
  private router         = inject(Router);
  private productService = inject(Product);

  query   = signal('');
  results = signal<ProductModel[]>([]);

  search(query: string): void {
    this.query.set(query);
    const q = query.trim().toLowerCase();

    if (!q || q.length < 2) {
      this.results.set([]);
      return;
    }

    const filtered = this.productService.activeProducts()
      .filter(p =>
        p.name.toLowerCase().includes(q)         ||
        p.description?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
      )
      .slice(0, 8);

    this.results.set(filtered);
  }

  navigateTo(product: ProductModel): void {
    this.query.set('');
    this.results.set([]);
    this.router.navigate(['/products', product.id]);
  }

  goToResults(): void {
    const q = this.query().trim();
    if (!q) return;
    this.router.navigate(['/products'], { queryParams: { q } });
    this.query.set('');
    this.results.set([]);
  }
}
