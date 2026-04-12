import { Component, inject, signal } from '@angular/core';
import { Auth } from '../../../core/services/auth';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterLink,
    InputTextModule, PasswordModule, ButtonModule,
    DividerModule, MessageModule],
  templateUrl: './login.html',
})
export class Login {
  private fb = inject(FormBuilder);
  private auth = inject(Auth);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  submitting = signal(false);
  error = signal<string | null>(null);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    try {
      await this.auth.signIn(this.form.value.email!, this.form.value.password!);
      const returnUrl = this.route.snapshot.queryParams['returnUrl'] ?? '/';
      this.router.navigateByUrl(returnUrl);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === 'string'
            ? err
            : 'An unexpected error occurred';
      this.error.set(this.friendlyError(message));
    } finally {
      this.submitting.set(false);
    }
  }

  async loginWithGoogle(): Promise<void> {
    try {
      await this.auth.signInWithGoogle();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === 'string'
            ? err
            : 'An unexpected error occurred';
      this.error.set(message);
    }
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c.touched);
  }

  private friendlyError(msg: string): string {
    if (msg.includes('Invalid login credentials')) return 'Incorrect email or password.';
    if (msg.includes('Email not confirmed')) return 'Please confirm your email before logging in.';
    return msg;
  }
}
