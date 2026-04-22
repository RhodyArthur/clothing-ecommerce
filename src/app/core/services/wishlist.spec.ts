import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Wishlist } from './wishlist';
import { Auth } from './auth';
import { Supabase } from './supabase';

describe('Wishlist', () => {
  let service: Wishlist;
  let authMock: {
    currentUser: ReturnType<typeof signal>;
  };
  let supabaseMock: {
    client: {
      from: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    localStorage.clear();

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
        Wishlist,
        { provide: Auth, useValue: authMock },
        { provide: Supabase, useValue: supabaseMock },
      ],
    });
  });

  it('loads and preserves guest wishlist ids from localStorage', () => {
    localStorage.setItem('wishlist', JSON.stringify(['p1', 'p2']));

    service = TestBed.inject(Wishlist);

    expect(service.ids()).toEqual(['p1', 'p2']);
    expect(JSON.parse(localStorage.getItem('wishlist') ?? '[]')).toEqual(['p1', 'p2']);
  });

  it('adds and removes guest wishlist items in localStorage', async () => {
    service = TestBed.inject(Wishlist);

    await service.add('p1');
    expect(service.has('p1')).toBe(true);
    expect(JSON.parse(localStorage.getItem('wishlist') ?? '[]')).toEqual(['p1']);

    await service.remove('p1');
    expect(service.has('p1')).toBe(false);
    expect(JSON.parse(localStorage.getItem('wishlist') ?? '[]')).toEqual([]);
  });

  it('syncs authenticated wishlist changes through Supabase', async () => {
    const user = { id: 'user-1' };
    authMock.currentUser.set(user);

    const fetchResponse = Promise.resolve({
      data: [{ product_id: 'p9' }],
      error: null,
    });

    const selectQuery = {
      select: vi.fn(() => selectQuery),
      eq: vi.fn(() => selectQuery),
      then: fetchResponse.then.bind(fetchResponse),
    };

    const writeQuery = {
      upsert: vi.fn().mockResolvedValue({ error: null }),
      delete: vi.fn(() => ({
        match: vi.fn().mockResolvedValue({ error: null }),
      })),
    };

    supabaseMock.client.from.mockImplementation((table: string) => {
      if (table !== 'wishlist') {
        throw new Error(`Unexpected table: ${table}`);
      }

      return {
        ...selectQuery,
        ...writeQuery,
      };
    });

    service = TestBed.inject(Wishlist);
    await Promise.resolve();

    await service.add('p4');
    expect(service.has('p4')).toBe(true);

    await service.remove('p4');
    expect(service.has('p4')).toBe(false);
  });
});
