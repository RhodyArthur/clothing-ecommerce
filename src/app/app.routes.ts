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
    ]
}
];
