import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Search } from './search';
import { Product } from './product';
import { Product as ProductModel } from '../models/product';

describe('Search', () => {
  let service: Search;
  let routerMock: {
    navigate: ReturnType<typeof vi.fn>;
  };
  let productMock: {
    activeProducts: ReturnType<typeof signal<ProductModel[]>>;
  };

  beforeEach(() => {
    routerMock = {
      navigate: vi.fn(),
    };

    productMock = {
      activeProducts: signal([
        {
          id: 'p1',
          name: 'Linen Shirt',
          description: 'Lightweight and breathable',
          category: 'Men',
          price: 35,
          sizes: ['M'],
          colors: ['White'],
          stock_count: 10,
          image_urls: ['shirt.jpg'],
          is_active: true,
          created_at: '2026-01-01T00:00:00Z',
        },
        {
          id: 'p2',
          name: 'Wrap Dress',
          description: 'Elegant evening piece',
          category: 'Women',
          price: 80,
          sizes: ['S'],
          colors: ['Red'],
          stock_count: 5,
          image_urls: ['dress.jpg'],
          is_active: true,
          created_at: '2026-01-02T00:00:00Z',
        },
      ]),
    };

    TestBed.configureTestingModule({
      providers: [
        Search,
        { provide: Router, useValue: routerMock },
        { provide: Product, useValue: productMock },
      ],
    });

    service = TestBed.inject(Search);
  });

  it('returns no results for queries shorter than two characters', () => {
    service.search('a');

    expect(service.results()).toEqual([]);
  });

  it('filters products by name, description, or category', () => {
    service.search('dress');

    expect(service.results()).toHaveLength(1);
    expect(service.results()[0]?.id).toBe('p2');
  });

  it('navigates to product details and clears transient search state', () => {
    service.search('linen');

    service.navigateTo(productMock.activeProducts()[0]);

    expect(routerMock.navigate).toHaveBeenCalledWith(['/products', 'p1']);
    expect(service.query()).toBe('');
    expect(service.results()).toEqual([]);
  });

  it('navigates to the product results page with the current query', () => {
    service.query.set('linen');

    service.goToResults();

    expect(routerMock.navigate).toHaveBeenCalledWith(['/products'], {
      queryParams: { q: 'linen' },
    });
  });
});
