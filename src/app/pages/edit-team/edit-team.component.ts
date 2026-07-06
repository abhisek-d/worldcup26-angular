import { Component, EventEmitter, Input, OnInit, Output, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorldcupService } from '../../services/worldcup.service';

type EditStage = 'email' | 'verifying' | 'loading' | 'picker' | 'success';

@Component({
  selector: 'app-edit-team',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-team.component.html',
  styleUrl: './edit-team.component.scss'
})
export class EditTeamComponent implements OnInit {
  @Input() teamId!: string;
  @Input() teamName = '';
  @Input() matchId!: number;
  @Output() closed = new EventEmitter<void>();

  stage: EditStage = 'email';
  emailInput = '';
  errorMsg = '';

  // squad data (both teams in the fixture)
  lineups: any[] = [];

  // current selection state
  selectedPlayers = new Map<number, any>(); // keyed by playerId
  captainId: number | null = null;
  viceCaptainId: number | null = null;
  editedTeamName = '';
  ownerEmail = '';

  updating = false;

  // positional rules (same as contest picking)
  readonly MAX_PLAYERS = 11;
  readonly MAX_GK = 1;
  readonly MIN_DEF = 3;
  readonly MIN_MID = 3;
  readonly MIN_FWD = 1;

  constructor(private wc: WorldcupService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.editedTeamName = this.teamName;
  }

  cancel(): void {
    this.closed.emit();
  }

