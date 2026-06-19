import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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

  // events state (keyed by fixture id) — stores raw events array
  expandedFixtureId: number | null = null;
  eventsByFixture = new Map<number, any[]>();
  eventsLoading = false;
  eventsError = '';

  constructor(private wc: WorldcupService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.wc.getApiFootballFixtures().subscribe({
      next: (data: any) => {
        const list = data?.response ?? [];
        this.matches = list.sort((a: any, b: any) =>
          new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime()
        );
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

  phase(m: any): string { return m.league?.round ?? 'Fixtures'; }
  home(m: any): string { return m.teams?.home?.name ?? 'TBD'; }
  away(m: any): string { return m.teams?.away?.name ?? 'TBD'; }
  homeLogo(m: any): string { return m.teams?.home?.logo ?? ''; }
  awayLogo(m: any): string { return m.teams?.away?.logo ?? ''; }
  homeGoals(m: any): number | null { return m.goals?.home; }
  awayGoals(m: any): number | null { return m.goals?.away; }
  homeId(m: any): number { return m.teams?.home?.id; }
  awayId(m: any): number { return m.teams?.away?.id; }
  venue(m: any): string { return m.fixture?.venue?.name ?? ''; }

  isFinished(m: any): boolean { return m.fixture?.status?.long === 'Match Finished'; }
  isLive(m: any): boolean {
    const s = m.fixture?.status?.short;
    return s === '1H' || s === '2H' || s === 'HT' || s === 'ET';
  }

  toIST(isoDate: string): { date: string; time: string } {
    if (!isoDate) return { date: '', time: 'TBD' };
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return { date: '', time: 'TBD' };
    const date = d.toLocaleDateString('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
      timeZone: 'Asia/Kolkata'
    });
    const time = d.toLocaleTimeString('en-GB', {
      hour: '2-digit', minute: '2-digit',
      timeZone: 'Asia/Kolkata'
    }) + ' IST';
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

  // Toggle event details for a finished match
  toggleGoals(fixtureId: number): void {
    if (this.expandedFixtureId === fixtureId) {
      this.expandedFixtureId = null;
      return;
    }
    this.expandedFixtureId = fixtureId;
    this.eventsError = '';

    if (this.eventsByFixture.has(fixtureId)) {
      this.cdr.detectChanges();
      return;
    }

    this.eventsLoading = true;
    this.cdr.detectChanges();

    this.wc.getFixtureEvents(fixtureId).subscribe({
      next: (data: any) => {
        const events = data?.response ?? [];
        this.eventsByFixture.set(fixtureId, events);
        this.eventsLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.eventsError = `Failed to load events — ${err.message}`;
        this.eventsLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private eventsFor(fixtureId: number): any[] {
    return this.eventsByFixture.get(fixtureId) ?? [];
  }

  hasEvents(fixtureId: number): boolean {
    return this.eventsFor(fixtureId).length > 0;
  }

  private timeStr(ev: any): string {
    const e = ev.time?.elapsed ?? '';
    const extra = ev.time?.extra;
    return extra ? `${e}+${extra}'` : `${e}'`;
  }

  // Goals for a team, grouped by player → "Jonathan David 29', 45+3', 90+2'"
  goalsForTeam(fixtureId: number, teamId: number): { name: string; times: string; og: boolean }[] {
    const goals = this.eventsFor(fixtureId).filter(
      e => e.type === 'Goal' && e.team?.id === teamId
    );

    // group by player name
    const map = new Map<string, { times: string[]; og: boolean }>();
    goals.forEach(g => {
      const name = g.player?.name ?? 'Unknown';
      const isOG = g.detail === 'Own Goal';
      const isPen = g.detail === 'Penalty';
      let t = this.timeStr(g);
      if (isPen) t += ' (P)';
      const key = isOG ? `${name}__OG` : name;
      if (!map.has(key)) map.set(key, { times: [], og: isOG });
      map.get(key)!.times.push(t);
    });

    return Array.from(map.entries()).map(([key, val]) => ({
      name: key.replace('__OG', ''),
      times: val.times.join(', '),
      og: val.og
    }));
  }

  // Red cards for a team
  redCardsForTeam(fixtureId: number, teamId: number): { name: string; time: string }[] {
    return this.eventsFor(fixtureId)
      .filter(e => e.type === 'Card' && e.detail === 'Red Card' && e.team?.id === teamId)
      .map(c => ({ name: c.player?.name ?? 'Unknown', time: this.timeStr(c) }));
  }
}