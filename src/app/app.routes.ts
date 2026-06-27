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
  {
    path: 'contest',
    loadComponent: () => import('./pages/contest/contest.component').then(m => m.ContestComponent)
  },
  {
    path: 'submit-team',
    loadComponent: () => import('./pages/submit-team/submit-team.component').then(m => m.SubmitTeamComponent)
  },
  { path: '**', redirectTo: 'fixtures' },
];