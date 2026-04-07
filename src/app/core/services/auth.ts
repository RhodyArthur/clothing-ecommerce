import { inject, Injectable, signal } from '@angular/core';
import { User } from '@supabase/supabase-js';
import { Supabase } from './supabase';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  currentUser = signal<User | null>(null);
  private readonly supabaseService = inject(Supabase);

  constructor() {
    this.initializeAuth();
    this.setupAuthStateListener();
  }

  private initializeAuth(): void {
    this.supabaseService.client.auth.getUser().then(({data}) => {
      this.currentUser.set(data.user);
    });
  }

  private setupAuthStateListener(): void {
    this.supabaseService.client.auth.onAuthStateChange((_, session) => {
        this.currentUser.set(session?.user ?? null);
    });
  }

  signUp(email: string, password: string, fullName: string) {
    return this.supabaseService.client.auth.signUp({
      email, password,
      options: { data: { full_name: fullName } }
    });
  }

  signIn(email: string, password: string) {
    return this.supabaseService.client.auth.signInWithPassword({ email, password });
  }

  signInWithGoogle() {
    return this.supabaseService.client.auth.signInWithOAuth({ provider: 'google' });
  }

  signOut() {
    return this.supabaseService.client.auth.signOut();
  }

}
