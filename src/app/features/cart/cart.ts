import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { Cart as CartService } from '../../core/services/cart';
import { ConfirmationService, MessageService } from 'primeng/api';
import { EmptyState } from '../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-cart',
  imports: [CommonModule, RouterLink, ButtonModule, ToastModule, ConfirmDialogModule, EmptyState],
  providers: [MessageService, ConfirmationService],
  templateUrl: './cart.html',
})
export class Cart {
  readonly cartService = inject(CartService);
  private confirmation = inject(ConfirmationService);

  confirmClearCart(): void {
    this.confirmation.confirm({
      header: 'Clear Cart',
      message: 'Are you sure you want to clear your cart?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Yes, clear',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        await this.cartService.clearCart();
      },
    });
  }
}
