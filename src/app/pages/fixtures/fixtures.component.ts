import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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

  constructor(private wc: WorldcupService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.wc.getGames().subscribe({
      next: (data: any) => {
        this.matches = data?.games ?? (Array.isArray(data) ? data : []);
        this.phases = ['All', ...new Set(this.matches.map(m => this.phase(m)))];
        this.applyFilters();
        this.loading = false;
        this.cdr.detectChanges();  // ← force Angular to re-render
      },
      error: (err: any) => {
        this.error = `Failed to load fixtures — ${err.message}`;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  phase(m: Match): string {
    if (!m.type) return 'Fixtures';
    const map: Record<string, string> = {
      group: 'Group Stage',
      knockout: 'Knockout',
      'round of 32': 'Round of 32',
      'round of 16': 'Round of 16',
      quarterfinal: 'Quarter Finals',
      semifinal: 'Semi Finals',
      final: 'Final',
    };
    return map[m.type.toLowerCase()] ?? m.type;
  }

  home(m: Match): string { return m.home_team_name_en ?? 'TBD'; }
  away(m: Match): string { return m.away_team_name_en ?? 'TBD'; }

  toIST(local_date?: string): { date: string; time: string } {
    if (!local_date) return { date: '', time: 'TBD' };
    const [datePart, timePart] = local_date.split(' ');
    if (!datePart || !timePart) return { date: local_date, time: '' };
    const [month, day, year] = datePart.split('/');
    const [hour, minute] = timePart.split(':');
    const utc = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute)));
    if (isNaN(utc.getTime())) return { date: local_date, time: '' };
    const ist = new Date(utc.getTime() + 11.5 * 60 * 60 * 1000);
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
    const map = new Map<string, Match[]>();
    list.forEach(m => {
      const p = this.phase(m);
      if (!map.has(p)) map.set(p, []);
      map.get(p)!.push(m);
    });
    this.grouped = Array.from(map.entries()).map(([phase, matches]) => ({ phase, matches }));
  }
}