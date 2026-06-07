import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorldcupService } from '../../services/worldcup.service';
import { Stadium } from '../../models/worldcup.models';

@Component({
  selector: 'app-stadiums',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stadiums.component.html',
  styleUrl: './stadiums.component.scss'
})
export class StadiumsComponent implements OnInit {
  stadiums: Stadium[] = [];
  loading = true;
  error = '';

  constructor(private wc: WorldcupService) {}

  ngOnInit(): void {
    this.wc.getStadiums().subscribe({
      next: (data) => {
        this.stadiums = Array.isArray(data) ? data : (data as any)?.stadiums ?? [];
        this.loading = false;
      },
      error: (err) => {
        this.error = `Failed to load stadiums — ${err.message}`;
        this.loading = false;
      }
    });
  }
}
