import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { WorldcupService } from '../../services/worldcup.service';
import { Team } from '../../models/worldcup.models';

@Component({
  selector: 'app-team-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './team-detail.component.html',
  styleUrl: './team-detail.component.scss'
})
export class TeamDetailComponent implements OnInit {
  team: Team | null = null;
  teamName = '';
  loading = true;
  error = '';

  constructor(private route: ActivatedRoute, private wc: WorldcupService) {}

  ngOnInit(): void {
    this.teamName = this.route.snapshot.paramMap.get('name') ?? '';
    this.wc.getTeamByName(this.teamName).subscribe({
      next: (data) => {
        this.team = Array.isArray(data) ? data[0] : data;
        this.loading = false;
      },
      error: (err) => {
        this.error = `Could not load team — ${err.message}`;
        this.loading = false;
      }
    });
  }

  get displayName(): string { return this.team?.name ?? this.team?.country ?? this.teamName; }
}
