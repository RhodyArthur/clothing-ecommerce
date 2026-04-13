import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Auth } from '../../../core/services/auth';
import { passwordsMatch, phoneValidator, passwordValidator } from '../../../core/utils/validators';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    MessageModule,
  ],
  templateUrl: './register.html',
})
export class Register {
  private fb = inject(FormBuilder);
  private auth = inject(Auth);

  submitting = signal(false);
  error = signal<string | null>(null);
  emailSent = signal(false);

  form = this.fb.group(
    {
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, phoneValidator]],
      password: ['', [Validators.required, passwordValidator]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatch },
  );

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    try {
      await this.auth.signUp(
        this.form.value.email!,
        this.form.value.password!,
        this.form.value.fullName!,
        this.form.value.phone!,
      );
      this.emailSent.set(true);
    } catch (err: unknown) {
      const maybeMessage =
        typeof err === 'object' && err !== null && 'message' in err
          ? (err as { message?: unknown }).message
          : undefined;
      const msgText = typeof maybeMessage === 'string' ? maybeMessage : String(err);
      this.error.set(
        msgText.includes('already registered')
          ? 'An account with this email already exists.'
          : msgText,
      );
    } finally {
      this.submitting.set(false);
    }
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c.touched);
  }

  get passwordMismatch(): boolean {
    return !!(this.form.hasError('mismatch') && this.form.get('confirmPassword')?.touched);
  }
}
