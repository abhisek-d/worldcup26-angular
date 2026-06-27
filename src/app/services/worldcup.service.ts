import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Match, Team, Group, Stadium } from '../models/worldcup.models';

@Injectable({ providedIn: 'root' })
export class WorldcupService {

  private readonly BASE = '/api';
  private readonly TOKEN = '';

  constructor(private http: HttpClient) {}

  private get authHeaders(): HttpHeaders {
    return this.TOKEN
      ? new HttpHeaders({ Authorization: `Bearer ${this.TOKEN}` })
      : new HttpHeaders();
  }

  getGames(): Observable<any> {
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

  getContestFixtures(date: string): Observable<any> {
    const headers = new HttpHeaders({ 'x-apisports-key': '0da66c440ae9302c51160e64fc562209' });
    return this.http.get<any>(
      `https://v3.football.api-sports.io/fixtures?league=1&season=2026&date=${date}`,
      { headers }
    );
  }

  getLineups(fixtureId: number): Observable<any> {
    const headers = new HttpHeaders({ 'x-apisports-key': '0da66c440ae9302c51160e64fc562209' });
    return this.http.get<any>(
      `https://v3.football.api-sports.io/fixtures/lineups?fixture=${fixtureId}`,
      { headers }
    );
  }

  getApiFootballFixtures(): Observable<any> {
    const headers = new HttpHeaders({ 'x-apisports-key': '0da66c440ae9302c51160e64fc562209' });
    return this.http.get<any>(
      `https://v3.football.api-sports.io/fixtures?league=1&season=2026&from=2026-06-01&to=2026-07-31`,
      { headers }
    );
  }

  getFixtureEvents(fixtureId: number): Observable<any> {
    const headers = new HttpHeaders({ 'x-apisports-key': '0da66c440ae9302c51160e64fc562209' });
    return this.http.get<any>(
      `https://v3.football.api-sports.io/fixtures/events?fixture=${fixtureId}`,
      { headers }
    );
  }

  getMatchPoints(matchId: number): Observable<any> {
    return this.http.get<any>(
      `https://fantasy-scoring-engine.onrender.com/match-points?matchId=${matchId}`
    );
  }
  createTeam(matchId: number, payload: any): Observable<any> {
  return this.http.post<any>(
    `https://fantasy-scoring-engine.onrender.com/create-team?matchId=${matchId}`,
    payload
  );
}}