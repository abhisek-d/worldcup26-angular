import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorldcupService } from '../../services/worldcup.service';

@Component({
  selector: 'app-contest',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contest.component.html',
  styleUrl: './contest.component.scss'
})
export class ContestComponent implements OnInit {
  fixtures: any[] = [];
  loading = true;
  error = '';
  selectedDate = '2026-06-18';

  // lineup state
  expandedFixtureId: number | null = null;
  lineups: any[] = [];
  lineupLoading = false;
  lineupError = '';
  lineupMessage = '';

  // match-points state
  pointsFixtureId: number | null = null;
  matchPoints: any = null;
  pointsLoading = false;
  pointsError = '';

  constructor(private wc: WorldcupService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadFixtures();
  }

  loadFixtures(): void {
    this.loading = true;
    this.error = '';
    this.expandedFixtureId = null;
    this.lineups = [];
    this.lineupMessage = '';
    this.pointsFixtureId = null;
    this.matchPoints = null;

    this.wc.getContestFixtures(this.selectedDate).subscribe({
      next: (data: any) => {
        this.fixtures = data?.response ?? [];
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

  onDateChange(): void {
    this.loadFixtures();
  }

  toggleLineup(fixtureId: number): void {
    if (this.expandedFixtureId === fixtureId) {
      this.expandedFixtureId = null;
      this.lineups = [];
      this.lineupMessage = '';
      return;
    }

    this.expandedFixtureId = fixtureId;
    this.lineups = [];
    this.lineupError = '';
    this.lineupMessage = '';
    this.lineupLoading = true;
    this.cdr.detectChanges();

    this.wc.getLineups(fixtureId).subscribe({
      next: (data: any) => {
        const resp = data?.response ?? [];
        if (resp.length === 0) {
          this.lineupMessage = 'Line up not announced';
        } else {
          this.lineups = resp;
        }
        this.lineupLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.lineupError = `Failed to load lineup — ${err.message}`;
        this.lineupLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ── Match Points ──
  toggleMatchPoints(fixtureId: number, event: MouseEvent): void {
    event.stopPropagation();

    if (this.pointsFixtureId === fixtureId) {
      this.pointsFixtureId = null;
      this.matchPoints = null;
      return;
    }

    this.pointsFixtureId = fixtureId;
    this.matchPoints = null;
    this.pointsError = '';
    this.pointsLoading = true;
    this.cdr.detectChanges();

    this.wc.getMatchPoints(fixtureId).subscribe({
      next: (data: any) => {
        this.matchPoints = data;
        this.pointsLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.pointsError = `Failed to load points — ${err.message}`;
        this.pointsLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  sortedPlayers(players: any[]): any[] {
    return [...(players ?? [])].sort((a, b) => b.totalPoints - a.totalPoints);
  }

  breakdownEntries(breakdown: any): { key: string; value: number }[] {
    if (!breakdown) return [];
    return Object.entries(breakdown).map(([key, value]) => ({ key, value: value as number }));
  }

  isFinished(f: any): boolean { return f.fixture?.status?.short === 'FT'; }
  isLive(f: any): boolean {
    const s = f.fixture?.status?.short;
    return s === '1H' || s === '2H' || s === 'HT' || s === 'ET';
  }
  isNotStarted(f: any): boolean { return f.fixture?.status?.short === 'NS'; }

  toIST(isoDate: string): string {
    if (!isoDate) return 'TBD';
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return 'TBD';
    return d.toLocaleTimeString('en-GB', {
      hour: '2-digit', minute: '2-digit',
      timeZone: 'Asia/Kolkata'
    }) + ' IST';
  }

  statusLabel(f: any): string {
    const s = f.fixture?.status;
    if (!s) return '';
    if (s.short === 'FT') return 'Full Time';
    if (s.short === 'NS') return this.toIST(f.fixture?.date);
    if (s.short === 'HT') return 'Half Time';
    return s.long ?? '';
  }

  playersByPos(startXI: any[], pos: string): any[] {
    return (startXI ?? []).filter(p => p.player?.pos === pos);
  }

  posLabel(pos: string): string {
    const map: Record<string, string> = {
      G: 'Goalkeeper',
      D: 'Defenders',
      M: 'Midfielders',
      F: 'Forwards'
    };
    return map[pos] ?? pos;
  }
}