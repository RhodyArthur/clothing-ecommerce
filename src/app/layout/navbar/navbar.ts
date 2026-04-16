import { Component, HostListener, inject, signal, OnInit, computed } from '@angular/core';
import { Auth } from '../../core/services/auth';
import { Cart } from '../../core/services/cart';
import { Wishlist } from '../../core/services/wishlist';
import { RouterLink } from '@angular/router';
import { DrawerModule } from 'primeng/drawer';
import { Divider } from 'primeng/divider';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, DrawerModule, Divider],
  host: {
    class: 'block sticky top-0 z-50',
  },
  templateUrl: './navbar.html',
})
export class Navbar implements OnInit {
  private readonly cart = inject(Cart);
  private readonly wishlist = inject(Wishlist);
  auth = inject(Auth);

  cartCount = computed(() => this.cart.itemCount());
  wishlistCount = computed(() => this.wishlist.count());

  mobileMenuOpen = signal(false);
  scrolled = signal(false);
  accountOpen = signal(false);

  navLinks = [
    { label: 'Women', path: '/products', query: { category: 'women' } },
    { label: 'Men', path: '/products', query: { category: 'men' } },
    { label: 'Unisex', path: '/products', query: { category: 'unisex' } },
    { label: 'Accessories', path: '/products', query: { category: 'accessories' } },
  ];

  @HostListener('window:scroll')
  onScroll(): void {
    this.updateScrolled();
  }

  ngOnInit(): void {
    this.updateScrolled();
  }

  // Close dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.account-menu')) {
      this.accountOpen.set(false);
    }
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
