import { Routes } from '@angular/router';
import { MainLayout } from './layout/main-layout/main-layout';

export const routes: Routes = [
    {
    path: '',
    component: MainLayout,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/home/home').then(m => m.Home)
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./features/products/product-list/product-list')
            .then(m => m.ProductList)
      },
      {
        path: 'products/:id',
        loadComponent: () =>
          import('./features/products/product-detail/product-detail')
            .then(m => m.ProductDetail)
      },
      {
        path: 'cart',
        loadComponent: () =>
          import('./features/cart/cart')
            .then(m => m.Cart)
      },
      {
        path: 'wishlist',
        loadComponent: () =>
          import('./features/wishlist/wishlist')
            .then(m => m.Wishlist)
      },
      {
        path: 'checkout',
        loadComponent: () =>
          import('./features/checkout/checkout')
            .then(m => m.Checkout)
      },
    ]
}
];
