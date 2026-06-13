import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'fixtures', pathMatch: 'full' },
  {
    path: 'fixtures',
    loadComponent: () => import('./pages/fixtures/fixtures.component').then(m => m.FixturesComponent)
  },
  {
    path: 'groups',
    loadComponent: () => import('./pages/groups/groups.component').then(m => m.GroupsComponent)
  },
  {
    path: 'teams',
    loadComponent: () => import('./pages/teams/teams.component').then(m => m.TeamsComponent)
  },
  {
    path: 'teams/:name',
    loadComponent: () => import('./pages/team-detail/team-detail.component').then(m => m.TeamDetailComponent)
  },
  { path: '**', redirectTo: 'fixtures' }
];
