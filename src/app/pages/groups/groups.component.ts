import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { WorldcupService } from '../../services/worldcup.service';
import { Group, Team } from '../../models/worldcup.models';

@Component({
  selector: 'app-groups',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './groups.component.html',
  styleUrl: './groups.component.scss'
})
export class GroupsComponent implements OnInit {
  groups: Group[] = [];
  loading = true;
  error = '';

  constructor(private wc: WorldcupService) {}

  ngOnInit(): void {
    this.wc.getGroups().subscribe({
      next: (data) => {
        this.groups = Array.isArray(data) ? data : (data as any)?.groups ?? [];
        this.loading = false;
      },
      error: (err) => {
        this.error = `Failed to load groups — ${err.message}`;
        this.loading = false;
      }
    });
  }

  groupName(g: Group): string { return g.name ?? g.group ?? ''; }

  teamNames(g: Group): string[] {
    if (!g.teams?.length) return [];
    return g.teams.map(t => typeof t === 'string' ? t : (t as Team).name ?? (t as Team).country ?? '');
  }
}
