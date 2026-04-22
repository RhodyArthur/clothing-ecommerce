import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Auth } from './auth';
import { Supabase } from './supabase';

describe('Auth', () => {
  let service: Auth;
  let routerMock: {
    navigate: ReturnType<typeof vi.fn>;
  };
  let authClientMock: {
    getSession: ReturnType<typeof vi.fn>;
    onAuthStateChange: ReturnType<typeof vi.fn>;
    signUp: ReturnType<typeof vi.fn>;
    signInWithPassword: ReturnType<typeof vi.fn>;
    signInWithOAuth: ReturnType<typeof vi.fn>;
    signOut: ReturnType<typeof vi.fn>;
    resetPasswordForEmail: ReturnType<typeof vi.fn>;
    updateUser: ReturnType<typeof vi.fn>;
  };
  let authStateChangeCallback:
    | ((event: string, session: { user: { user_metadata?: Record<string, unknown> } } | null) => void)
    | undefined;

  beforeEach(() => {
    routerMock = {
      navigate: vi.fn(),
    };

    authClientMock = {
      getSession: vi.fn().mockResolvedValue({
        data: {
          session: {
            user: {
              id: 'user-1',
              email: 'user@example.com',
              user_metadata: { is_admin: true },
            },
          },
        },
      }),
      onAuthStateChange: vi.fn((callback) => {
        authStateChangeCallback = callback;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      }),
      signUp: vi.fn().mockResolvedValue({ data: { user: { id: 'new-user' } }, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: { session: {} }, error: null }),
      signInWithOAuth: vi.fn().mockResolvedValue({ error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
      updateUser: vi.fn().mockResolvedValue({ error: null }),
    };

    TestBed.configureTestingModule({
      providers: [
        Auth,
        { provide: Router, useValue: routerMock },
        { provide: Supabase, useValue: { client: { auth: authClientMock } } },
      ],
    });
  });

  it('restores the initial session and exposes admin state', async () => {
    service = TestBed.inject(Auth);
    await service.waitForSession();

    expect(service.currentUser()?.email).toBe('user@example.com');
    expect(service.isLoggedIn()).toBe(true);
    expect(service.isAdmin()).toBe(true);
    expect(service.loading()).toBe(false);
  });

  it('passes sign-up metadata and redirect URL to Supabase', async () => {
    service = TestBed.inject(Auth);
    await service.waitForSession();

    await service.signUp('new@example.com', 'Password1!', 'Ada Lovelace', '233200000000');

    expect(authClientMock.signUp).toHaveBeenCalledWith({
      email: 'new@example.com',
      password: 'Password1!',
      options: {
        data: {
          full_name: 'Ada Lovelace',
          phone_number: '233200000000',
        },
        emailRedirectTo: `${window.location.origin}/auth/login`,
      },
    });
  });

  it('navigates home on signed out auth state changes', async () => {
    service = TestBed.inject(Auth);
    await service.waitForSession();

    authStateChangeCallback?.('SIGNED_OUT', null);

    expect(routerMock.navigate).toHaveBeenCalledWith(['/']);
    expect(service.currentUser()).toBeNull();
  });
});
