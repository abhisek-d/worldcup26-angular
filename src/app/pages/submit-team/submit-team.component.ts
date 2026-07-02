import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TeamSelectionService } from '../../services/team-selection.service';
import { WorldcupService } from '../../services/worldcup.service';

@Component({
  selector: 'app-submit-team',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './submit-team.component.html',
  styleUrl: './submit-team.component.scss'
})
export class SubmitTeamComponent {
  players: any[] = [];
  fixtureId: number | null = null;

  teamName = '';
  email = '';
  captainId: number | null = null;
  viceCaptainId: number | null = null;

  submitting = false;
  submitted = false;
  errorMsg = '';
  savedTeamId = '';

  constructor(
    private teamSelection: TeamSelectionService,
    private router: Router,
    private wc: WorldcupService,
    private cdr: ChangeDetectorRef
  ) {
    this.players = this.teamSelection.players;
    this.fixtureId = this.teamSelection.fixtureId;
  }

  onCaptainChange(playerId: number): void {
    this.captainId = playerId;
    if (this.viceCaptainId === playerId) {
      this.viceCaptainId = null;
    }
  }

  onViceChange(playerId: number): void {
    this.viceCaptainId = playerId;
    if (this.captainId === playerId) {
      this.captainId = null;
    }
  }

  submit(): void {
    this.errorMsg = '';

    if (!this.teamName.trim()) {
      this.errorMsg = 'Please enter a team name.';
      return;
    }
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email.trim());
    if (!emailOk) {
      this.errorMsg = 'Please enter a valid email address.';
      return;
    }
    if (this.captainId === null) {
      this.errorMsg = 'Please select a captain.';
      return;
    }
    if (this.viceCaptainId === null) {
      this.errorMsg = 'Please select a vice-captain.';
      return;
    }
    if (this.captainId === this.viceCaptainId) {
      this.errorMsg = 'Captain and vice-captain must be different players.';
      return;
    }
    if (this.fixtureId === null) {
      this.errorMsg = 'Missing match id. Please go back and pick your team again.';
      return;
    }

    // Build startXI in the lineup shape (11 players)
    const startXI = this.players.map(p => ({
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
        fixture: String(this.fixtureId)
      },
      errors: [],
      paging: { current: 1, total: 1 },
      response: [
        {
          team: {
            id: null,
            name: this.teamName.trim(),
            email: this.email.trim()
          },
          startXI: startXI
        }
      ]
    };

    this.submitting = true;
    this.wc.createTeam(this.fixtureId, payload).subscribe({
      next: (res: any) => {
        console.log('create-team response:', res);
        this.submitting = false;
        if (res && res.status === 'success') {
          this.savedTeamId = res.teamId ?? '';
          this.submitted = true;
        } else {
          this.errorMsg = (res && res.message) ? res.message : 'Submission failed. Please try again.';
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        // Backend sends { status: 'error', message: '...' } in the 400 body (under err.error)
        const backendMsg = err?.error?.message;
        this.errorMsg = backendMsg
          ? backendMsg
          : 'Submission failed — please try again.';
        this.submitting = false;
        this.cdr.detectChanges();
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/contest']);
  }

  done(): void {
    this.teamSelection.clear();
    this.router.navigate(['/contest']);
  }
}