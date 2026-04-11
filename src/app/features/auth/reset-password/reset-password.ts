import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../../core/services/auth';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { passwordsMatch } from '../../../core/utils/validators';

@Component({
  selector: 'app-reset-password',
  imports: [CommonModule, ReactiveFormsModule, RouterLink,
    PasswordModule, ButtonModule, MessageModule],
  templateUrl: './reset-password.html',
})
export class ResetPassword {
  private fb     = inject(FormBuilder);
  private auth   = inject(Auth);
  private router = inject(Router);

  submitting = signal(false);
  error      = signal<string | null>(null);
  success    = signal(false);

  form = this.fb.group({
    password:        ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required]
  }, { validators: passwordsMatch });

  async onSubmit(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.submitting.set(true);
    this.error.set(null);

    try {
      await this.auth.updatePassword(this.form.value.password!);
      this.success.set(true);
      setTimeout(() => this.router.navigate(['/auth/login']), 2500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update password'
      this.error.set(message);
    } finally {
      this.submitting.set(false);
    }
  }

  get passwordMismatch(): boolean {
    return !!(this.form.hasError('mismatch') &&
              this.form.get('confirmPassword')?.touched);
  }
}