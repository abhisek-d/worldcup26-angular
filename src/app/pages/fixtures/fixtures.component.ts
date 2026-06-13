import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { WorldcupService } from '../../services/worldcup.service';

@Component({
  selector: 'app-fixtures',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fixtures.component.html',
  styleUrl: './fixtures.component.scss'
})
export class FixturesComponent implements OnInit {
  matches: any[] = [];
  grouped: { phase: string; matches: any[] }[] = [];
  phases: string[] = [];
  activePhase = 'All';
  searchQuery = '';
  loading = true;
  error = '';

  private stadiumOffsetMap = new Map<string, number>();
  private stadiumNameMap = new Map<string, string>();
  private teamFlagMap = new Map<string, string>(); // team_id → flag url

  constructor(private wc: WorldcupService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    forkJoin({
      games: this.wc.getGames(),
      stadiums: this.wc.getStadiums(),
      teams: this.wc.getTeams()
    }).subscribe({
      next: (result: any) => {
        // Build stadium maps
        const stadiums = result.stadiums?.stadiums ?? (Array.isArray(result.stadiums) ? result.stadiums : []);
        stadiums.forEach((s: any) => {
          this.stadiumOffsetMap.set(String(s.id), this.regionToISTOffset(s.region, s.country_en));
          this.stadiumNameMap.set(String(s.id), s.name_en ?? '');
        });

        // Build team flag map using team id
        const teams = result.teams?.teams ?? (Array.isArray(result.teams) ? result.teams : []);
        teams.forEach((t: any) => {
          this.teamFlagMap.set(String(t.id), t.flag ?? '');
        });

        // Sort matches by local_date ascending
        this.matches = (result.games?.games ?? (Array.isArray(result.games) ? result.games : []))
          .sort((a: any, b: any) => {
            const toMs = (d: string) => {
              if (!d) return 0;
              const [dp, tp] = d.split(' ');
              const [mo, day, yr] = dp.split('/');
              const [hr, mn] = (tp || '00:00').split(':');
              return Date.UTC(+yr, +mo - 1, +day, +hr, +mn);
            };
            return toMs(a.local_date) - toMs(b.local_date);
          });

        this.phases = ['All', ...new Set(this.matches.map(m => this.phase(m)))];
        this.applyFilters();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.error = `Failed to load fixtures — ${err.message}`;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private regionToISTOffset(region: string, country: string): number {
    if (country === 'Canada') return 9.5;
    if (country === 'Mexico') return 10.5;
    const map: Record<string, number> = {
      'Eastern':  9.5,
      'Central':  10.5,
      'Mountain': 11.5,
      'Western':  12.5,
    };
    return map[region] ?? 9.5;
  }

  phase(m: any): string {
    if (!m.type) return 'Fixtures';
    const map: Record<string, string> = {
      group: 'Group Stage',
      knockout: 'Knockout',
      'round of 32': 'Round of 32',
      'round of 16': 'Round of 16',
      quarterfinal: 'Quarter Finals',
      semifinal: 'Semi Finals',
      third: 'Third Place',
      final: 'Final',
    };
    return map[m.type.toLowerCase()] ?? m.type;
  }

  home(m: any): string { return m.home_team_name_en ?? 'TBD'; }
  away(m: any): string { return m.away_team_name_en ?? 'TBD'; }
  isFinished(m: any): boolean { return m.finished === 'TRUE'; }
  stadiumName(m: any): string { return this.stadiumNameMap.get(String(m.stadium_id)) ?? ''; }
  homeFlag(m: any): string { return this.teamFlagMap.get(String(m.home_team_id)) ?? ''; }
  awayFlag(m: any): string { return this.teamFlagMap.get(String(m.away_team_id)) ?? ''; }

  parseScorers(raw: string): string[] {
    if (!raw || raw === 'null') return [];
    return raw
      .replace(/^\{|\}$/g, '')
      .split(',')
      .map(s => s.replace(/^"|"$/g, '').trim())
      .filter(s => s.length > 0);
  }

  toIST(local_date?: string, stadium_id?: string): { date: string; time: string } {
    if (!local_date) return { date: '', time: 'TBD' };
    const [datePart, timePart] = local_date.split(' ');
    if (!datePart || !timePart) return { date: local_date, time: '' };
    const [month, day, year] = datePart.split('/');
    const [hour, minute] = timePart.split(':');
    const utc = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute)));
    if (isNaN(utc.getTime())) return { date: local_date, time: '' };
    const offsetHours = stadium_id ? (this.stadiumOffsetMap.get(String(stadium_id)) ?? 9.5) : 9.5;
    const ist = new Date(utc.getTime() + offsetHours * 60 * 60 * 1000);
    const date = ist.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
    const time = ist.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' IST';
    return { date, time };
  }

  setPhase(p: string): void {
    this.activePhase = p;
    this.applyFilters();
  }

  applyFilters(): void {
    let list = this.matches;
    if (this.activePhase !== 'All') list = list.filter(m => this.phase(m) === this.activePhase);
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(m =>
        this.home(m).toLowerCase().includes(q) ||
        this.away(m).toLowerCase().includes(q)
      );
    }
    const map = new Map<string, any[]>();
    list.forEach(m => {
      const p = this.phase(m);
      if (!map.has(p)) map.set(p, []);
      map.get(p)!.push(m);
    });
    this.grouped = Array.from(map.entries()).map(([phase, matches]) => ({ phase, matches }));
  }
}