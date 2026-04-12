import { Component, inject, signal } from '@angular/core';
import { Auth } from '../../../../core/services/auth';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-admin-layout',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, ButtonModule],
  templateUrl: './admin-layout.html',
})
export class AdminLayout {
  private auth   = inject(Auth);
  private router = inject(Router);

  sidebarOpen = signal(false);

  navItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: 'pi-chart-bar'    },
    { label: 'Products',  path: '/admin/products',  icon: 'pi-box'          },
    { label: 'Orders',    path: '/admin/orders',    icon: 'pi-shopping-bag' }
  ];

  currentUser = this.auth.currentUser;

  async signOut(): Promise<void> {
    await this.auth.signOut();
    this.router.navigate(['/']);
  }
}
