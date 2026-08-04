import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'import',
    loadComponent: () => import('./pages/import-deck.page').then((p) => p.ImportDeckPage),
  },
  {
    path: 'simulation',
    loadComponent: () => import('./pages/simulation.page').then((p) => p.SimulationPage),
  },
  {
    path: '**',
    redirectTo: '/simulation',
  },
];
