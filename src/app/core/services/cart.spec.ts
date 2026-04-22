import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Cart } from './cart';
import { Auth } from './auth';
import { Supabase } from './supabase';
import { CartItem } from '../models/cart';

describe('Cart', () => {
  let service: Cart;
  let authMock: {
    currentUser: ReturnType<typeof signal>;
  };
  let supabaseMock: {
    client: {
      from: ReturnType<typeof vi.fn>;
      rpc: ReturnType<typeof vi.fn>;
    };
  };

  const guestItem: CartItem = {
    product_id: 'p1',
    name: 'Oxford Shirt',
    price: 30,
    quantity: 2,
    size: 'M',
    color: 'Blue',
    image_url: 'shirt.jpg',
  };

  beforeEach(() => {
    localStorage.clear();

    authMock = {
      currentUser: signal(null),
    };

    supabaseMock = {
      client: {
        from: vi.fn(),
        rpc: vi.fn(),
      },
    };

    TestBed.configureTestingModule({
      providers: [
        Cart,
        { provide: Auth, useValue: authMock },
        { provide: Supabase, useValue: supabaseMock },
      ],
    });
  });

  it('loads and preserves guest cart items from localStorage', () => {
    localStorage.setItem('cart', JSON.stringify([guestItem]));

    service = TestBed.inject(Cart);

    expect(service.items()).toEqual([guestItem]);
    expect(JSON.parse(localStorage.getItem('cart') ?? '[]')).toEqual([guestItem]);
  });

  it('adds guest cart items to localStorage and updates totals', async () => {
    service = TestBed.inject(Cart);

    await service.addItem(guestItem);

    expect(service.items()).toEqual([guestItem]);
    expect(service.itemCount()).toBe(2);
    expect(service.total()).toBe(60);
    expect(JSON.parse(localStorage.getItem('cart') ?? '[]')).toEqual([guestItem]);
  });

  it('syncs authenticated cart items through Supabase', async () => {
    const user = { id: 'user-1' };
    authMock.currentUser.set(user);

    const fetchResponse = Promise.resolve({
      data: [
        {
          quantity: 3,
          size: 'L',
          color: 'Black',
          products: {
            id: 'p2',
            name: 'Bomber Jacket',
            price: 80,
            image_urls: ['jacket.jpg'],
          },
        },
      ],
      error: null,
    });

    const fetchQuery = {
      select: vi.fn(() => fetchQuery),
      eq: vi.fn(() => fetchQuery),
      then: fetchResponse.then.bind(fetchResponse),
    };

    supabaseMock.client.from.mockImplementation((table: string) => {
      if (table === 'cart_items') {
        return fetchQuery;
      }

      throw new Error(`Unexpected table: ${table}`);
    });
    supabaseMock.client.rpc.mockResolvedValue({ error: null });

    service = TestBed.inject(Cart);
    await Promise.resolve();

    await service.addItem({
      product_id: 'p2',
      name: 'Bomber Jacket',
      price: 80,
      quantity: 1,
      size: 'L',
      color: 'Black',
      image_url: 'jacket.jpg',
    });

    expect(supabaseMock.client.rpc).toHaveBeenCalledWith('increment_cart_item', {
      p_user_id: 'user-1',
      p_product_id: 'p2',
      p_size: 'L',
      p_color: 'Black',
      p_quantity: 1,
    });
    expect(service.items()).toEqual([
      {
        product_id: 'p2',
        name: 'Bomber Jacket',
        price: 80,
        quantity: 3,
        size: 'L',
        color: 'Black',
        image_url: 'jacket.jpg',
      },
    ]);
  });
});
