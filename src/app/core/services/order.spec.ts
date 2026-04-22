import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Order } from './order';
import { Auth } from './auth';
import { Supabase } from './supabase';

describe('Order', () => {
  let service: Order;
  let authMock: {
    currentUser: ReturnType<typeof signal>;
  };
  let supabaseMock: {
    client: {
      from: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    authMock = {
      currentUser: signal(null),
    };

    supabaseMock = {
      client: {
        from: vi.fn(),
      },
    };

    TestBed.configureTestingModule({
      providers: [
        Order,
        { provide: Auth, useValue: authMock },
        { provide: Supabase, useValue: supabaseMock },
      ],
    });
  });

  it('requires authentication to create an order', async () => {
    service = TestBed.inject(Order);

    const result = await service.createOrder({
      items: [],
      total: 20,
      delivery_address: 'Accra',
    });

    expect(result).toBeNull();
    expect(service.error()).toContain('logged in');
  });

  it('creates an order for an authenticated user', async () => {
    authMock.currentUser.set({ id: 'user-1' });

    const single = vi.fn().mockResolvedValue({
      data: {
        id: 'order-1',
        user_id: 'user-1',
        items: [],
        total: 35,
        status: 'pending',
        delivery_address: 'Accra',
        whatsapp_sent: false,
        confirmed_by_customer: false,
        created_at: '2026-01-01T00:00:00Z',
      },
      error: null,
    });

    const insertChain = {
      insert: vi.fn(() => insertChain),
      select: vi.fn(() => insertChain),
      single,
    };

    supabaseMock.client.from.mockReturnValue(insertChain);

    service = TestBed.inject(Order);
    const order = await service.createOrder({
      items: [],
      total: 35,
      delivery_address: 'Accra',
    });

    expect(insertChain.insert).toHaveBeenCalledWith({
      user_id: 'user-1',
      items: [],
      total: 35,
      delivery_address: 'Accra',
      status: 'pending',
      whatsapp_sent: false,
    });
    expect(order?.id).toBe('order-1');
  });

  it('fetches orders for the current user', async () => {
    authMock.currentUser.set({ id: 'user-1' });

    const response = Promise.resolve({
      data: [
        {
          id: 'order-2',
          user_id: 'user-1',
          items: [],
          total: 60,
          status: 'pending',
          delivery_address: 'Tema',
          whatsapp_sent: true,
          confirmed_by_customer: false,
          created_at: '2026-01-02T00:00:00Z',
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

    supabaseMock.client.from.mockReturnValue(query);

    service = TestBed.inject(Order);
    await service.fetchMyOrders();

    expect(query.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(service.orders()).toHaveLength(1);
  });

  it('updates local order status after a successful admin change', async () => {
    const fetchResponse = Promise.resolve({
      data: [
        {
          id: 'order-3',
          user_id: 'user-1',
          items: [],
          total: 90,
          status: 'pending',
          delivery_address: 'Kumasi',
          whatsapp_sent: false,
          confirmed_by_customer: false,
          created_at: '2026-01-03T00:00:00Z',
        },
      ],
      error: null,
    });

    const fetchQuery = {
      select: vi.fn(() => fetchQuery),
      order: vi.fn(() => fetchQuery),
      eq: vi.fn(() => fetchQuery),
      then: fetchResponse.then.bind(fetchResponse),
    };

    const updateChain = {
      update: vi.fn(() => updateChain),
      eq: vi.fn().mockResolvedValue({ error: null }),
    };

    supabaseMock.client.from.mockImplementation((table: string) => {
      if (table !== 'orders') {
        throw new Error(`Unexpected table: ${table}`);
      }

      return {
        ...fetchQuery,
        ...updateChain,
      };
    });

    service = TestBed.inject(Order);
    await service.fetchAllOrders();

    const success = await service.updateOrderStatus('order-3', 'shipped');

    expect(success).toBe(true);
    expect(service.orders()[0]?.status).toBe('shipped');
  });
});
