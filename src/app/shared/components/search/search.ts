import { Component, inject } from '@angular/core';
import { Product } from '../../../core/models/product';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AutoCompleteCompleteEvent, AutoCompleteSelectEvent } from 'primeng/types/autocomplete';
import { Search as SearchService } from '../../../core/services/search';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { EmptyState } from '../empty-state/empty-state';

@Component({
  selector: 'app-search',
  imports: [CommonModule, FormsModule, AutoCompleteModule, EmptyState],
  templateUrl: './search.html',
  styleUrl: './search.css',
})
export class Search {
  search = inject(SearchService);

  // PrimeNG autocomplete needs a local value binding
  selectedProduct: Product | string | null = null;

  onSearch(event: AutoCompleteCompleteEvent): void {
    this.search.search(event.query);
  }

  onSelect(event: AutoCompleteSelectEvent): void {
    this.search.navigateTo(event.value as Product);
    this.selectedProduct = null;
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      const q =
        typeof this.selectedProduct === 'string' ? this.selectedProduct : this.search.query();
      if (q) {
        this.search.query.set(q);
        this.search.goToResults();
        this.selectedProduct = null;
      }
    }
  }
}
