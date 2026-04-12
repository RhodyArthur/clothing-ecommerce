import { Routes } from '@angular/router';
import { adminGuard } from '../../core/guards/admin-guard';
import { AdminLayout } from './layout/admin-layout/admin-layout';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminLayout,
    canActivate: [adminGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/admin-dashboard/admin-dashboard')
            .then(m => m.AdminDashboard)
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./products/admin-products/admin-products')
            .then(m => m.AdminProducts)
      },
      {
        path: 'products/new',
        loadComponent: () =>
          import('./products/product-form/product-form')
            .then(m => m.ProductForm)
      },
      {
        path: 'products/:id/edit',
        loadComponent: () =>
          import('./products/product-form/product-form')
            .then(m => m.ProductForm)
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./orders/admin-orders/admin-orders')
            .then(m => m.AdminOrders)
      }
    ]
  }
];