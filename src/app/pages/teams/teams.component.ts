import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { WorldcupService } from '../../services/worldcup.service';
import { Team } from '../../models/worldcup.models';

@Component({
  selector: 'app-teams',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './teams.component.html',
  styleUrl: './teams.component.scss'
})
export class TeamsComponent implements OnInit {
  teams: Team[] = [];
  filtered: Team[] = [];
  searchQuery = '';
  loading = true;
  error = '';

  constructor(private wc: WorldcupService) {}

  ngOnInit(): void {
    this.wc.getTeams().subscribe({
      next: (data) => {
        this.teams = Array.isArray(data) ? data : (data as any)?.teams ?? [];
        this.filtered = [...this.teams];
        this.loading = false;
      },
      error: (err) => {
        this.error = `Failed to load teams — ${err.message}`;
        this.loading = false;
      }
    });
  }

  name(t: Team): string { return t.name ?? t.country ?? ''; }

  applyFilter(): void {
    const q = this.searchQuery.toLowerCase();
    this.filtered = this.teams.filter(t => this.name(t).toLowerCase().includes(q));
  }
}
