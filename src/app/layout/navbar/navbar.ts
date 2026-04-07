import { Component, HostListener, inject, signal, OnInit } from '@angular/core';
import { Auth } from '../../core/services/auth';
import { Cart } from '../../core/services/cart';
import { Wishlist } from '../../core/services/wishlist';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink],
  templateUrl: './navbar.html',
})
export class Navbar implements OnInit {
  private readonly cart = inject(Cart);
  private readonly wishlist = inject(Wishlist);
  auth = inject(Auth);

  mobileMenuOpen = signal(false);
  scrolled = signal(false);

  navLinks = [
    { label: 'Women', path: '/products', query: { category: 'women' } },
    { label: 'Men', path: '/products', query: { category: 'men' } },
    { label: 'Accessories', path: '/products', query: { category: 'accessories' } },
  ];

  @HostListener('window:scroll')
  onScroll(): void {
    this.updateScrolled();
  }

  ngOnInit(): void {
    this.updateScrolled();
  }

  private updateScrolled(): void {
    if (globalThis.window !== undefined) {
      this.scrolled.set(globalThis.window.scrollY > 10);
    }
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((v) => !v);
  }

  isDesktop(): boolean {
    return globalThis.window !== undefined && globalThis.window.innerWidth >= 768;
  }

  signOut(): void {
    this.auth.signOut();
  }
}