  // ── Step 1: verify email server-side ──
  verifyEmail(): void {
    this.errorMsg = '';
    const email = this.emailInput.trim();
    if (!email) {
      this.errorMsg = 'Please enter your email.';
      this.cdr.detectChanges();
      return;
    }

    this.stage = 'verifying';
    this.cdr.detectChanges();

    this.wc.verifyTeam(this.matchId, this.teamId, email).subscribe({
      next: (res: any) => {
        if (res?.valid === true) {
          this.ownerEmail = email;
          this.loadExistingTeamAndSquad(email);
        } else {
          this.stage = 'email';
          this.errorMsg = 'Email id not valid for the team you want to edit. Please try again!';
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.stage = 'email';
        this.errorMsg = 'Could not verify email right now. Please try again.';
        this.cdr.detectChanges();
      }
    });
  }

  // ── Step 2: load existing team + full squad ──
  private loadExistingTeamAndSquad(email: string): void {
    this.stage = 'loading';
    this.errorMsg = '';
    this.cdr.detectChanges();

    this.wc.getTeamByEmail(this.matchId, email).subscribe({
      next: (existingTeam: any) => {
        this.wc.getLineups(this.matchId).subscribe({
          next: (lineupData: any) => {
            this.lineups = lineupData?.response ?? [];
            this.prefillFromExistingTeam(existingTeam);
            this.stage = 'picker';
            this.cdr.detectChanges();
          },
          error: () => {
            this.errorMsg = 'Failed to load squad for this match.';
            this.stage = 'email';
            this.cdr.detectChanges();
          }
        });
      },
      error: (err: any) => {
        this.errorMsg = err?.error?.message ?? 'Could not load your existing team.';
        this.stage = 'email';
        this.cdr.detectChanges();
      }
    });
  }

  // pre-check the existing 11 players and set C/VC
  private prefillFromExistingTeam(existingTeam: any): void {
    this.selectedPlayers.clear();
    this.captainId = null;
    this.viceCaptainId = null;
    this.editedTeamName = existingTeam?.teamName ?? this.teamName;

    (existingTeam?.players ?? []).forEach((p: any) => {
      this.selectedPlayers.set(p.playerId, {
        id: p.playerId,
        name: p.playerName,
        number: p.number,
        pos: p.pos,
        grid: p.grid ?? null
      });
      if (p.captain) this.captainId = p.playerId;
      if (p.viceCaptain) this.viceCaptainId = p.playerId;
    });
  }

  // ── Squad picking (mirrors contest's pick logic) ──
  playersByPos(startXI: any[], pos: string): any[] {
    return (startXI ?? []).filter(p => p.player?.pos === pos);
  }

  posLabel(pos: string): string {
    const map: Record<string, string> = { G: 'Goalkeeper', D: 'Defenders', M: 'Midfielders', F: 'Forwards' };
    return map[pos] ?? pos;
  }

  isSelected(playerId: number): boolean {
    return this.selectedPlayers.has(playerId);
  }

  countByPos(pos: string): number {
    let n = 0;
    this.selectedPlayers.forEach(p => { if (p.pos === pos) n++; });
    return n;
  }

  private canAddPlayer(pos: string): boolean {
    if (this.selectedPlayers.size >= this.MAX_PLAYERS) return false;
    if (pos === 'G' && this.countByPos('G') >= this.MAX_GK) return false;
    return true;
  }

  isCheckboxDisabled(player: any): boolean {
    if (this.isSelected(player.id)) return false;
    return !this.canAddPlayer(player.pos);
  }

  togglePlayer(player: any): void {
    const id = player.id;
    if (this.selectedPlayers.has(id)) {
      this.selectedPlayers.delete(id);
      if (this.captainId === id) this.captainId = null;
      if (this.viceCaptainId === id) this.viceCaptainId = null;
    } else {
      if (!this.canAddPlayer(player.pos)) return;
      this.selectedPlayers.set(id, {
        id,
        name: player.name,
        number: player.number,
        pos: player.pos,
        grid: player.grid ?? null
      });
    }
    this.cdr.detectChanges();
  }

  onCaptainChange(playerId: number): void {
    this.captainId = playerId;
    if (this.viceCaptainId === playerId) this.viceCaptainId = null;
  }

  onViceChange(playerId: number): void {
    this.viceCaptainId = playerId;
    if (this.captainId === playerId) this.captainId = null;
  }

  get selectedCount(): number {
    return this.selectedPlayers.size;
  }

  isTeamValid(): boolean {
    return this.selectedPlayers.size === this.MAX_PLAYERS
      && this.countByPos('G') === this.MAX_GK
      && this.countByPos('D') >= this.MIN_DEF
      && this.countByPos('M') >= this.MIN_MID
      && this.countByPos('F') >= this.MIN_FWD
      && this.captainId !== null
      && this.viceCaptainId !== null
      && this.captainId !== this.viceCaptainId;
  }

  validationMessage(): string {
    if (this.countByPos('G') < this.MAX_GK) return 'Select 1 goalkeeper';
    if (this.countByPos('G') > this.MAX_GK) return 'Only 1 goalkeeper allowed';
    if (this.countByPos('D') < this.MIN_DEF) return `Select at least ${this.MIN_DEF} defenders`;
    if (this.countByPos('M') < this.MIN_MID) return `Select at least ${this.MIN_MID} midfielders`;
    if (this.countByPos('F') < this.MIN_FWD) return `Select at least ${this.MIN_FWD} forward`;
    if (this.selectedPlayers.size < this.MAX_PLAYERS) {
      return `Select ${this.MAX_PLAYERS - this.selectedPlayers.size} more player(s)`;
    }
    if (this.captainId === null) return 'Select a captain';
    if (this.viceCaptainId === null) return 'Select a vice-captain';
    if (this.captainId === this.viceCaptainId) return 'Captain and vice-captain must differ';
    return '';
  }

  // ── Step 3: update ──
  updateTeam(): void {
    if (!this.isTeamValid()) {
      this.errorMsg = this.validationMessage();
      this.cdr.detectChanges();
      return;
    }

    // Build in the SAME nested shape as create (CreateTeamRequest), matching submit-team's payload
    const startXI = Array.from(this.selectedPlayers.values()).map(p => ({
      player: {
        id: p.id,
        name: p.name,
        number: p.number,
        pos: p.pos,
        grid: p.grid ?? null,
        captain: p.id === this.captainId ? 'true' : 'false',
        viceCaptain: p.id === this.viceCaptainId ? 'true' : 'false'
      }
    }));

    const payload = {
      get: 'custom/lineup',
      parameters: {
        fixture: String(this.matchId)
      },
      errors: [],
      paging: { current: 1, total: 1 },
      response: [
        {
          team: {
            id: this.teamId,
            name: this.editedTeamName.trim() || this.teamName,
            email: this.ownerEmail
          },
          startXI: startXI
        }
      ]
    };

    this.updating = true;
    this.errorMsg = '';
    this.cdr.detectChanges();

    this.wc.updateTeam(this.matchId, payload).subscribe({
      next: (res: any) => {
        this.updating = false;
        if (res?.status === 'success') {
          this.stage = 'success';
        } else {
          this.errorMsg = res?.message ?? 'Update failed. Please try again.';
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.updating = false;
        this.errorMsg = err?.error?.message ?? 'Update failed. Please try again.';
        this.cdr.detectChanges();
      }
    });
  }

  done(): void {
    this.closed.emit();
  }
}