import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorldcupService } from '../../services/worldcup.service';
import { Match } from '../../models/worldcup.models';

@Component({
  selector: 'app-fixtures',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fixtures.component.html',
  styleUrl: './fixtures.component.scss'
})
export class FixturesComponent implements OnInit {
  matches: Match[] = [];
  grouped: { phase: string; matches: Match[] }[] = [];
  phases: string[] = [];
  activePhase = 'All';
  searchQuery = '';
  loading = true;
  error = '';

  constructor(private wc: WorldcupService) {}

  ngOnInit(): void {
    this.wc.getGames().subscribe({
      next: (data) => {
        this.matches = Array.isArray(data) ? data : (data as any)?.games ?? (data as any)?.matches ?? [];
        this.phases = ['All', ...new Set(this.matches.map(m => this.phase(m)))];
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        this.error = `Failed to load fixtures — ${err.message}`;
        this.loading = false;
      }
    });
  }

  phase(m: Match): string { return m.stage ?? m.phase ?? m.round ?? 'Fixtures'; }
  home(m: Match): string  { return m.home_team ?? m.home ?? m.team1 ?? 'TBD'; }
  away(m: Match): string  { return m.away_team ?? m.away ?? m.team2 ?? 'TBD'; }
  dateRaw(m: Match): string | undefined { return m.datetime ?? m.date ?? m.match_date ?? m.local_date; }
  venue(m: Match): string { return m.stadium ?? m.venue ?? m.city ?? ''; }

  formatDate(raw?: string): string {
    if (!raw) return '';
    const d = new Date(raw);
    return isNaN(d.getTime()) ? raw : d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  formatTime(raw?: string): string {
    if (!raw) return 'TBD';
    const d = new Date(raw);
    return isNaN(d.getTime()) ? '' : d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
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
        this.away(m).toLowerCase().includes(q) ||
        this.venue(m).toLowerCase().includes(q)
      );
    }
    const map = new Map<string, Match[]>();
    list.forEach(m => {
      const p = this.phase(m);
      if (!map.has(p)) map.set(p, []);
      map.get(p)!.push(m);
    });
    this.grouped = Array.from(map.entries()).map(([phase, matches]) => ({ phase, matches }));
  }
}
