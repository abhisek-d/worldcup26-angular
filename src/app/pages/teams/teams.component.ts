import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { WorldcupService } from '../../services/worldcup.service';

@Component({
  selector: 'app-teams',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './teams.component.html',
  styleUrl: './teams.component.scss'
})
export class TeamsComponent implements OnInit {
  teams: any[] = [];
  filtered: any[] = [];
  searchQuery = '';
  loading = true;
  error = '';

  constructor(private wc: WorldcupService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.wc.getTeams().subscribe({
      next: (data: any) => {
        this.teams = data?.teams ?? (Array.isArray(data) ? data : []);
        this.filtered = [...this.teams];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.error = `Failed to load teams — ${err.message}`;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilter(): void {
    const q = this.searchQuery.toLowerCase();
    this.filtered = this.teams.filter(t =>
      t.name_en?.toLowerCase().includes(q) ||
      t.groups?.toLowerCase().includes(q)
    );
  }
}