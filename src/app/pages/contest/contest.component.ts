import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorldcupService } from '../../services/worldcup.service';
import { Router } from '@angular/router';
import { TeamSelectionService } from '../../services/team-selection.service';

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
  selectedDate = new Date().toISOString().split('T')[0];

  expandedFixtureId: number | null = null;
  lineups: any[] = [];
  lineupLoading = false;
  lineupError = '';
  lineupMessage = '';

  pointsFixtureId: number | null = null;
  matchPoints: any = null;
  pointsLoading = false;
  pointsError = '';

  selectedPlayers = new Map<number, any>();
  readonly MAX_PLAYERS = 11;
  // positional rules
  readonly MAX_GK = 1;        // exactly 1
  readonly MIN_DEF = 3;
  readonly MIN_MID = 3;
  readonly MIN_FWD = 1;

  // ── Saved teams state ──
  savedTeamsFixtureId: number | null = null;
  savedTeams: any[] = [];
  savedTeamsLoading = false;
  savedTeamsError = '';
  expandedSavedTeamId: string | null = null;

  // ── Per-team score state (keyed by teamId) ──
  teamScores = new Map<string, number>();
  teamScoreLoading = new Set<string>();
  teamScoreError = new Map<string, string>();

  // ── Player meta (photo + rating) from /players season squad, display only ──
  playerMeta = new Map<number, { photo: string; rating: string | null }>();

  // statuses that allow joining (match not started)
  private readonly JOINABLE_STATUSES = ['NS', 'TBD'];

  constructor(
    private wc: WorldcupService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private teamSelection: TeamSelectionService
  ) {}

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
    this.selectedPlayers.clear();
    this.savedTeamsFixtureId = null;
    this.savedTeams = [];
    this.expandedSavedTeamId = null;
    this.teamScores.clear();
    this.teamScoreLoading.clear();
    this.teamScoreError.clear();
    this.playerMeta.clear();

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
    this.selectedPlayers.clear();
    this.playerMeta.clear();
    this.cdr.detectChanges();

    // 1) check current match status before allowing team selection
    this.wc.getFixtureStatus(fixtureId).subscribe({
      next: (data: any) => {
        const fixture = data?.response?.[0];
        const shortStatus = fixture?.fixture?.status?.short ?? '';

        if (!this.JOINABLE_STATUSES.includes(shortStatus)) {
          // match already started or finished — block selection
          this.lineupLoading = false;
          this.lineupMessage =
            'This match has already started. You can no longer pick or submit a team for it.';
          this.cdr.detectChanges();
          return;
        }

        // 2) match not started — load the squad
        this.fetchLineups(fixtureId);
      },
      error: (err: any) => {
        this.lineupError = `Failed to check match status — ${err.message}`;
        this.lineupLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private fetchLineups(fixtureId: number): void {
    this.wc.getLineups(fixtureId).subscribe({
      next: (data: any) => {
        const resp = data?.response ?? [];
        if (resp.length === 0) {
          this.lineupMessage = 'Line up not announced';
        } else {
          this.lineups = resp;
          // also fetch season photo + rating for each team in the match (display only)
          this.playerMeta.clear();
          resp.forEach((teamBlock: any) => {
            const teamId = teamBlock?.team?.id;
            if (teamId != null) {
              this.fetchPlayerMeta(teamId, 1);
            }
          });
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

  // Season squad meta (photo + rating). Paginated — fetch each page until current === total.
  private fetchPlayerMeta(teamId: number, page: number): void {
    this.wc.getTeamSquadPlayers(teamId, page).subscribe({
      next: (data: any) => {
        const resp = data?.response ?? [];
        resp.forEach((entry: any) => {
          const id = entry?.player?.id;
          if (id != null) {
            this.playerMeta.set(id, {
              photo: entry?.player?.photo ?? '',
              rating: entry?.statistics?.[0]?.games?.rating ?? null
            });
          }
        });
        this.cdr.detectChanges();

        // follow pagination
        const current = data?.paging?.current ?? 1;
        const total = data?.paging?.total ?? 1;
        if (current < total) {
          this.fetchPlayerMeta(teamId, current + 1);
        }
      },
      error: () => { /* meta is optional — ignore failures */ }
    });
  }

  photoOf(playerId: number): string {
    return this.playerMeta.get(playerId)?.photo ?? '';
  }

  ratingOf(playerId: number): string {
    const r = this.playerMeta.get(playerId)?.rating;
    return r ?? '—';
  }

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

  // ── Saved teams ──
  toggleSavedTeams(fixtureId: number, event: MouseEvent): void {
    event.stopPropagation();

    if (this.savedTeamsFixtureId === fixtureId) {
      this.savedTeamsFixtureId = null;
      this.savedTeams = [];
      this.expandedSavedTeamId = null;
      this.teamScores.clear();
      this.teamScoreLoading.clear();
      this.teamScoreError.clear();
      return;
    }

    this.savedTeamsFixtureId = fixtureId;
    this.savedTeams = [];
    this.savedTeamsError = '';
    this.expandedSavedTeamId = null;
    this.savedTeamsLoading = true;
    this.teamScores.clear();
    this.teamScoreLoading.clear();
    this.teamScoreError.clear();
    this.cdr.detectChanges();

    this.wc.getSavedTeams(fixtureId).subscribe({
      next: (data: any) => {
        this.savedTeams = data ?? [];
        this.savedTeamsLoading = false;
        this.cdr.detectChanges();

        // auto-fetch total points for every saved team
        this.savedTeams.forEach((team: any) => {
          this.fetchTeamScore(team.teamId, fixtureId);
        });
      },
      error: (err: any) => {
        this.savedTeamsError = `Failed to load saved teams — ${err.message}`;
        this.savedTeamsLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  toggleSavedTeamDetail(teamId: string): void {
    this.expandedSavedTeamId = this.expandedSavedTeamId === teamId ? null : teamId;
    this.cdr.detectChanges();
  }

  // ── Per-team total points ──
  fetchTeamScore(teamId: string, matchId: number): void {
    if (this.teamScores.has(teamId) || this.teamScoreLoading.has(teamId)) {
      return;
    }

    this.teamScoreLoading.add(teamId);
    this.teamScoreError.delete(teamId);
    this.cdr.detectChanges();

    this.wc.getTeamScore(teamId, matchId).subscribe({
      next: (res: any) => {
        this.teamScores.set(teamId, res?.totalPoints ?? 0);
        this.teamScoreLoading.delete(teamId);
        this.cdr.detectChanges();
      },
      error: () => {
        this.teamScoreError.set(teamId, 'Error');
        this.teamScoreLoading.delete(teamId);
        this.cdr.detectChanges();
      }
    });
  }

  loadTeamScore(teamId: string, matchId: number, event: MouseEvent): void {
    event.stopPropagation();
    this.teamScoreError.delete(teamId);
    this.fetchTeamScore(teamId, matchId);
  }

  hasScore(teamId: string): boolean { return this.teamScores.has(teamId); }
  scoreOf(teamId: string): number { return this.teamScores.get(teamId) ?? 0; }
  isScoreLoading(teamId: string): boolean { return this.teamScoreLoading.has(teamId); }
  scoreErrorOf(teamId: string): string { return this.teamScoreError.get(teamId) ?? ''; }

  captainOf(team: any): string {
    const c = (team.players ?? []).find((p: any) => p.captain);
    return c ? c.playerName : '—';
  }

  viceCaptainOf(team: any): string {
    const v = (team.players ?? []).find((p: any) => p.viceCaptain);
    return v ? v.playerName : '—';
  }

  // ── Team selection ──
  togglePlayer(player: any, teamName: string, teamLogo: string): void {
    const id = player.id;
    if (this.selectedPlayers.has(id)) {
      this.selectedPlayers.delete(id);
    } else {
      if (!this.canAddPlayer(player.pos)) {
        return; // at total cap, or trying to add a 2nd goalkeeper
      }
      this.selectedPlayers.set(id, {
        id,
        name: player.name,
        number: player.number,
        pos: player.pos,
        grid: player.grid ?? null,
        teamName,
        teamLogo,
        photo: this.photoOf(id),
        rating: this.ratingOf(id)
      });
    }
    this.cdr.detectChanges();
  }

  isSelected(playerId: number): boolean {
    return this.selectedPlayers.has(playerId);
  }

  isSelectionFull(): boolean {
    return this.selectedPlayers.size >= this.MAX_PLAYERS;
  }

  get selectedCount(): number {
    return this.selectedPlayers.size;
  }

  isCheckboxDisabled(player: any): boolean {
    if (this.isSelected(player.id)) return false; // always allow unchecking
    return !this.canAddPlayer(player.pos);
  }

  clearSelection(): void {
    this.selectedPlayers.clear();
    this.cdr.detectChanges();
  }

  submitTeam(): void {
    if (!this.isTeamValid()) {
      alert(this.validationMessage());
      return;
    }
    this.teamSelection.set(Array.from(this.selectedPlayers.values()), this.expandedFixtureId);
    this.router.navigate(['/submit-team']);
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

  private computeRanks(): Map<string, number> {
    const ranks = new Map<string, number>();

    const scored = this.savedTeams
      .filter((t: any) => this.teamScores.has(t.teamId))
      .map((t: any) => ({ teamId: t.teamId, score: this.teamScores.get(t.teamId)! }))
      .sort((a, b) => b.score - a.score);

    let lastScore: number | null = null;
    let lastRank = 0;
    scored.forEach((item, index) => {
      if (lastScore === null || item.score !== lastScore) {
        lastRank = index + 1;
        lastScore = item.score;
      }
      ranks.set(item.teamId, lastRank);
    });

    return ranks;
  }

  rankOf(teamId: string): number | null {
    return this.computeRanks().get(teamId) ?? null;
  }

  rankLabel(rank: number | null): string {
    if (rank === null) return '';
    if (rank === 1) return '🥇 1st';
    if (rank === 2) return '🥈 2nd';
    if (rank === 3) return '🥉 3rd';
    return `${rank}th`;
  }

  sortedSavedTeams(): any[] {
    return [...this.savedTeams].sort((a, b) => {
      const sa = this.teamScores.has(a.teamId) ? this.teamScores.get(a.teamId)! : -Infinity;
      const sb = this.teamScores.has(b.teamId) ? this.teamScores.get(b.teamId)! : -Infinity;
      return sb - sa;
    });
  }

  // count selected players by position
  countByPos(pos: string): number {
    let n = 0;
    this.selectedPlayers.forEach(p => { if (p.pos === pos) n++; });
    return n;
  }

  // whether a given player can still be added, considering position rules
  private canAddPlayer(pos: string): boolean {
    if (this.selectedPlayers.size >= this.MAX_PLAYERS) return false;
    // only hard live-cap is the goalkeeper (exactly 1)
    if (pos === 'G' && this.countByPos('G') >= this.MAX_GK) return false;
    return true;
  }

  // is the current 11 valid for submission?
  isTeamValid(): boolean {
    return this.selectedPlayers.size === this.MAX_PLAYERS
      && this.countByPos('G') === this.MAX_GK
      && this.countByPos('D') >= this.MIN_DEF
      && this.countByPos('M') >= this.MIN_MID
      && this.countByPos('F') >= this.MIN_FWD;
  }

  // human-readable reason the team isn't valid yet (for the UI)
  validationMessage(): string {
    if (this.countByPos('G') < this.MAX_GK) return 'Select 1 goalkeeper';
    if (this.countByPos('G') > this.MAX_GK) return 'Only 1 goalkeeper allowed';
    if (this.countByPos('D') < this.MIN_DEF) return `Select at least ${this.MIN_DEF} defenders`;
    if (this.countByPos('M') < this.MIN_MID) return `Select at least ${this.MIN_MID} midfielders`;
    if (this.countByPos('F') < this.MIN_FWD) return `Select at least ${this.MIN_FWD} forward`;
    if (this.selectedPlayers.size < this.MAX_PLAYERS) {
      return `Select ${this.MAX_PLAYERS - this.selectedPlayers.size} more player(s)`;
    }
    return '';
  }

}