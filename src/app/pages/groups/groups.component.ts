import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { WorldcupService } from '../../services/worldcup.service';

@Component({
  selector: 'app-groups',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './groups.component.html',
  styleUrl: './groups.component.scss'
})
export class GroupsComponent implements OnInit {
  groups: any[] = [];
  loading = true;
  error = '';

  private teamMap = new Map<string, any>();
  private teamFormMap = new Map<string, string[]>();

  constructor(private wc: WorldcupService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    forkJoin({
      groups: this.wc.getGroups(),
      teams: this.wc.getTeams(),
      games: this.wc.getGames()
    }).subscribe({
      next: (result: any) => {
        // Build team map
        const teams = result.teams?.teams ?? (Array.isArray(result.teams) ? result.teams : []);
        teams.forEach((t: any) => this.teamMap.set(String(t.id), t));

        // Build form from finished games
        const games = result.games?.games ?? (Array.isArray(result.games) ? result.games : []);
        games
          .filter((g: any) => g.finished === 'TRUE')
          .forEach((g: any) => {
            const homeId = String(g.home_team_id);
            const awayId = String(g.away_team_id);
            const hs = Number(g.home_score);
            const as_ = Number(g.away_score);

            const homeResult = hs > as_ ? 'W' : hs < as_ ? 'L' : 'D';
            const awayResult = as_ > hs ? 'W' : as_ < hs ? 'L' : 'D';

            if (!this.teamFormMap.has(homeId)) this.teamFormMap.set(homeId, []);
            if (!this.teamFormMap.has(awayId)) this.teamFormMap.set(awayId, []);
            this.teamFormMap.get(homeId)!.push(homeResult);
            this.teamFormMap.get(awayId)!.push(awayResult);
          });

        // Build + sort groups
        const rawGroups = result.groups?.groups ?? (Array.isArray(result.groups) ? result.groups : []);
        this.groups = rawGroups
          .sort((a: any, b: any) => a.name.localeCompare(b.name))
          .map((g: any) => ({
            ...g,
            teams: [...g.teams].sort((a: any, b: any) => {
              if (Number(b.pts) !== Number(a.pts)) return Number(b.pts) - Number(a.pts);
              return Number(b.gd) - Number(a.gd);
            })
          }));

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.error = `Failed to load groups — ${err.message}`;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getFlag(team_id: string): string {
    return this.teamMap.get(String(team_id))?.flag ?? '';
  }

  getName(team_id: string): string {
    return this.teamMap.get(String(team_id))?.name_en ?? `Team ${team_id}`;
  }

  getForm(team_id: string): string[] {
    const form = this.teamFormMap.get(String(team_id)) ?? [];
    const last5 = form.slice(-5);
    while (last5.length < 5) last5.unshift('N');
    return last5;
  }
}