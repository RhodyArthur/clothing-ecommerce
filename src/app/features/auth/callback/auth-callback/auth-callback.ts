import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Supabase } from '../../../../core/services/supabase';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [ProgressSpinnerModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50">
      <div class="text-center">
        <p-progress-spinner ariaLabel="loading" />
        <p class="text-sm text-gray-400">Signing you in...</p>
      </div>
    </div>
  `,
})
export class AuthCallback implements OnInit {
  private supabase = inject(Supabase);
  private router = inject(Router);

  async ngOnInit(): Promise<void> {
    const { data } = await this.supabase.client.auth.getSession();
    if (data.session) {
      const user = data.session.user;
      const isAdmin = !!user?.user_metadata?.['is_admin'];
      if (isAdmin) {
        this.router.navigate(['/admin']);
      } else {
        this.router.navigate(['/']);
      }
    } else {
      this.router.navigate(['/auth/login']);
    }
  }
}
