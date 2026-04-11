import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { Cart as CartService } from '../../core/services/cart';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-cart',
  imports: [CommonModule, RouterLink, ButtonModule, ToastModule],
  providers: [MessageService],
  templateUrl: './cart.html',
})
export class Cart {
  readonly cartService = inject(CartService);
  
}
