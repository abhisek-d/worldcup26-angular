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
  submitted = false;
  errorMsg = '';

  constructor(
    private teamSelection: TeamSelectionService,
    private router: Router
  ) {
    this.players = this.teamSelection.players;
    this.fixtureId = this.teamSelection.fixtureId;
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

    // backend not ready — log the payload for now
    console.log('Team submitted (mock):', {
      teamName: this.teamName.trim(),
      email: this.email.trim(),
      fixtureId: this.fixtureId,
      players: this.players
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