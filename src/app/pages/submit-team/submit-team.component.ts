import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TeamSelectionService } from '../../services/team-selection.service';

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

  submitted = false;
  errorMsg = '';

  constructor(
    private teamSelection: TeamSelectionService,
    private router: Router
  ) {
    this.players = this.teamSelection.players;
    this.fixtureId = this.teamSelection.fixtureId;
  }

  // when captain is chosen, clear vice if it was the same player
  onCaptainChange(playerId: number): void {
    this.captainId = playerId;
    if (this.viceCaptainId === playerId) {
      this.viceCaptainId = null;
    }
  }

  // when vice is chosen, clear captain if it was the same player
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

    // mark each player with captain/vice flags
    const payloadPlayers = this.players.map(p => ({
      ...p,
      isCaptain: p.id === this.captainId,
      isViceCaptain: p.id === this.viceCaptainId
    }));

    // backend not ready — log the payload for now
    console.log('Team submitted (mock):', {
      teamName: this.teamName.trim(),
      email: this.email.trim(),
      fixtureId: this.fixtureId,
      captainId: this.captainId,
      viceCaptainId: this.viceCaptainId,
      players: payloadPlayers
    });

    this.submitted = true;
  }

  goBack(): void {
    this.router.navigate(['/contest']);
  }

  done(): void {
    this.teamSelection.clear();
    this.router.navigate(['/contest']);
  }
}