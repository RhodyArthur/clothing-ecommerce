import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Auth } from '../../../core/services/auth';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';


@Component({
  selector: 'app-forgot-password',
  imports: [
    CommonModule, ReactiveFormsModule,
    InputTextModule, ButtonModule, MessageModule
  ],
  templateUrl: './forgot-password.html',
})
export class ForgotPassword {
  private fb   = inject(FormBuilder);
  private auth = inject(Auth);

  submitting = signal(false);
  sent       = signal(false);
  error      = signal<string | null>(null);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  async onSubmit(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.submitting.set(true);
    this.error.set(null);

    try {
      await this.auth.sendPasswordResetEmail(this.form.value.email!);
      this.sent.set(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send password reset email'
      this.error.set(message);
    } finally {
      this.submitting.set(false);
    }
  }
}