import { TestBed } from '@angular/core/testing';
import { Product } from './product';
import { Supabase } from './supabase';

describe('Product', () => {
  let service: Product;
  let supabaseMock: {
    client: {
      from: ReturnType<typeof vi.fn>;
      channel: ReturnType<typeof vi.fn>;
      removeChannel: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    supabaseMock = {
      client: {
        from: vi.fn(),
        channel: vi.fn(),
        removeChannel: vi.fn(),
      },
    };

    TestBed.configureTestingModule({
      providers: [Product, { provide: Supabase, useValue: supabaseMock }],
    });
  });

  it('fetches products and applies Supabase filters', async () => {
    const response = Promise.resolve({
      data: [
        {
          id: 'p1',
          name: 'Trousers',
          description: 'Relaxed fit',
          price: 99,
          category: 'Men',
          sizes: ['M'],
          colors: ['Black'],
          stock_count: 4,
          image_urls: ['pants.jpg'],
          is_active: true,
          created_at: '2026-01-01T00:00:00Z',
        },
      ],
      error: null,
    });

    const query = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      order: vi.fn(() => query),
      gte: vi.fn(() => query),
      lte: vi.fn(() => query),
      contains: vi.fn(() => query),
      then: response.then.bind(response),
    };

    supabaseMock.client.from.mockReturnValue(query);

    service = TestBed.inject(Product);
    await service.fetchProducts({
      category: 'Men',
      minPrice: 50,
      maxPrice: 150,
      size: 'M',
      color: 'Black',
    });

    expect(query.eq).toHaveBeenCalledWith('is_active', true);
    expect(query.eq).toHaveBeenCalledWith('category', 'Men');
    expect(query.gte).toHaveBeenCalledWith('price', 50);
    expect(query.lte).toHaveBeenCalledWith('price', 150);
    expect(query.contains).toHaveBeenCalledWith('sizes', ['M']);
    expect(query.contains).toHaveBeenCalledWith('colors', ['Black']);
    expect(service.products()).toHaveLength(1);
    expect(service.activeProducts()).toHaveLength(1);
  });

  it('returns a product by id from Supabase', async () => {
    const single = vi.fn().mockResolvedValue({
      data: {
        id: 'p2',
        name: 'Blazer',
        description: 'Tailored',
        price: 120,
        category: 'Women',
        sizes: ['S'],
        colors: ['Beige'],
        stock_count: 2,
        image_urls: ['blazer.jpg'],
        is_active: true,
        created_at: '2026-01-02T00:00:00Z',
      },
      error: null,
    });

    const query = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      single,
    };

    supabaseMock.client.from.mockReturnValue(query);

    service = TestBed.inject(Product);
    const product = await service.getProductById('p2');

    expect(query.eq).toHaveBeenCalledWith('id', 'p2');
    expect(product?.name).toBe('Blazer');
  });

  it('updates local state from realtime product events', async () => {
    const response = Promise.resolve({
      data: [
        {
          id: 'p1',
          name: 'Sneakers',
          description: 'Leather',
          price: 75,
          category: 'Unisex',
          sizes: ['42'],
          colors: ['White'],
          stock_count: 8,
          image_urls: ['shoe.jpg'],
          is_active: true,
          created_at: '2026-01-03T00:00:00Z',
        },
      ],
      error: null,
    });

    const query = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      order: vi.fn(() => query),
      then: response.then.bind(response),
    };

    const handlers: Record<string, (payload: { new?: unknown; old?: unknown }) => void> = {};
    const realtimeChain = {
      on: vi.fn((_: string, config: { event: string }, handler: (payload: { new?: unknown; old?: unknown }) => void) => {
        handlers[config.event] = handler;
        return realtimeChain;
      }),
      subscribe: vi.fn(() => realtimeChain),
    };

    supabaseMock.client.from.mockReturnValue(query);
    supabaseMock.client.channel.mockReturnValue(realtimeChain);

    service = TestBed.inject(Product);
    await service.fetchProducts();
    service.subscribeToRealtime();

    handlers['UPDATE']?.({
      new: {
        id: 'p1',
        name: 'Sneakers',
        description: 'Leather',
        price: 70,
        category: 'Unisex',
        sizes: ['42'],
        colors: ['White'],
        stock_count: 8,
        image_urls: ['shoe.jpg'],
        is_active: true,
        created_at: '2026-01-03T00:00:00Z',
      },
    });

    expect(service.products()[0]?.price).toBe(70);

    handlers['DELETE']?.({ old: { id: 'p1' } });
    expect(service.products()).toEqual([]);
  });
});
