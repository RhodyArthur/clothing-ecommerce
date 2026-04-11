import { inject, Injectable, signal } from '@angular/core';
import { User } from '@supabase/supabase-js';
import { Supabase } from './supabase';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private supabase = inject(Supabase);
  private router = inject(Router);

  currentUser = signal<User | null>(null);
  loading = signal(true);

  constructor() {
    // Restore session on app load
    this.supabase.client.auth.getSession().then(({ data }) => {
      this.currentUser.set(data.session?.user ?? null);
      this.loading.set(false);
    });

    // Keep signal in sync with Supabase auth state
    this.supabase.client.auth.onAuthStateChange((event, session) => {
      this.currentUser.set(session?.user ?? null);

      if (event === 'SIGNED_OUT') {
        this.router.navigate(['/']);
      }
    });
  }

  // ── Sign up ────────────────────────────────────────
  async signUp(email: string, password: string, fullName: string, phone: string) {
    const { data, error } = await this.supabase.client.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone: phone },
        emailRedirectTo: `${window.location.origin}/auth/login`,
      },
    });
    if (error) throw error;
    return data;
  }

  // ── Sign in ────────────────────────────────────────
  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  // ── Google OAuth ───────────────────────────────────
  async signInWithGoogle() {
    const { error } = await this.supabase.client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
  }

  // ── Sign out ───────────────────────────────────────
  async signOut() {
    const { error } = await this.supabase.client.auth.signOut();
    if (error) throw error;
  }

  // ── Forgot password ────────────────────────────────
  async sendPasswordResetEmail(email: string) {
    const { error } = await this.supabase.client.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (error) throw error;
  }

  // ── Reset password ─────────────────────────────────
  async updatePassword(newPassword: string) {
    const { error } = await this.supabase.client.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
  }

  isLoggedIn(): boolean {
    return !!this.currentUser();
  }
}
