import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Match, Team, Group, Stadium } from '../models/worldcup.models';

@Injectable({ providedIn: 'root' })
export class WorldcupService {

  private readonly BASE = '/api';

  // Paste your token here if you have one; leave empty for public-only endpoints
  private readonly TOKEN = '';

  constructor(private http: HttpClient) {}

  private get authHeaders(): HttpHeaders {
    return this.TOKEN
      ? new HttpHeaders({ Authorization: `Bearer ${this.TOKEN}` })
      : new HttpHeaders();
  }

  getGames(): Observable<any> {
    // Returns { games: [...] }
    return this.http.get<any>(`${this.BASE}/get/games`);
  }

  getTeams(): Observable<Team[]> {
    return this.http.get<Team[]>(`${this.BASE}/get/teams`, { headers: this.authHeaders });
  }

  getTeamByName(name: string): Observable<Team | Team[]> {
    return this.http.get<Team | Team[]>(
      `${this.BASE}/get/team/?name=${encodeURIComponent(name)}`,
      { headers: this.authHeaders }
    );
  }

  getGroups(): Observable<Group[]> {
    return this.http.get<Group[]>(`${this.BASE}/get/groups`, { headers: this.authHeaders });
  }

  getStadiums(): Observable<Stadium[]> {
    return this.http.get<Stadium[]>(`${this.BASE}/get/stadiums`, { headers: this.authHeaders });
  }
}
